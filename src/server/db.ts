import { PrismaClient } from "@prisma/client";
import { QdrantClient } from "@qdrant/js-client-rest";

import { env } from "~/env.mjs";

const global = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  qdrant: QdrantClient | undefined;
};

export const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

export const qdrant =
  global.qdrant ?? new QdrantClient({ url: "http://localhost:6333" });

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
  global.qdrant = qdrant;
}
