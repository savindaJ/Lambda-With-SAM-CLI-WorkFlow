import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { requireAuth } from "../shared/auth";
import { NotFoundError, nowIso, updateProduct, type ProductUpdates } from "../shared/db";
import { error, HttpError, ok, parseBody } from "../shared/response";

const ALLOWED = new Set(["name", "description", "price", "currency"]);

interface UpdateBody {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
}

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const user = requireAuth(event);

    const productId =
      event.pathParameters?.productId ||
      event.pathParameters?.id ||
      event.queryStringParameters?.productId;

    if (!productId) return error("productId is required", 400);

    let body: UpdateBody;
    try {
      body = parseBody<UpdateBody>(event);
    } catch {
      return error("Invalid JSON body", 400);
    }

    const updates: ProductUpdates = {};
    for (const key of ALLOWED) {
      if (body[key as keyof UpdateBody] !== undefined) {
        (updates as Record<string, unknown>)[key] = body[key as keyof UpdateBody];
      }
    }

    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();
      if (!updates.name) return error("name cannot be empty", 400);
    }
    if (updates.description !== undefined) {
      updates.description = String(updates.description).trim();
    }
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
      if (!Number.isFinite(updates.price) || updates.price < 0) {
        return error("price must be a non-negative number", 400);
      }
    }
    if (updates.currency !== undefined) {
      updates.currency = String(updates.currency).trim().toUpperCase();
    }

    if (Object.keys(updates).length === 0) {
      return error("No updatable fields provided", 400);
    }

    updates.updatedAt = nowIso();

    try {
      const updated = updateProduct(productId, updates, user.userId);
      return ok(updated);
    } catch (err) {
      if (err instanceof NotFoundError) {
        return error(err.message, 404);
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.statusCode);
    return error(err instanceof Error ? err.message : "Internal error", 500);
  }
};
