import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import * as tfconv from '@tensorflow/tfjs-converter';
import { ToxicityClassifier, load } from '@tensorflow-models/toxicity';

export default {
	fetch(request: Request, env: { MY_MODEL_DO: DurableObjectNamespace }) {
		const { pathname } = new URL(request.url);
		const id = env.MY_MODEL_DO.idFromName(pathname);
		const stub = env.MY_MODEL_DO.get(id);
		return stub.fetch(request);
	},
};

export class ModelDO implements DurableObject {
  private storage;

  constructor(controller) {
    this.storage = controller.storage;
  }

  async fetch(request) {
    console.log("Welcome from ModelDO");
    let url = new URL(request.url);
    // let tfjsModel = await this.storage.get("tfjsModel");

    switch(url.pathname) {
      case "/api/load-model":
        // if(!tfjsModel) {
          console.log("Loading tfJS model...");
          await tf.setBackend('cpu');
    
          try {
            const tfjsModel = await loadModel();
            return new Response("OK");
            
          //   await this.storage.put("tfjsModel", tfjsModel.model);
          } catch(err) {
            console.log(`Error loading model: ${err}`);
            throw err;
          }
        // }
    //   case "/api/classify": 
    //     await tf.setBackend('cpu');
      
    //     try {
    //       const tfjsModel = await toxicity.load();
    //       const { text } = await request.json();
    //       const inputs = [text];

    //       console.log(`🕵️  Classifying "${inputs}" ... ${tfjsModel}`);
    //       let results = await tfjsModel.classify(inputs);
    //       console.log(`✨ Classification complete. See the results below: 
    //       ${JSON.stringify(results, null, 2)}`);
        
    //       results = inputs.map((d, i) => {
    //         const obj = { text: d };
        
    //         results.forEach((classification) => {
    //           obj[classification.label] = classification.results[i].match;
    //         });
        
    //         return obj;
    //       });

    //       const labels = tfjsModel
    //         ? tfjsModel.model.outputNodes.map((d) => d.split("/")[0])
    //         : [];

    //       return new Response(
    //         JSON.stringify({ results, labels }),
    //         { headers: { 'Content-type': 'application/json' } });
          
    //       // await this.storage.put("tfjsModel", tfjsModel.model);
    //     } catch(err) {
    //       console.log(`Error loading model: ${err}`);
    //       throw err;
    //     }
    }
    return new Response("OK");
  }
}

async function loadModel() {
  let model = new ToxicityClassifier();
  model.loadTokenizer= await model.loadTokenizer();
  model = await tfconv.loadGraphModel(
    'https://tfhub.dev/tensorflow/tfjs-model/toxicity/1/default/1', {
      fromTFHub: true,
      fetchFunc: async (url, options, smth) => {
          return fetch(url, options)
        }
      });
  model.toxicityLabels = [];

  console.log(`Model: ${model}`)

  model.labels =
      model.outputs.map((d: {name: string}) => d.name.split('/')[0]);

  if (model.toxicityLabels.length === 0) {
    model.toxicityLabels = model.labels;
  } else {
    tf.util.assert(
        model.toxicityLabels.every(d => model.labels.indexOf(d) > -1),
        () => `toxicityLabels argument must contain only items from the ` +
            `model heads ${model.labels.join(', ')}, ` +
            `got ${model.toxicityLabels.join(', ')}`);
  }
  return model;
}