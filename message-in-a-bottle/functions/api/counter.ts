interface Env {
  COUNTER_DO: DurableObjectNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { pathname } = new URL(context.request.url);
  const id = context.env.COUNTER_DO.idFromName(pathname);
  const stub = context.env.COUNTER_DO.get(id);
  
  // Pass the request down to the durable object
  let response = await stub.fetch(context.request);
  const { count } = await response.json();

  return new Response(`Durable Object counter: '${count}'`);
}