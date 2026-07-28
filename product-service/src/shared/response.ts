import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export type ApiResult = APIGatewayProxyResult;

export function ok(body: unknown, statusCode = 200): ApiResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

export function error(message: string, statusCode = 400): ApiResult {
  return ok({ error: message }, statusCode);
}

export function parseBody<T = Record<string, unknown>>(
  event: APIGatewayProxyEvent
): T {
  let body: unknown = event.body ?? "{}";
  if (event.isBase64Encoded && typeof body === "string") {
    body = Buffer.from(body, "base64").toString("utf8");
  }
  if (typeof body === "string") {
    return (body ? JSON.parse(body) : {}) as T;
  }
  return (body ?? {}) as T;
}

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}
