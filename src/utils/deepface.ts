import axios from "axios";
import { type DETECTORS, type MODELS } from "./constants";

const DEEPFACE_API_URL = "http://localhost:3001";

const api = axios.create({
  baseURL: DEEPFACE_API_URL,
});

export const represent = async (
  image: string,
  model: (typeof MODELS)[number],
  detector: (typeof DETECTORS)[number]
) => {
  const { data } = await api.post<{ results: { embedding: number[] }[] }>(
    "/represent",
    {
      img: image,
      model_name: model,
      detector_backend: detector.toLowerCase(),
    }
  );

  if (!data.results[0]) throw new Error("No results");

  return data.results[0].embedding;
};
