import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { requireAuth } from "../shared/auth";
import { getProduct } from "../shared/db";
import { error, HttpError, ok } from "../shared/response";

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    requireAuth(event);

    const productId =
      event.pathParameters?.productId ||
      event.pathParameters?.id ||
      event.queryStringParameters?.productId;

    if (!productId) return error("productId is required", 400);

    const product = getProduct(productId);
    if (!product) return error("Product not found", 404);

    return ok(product);
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.statusCode);
    return error(err instanceof Error ? err.message : "Internal error", 500);
  }
};
