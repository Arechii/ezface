import { createNextPageApiHandler } from "uploadthing/next-legacy";
import { faceRouter } from "~/server/uploadthing";

const handler = createNextPageApiHandler({
  router: faceRouter,
});

export default handler;
