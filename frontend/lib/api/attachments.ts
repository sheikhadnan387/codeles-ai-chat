import { apiClient } from "./client";
import type { Attachment } from "@/types";

export async function uploadAttachment(
  file: File,
  signal?: AbortSignal,
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post<Attachment>(
    "/attachments",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
    },
  );
  return data;
}
