export type ModelClassification = { text: string; } & {
  [key: string]: boolean | null;
}

export type ClassificationResult = {
  labels: string[];
  results: ModelClassification[];
}