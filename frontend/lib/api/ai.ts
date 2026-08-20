import { apiClient } from "./client";
import type { AiModel } from "@/types";

export async function listAiModels(): Promise<AiModel[]> {
  const { data } = await apiClient.get<AiModel[]>("/ai/models");
  return data;
}
