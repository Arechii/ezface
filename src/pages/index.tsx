import {
  ArrowUpTrayIcon,
  MagnifyingGlassCircleIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import {
  type inferProcedureInput,
  type inferProcedureOutput,
} from "@trpc/server";
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
  DISTANCE_METRICS,
  MODELS,
} from "~/utils/constants";

const { useUploadThing } = generateReactHelpers<FaceRouter>();

type Input = inferProcedureInput<AppRouter["find"]>;
type Output = inferProcedureOutput<AppRouter["find"]>;

const Home: NextPage = () => {
  const represent = api.represent.useMutation();
  const find = api.find.useMutation();

  const [input, setInput] = useState<Input>({
    images: [],
    model: MODELS[0],
    detector: DETECTORS[0],
    distanceMetric: DISTANCE_METRICS[0],
    database: DATABASES[0],
  });

  const [isFinding, setIsFinding] = useState(false);
  const [output, setOutput] = useState<Output | null>(null);

  const { startUpload, isUploading } = useUploadThing({
    endpoint: "imageUploader",
    onClientUploadComplete: (r) =>
      r &&
      setInput((prev) => ({
        ...prev,
        images: prev.images.map((i) => {
          if (i.url) return i;

          return {
            label: i.label.split(".")[0] ?? i.label,
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
            label: f.name.replace(f.type.split("/")[1] ?? "", ""),
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
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Ez<span className="text-primary">Face</span>
          </h1>
          <div className="flex max-w-2xl flex-col gap-2">
            <div className="z-20 flex flex-row gap-2 rounded-xl bg-neutral p-4">
              <div className="w-40">
                <h3 className="label-text">Model</h3>
                <Select
                  values={MODELS}
                  selected={input.model}
                  setSelected={(model) =>
                    setInput((prev) => ({ ...prev, model }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="label-text">Detector</h3>
                <Select
                  values={DETECTORS}
                  selected={input.detector}
                  setSelected={(detector) =>
                    setInput((prev) => ({ ...prev, detector }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="label-text">Distance Metric</h3>
                <Select
                  values={DISTANCE_METRICS}
                  selected={input.distanceMetric}
                  setSelected={(distanceMetric) =>
                    setInput((prev) => ({ ...prev, distanceMetric }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="label-text">Database</h3>
                <Select
                  values={DATABASES}
                  selected={input.database}
                  setSelected={(database) =>
                    setInput((prev) => ({ ...prev, database }))
                  }
                />
              </div>
            </div>
            {!output && input.images.length > 0 && (
              <div className="flex h-16 flex-row gap-2 overflow-x-scroll rounded-xl bg-neutral p-2">
                {input.images.map((image, i) => {
                  if (!image.url) return null;

                  return (
                    <div className="avatar" key={i}>
                      <div className="w-12 rounded-xl">
                        {/*eslint-disable-next-line @next/next/no-img-element*/}
                        <img
                          src={image.url}
                          alt={image.label}
                          title={image.label}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!output && (
              <div
                className="relative flex h-96 w-full flex-col items-center justify-center gap-4 rounded-xl bg-neutral p-2"
                {...getRootProps()}
              >
                <div
                  className={`flex h-full w-full items-center justify-center rounded-xl border-2 border-neutral-content ${
                    isDragAccept ? "border-success" : ""
                  } ${isDragReject ? "border-error" : ""}
                `}
                >
                  <input {...getInputProps()} />
                  {!isUploading && !isFinding ? (
                    <ArrowUpTrayIcon
                      className={`h-8 w-8 text-neutral-content hover:cursor-pointer ${
                        isDragAccept ? "text-success" : ""
                      } ${isDragReject ? "text-error" : ""}`}
                      aria-hidden="true"
                    />
                  ) : (
                    <progress className="progress progress-primary w-56 bg-base-300/20" />
                  )}
                </div>
                {input.images.length > 0 && !isUploading && (
                  <div className="absolute bottom-0 right-0 mb-4 mr-4 flex flex-row gap-1 font-bold">
                    <div
                      className="tooltip tooltip-primary"
                      data-tip="Index images"
                    >
                      <button className="rounded-lg p-1 text-primary hover:bg-neutral-focus">
                        <PlusCircleIcon
                          className="h-8 w-8"
                          aria-hidden="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            represent.mutate(input);
                          }}
                        />
                      </button>
                    </div>
                    <div
                      className="tooltip tooltip-secondary"
                      data-tip="Find matches"
                    >
                      <button
                        className="rounded-lg p-1 text-secondary hover:bg-neutral-focus"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFinding(true);
                          find.mutate(input, {
                            onSuccess(data) {
                              setOutput(data);
                              setIsFinding(false);
                            },
                          });
                        }}
                      >
                        <MagnifyingGlassCircleIcon
                          className="h-8 w-8"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    <div
                      className="tooltip tooltip-accent"
                      data-tip="Clear input"
                    >
                      <button
                        className="rounded-lg p-1 text-accent hover:bg-neutral-focus"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInput((prev) => ({ ...prev, images: [] }));
                        }}
                      >
                        <XCircleIcon className="h-8 w-8" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {output && (
              <div className="relative flex h-96 w-full flex-col gap-4 rounded-xl bg-neutral p-2">
                <div className="h-5/6 w-full overflow-x-auto rounded-xl">
                  <table className="table-zebra table-compact table h-full w-full">
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Label</th>
                        <th>Time</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1</th>
                        <th>Matches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {output.results.map((r, i) => (
                        <tr key={i}>
                          <th>
                            <div className="avatar" key={i}>
                              <div className="w-8 rounded-xl">
                                {/*eslint-disable-next-line @next/next/no-img-element*/}
                                <img
                                  src={r.url}
                                  alt={r.label}
                                  title={r.label}
                                />
                              </div>
                            </div>
                          </th>
                          <td>
                            <div className="font-bold">{r.label}</div>
                          </td>
                          <td>
                            <span className="badge-info badge">
                              {r.time.toFixed(2)}s
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${
                                r.precision >= 0.8
                                  ? "badge-success"
                                  : "badge-error"
                              } badge`}
                            >
                              {r.precision.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${
                                r.recall >= 0.8
                                  ? "badge-success"
                                  : "badge-error"
                              } badge`}
                            >
                              {r.recall.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`${
                                r.f1 >= 0.8 ? "badge-success" : "badge-error"
                              } badge`}
                            >
                              {r.f1.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <div className="avatar-group -space-x-4">
                              {r.matches.map((m, i) => (
                                <div key={i} className="avatar">
                                  <div className="w-8 rounded-xl">
                                    {/*eslint-disable-next-line @next/next/no-img-element*/}
                                    <img
                                      src={m.url}
                                      alt={m.label}
                                      title={`${m.label} - ${m.distance.toFixed(
                                        2
                                      )}`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="absolute bottom-0 right-0 mb-4 mr-4 flex flex-row gap-1 font-bold">
                  <div
                    className="tooltip tooltip-accent"
                    data-tip="Clear output"
                  >
                    <button
                      className="rounded-lg p-1 text-accent hover:bg-neutral-focus"
                      onClick={() => setOutput(null)}
                    >
                      <XCircleIcon className="h-8 w-8" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
