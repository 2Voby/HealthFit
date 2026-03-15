import { client } from "@/api/client";
import type { Flow } from "@/types/flow";
import type { ApiResult } from "@/types/api";
import { OfferSelectionResponse } from "@/types/offer";

export async function getActiveFlow(): Promise<ApiResult<Flow>> {
  try {
    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
    const response = await client.get<Flow>("v1/flows/active");
    return { success: true, data: response.data };
  } catch (error: any) {
    const message = error?.response?.data?.message ?? error?.message ?? "Unknown error";
    return { success: false, error: message, details: error?.response?.data };
  }
}

// src/api/requests.ts
export async function getSuggestedOffer(attributes: number[]): Promise<ApiResult<OfferSelectionResponse>> {
  try {
    const response = await client.post<OfferSelectionResponse>("v1/offers/selection", { attributes });
    return { success: true, data: response.data };
  } catch (error: any) {
    const message = error?.response?.data?.message ?? error?.message ?? "Unknown error";
    return { success: false, error: message, details: error?.response?.data };
  }
}