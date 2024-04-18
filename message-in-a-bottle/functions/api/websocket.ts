interface Env {
  GLOBE_DO: DurableObjectNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { pathname } = new URL(context.request.url);
  const id = context.env.GLOBE_DO.idFromName(pathname);
  const stub = context.env.GLOBE_DO.get(id);
  
  // Pass the request down to the durable object
  return stub.fetch(context.request, { headers: {upgrade: "websocket"} });
}