import { type Image } from "@prisma/client";
import { SchemaFieldTypes, VectorAlgorithms } from "redis";
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
  image: z.object({
    label: z.string().regex(/^[a-zA-Z0-9-_]+$/),
    url: z.string().url(),
  }),
  model: z.enum(MODELS),
  detector: z.enum(DETECTORS),
  distanceMetric: z.enum(DISTANCE_METRICS),
  database: z.enum(DATABASES),
});

const Output = z.object({
  label: z.string().regex(/^[a-zA-Z0-9-_]+$/),
  url: z.string().url(),
  time: z.number(),
  precision: z.number(),
  recall: z.number(),
  f1: z.number(),
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
});

export const appRouter = createTRPCRouter({
  represent: publicProcedure.input(Input).mutation(
    async ({
      input: {
        image: { label, url },
        model,
        detector,
        database,
        distanceMetric,
      },
      ctx: { prisma, qdrant, redis },
    }) => {
      const embedding = await represent(await fetchImage(url), model, detector);

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

          if (!collections.collections.find((c) => c.name === collectionName)) {
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

        case "Redis":
          const index = `Image-${model}-${detector}-${distanceMetric}`;

          try {
            await redis.ft.create(
              index,
              {
                label: SchemaFieldTypes.TAG,
                embedding: {
                  type: SchemaFieldTypes.VECTOR,
                  ALGORITHM: VectorAlgorithms.HNSW,
                  TYPE: "FLOAT32",
                  DIM: embedding.length,
                  DISTANCE_METRIC:
                    distanceMetric === "Cosine" ? "COSINE" : "L2",
                },
              },
              {
                ON: "HASH",
                PREFIX: `${index}:`,
              }
            );
          } catch (err) {
            if (
              !(err instanceof Error) ||
              err.message !== "Index already exists"
            ) {
              throw err;
            }
          }

          await redis.hSet(
            `${index}:${parseInt(
              Math.floor(Math.random() * 1000000)
                .toString()
                .padStart(6, "0")
            )}`,
            {
              label,
              url,
              embedding: Buffer.from(new Float32Array(embedding).buffer),
            }
          );
          break;
      }
    }
  ),
  find: publicProcedure
    .input(Input)
    .output(Output)
    .mutation(
      async ({
        input: {
          image: { label, url },
          model,
          detector,
          database,
          distanceMetric,
        },
        ctx: { prisma, qdrant, redis },
      }) => {
        const start = Date.now();
        const threshold = THRESHOLDS[model][distanceMetric];
        let images: ImageFindResult[] = [];
        let count = 0;
        let end = 0;
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
            end = Date.now();
            count = await prisma.image.count({
              where: { label, model, detector },
            });
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
            end = Date.now();
            count = (
              await qdrant.count(collectionName, {
                filter: { must: [{ key: "label", match: { value: label } }] },
              })
            ).count;
            break;

          case "Redis":
            const index = `Image-${model}-${detector}-${distanceMetric}`;
            const results = await redis.ft.search(
              index,
              "@embedding:[VECTOR_RANGE $RANGE $BLOB]=>{$YIELD_DISTANCE_AS: distance}",
              {
                PARAMS: {
                  BLOB: Buffer.from(new Float32Array(embedding).buffer),
                  RANGE: threshold,
                },
                SORTBY: "distance",
                DIALECT: 2,
                RETURN: ["label", "url", "distance"],
              }
            );
            images = results.documents.map((r) => ({
              label: r.value.label as string,
              url: r.value.url as string,
              distance: parseFloat(r.value.distance as string),
            }));
            end = Date.now();
            count = (await redis.ft.search(index, `@label:{${label}}`)).total;
            break;
        }

        const truePositives = images.filter((i) => i.label === label).length;
        const falsePositives = images.length - truePositives;
        const falseNegatives = count - truePositives;
        const precision = truePositives / (truePositives + falsePositives || 1);
        const recall = truePositives / (truePositives + falseNegatives);
        const f1 = (2 * (precision * recall)) / (precision + recall || 1);

        return {
          label,
          url,
          time: (end - start) / 1000,
          precision,
          recall,
          f1,
          model,
          detector,
          distanceMetric,
          database,
          matches: images,
        };
      }
    ),
});

export type AppRouter = typeof appRouter;
