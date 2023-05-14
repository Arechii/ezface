import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  DATABASES,
  DETECTORS,
  DISTANCE_METRICS,
  MODELS,
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
  distanceMetric: z.enum(DISTANCE_METRICS),
  database: z.enum(DATABASES),
});

export const appRouter = createTRPCRouter({
  represent: publicProcedure
    .input(Input)
    .mutation(
      async ({
        input: { images, model, detector, database, distanceMetric },
        ctx: { prisma },
      }) => {
        for (const { label, url } of images) {
          const embedding = await represent(
            await fetchImage(url),
            model,
            detector
          );

          switch (database) {
            case "PostgreSQL":
              const image = await prisma.image.create({
                data: {
                  label,
                  url,
                  model,
                  detector,
                },
              });
              await prisma.$executeRaw`UPDATE "Image" SET embedding = ${JSON.stringify(
                embedding
              )}::vector WHERE "id" = ${image.id}`;
              break;
          }
        }
      }
    ),
  find: publicProcedure
    .input(Input)
    .mutation(
      async ({
        input: { images, model, detector, database, distanceMetric },
        ctx: { prisma },
      }) => {
        for (const { label, url } of images) {
          const embedding = await represent(
            await fetchImage(url),
            model,
            detector
          );

          switch (database) {
            case "PostgreSQL":
              const query =
                distanceMetric === "Euclidean"
                  ? prisma.$queryRaw`
                    SELECT label, url, embedding <-> ${embedding}::vector AS distance 
                    FROM "Image" 
                    WHERE model = ${model} AND detector = ${detector} 
                    ORDER BY distance`
                  : prisma.$queryRaw`
                    SELECT label, url, embedding <=> ${embedding}::vector AS distance 
                    FROM "Image" 
                    WHERE model = ${model} AND detector = ${detector} 
                    ORDER BY distance`;
              const images = await query;
              console.log(images);
              break;
          }
        }
      }
    ),
});

export type AppRouter = typeof appRouter;
