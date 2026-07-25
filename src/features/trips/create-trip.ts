import type { TripValues } from "@/lib/validation/trips";

export type CreateTripRpcArguments = {
  p_name: string;
  p_description: string | null;
  p_cover_path: string;
};

type RpcError = { message: string };
type RpcResponse = { data: string | null; error: RpcError | null };

export function buildCreateTripArguments(
  values: TripValues,
): CreateTripRpcArguments {
  return {
    p_name: values.name,
    p_description: values.description || null,
    p_cover_path: values.coverPlaceholder,
  };
}

export async function executeCreateTrip(
  values: TripValues,
  invokeRpc: (args: CreateTripRpcArguments) => Promise<RpcResponse>,
) {
  const { data, error } = await invokeRpc(buildCreateTripArguments(values));

  if (error || !data) {
    return {
      success: false as const,
      error: "The chapter could not be created. Please try again.",
    };
  }

  return { success: true as const, tripId: data };
}
