import {
  ArrowUpTrayIcon,
  MagnifyingGlassCircleIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { type inferProcedureInput } from "@trpc/server";
import { generateReactHelpers } from "@uploadthing/react/hooks";
import { type NextPage } from "next";
import Head from "next/head";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Select from "~/components/select";
import { type AppRouter } from "~/server/api/root";
import { type FaceRouter } from "~/server/uploadthing";
import { api } from "~/utils/api";
import {
  DATABASES,
  DETECTORS,
  MODELS,
  SIMILARITY_METRICS,
} from "~/utils/constants";

const { useUploadThing } = generateReactHelpers<FaceRouter>();

type Input = inferProcedureInput<AppRouter["deepface"]["find"]>;

const Home: NextPage = () => {
  const represent = api.deepface.represent.useMutation();
  const find = api.deepface.find.useMutation();

  const [input, setInput] = useState<Input>({
    images: [],
    model: MODELS[0],
    detector: DETECTORS[0],
    similarityMetric: SIMILARITY_METRICS[0],
    database: DATABASES[0],
  });

  const { startUpload, isUploading } = useUploadThing({
    endpoint: "imageUploader",
    onClientUploadComplete: (r) =>
      r &&
      setInput((prev) => ({
        ...prev,
        images: prev.images.map((i) => {
          if (i.url) return i;

          return {
            ...i,
            url: r.find((r) => r.fileKey.includes(i.label))?.fileUrl ?? "",
          };
        }),
      })),
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setInput((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          ...acceptedFiles.map((f) => ({
            label: f.name.split(".")[0] ?? "",
            url: "",
          })),
        ],
      }));
      void startUpload(acceptedFiles);
    },
    [startUpload]
  );

  const { getRootProps, getInputProps, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/jpeg": [],
        "image/png": [],
      },
    });

  return (
    <>
      <Head>
        <title>EzFace</title>
        <meta
          name="description"
          content="DeepFace proof of concept with different databases"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-t from-[#13219f] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Ez<span className="text-[hsl(213,100%,70%)]">Face</span>
          </h1>
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="z-10 flex flex-row gap-2 rounded-xl bg-white/10 p-4 text-white">
              <div className="w-40">
                <h3 className="text-md">Model</h3>
                <Select
                  values={MODELS}
                  selected={input.model}
                  setSelected={(model) =>
                    setInput((prev) => ({ ...prev, model }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="text-md">Detector</h3>
                <Select
                  values={DETECTORS}
                  selected={input.detector}
                  setSelected={(detector) =>
                    setInput((prev) => ({ ...prev, detector }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="text-md">Similarity Metric</h3>
                <Select
                  values={SIMILARITY_METRICS}
                  selected={input.similarityMetric}
                  setSelected={(similarityMetric) =>
                    setInput((prev) => ({ ...prev, similarityMetric }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="text-md">Database</h3>
                <Select
                  values={DATABASES}
                  selected={input.database}
                  setSelected={(database) =>
                    setInput((prev) => ({ ...prev, database }))
                  }
                />
              </div>
            </div>
            {input.images.length > 0 && (
              <div className="flex h-16 flex-row gap-2 overflow-x-scroll rounded-xl bg-white/10 p-2">
                {input.images.map((image, i) => {
                  if (!image.url) return null;

                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      className="h-12 rounded-xl"
                      src={image.url}
                      alt={image.label}
                    />
                  );
                })}
              </div>
            )}
            <div
              className="relative flex h-96 w-full flex-col items-center justify-center gap-4 rounded-xl bg-white/10 p-2 text-white"
              {...getRootProps()}
            >
              <div
                className={`flex h-full w-full items-center justify-center rounded-xl border-2 border-[hsl(213,100%,70%)] ${
                  isDragAccept ? "border-teal-500" : ""
                } ${isDragReject ? "border-red-500" : ""}
                `}
              >
                <input {...getInputProps()} />
                {!isUploading ? (
                  <ArrowUpTrayIcon
                    className={`h-8 w-8 text-[hsl(213,100%,70%)] hover:cursor-pointer ${
                      isDragAccept ? "text-teal-500" : ""
                    } ${isDragReject ? "text-red-500" : ""}`}
                    aria-hidden="true"
                  />
                ) : (
                  <span>Uploading...</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 mb-3 mr-3 flex flex-row gap-1 font-bold">
                <button className="rounded-lg p-1 text-green-500 hover:bg-white/20">
                  <PlusCircleIcon
                    className="h-8 w-8"
                    aria-hidden="true"
                    onClick={() => represent.mutate(input)}
                  />
                </button>
                <button
                  className="rounded-lg p-1 text-yellow-500 hover:bg-white/20"
                  onClick={() => find.mutate(input)}
                >
                  <MagnifyingGlassCircleIcon
                    className="h-8 w-8"
                    aria-hidden="true"
                  />
                </button>
                <button
                  className="rounded-lg p-1 text-red-500 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInput((prev) => ({ ...prev, images: [] }));
                  }}
                >
                  <XCircleIcon className="h-8 w-8" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
