import axios from "axios";
import { Base64 } from "js-base64";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  DATABASES,
  DETECTORS,
  MODELS,
  SIMILARITY_METRICS,
} from "~/utils/constants";

const Input = z.object({
  images: z.string().refine(Base64.isValid).array(),
  model: z.enum(MODELS),
  detector: z.enum(DETECTORS),
  similarityMetric: z.enum(SIMILARITY_METRICS),
  database: z.enum(DATABASES),
});

export const deepfaceRouter = createTRPCRouter({
  represent: publicProcedure.input(Input).mutation(async ({ input }) => {
    const { data } = await axios.post<unknown>(
      "http://deepface:5000/represent",
      {
        img: "",
        model_name: input.model,
        detector_backend: input.detector,
      }
    );

    console.log(data, null, 2);
  }),
  find: publicProcedure.input(Input).mutation(() => {
    console.log("find");
  }),
});
