
import { loadModel, setupTFBackend } from "../../server/model/tf-toxicity-model";

export async function onRequestPost() {
  try {
    await setupTFBackend();
    await loadModel();
    return new Response("OK");
  } catch(err) {
    return new Response(`Error pre-loading model: ${err}`, {
      status: 500,
    });
  }
}