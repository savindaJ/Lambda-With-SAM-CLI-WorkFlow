export interface Product {
  productId: string;
  ownerId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductUpdates = Partial<
  Pick<Product, "name" | "description" | "price" | "currency" | "updatedAt">
>;

export class NotFoundError extends Error {
  constructor(message = "Product not found or not owned by you") {
    super(message);
    this.name = "NotFoundError";
  }
}

// In-memory only (resets on cold start). Shared via single ProductFunction router.
const products = new Map<string, Product>();

export function nowIso(): string {
  return new Date().toISOString();
}

export function putProduct(item: Product): Product {
  products.set(item.productId, item);
  return item;
}

export function getProduct(productId: string): Product | null {
  return products.get(productId) || null;
}

export interface ListProductsInput {
  ownerId?: string;
  limit?: number;
  offset?: number;
}

export interface ListProductsResult {
  items: Product[];
  nextOffset: number | null;
}

export function listProducts({
  ownerId,
  limit = 50,
  offset = 0,
}: ListProductsInput = {}): ListProductsResult {
  const capped = Math.min(Number(limit) || 50, 100);
  const start = Math.max(Number(offset) || 0, 0);

  let items = Array.from(products.values());
  if (ownerId) {
    items = items.filter((p) => p.ownerId === ownerId);
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const slice = items.slice(start, start + capped);
  const next = start + capped;
  return {
    items: slice,
    nextOffset: next < items.length ? next : null,
  };
}

export function updateProduct(
  productId: string,
  updates: ProductUpdates,
  ownerId: string
): Product {
  const existing = products.get(productId);
  if (!existing || existing.ownerId !== ownerId) {
    throw new NotFoundError();
  }
  const updated: Product = { ...existing, ...updates };
  products.set(productId, updated);
  return updated;
}
