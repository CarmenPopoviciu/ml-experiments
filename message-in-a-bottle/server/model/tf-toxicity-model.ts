import * as tf from '@tensorflow/tfjs-core';
// import '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-cpu';
import * as toxicity from '@tensorflow-models/toxicity';
import { ModelClassification } from '../../common/model.types';

let tfjsModel;

/**
 * Tensorflow.js supports multiple backends, such as WebGL, CPU, Wasm, 
 * etc.
 * (see https://www.tensorflow.org/js/guide/platform_environment#backends)
 * We can't run WebGL inside a Worker, and the Wasm backend needs more
 * figuring out, so for now we need to stick to CPU, even though it's 
 * the least performant :(
 */
export async function setupTFBackend() {
  await tf.setBackend('cpu');
}

export function getLabels() {
  return tfjsModel
    ? tfjsModel.model.outputNodes.map((d) => d.split("/")[0])
    : [];
}

export async function loadModel() {
  console.log("⏳ Loading model...");

  try{
    tfjsModel = await toxicity.load(0.9, []);
  } catch(err) {
    throw err;
  }

  console.log("✨ Loading model complete");
}

/**
 * Classifies the toxicity of the given inputs
 */
export async function classify(inputs: string[]): Promise<ModelClassification[]> {
  console.log(`🕵️  Classifying "${inputs}" ...`);

  const results = await tfjsModel.classify(inputs);

  console.log(`✨ Classification complete. See the results below: 
  ${JSON.stringify(results, null, 2)}`);

  return inputs.map((d, i) => {
    const obj = { text: d };

    results.forEach((classification) => {
      obj[classification.label] = classification.results[i].match;
    });

    return obj as ModelClassification;
  });
}