import { client } from "@/api/client";
import type { Flow } from "@/types/flow";
import type { ApiResult } from "@/types/api";

export async function getActiveFlow(): Promise<ApiResult<Flow>> {
  try {
    const response = await client.get<Flow>("v1/flows/active");
    return { success: true, data: response.data };
  } catch (error: any) {
    const message = error?.response?.data?.message ?? error?.message ?? "Unknown error";
    return { success: false, error: message, details: error?.response?.data };
  }
}