import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  DATABASES,
  DETECTORS,
  MODELS,
  SIMILARITY_METRICS,
} from "~/utils/constants";
import { represent } from "~/utils/deepface";
import { fetchImage } from "~/utils/image";

const Input = z.object({
  images: z.array(
    z.object({
      label: z.string().regex(/^[a-zA-Z0-9-_]+$/),
      url: z.string().url(),
    })
  ),
  model: z.enum(MODELS),
  detector: z.enum(DETECTORS),
  similarityMetric: z.enum(SIMILARITY_METRICS),
  database: z.enum(DATABASES),
});

export const appRouter = createTRPCRouter({
  represent: publicProcedure.input(Input).mutation(async ({ input }) => {
    for (const image of input.images) {
      const data = await represent(
        await fetchImage(image.url),
        input.model,
        input.detector
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

export type AppRouter = typeof appRouter;
