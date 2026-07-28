import type { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "../shared/auth";
import { nowIso, putProduct, type Product } from "../shared/db";
import { error, HttpError, ok, parseBody } from "../shared/response";

interface CreateBody {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
}

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const user = requireAuth(event);

    let body: CreateBody;
    try {
      body = parseBody<CreateBody>(event);
    } catch {
      return error("Invalid JSON body", 400);
    }

    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const price = Number(body.price);
    const currency = String(body.currency || "USD").trim().toUpperCase();

    if (!name) return error("name is required", 400);
    if (!Number.isFinite(price) || price < 0) {
      return error("price must be a non-negative number", 400);
    }

    const product: Product = {
      productId: uuidv4(),
      ownerId: user.userId,
      name,
      description,
      price,
      currency,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    putProduct(product);
    return ok(product, 201);
  } catch (err) {
    if (err instanceof HttpError) return error(err.message, err.statusCode);
    return error(err instanceof Error ? err.message : "Internal error", 500);
  }
};
