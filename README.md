# Hotel Offer Orchestrator

A backend service that aggregates hotel offers from two mock suppliers, compares prices, removes duplicate hotels, and returns the best available offer for each hotel.

The project uses **NestJS, TypeScript, Temporal, Redis, Docker, and PostgreSQL (for Temporal's internal persistence)**.

---

## Features

* Fetch hotel offers from two mock suppliers
* Run supplier fetching through a Temporal workflow
* Call Supplier A and Supplier B in parallel
* Deduplicate hotels by hotel name
* Select the cheapest offer when a hotel exists in both suppliers
* Keep hotels that are available from only one supplier
* Cache hotel results in Redis
* Filter hotels by minimum and maximum price
* Dockerized infrastructure
* Health check endpoint for suppliers
* Postman-compatible REST APIs

---

## Tech Stack

* **Node.js**
* **NestJS**
* **TypeScript**
* **Temporal**
* **Redis**
* **PostgreSQL** - used internally by Temporal
* **Docker / Docker Compose**
* **Postman**

---

## Architecture

```text
                    Client
                      |
                      v
              NestJS REST API
                      |
                      v
               Hotels Service
                      |
                 Check Redis
                  /       \
               HIT         MISS
                |            |
                |            v
                |       Temporal Workflow
                |          /        \
                |         v          v
                |    Supplier A   Supplier B
                |         \          /
                |          \        /
                |           v      v
                |        Compare & Deduplicate
                |               |
                |               v
                |             Redis
                |               |
                +---------------+
                        |
                        v
                    Response
```

---

## API Endpoints

### 1. Get Supplier A Hotels

```http
GET /supplierA/hotels?city=delhi
```

Example:

```bash
curl "http://localhost:4000/supplierA/hotels?city=delhi"
```

---

### 2. Get Supplier B Hotels

```http
GET /supplierB/hotels?city=delhi
```

Example:

```bash
curl "http://localhost:4000/supplierB/hotels?city=delhi"
```

---

### 3. Get Aggregated Hotels

```http
GET /api/hotels?city=delhi
```

Example:

```bash
curl "http://localhost:4000/api/hotels?city=delhi"
```

The API:

1. Gets hotels from both suppliers.
2. Compares overlapping hotels.
3. Selects the cheaper offer.
4. Keeps hotels available from only one supplier.
5. Returns the final deduplicated list.

Example response:

```json
[
  {
    "name": "Holtin",
    "price": 5340,
    "city": "delhi",
    "commissionPct": 20,
    "supplier": "Supplier B"
  },
  {
    "name": "Radison",
    "price": 5900,
    "city": "delhi",
    "commissionPct": 13,
    "supplier": "Supplier A"
  }
]
```

---

### 4. Filter Hotels by Price

```http
GET /api/hotels?city=delhi&minPrice=5000&maxPrice=7000
```

Example:

```bash
curl "http://localhost:4000/api/hotels?city=delhi&minPrice=5000&maxPrice=7000"
```

Parameters:

| Parameter  | Required | Description         |
| ---------- | -------- | ------------------- |
| `city`     | Yes      | City to search      |
| `minPrice` | No       | Minimum hotel price |
| `maxPrice` | No       | Maximum hotel price |

---

### 5. Health Check

```http
GET /health
```

Example:

```bash
curl "http://localhost:4000/health"
```

Example response:

```json
{
  "status": "ok",
  "suppliers": {
    "supplierA": "healthy",
    "supplierB": "healthy"
  }
}
```

---

## Mock Suppliers

The project contains two mock hotel suppliers.

### Supplier A

```http
GET /supplierA/hotels?city=delhi
```

### Supplier B

```http
GET /supplierB/hotels?city=delhi
```

The mock data contains overlapping hotels with different prices.

For example:

```text
Holtin

Supplier A → ₹6000
Supplier B → ₹5340

Selected → Supplier B
```

This allows the application to demonstrate the hotel deduplication and price comparison logic.

---

## Temporal Workflow

Temporal is used to orchestrate the hotel aggregation workflow.

The workflow executes supplier activities in parallel:

```text
              Hotel Workflow
                    |
          +---------+---------+
          |                   |
          v                   v
   Supplier A Activity   Supplier B Activity
          |                   |
          +---------+---------+
                    |
                    v
             Compare Prices
                    |
                    v
              Deduplicate
                    |
                    v
             Final Hotel List
```

### Temporal Components

* **Workflow** - defines the hotel aggregation process
* **Activities** - fetch data from Supplier A and Supplier B
* **Worker** - executes the workflow and activities
* **Temporal Server** - manages workflow execution and state

---

## Redis

Redis is used for caching hotel results.

A repeated request can return the cached result instead of executing the complete workflow again.

Example:

```text
First request
     |
     v
Redis MISS
     |
     v
Temporal Workflow
     |
     v
Save result to Redis
```

Next identical request:

```text
Request
   |
   v
Redis HIT
   |
   v
Return cached result
```

Redis runs on:

```text
localhost:6379
```

---

## Docker

Docker Compose is used to run the infrastructure required by the application.

Services include:

```text
NestJS Application
Redis
Temporal
Temporal UI
PostgreSQL
```

### Start Docker Services

```bash
docker compose up -d
```

Check running containers:

```bash
docker compose ps
```

Stop services:

```bash
docker compose down
```

---

## Temporal UI

Temporal UI is available at:

```text
http://localhost:8080
```

It can be used to inspect workflow executions and their status.

---

## Local Development

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Docker Desktop
* Git

---

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

```bash
cd Hotel
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Start Docker services

```bash
docker compose up -d
```

Verify:

```bash
docker compose ps
```

---

### 4. Start NestJS

```bash
npm run start:dev
```

The application runs on:

```text
http://localhost:4000
```

---

### 5. Start Temporal Worker

Run the Temporal worker separately:

```bash
npm run worker
```

The worker connects to the Temporal server and executes the hotel workflow.

---

## Environment

For local development, the services use the following addresses:

```text
NestJS:
localhost:4000

Redis:
localhost:6379

Temporal:
localhost:7233

Temporal UI:
localhost:8080

PostgreSQL:
localhost:5432
```

When running the application entirely inside Docker Compose, Docker service names should be used instead of `localhost`.

For example:

```text
redis:6379
temporal:7233
```

---

## Project Structure

```text
src/
│
├── hotels/
│   ├── hotels.controller.ts
│   ├── hotels.service.ts
│   ├── hotels.module.ts
│   │
│   └── temporal/
│       ├── hotel.workflow.ts
│       ├── hotel.activities.ts
│       ├── temporal.client.ts
│       └── worker.ts
│
├── redis/
│   ├── redis.service.ts
│   └── redis.module.ts
│
└── utils/
    └── mockData.ts

postman/
└── hotel-offer.postman_collection.json

Dockerfile
docker-compose.yml
README.md
package.json
tsconfig.json
```

---

## Error Handling

The API validates the required `city` parameter.

Example:

```http
GET /api/hotels
```

returns a validation error because `city` is required.

The Temporal workflow can also handle supplier activity failures through Temporal's retry mechanism.

---

## Testing

The project can be tested using Postman or cURL.

### Test Cases

#### Valid city

```http
GET /api/hotels?city=delhi
```

#### City with no results

```http
GET /api/hotels?city=mumbai
```

#### Price filtering

```http
GET /api/hotels?city=delhi&minPrice=5000&maxPrice=7000
```

#### Health check

```http
GET /health
```

---

## Postman Collection

A Postman collection is included in:

```text
postman/hotel-offer.postman_collection.json
```

Import the collection into Postman to test all available endpoints.

---

## Future Improvements

Possible improvements include:

* Real supplier API integrations
* Supplier timeout handling
* More advanced Redis caching
* Authentication and authorization
* Rate limiting
* Structured logging
* Monitoring and metrics
* Additional supplier integrations
* Automated tests

---

## Author

**Raj Barmaiya**

MERN / Node.js Developer
