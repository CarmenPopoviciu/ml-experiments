import { ClassificationResult } from "../../../common/model.types";

export function preloadModel() {
  fetch('/api/load-model', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' }
  });
}

async function classify(text: string): Promise<ClassificationResult> {
  const response = await fetch('/api/classify', {
    method: 'POST',
    body: JSON.stringify({ text }),
    headers: { 'Content-type': 'application/json' }
  });
  return await response.json();
}

export async function classifyMessage(text: string): Promise<{ containsToxicSentiments: boolean; }> {
  const { labels, results } = await classify(text);

  let containsToxicSentiments = false;

  // let's make this very binary: it's either toxic or not
  // no in-betweens accepted
  for(let i=0; i< results.length; i++) {
    let classification = results[i];

    for(let j=0; j<labels.length; j++) {
      let label = labels[j];

      // if it's not strictly false then it's toxic
      if(classification[label] !== false) {
        containsToxicSentiments = true;
        break;
      }
    }
  }

  return { containsToxicSentiments };
}