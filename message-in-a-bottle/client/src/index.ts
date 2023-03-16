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
  const ownLocationData = [{
    lat: Number(ownLatitude),
    lng: Number(ownLongitude),
  }];

  globe = initialiseGlobe(globeContainerEl);
  // globe.ringsData(ownLocationData);
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
    const quit = data.quit;
    const messaged = data.messaged;

    // add sessions who joined
    if(joined) {
      const { latitude, longitude } = joined;
      globe.ringsData([...globe.ringsData(), {
        lat: Number(latitude),
        lng: Number(longitude),
        color: colorInterpolator,
      }]);
    }

    // remove sessions who quit
    if(quit) {
      const { latitude, longitude } = quit;
      console.log(`Removing ${latitude} lat, ${longitude} long. WebSocket connection was closed.`)
      const remaining = globe.ringsData().filter(crr => crr.lat != latitude && crr.lng != longitude);
      globe.ringsData(remaining);
    }

    // update sessions who sent a message
    if(messaged) {
      const { latitude, longitude, containsToxicSentiments } = messaged;
      const session = globe.ringsData().find(el => el.lat == latitude && el.lng == longitude);
      session.color = containsToxicSentiments ? () => "red" : colorInterpolator;
    }
  }
}