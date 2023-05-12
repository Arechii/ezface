import axios from "axios";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  DATABASES,
  DETECTORS,
  MODELS,
  SIMILARITY_METRICS,
} from "~/utils/constants";

const Input = z.object({
  images: z.array(z.string().url()),
  model: z.enum(MODELS),
  detector: z.enum(DETECTORS),
  similarityMetric: z.enum(SIMILARITY_METRICS),
  database: z.enum(DATABASES),
});

export const deepfaceRouter = createTRPCRouter({
  represent: publicProcedure.input(Input).mutation(async ({ input }) => {
    for (const image of input.images) {
      const { data } = await axios.post<unknown>(
        "http://deepface:5000/represent",
        {
          img: image,
          model_name: input.model,
          detector_backend: input.detector.toLowerCase(),
        }
      );

      console.log(data);
    }
  }),
  find: publicProcedure.input(Input).mutation(async ({ input }) => {
    for (const image of input.images) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(image);
    }
  }),
});
