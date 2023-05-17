import { PrismaClient } from "@prisma/client";
import { QdrantClient } from "@qdrant/js-client-rest";
import { createClient, type RedisClientType } from "redis";

import { env } from "~/env.mjs";

const global = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  qdrant: QdrantClient | undefined;
  redis: RedisClientType | undefined;
};

export const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

export const qdrant =
  global.qdrant ?? new QdrantClient({ url: "http://localhost:6333" });

export const redis = global.redis ?? createClient();

if (!redis.isOpen) {
  void redis.connect();
}

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
  global.qdrant = qdrant;
  global.redis = redis;
}
