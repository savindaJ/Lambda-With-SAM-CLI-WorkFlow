import type { APIGatewayProxyEvent } from "aws-lambda";
import jwt from "jsonwebtoken";
import { HttpError } from "./response";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthUser {
  userId: string;
  email?: string;
}

interface AccessTokenPayload {
  sub: string;
  email?: string;
  type?: string;
}

function getBearerToken(event: APIGatewayProxyEvent): string | null {
  const headers = event.headers || {};
  const auth =
    headers.Authorization ||
    headers.authorization ||
    headers.AUTHORIZATION ||
    "";
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function requireAuth(event: APIGatewayProxyEvent): AuthUser {
  const token = getBearerToken(event);
  if (!token) {
    throw new HttpError("Missing Authorization Bearer token", 401);
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    if (payload.type && payload.type !== "access") {
      throw new HttpError("Access token required", 401);
    }
    return {
      userId: payload.sub,
      email: payload.email,
    };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError("Invalid or expired token", 401);
  }
}
