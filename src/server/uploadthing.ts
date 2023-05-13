/** server/uploadthing.ts */
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy";
const f = createUploadthing();

export const faceRouter = {
  imageUploader: f
    .fileTypes(["image"])
    .maxSize("16MB")
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type FaceRouter = typeof faceRouter;
