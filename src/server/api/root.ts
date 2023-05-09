import { createTRPCRouter } from "~/server/api/trpc";
import { deepfaceRouter } from "./routers/deepface";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  deepface: deepfaceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
