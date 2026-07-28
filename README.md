# lambda-test

Two apps, **one API Gateway / one port** when run from the repo root.

| App | Runtime | Routes |
|-----|---------|--------|
| **auth-service** | Python 3.11 | `/auth/*` |
| **product-service** | TypeScript | `/products/*` |

No database — in-memory store (resets on cold start).

## Run both on a single port (recommended)

Needs **Docker Desktop** running.

```bash
cd /Users/savindajayasekara/My-Workzone/lambda-test

# install product deps once
cd product-service && npm install && cd ..

# build both Lambdas, then start one local API on :3000
PATH="$PWD/product-service/node_modules/.bin:$PATH" sam build
sam local start-api --port 3000 --env-vars env.json --warm-containers EAGER
```

Everything is on **http://127.0.0.1:3000**

```bash
# Register
curl -s -X POST http://127.0.0.1:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"secret123","name":"Alice"}'

# Login → copy accessToken
curl -s -X POST http://127.0.0.1:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"secret123"}'

# Create product
curl -s -X POST http://127.0.0.1:3000/products \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mouse","price":29.99}'

# List products
curl -s http://127.0.0.1:3000/products \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

| Method | Path |
|--------|------|
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/logout` |
| POST | `/auth/refresh` |
| POST | `/products` |
| GET | `/products` |
| GET | `/products/{productId}` |
| PUT | `/products/{productId}` |

## Optional: run apps on separate ports

```bash
# Auth :3001
cd auth-service && sam build
sam local start-api --port 3001 --env-vars env.json --warm-containers EAGER

# Product :3002
cd product-service && npm run build
sam local start-api --port 3002 --env-vars env.json --warm-containers EAGER
```

## Deploy

From root (one stack, one API URL):

```bash
PATH="$PWD/product-service/node_modules/.bin:$PATH" sam build
sam deploy --guided
```

Or deploy each service folder separately if you want 2 API URLs.

cd product-service && npm install && cd ..

PATH="$PWD/product-service/node_modules/.bin:$PATH" sam build
sam local start-api --port 3000 --env-vars env.json --warm-containers EAGER