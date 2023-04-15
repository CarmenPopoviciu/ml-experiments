import { loadModel, setupTFBackend } from "../../server/model/tf-toxicity-model";

// interface Env {
//   MODEL_DO: DurableObjectNamespace;
// }

export async function onRequestPost(context) {
  // const { pathname } = new URL(context.request.url);
  // const id = context.env.MODEL_DO.idFromName(pathname);
  // const stub = context.env.MODEL_DO.get(id);
  // return stub.fetch(context.request);
  try {
    await setupTFBackend();
    await loadModel();
    return new Response("OK");
  } catch(err) {
    return new Response(`Error pre-loading model: ${err}`);
  }
}