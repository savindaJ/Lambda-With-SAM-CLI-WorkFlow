import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { handler as createHandler } from "./create";
import { handler as getHandler } from "./get";
import { handler as listHandler } from "./list";
import { handler as updateHandler } from "./update";
import { error } from "./shared/response";

function normalizePath(path: string): string {
  for (const prefix of ["/prod"]) {
    if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length);
    if (path === prefix) return "/";
  }
  return path;
}

async function run(
  fn: APIGatewayProxyHandler,
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const result = fn(event, context, () => undefined);
  return (await result) as APIGatewayProxyResult;
}

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const method = (event.httpMethod || "").toUpperCase();
  const path = normalizePath(event.path || "");

  if (method === "POST" && path === "/products") {
    return run(createHandler, event, context);
  }
  if (method === "GET" && path === "/products") {
    return run(listHandler, event, context);
  }
  if (method === "GET" && path.startsWith("/products/")) {
    const productId = decodeURIComponent(path.slice("/products/".length));
    event.pathParameters = { ...(event.pathParameters || {}), productId };
    return run(getHandler, event, context);
  }
  if (method === "PUT" && path.startsWith("/products/")) {
    const productId = decodeURIComponent(path.slice("/products/".length));
    event.pathParameters = { ...(event.pathParameters || {}), productId };
    return run(updateHandler, event, context);
  }

  return error(`Not found: ${method} ${path}`, 404);
};
