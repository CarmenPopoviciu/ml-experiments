import { GlobeInstance } from "globe.gl";
import { colorInterpolator } from "./globe/defaultConfig";
import { initialiseGlobe } from "./globe/globe";
import { getOwnCoordinates } from "./services/coordinatesService";
import { preloadModel, classifyMessage } from "./services/modelService";

let ws: WebSocket;

/**
 * Attempt to preload the Tensorflow.js model so it's available
 * ahead of time
 */
preloadModel();

window.addEventListener('DOMContentLoaded', () => {
  doTheCoolStuff();
});

window.addEventListener("beforeunload", () => {
  ws.close();
});

async function doTheCoolStuff() {
  let globe: GlobeInstance;

  const globeContainerEl = document.querySelector('.globe-container') as HTMLElement;
  const messageInputEl = document.querySelector('#message') as HTMLInputElement;

  messageInputEl.addEventListener("keyup", async (ev: KeyboardEvent) => {
    if(ev.key === 'Enter') {
      const { containsToxicSentiments } = await classifyMessage(messageInputEl.value);

      ws.send(JSON.stringify({ containsToxicSentiments }))
      messageInputEl.value = "";
    }
  });
  
  const { latitude: ownLatitude, longitude: ownLongitude } = await getOwnCoordinates();

  globe = initialiseGlobe(globeContainerEl);
  globe.pointOfView({
    // always start at own coordinates
    lat: ownLatitude,
    lng: ownLongitude
  });

  let hostname = window.location.host;
  const wss = document.location.protocol === "http:" ? "ws://" : "wss://";
  ws = new WebSocket(wss + hostname + "/api/websocket");

  ws.onopen = () => {
    console.log("WebSocket ready");
  }

  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    const joined = data.joined;
    const sessions = data.activeSessions;
    const quit = data.quit;
    const messaged = data.messaged;

    // render all active user sessions
    if(joined) {
      const sessionData = sessions.map(session => {
        return {
          lat: Number(session.latitude),
          lng: Number(session.longitude),
          color: colorInterpolator
        }
      });

      // this is possibly wasteful and definitely sub-optimal
      globe.ringsData(sessionData);
    }

    // remove from the globe sessions who quit
    if(quit) {
      const { latitude, longitude } = quit;
      console.log(`Removing ${latitude} lat, ${longitude} long. WebSocket connection was closed.`)
      const remaining = globe.ringsData().filter(crr => crr.lat != latitude && crr.lng != longitude);
      globe.ringsData(remaining);
    }

    // update rendering on the globe of sessions who sent a message
    if(messaged) {
      const { latitude, longitude, containsToxicSentiments } = messaged;
      const sessionRingData = globe.ringsData().find(el => el.lat == latitude && el.lng == longitude);
      sessionRingData.color = containsToxicSentiments ? () => "red" : colorInterpolator;
    }
  }
}