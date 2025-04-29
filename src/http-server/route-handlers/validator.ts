export interface GetParams {
  id: string;
}

export const ErrorMessage = {
  InvalidParams: "Params must be an object",
  InvalidId: "id must be a string",
} as const;
export type ErrorMessage = (typeof ErrorMessage)[keyof typeof ErrorMessage];

export function assertGetParams(
  params: unknown,
): asserts params is { id: string } {
  if (typeof params !== "object" || params === null) {
    throw new Error(ErrorMessage.InvalidParams);
  }

  if (typeof (params as Record<string, unknown>).id !== "string") {
    throw new Error(ErrorMessage.InvalidId);
  }
}
