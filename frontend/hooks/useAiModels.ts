"use client";

import { useEffect, useState } from "react";
import { listAiModels } from "@/lib/api/ai";
import { getApiErrorMessage } from "@/lib/api/client";
import type { AiModel } from "@/types";

// GET /ai/models is config-backed, not a hardcoded list — fetch once and
// cache in module scope so every consumer (composer, settings dialog) shares
// the same in-flight request and result without a data-fetching library.
let cachedModels: AiModel[] | null = null;
let inflightRequest: Promise<AiModel[]> | null = null;

export type AiModelsStatus = "loading" | "loaded" | "error";

export function useAiModels() {
  const [models, setModels] = useState<AiModel[]>(() => cachedModels ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedModels) return;
    let cancelled = false;

    if (!inflightRequest) {
      inflightRequest = listAiModels();
    }

    inflightRequest
      .then((data) => {
        cachedModels = data;
        if (!cancelled) setModels(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load available models."));
        }
      })
      .finally(() => {
        inflightRequest = null;
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const status: AiModelsStatus = models.length > 0 ? "loaded" : error ? "error" : "loading";

  return { models, status, error };
}
