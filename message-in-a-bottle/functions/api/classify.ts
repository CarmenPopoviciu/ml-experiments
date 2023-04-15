import { classify, getLabels } from '../../server/model/tf-toxicity-model';

// interface Env {
//   MODEL_DO: DurableObjectNamespace;
// }

export async function onRequestPost(context) {
  const { request } = context;
  // const { pathname } = new URL(context.request.url);
  // const id = context.env.MODEL_DO.idFromName(pathname);
  // const stub = context.env.MODEL_DO.get(id);

  const { text } = await request.json();
  const labels = getLabels();
  
  // return stub.fetch(context.request, {
  //   method: 'POST',
  //   body: JSON.stringify({ text }),
  //   headers: { 'Content-type': 'application/json' }
  // });

  /**
   * Since Workers don't support `performance.now()` this seems to be
   * the best way to measure the classification elapsed time. It would
   * have been helpful to provide this metric to the client, so we can
   * differentiate between the elapsed time of the request + classification 
   * and just the classification alone, in one place. Unfortunately that's 
   * not possible with `console.timeEnd()`, so for now we'll just have to 
   * do with what we have ¯\_(ツ)_/¯ 
   */
  console.time('🕒 Classification elapsed time');
  const results = await classify([text]);
  console.timeEnd('🕒 Classification elapsed time');
  // /** */

  return new Response(
    JSON.stringify({ labels, results }),
    { headers: { 'Content-type': 'application/json' } });
}