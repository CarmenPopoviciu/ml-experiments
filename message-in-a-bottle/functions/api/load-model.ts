import { loadModel, setupTFBackend } from "../../server/model/tf-toxicity-model";

export async function onRequestPost() {
  /**
   * This is far from ideal yet. Basically it means we load the TF model
   * every time a user session makes a request to this API, so in effect
   * everyone. What we want is to load the model once, on first request,
   * and have it available for any subsequent requests. DOs can help us
   * with this. Coming soon...
   */
  try {
    await setupTFBackend();
    await loadModel();
    return new Response("OK");
  } catch(err) {
    return new Response(`Error pre-loading model: ${err}`);
  }
}