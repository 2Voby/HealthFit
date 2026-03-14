import { client } from "@/api/client";

export async function getActiveFlow(): Promise<unknown> {
    try {
        const response = await client.get<unknown>('v1/flows/active');
        return { success: true, data: response.data };
    } catch (error: any) {
        const message = error?.response?.data?.message ?? error?.message ?? 'Unknown error';
        return { success: false, error: message, details: error?.response?.data };
    }
}