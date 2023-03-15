import { GlobeInstance } from "globe.gl";
import { colorInterpolator } from "./globe/defaultConfig";
import { initialiseGlobe } from "./globe/globe";
import { getOwnCoordinates } from "./services/coordinatesService";
import { preloadModel, classifyMessage } from "./services/modelService";

/**
 * Attempt to preload the Tensorflow.js model so it's available
 * ahead of time
 */
preloadModel();

window.addEventListener('DOMContentLoaded', () => {
  doTheCoolStuff();
});

async function doTheCoolStuff() {
  let globe: GlobeInstance;

  const globeContainerEl = document.querySelector('.globe-container') as HTMLElement;
  const messageInputEl = document.querySelector('#message') as HTMLInputElement;

  messageInputEl.addEventListener("keyup", async (ev: KeyboardEvent) => {
    if(ev.key === 'Enter') {
      const { containsToxicSentiments } = await classifyMessage(messageInputEl.value);

      if(containsToxicSentiments) {
        globe.ringColor(() => "red");
      } else {
        globe.ringColor(() => colorInterpolator);
      }

      messageInputEl.value = "";
    }
  });
  
  const { latitude: ownLatitude, longitude: ownLongitude } = await getOwnCoordinates();
  const ownLocationData = [{
    lat: Number(ownLatitude),
    lng: Number(ownLongitude),
  }];

  globe = initialiseGlobe(globeContainerEl);
  globe.ringsData(ownLocationData);
  globe.pointOfView({
    // always start at own coordinates
    lat: ownLatitude,
    lng: ownLongitude
  });
}