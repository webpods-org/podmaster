import { StatusCodes } from "http-status-codes";

export function getFieldValue(
  value: string | string[] | undefined
): string | undefined {
  return value !== undefined
    ? Array.isArray(value)
      ? value[0]
      : value
    : undefined;
}

export type HttpError = {
  error: string;
  status: StatusCodes;
};
