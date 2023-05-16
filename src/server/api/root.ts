import { type Image } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  DATABASES,
  DETECTORS,
  DISTANCE_METRICS,
  MODELS,
  THRESHOLDS,
} from "~/utils/constants";
import { represent } from "~/utils/deepface";
import { fetchImage } from "~/utils/image";

type ImageFindResult = Pick<Image, "label" | "url"> & { distance: number };

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

const Output = z.object({
  results: z.array(
    z.object({
      label: z.string().regex(/^[a-zA-Z0-9-_]+$/),
      url: z.string().url(),
      time: z.number(),
      precision: z.number(),
      model: z.enum(MODELS),
      detector: z.enum(DETECTORS),
      distanceMetric: z.enum(DISTANCE_METRICS),
      database: z.enum(DATABASES),
      matches: z.array(
        z.object({
          label: z.string().regex(/^[a-zA-Z0-9-_]+$/),
          url: z.string().url(),
          distance: z.number(),
        })
      ),
    })
  ),
});

export const appRouter = createTRPCRouter({
  represent: publicProcedure
    .input(Input)
    .mutation(
      async ({
        input: { images, model, detector, database, distanceMetric },
        ctx: { prisma, qdrant },
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
            case "Qdrant":
              const collectionName = `Image-${model}-${detector}-${distanceMetric}`;
              const collections = await qdrant.getCollections();

              if (
                !collections.collections.find((c) => c.name === collectionName)
              ) {
                await qdrant.createCollection(collectionName, {
                  vectors: {
                    size: embedding.length,
                    distance: distanceMetric === "Cosine" ? "Cosine" : "Euclid",
                  },
                });
              }

              await qdrant.upsert(collectionName, {
                wait: true,
                points: [
                  {
                    id: parseInt(
                      Math.floor(Math.random() * 1000000)
                        .toString()
                        .padStart(6, "0")
                    ),
                    vector: embedding,
                    payload: {
                      label,
                      url,
                    },
                  },
                ],
              });
              break;
          }
        }
      }
    ),
  find: publicProcedure
    .input(Input)
    .output(Output)
    .mutation(
      async ({
        input: { images, model, detector, database, distanceMetric },
        ctx: { prisma, qdrant },
      }) => {
        const results: z.infer<typeof Output>["results"] = [];

        for (const { label, url } of images) {
          let images: ImageFindResult[] = [];
          const start = Date.now();
          const threshold = THRESHOLDS[model][distanceMetric];
          let embedding: number[] | string = await represent(
            await fetchImage(url),
            model,
            detector
          );

          switch (database) {
            case "PostgreSQL":
              embedding = JSON.stringify(embedding);
              const query =
                distanceMetric === "Euclidean"
                  ? prisma.$queryRaw<ImageFindResult[]>`
                    SELECT label, url, embedding <-> ${embedding}::vector AS distance 
                    FROM "Image" 
                    WHERE model = ${model} AND detector = ${detector} AND embedding <-> ${embedding}::vector <= ${threshold} 
                    ORDER BY distance`
                  : prisma.$queryRaw<ImageFindResult[]>`
                    SELECT label, url, embedding <=> ${embedding}::vector AS distance 
                    FROM "Image" 
                    WHERE model = ${model} AND detector = ${detector} AND embedding <=> ${embedding}::vector <= ${threshold} 
                    ORDER BY distance`;
              images = await query;
              break;
            case "Qdrant":
              const collectionName = `Image-${model}-${detector}-${distanceMetric}`;
              const collections = await qdrant.getCollections();

              if (
                !collections.collections.find((c) => c.name === collectionName)
              ) {
                await qdrant.createCollection(collectionName, {
                  vectors: {
                    size: embedding.length,
                    distance: distanceMetric === "Cosine" ? "Cosine" : "Euclid",
                  },
                });
              }

              const res = await qdrant.search(collectionName, {
                vector: embedding,
                score_threshold:
                  distanceMetric === "Cosine" ? 1 - threshold : threshold,
                with_payload: true,
              });

              images = res.map((r) => ({
                label: r.payload?.label as string,
                url: r.payload?.url as string,
                distance: distanceMetric === "Cosine" ? 1 - r.score : r.score,
              }));

              console.log(images);

              break;
          }

          results.push({
            label,
            url,
            time: (Date.now() - start) / 1000,
            precision:
              images.length === 0
                ? 1
                : images.filter((i) => i.label === label).length /
                  images.length,
            model,
            detector,
            distanceMetric,
            database,
            matches: images,
          });
        }

        return { results };
      }
    ),
});

export type AppRouter = typeof appRouter;
