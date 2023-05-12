/** server/uploadthing.ts */
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
import { prisma } from "./db";
const f = createUploadthing();

export const faceRouter = {
  imageUploader: f
    .fileTypes(["image"])
    .maxSize("16MB")
    .onUploadComplete(async ({ file }) => {
      console.log("file", file);
      console.log(await prisma.example.findMany());
    }),
} satisfies FileRouter;

export type FaceRouter = typeof faceRouter;
