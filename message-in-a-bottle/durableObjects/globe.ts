interface Session {
  ip: string;
  webSocket: WebSocket;
  latitude: string;
  longitude: string;
  quit?: boolean;
}

export default {
	fetch(request: Request, env: { MY_DO: DurableObjectNamespace }) {
		const { pathname } = new URL(request.url);
		const id = env.MY_DO.idFromName(pathname);
		const stub = env.MY_DO.get(id);
		return stub.fetch(request);
	},
};

// Dummy data
// ~ for testing purposes ~
const countries = [
  {latitude: "35.6762", longitude: "139.6503"},   // tokyo
  {latitude: "-33.8688", longitude: "151.2093"},  // sydney
  {latitude: "40.7128", longitude: "-74.0060"},   // new york
  {latitude: "37.7749", longitude: "-122.4194"},  // san francisco
  {latitude: "38.7223", longitude: "-9.1393"},    // lisbon
  {latitude: "37.0168", longitude: "-8.9406"},    // sagres
  {latitude: "55.6761", longitude: "12.5683"},    // copenhagen
  {latitude: "-22.9068", longitude: "-43.1729"},  // rio de janeiro
  {latitude: "35.0116", longitude: "135.7681"},   // kyoto
  {latitude: "33.5902", longitude: "130.4017"},   // fukuoka
  {latitude: "45.5019", longitude: "-73.5674"},   // montreal
  {latitude: "37.9838", longitude: "23.7275"},    // athens
  {latitude: "-36.8509", longitude: "174.7645"},  // auckland
  {latitude: "-37.8136", longitude: "144.9631"},  // melbourne
  {latitude: "37.5519", longitude: "126.9918"},   // seoul
  {latitude: "30.0444", longitude: "31.2357"},    // cairo
  {latitude: "32.0853", longitude: "34.7818"},    // tel aviv
  {latitude: "34.0181", longitude: "-5.0078"},    // fes
  {latitude: "-33.9249", longitude: "18.4241"},   // cape town
];

export class GlobeDO implements DurableObject {
  private sessions: Array<Session>;

	constructor(public state: DurableObjectState) {
    // We will put the WebSocket objects for each client, along with some metadata, into
    // `sessions`.
    this.sessions = [];
  }

	async fetch(request) {
		let url = new URL(request.url);
    let { latitude, longitude } = request.cf;

    console.log(`Incoming request to ${url} from session with geo coordinates: ${latitude} lat and ${longitude} long.`);

    // Emulate diff geo coords for diff sessions
    // ~ for testing purposes ~
    const randCountry = countries[Math.floor(Math.random() * countries.length)];
    latitude = randCountry.latitude;
    longitude = randCountry.longitude;

    switch(url.pathname) {
      // The request is to `/api/websocket`. A client is trying to establish a new
      // WebSocket session.
      case "/api/websocket":
        if (request.headers.get("Upgrade") != "websocket") {
          return new Response("expected websocket", {status: 400});
        }

        // Get the client's IP address for use with the rate limiter.
        let ip = request.headers.get("CF-Connecting-IP");

        // To accept the WebSocket request, we create a WebSocketPair (which is like a socketpair,
        // i.e. two WebSockets that talk to each other), we return one end of the pair in the
        // response, and we operate on the other end. Note that this API is not part of the
        // Fetch API standard; unfortunately, the Fetch API / Service Workers specs do not define
        // any way to act as a WebSocket server today.
        let pair = new WebSocketPair();

        // We're going to take pair[1] as our end, and return pair[0] to the client.
        await this.handleSession(pair[1], ip, latitude, longitude);

        // Now we return the other end of the pair to the client.
        return new Response(null, { status: 101, webSocket: pair[0], headers: {
          "Upgrade": "websocket",
          "Connection": "Upgrade"
        } });
      default:
        return new Response("Not found", {status: 404});
    }
	}

  async handleSession(webSocket, ip, latitude, longitude) {
    // Accept our end of the WebSocket. This tells the runtime that we'll be terminating the
    // WebSocket in JavaScript, not sending it elsewhere.
    webSocket.accept();

    let session: Session = { webSocket, ip, latitude, longitude };
    this.sessions.push(session);

    // Broadcast to all other connections that this session has joined.
    this.broadcast({ joined: { latitude, longitude } });

    webSocket.addEventListener("message", async (message) => {
      let data = JSON.parse(message.data);
      const { containsToxicSentiments } = data;
      console.log(`
${new Date().toTimeString()} [WebSocket message]: from session with geo coordinates: ${latitude} lat and ${longitude} long.
message: ${message.data}
`);
      
      // Broadcast to all other connections that a session has sent a message.
      this.broadcast({messaged: { latitude, longitude, containsToxicSentiments }});
    });

    webSocket.addEventListener("close", (event) => {
      console.log(`
${new Date().toTimeString()} [WebSocket close]: from session with geo coordinates ${session.latitude} lat and ${session.longitude} long. 
Closing.
`)

      session.quit = true;
      this.sessions = this.sessions.filter(member => member !== session);

      // Broadcast to all other connections that a session has left.
      this.broadcast({ quit: { latitude: session.latitude, longitude: session.longitude } });
    });
  }

  // broadcast() broadcasts a message to all clients.
  broadcast(message) {
    // Apply JSON if we weren't given a string to start with.
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }

    // Iterate over all the sessions sending them messages.
    let deadConnections = [];
    this.sessions = this.sessions.filter(session => {
        try {
          session.webSocket.send(message);
          return true;
        } catch (err) {
          // Whoops, this shouldn't have happenend, but this connection is 
          // dead. Let's remove it
          session.quit = true;
          deadConnections.push(session);
          return false;
        }
    });

    // If we found any dead connections we need to notify all clients.
    deadConnections.forEach(quitter => {
      console.log(`Found dead session with geo coordinates ${quitter.latitude} lat and ${quitter.longitude} long. Removing."`)
      this.broadcast({ quit: { latitude: quitter.latitude, longitude: quitter.longitude } });
    });
  }
}