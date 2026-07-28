import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { requireAuth } from "../shared/auth";
import { listProducts } from "../shared/db";
import { error, HttpError, ok } from "../shared/response";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const user = requireAuth(event);
    const qs = event.queryStringParameters || {};

    const mine = String(qs.mine || "true").toLowerCase() !== "false";
    const limit = Number(qs.limit || 50);
    const offset = Number(qs.offset || 0);

    const result = listProducts({
      ownerId: mine ? user.userId : undefined,
      limit,
      offset,
    });

    const response: {
      items: typeof result.items;
      nextOffset?: number;
    } = { items: result.items };

    if (result.nextOffset !== null) {
      response.nextOffset = result.nextOffset;
    }

    return ok(response);
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.statusCode);
    return error(err instanceof Error ? err.message : "Internal error", 500);
  }
};
