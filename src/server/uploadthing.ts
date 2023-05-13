/** server/uploadthing.ts */
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { prisma } from "./db";
const f = createUploadthing();

export const faceRouter = {
  imageUploader: f
    .fileTypes(["image"])
    .maxSize("16MB")
    .onUploadComplete(async ({ file }) => {
      await prisma.image.create({
        data: {
          name: file.name,
          url: file.url,
          label: file.name.split(".")[0] ?? file.name,
        },
      });
    }),
} satisfies FileRouter;

export type FaceRouter = typeof faceRouter;
