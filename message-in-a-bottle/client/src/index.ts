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
        // globe.htmlElementsData(ownLocationData);
        // globe.htmlElement(d => createBrokenHeart());
      } else {
        globe.ringColor(() => colorInterpolator);
        // globe.htmlElementsData(ownLocationData);
        // globe.htmlElement(d => createGlowingStar());
      }

      messageInputEl.value = "";
    }
  });
  
  // get own coordinates
  const { latitude: ownLatitude, longitude: ownLongitude } = await getOwnCoordinates();
  const ownLocationData = [{
    lat: Number(ownLatitude),
    lng: Number(ownLongitude),
  }];

  // render the globe
  globe = initialiseGlobe(globeContainerEl);
  globe.ringsData(ownLocationData);
  globe.pointOfView({
    // always start at own coordinates
    lat: ownLatitude,
    lng: ownLongitude
  });
}

function createGlowingStar() {
  const glowingStar = document.createElement('div');
  const star = document.createElement('div');
  const glow = document.createElement('div');

  star.innerHTML = "🌟";
  star.style.width = "20px";

  glow.style.position = "absolute";
  glow.style.top = "50%";
  glow.style.left = "50%";
  glow.style["box-shadow"] = "0px 1px 66px 30px #f4a742";
  
  glowingStar.appendChild(star);
  glowingStar.appendChild(glow);
  
  return glowingStar;
}

function createBrokenHeart() {
  const brokenHeart = document.createElement('div');
  const heart = document.createElement('div');
  const glow = document.createElement('div');

  heart.innerHTML = "💔";
  heart.style.width = "20px";

  glow.style.position = "absolute";
  glow.style.top = "50%";
  glow.style.left = "50%";
  glow.style["box-shadow"] = "0px 1px 66px 30px red";
  
  brokenHeart.appendChild(heart);
  brokenHeart.appendChild(glow);
  
  return brokenHeart;
}