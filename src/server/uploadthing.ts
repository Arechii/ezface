/** server/uploadthing.ts */
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
const f = createUploadthing();

export const faceRouter = {
  imageUploader: f
    .fileTypes(["image"])
    .maxSize("16MB")
    .onUploadComplete(({ file }) => {
      console.log("file", file);
    }),
} satisfies FileRouter;

export type FaceRouter = typeof faceRouter;
