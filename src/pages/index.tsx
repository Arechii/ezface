import {
  MagnifyingGlassCircleIcon,
  PlusCircleIcon,
} from "@heroicons/react/20/solid";
import { type inferProcedureInput } from "@trpc/server";
import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Select from "~/components/select";
import { type AppRouter } from "~/server/api/root";
import { api } from "~/utils/api";
import {
  DATABASES,
  DETECTORS,
  MODELS,
  SIMILARITY_METRICS,
} from "~/utils/constants";

type Input = inferProcedureInput<AppRouter["deepface"]["find"]>;

const Home: NextPage = () => {
  const find = api.deepface.find.useMutation();
  const [input, setInput] = useState<Input>({
    model: MODELS[0],
    detector: DETECTORS[0],
    similarityMetric: SIMILARITY_METRICS[0],
    database: DATABASES[0],
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
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 rounded-xl bg-white/10 p-4 text-white">
              <div className="w-40">
                <h3 className="text-md">Model</h3>
                <Select
                  values={MODELS}
                  selected={input.model}
                  setSelected={(model) =>
                    setInput((prev) => ({
                      ...prev,
                      model: model as (typeof MODELS)[number],
                    }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="text-md">Detector</h3>
                <Select
                  values={DETECTORS}
                  selected={input.detector}
                  setSelected={(detector) =>
                    setInput((prev) => ({
                      ...prev,
                      detector: detector as (typeof DETECTORS)[number],
                    }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="text-md">Similarity Metric</h3>
                <Select
                  values={SIMILARITY_METRICS}
                  selected={input.similarityMetric}
                  setSelected={(similarityMetric) =>
                    setInput((prev) => ({
                      ...prev,
                      similarityMetric:
                        similarityMetric as (typeof SIMILARITY_METRICS)[number],
                    }))
                  }
                />
              </div>
              <div className="w-40">
                <h3 className="text-md">Database</h3>
                <Select
                  values={DATABASES}
                  selected={input.database}
                  setSelected={(database) =>
                    setInput((prev) => ({
                      ...prev,
                      database: database as (typeof DATABASES)[number],
                    }))
                  }
                />
              </div>
            </div>
            <div className="relative flex h-96 w-full flex-col items-center justify-center gap-4 rounded-xl bg-white/10 p-4 text-white">
              <div className="absolute bottom-0 right-0 mb-2 mr-2 flex flex-row gap-1 font-bold">
                <button className="rounded-lg p-1 text-green-500 hover:bg-white/20">
                  <PlusCircleIcon className="h-8 w-8" aria-hidden="true" />
                </button>
                <button className="rounded-lg p-1 text-yellow-500 hover:bg-white/20">
                  <MagnifyingGlassCircleIcon
                    className="h-8 w-8"
                    aria-hidden="true"
                  />
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
