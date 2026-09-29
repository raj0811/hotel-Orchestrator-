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
* Dockerized application and infrastructure
* Temporal Worker runs automatically through Docker Compose
* Temporal UI for workflow monitoring
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
                       /      \
                    HIT        MISS
                     |           |
                     |           v
                     |    Temporal Workflow
                     |       /          \
                     |      v            v
                     | Supplier A     Supplier B
                     |   Activity       Activity
                     |      \            /
                     |       \          /
                     |        v        v
                     |    Compare & Deduplicate
                     |             |
                     |             v
                     |           Redis
                     |             |
                     +-------------+
                           |
                           v
                       Response
```

### Docker Architecture

```text
                         Docker Compose
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
   NestJS Backend       Temporal Worker          Redis
      :4000                  |                   :6379
        |                    |
        |                    v
        |              Temporal Server
        |                  :7233
        |                    |
        |                    v
        |                PostgreSQL
        |                  :5432
        |
        +--------------------+
                             |
                             v
                       Temporal UI
                          :8080
```

---

# API Endpoints

## 1. Get Supplier A Hotels

```http
GET /supplierA/hotels?city=delhi
```

Example:

```bash
curl "http://localhost:4000/supplierA/hotels?city=delhi"
```

Returns hotel offers available from Supplier A for the requested city.

---

## 2. Get Supplier B Hotels

```http
GET /supplierB/hotels?city=delhi
```

Example:

```bash
curl "http://localhost:4000/supplierB/hotels?city=delhi"
```

Returns hotel offers available from Supplier B for the requested city.

---

## 3. Get Aggregated Hotels

```http
GET /api/hotels?city=delhi
```

Example:

```bash
curl "http://localhost:4000/api/hotels?city=delhi"
```

The API:

1. Gets hotels from both suppliers through Temporal.
2. Runs Supplier A and Supplier B activities in parallel.
3. Compares overlapping hotels.
4. Selects the cheaper offer.
5. Keeps hotels available from only one supplier.
6. Stores the final result in Redis.
7. Returns the aggregated hotel list.

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

## 4. Filter Hotels by Price

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

Both `minPrice` and `maxPrice` are optional.

Examples:

```http
GET /api/hotels?city=delhi&minPrice=5000
```

```http
GET /api/hotels?city=delhi&maxPrice=7000
```

```http
GET /api/hotels?city=delhi&minPrice=5000&maxPrice=7000
```

---

## 5. Health Check

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

The health check verifies whether the mock supplier datasets are available.

---

# Mock Suppliers

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

This allows the application to demonstrate:

* Supplier aggregation
* Duplicate hotel detection
* Price comparison
* Cheapest offer selection
* Supplier-specific offers

---

# Temporal Workflow

Temporal is used to orchestrate the hotel aggregation workflow.

The workflow executes Supplier A and Supplier B activities in parallel.

```text
                    Hotel Workflow
                          |
                    +-----+-----+
                    |           |
                    v           v
             Supplier A     Supplier B
              Activity       Activity
                    |           |
                    +-----+-----+
                          |
                          v
                   Compare Prices
                          |
                          v
                     Deduplicate
                          |
                          v
                   Final Hotel List
                          |
                          v
                        Redis
```

## Temporal Components

### Workflow

Defines the overall hotel aggregation process.

The workflow coordinates the supplier activities and combines their results.

### Activities

Activities are responsible for fetching hotel data from Supplier A and Supplier B.

### Worker

The Temporal Worker executes the workflow and activities.

The worker runs automatically as a separate Docker Compose service.

### Temporal Server

The Temporal Server manages workflow execution, task queues, workflow state, and persistence.

### PostgreSQL

PostgreSQL is used by Temporal for its internal persistence.

The application itself does not use PostgreSQL as the hotel database.

---

# Parallel Supplier Fetching

Supplier A and Supplier B are fetched in parallel by the Temporal workflow.

Conceptually:

```text
                    Workflow
                       |
              +--------+--------+
              |                 |
              v                 v
        Supplier A         Supplier B
              |                 |
              +--------+--------+
                       |
                       v
                 Merge Results
                       |
                       v
                Deduplicate
                       |
                       v
               Select Cheapest
```

Running the supplier activities in parallel avoids waiting for one supplier to finish before starting the other.

---

# Hotel Deduplication

Hotels are deduplicated using the hotel name.

When the same hotel exists in both suppliers:

```text
Supplier A
Holtin → ₹6000

Supplier B
Holtin → ₹5340
```

The cheaper offer is selected:

```text
Holtin → ₹5340 → Supplier B
```

If a hotel exists only in one supplier, that offer is retained.

---

# Redis

Redis is used for storing aggregated hotel results.

The application can avoid executing the complete Temporal workflow when a previously generated result is available in Redis.

Conceptually:

```text
First Request
     |
     v
Redis MISS
     |
     v
Temporal Workflow
     |
     v
Aggregate Hotels
     |
     v
Save Result to Redis
     |
     v
Return Response
```

A subsequent request can use the cached result:

```text
Request
   |
   v
Redis HIT
   |
   v
Return Cached Result
```

Redis runs inside Docker at:

```text
redis:6379
```

From the host machine, Redis is exposed at:

```text
localhost:6379
```

---

# Docker

Docker Compose is used to run the complete application stack.

The following services are started automatically:

```text
NestJS Backend
Temporal Worker
Temporal Server
Temporal UI
Redis
PostgreSQL
```

## Start the Application

After cloning the repository, run:

```bash
docker compose up --build -d
```

This builds the backend and worker images and starts the complete application.

Check the running containers:

```bash
docker compose ps
```

Expected services:

```text
hotel-backend
hotel-worker
hotel-temporal
hotel-temporal-ui
hotel-redis
hotel-postgres
```

---

## View Logs

### Backend

```bash
docker compose logs backend --tail=50
```

### Temporal Worker

```bash
docker compose logs worker --tail=50
```

### Temporal Server

```bash
docker compose logs temporal --tail=50
```

### Redis

```bash
docker compose logs redis --tail=50
```

---

## Stop the Application

```bash
docker compose down
```

---

## Rebuild the Application

After making code changes:

```bash
docker compose down
docker compose up --build -d
```

---

# Temporal UI

Temporal UI is available at:

```text
http://localhost:8080
```

The UI can be used to inspect:

* Workflow executions
* Workflow status
* Workflow history
* Task queues
* Workflow failures
* Activity execution

---

# Local Development

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Docker Desktop
* Git

---

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

```bash
cd Hotel
```

---

## 2. Start the Complete Application

The recommended way to run the project is using Docker Compose:

```bash
docker compose up --build -d
```

This starts:

* NestJS Backend
* Temporal Worker
* Temporal Server
* Temporal UI
* Redis
* PostgreSQL

No separate `npm run start:dev` or `npm run worker` command is required when using Docker Compose.

---

## 3. Verify Services

```bash
docker compose ps
```

All six services should be running.

---

## 4. Test the Backend

Health check:

```text
http://localhost:4000/health
```

Aggregated hotels:

```text
http://localhost:4000/api/hotels?city=delhi
```

Supplier A:

```text
http://localhost:4000/supplierA/hotels?city=delhi
```

Supplier B:

```text
http://localhost:4000/supplierB/hotels?city=delhi
```

---

# Environment

When running the complete application through Docker Compose, Docker service names are used for communication between containers.

## Docker Addresses

```text
NestJS Backend:
backend:4000

Redis:
redis:6379

Temporal:
temporal:7233

PostgreSQL:
postgres:5432
```

## Host Addresses

From the host machine:

```text
Backend:
http://localhost:4000

Redis:
localhost:6379

Temporal:
localhost:7233

Temporal UI:
http://localhost:8080

PostgreSQL:
localhost:5432
```

The backend uses:

```text
PORT=4000
REDIS_HOST=redis
REDIS_PORT=6379
TEMPORAL_ADDRESS=temporal:7233
```

The Temporal Worker uses:

```text
TEMPORAL_ADDRESS=temporal:7233
```

---

# Project Structure

```text
src/
│
├── hotels/
│   ├── hotels.controller.ts
│   ├── hotels.service.ts
│   └── hotels.module.ts
│
├── temporal/
│   ├── hotel.workflow.ts
│   ├── hotel.activities.ts
│   ├── temporal.client.ts
│   └── worker.ts
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

# Error Handling

The API validates the required `city` parameter.

Example:

```http
GET /api/hotels
```

The request requires the `city` query parameter.

Temporal activities are executed through the Temporal Worker, allowing Temporal's workflow execution and activity retry mechanisms to handle activity failures.

---

# Testing

The project can be tested using Postman or cURL.

## Test Cases

### Valid City

```http
GET /api/hotels?city=delhi
```

### City With No Results

```http
GET /api/hotels?city=mumbai
```

### Price Filtering

```http
GET /api/hotels?city=delhi&minPrice=5000&maxPrice=7000
```

### Minimum Price Only

```http
GET /api/hotels?city=delhi&minPrice=5000
```

### Maximum Price Only

```http
GET /api/hotels?city=delhi&maxPrice=7000
```

### Supplier A

```http
GET /supplierA/hotels?city=delhi
```

### Supplier B

```http
GET /supplierB/hotels?city=delhi
```

### Health Check

```http
GET /health
```

---

# Postman Collection

A Postman collection is included in:

```text
postman/hotel-offer.postman_collection.json
```

Import the collection into Postman to test the available REST APIs.

The application can also be tested using the cURL examples provided in this README.

---

# Docker Compose Services

| Service       | Purpose                  | Port |
| ------------- | ------------------------ | ---: |
| `backend`     | NestJS REST API          | 4000 |
| `worker`      | Temporal Workflow Worker |    - |
| `temporal`    | Temporal Server          | 7233 |
| `temporal-ui` | Temporal Web UI          | 8080 |
| `redis`       | Hotel result cache       | 6379 |
| `postgres`    | Temporal persistence     | 5432 |

---

# Quick Start

For evaluators, the complete application can be started with:

```bash
git clone https://github.com/raj0811/hotel-Orchestrator-.git
cd Hotel
docker compose up --build -d
```

Verify:

```bash
docker compose ps
```

Then open:

```text
Backend:
http://localhost:4000/health

Hotel API:
http://localhost:4000/api/hotels?city=delhi

Temporal UI:
http://localhost:8080
```

To stop:

```bash
docker compose down
```

---

# Future Improvements

Possible improvements include:

* Real supplier API integrations
* Supplier timeout handling
* Advanced Redis caching strategies
* Authentication and authorization
* Rate limiting
* Structured logging
* Monitoring and metrics
* Additional supplier integrations
* Automated unit and integration tests
* Distributed tracing
* Circuit breaker for supplier failures

---

# Author

**Raj Barmaiya**

MERN / Node.js Developer
