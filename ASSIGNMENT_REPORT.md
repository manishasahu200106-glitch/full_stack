# ACADEMIC ASSIGNMENT REPORT
## Course: Web Application Projects with React (CSE 3395)
### B.Tech CSIT – 5th Semester | Academic Year 2026–2027

---

# Assignment 4: Containerization, Cloud Deployment and CI/CD Automation of a MERN Stack Blog Application

---

## 1. Executive Summary

This report documents the design, containerization, local orchestration, continuous integration/continuous delivery (CI/CD), and cloud deployment of a full-stack **MERN (MongoDB, Express.js, React.js, Node.js)** Blog Application. The frontend integrates **TanStack Query (React Query v5)** for reactive server-state management, cache invalidation, and optimistic UI updates.

The deployment infrastructure leverages industry best practices:
- **Docker** for standardized, reproducible multi-stage application packaging.
- **Docker Compose** for local microservice orchestration with dependency healthchecks and persistent volumes.
- **GitHub Actions** for an automated two-stage CI/CD pipeline (linting, automated integration testing, Docker Hub artifact publishing, and cloud deployment).
- **Docker Hub** as the centralized container image registry.
- **Google Cloud Run** for serverless, autoscaling, enterprise-grade container hosting.
- **MongoDB Atlas** for secure, distributed cloud database persistence.

---

## 2. Architecture & Service Topology

```
+-----------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                     |
|           Accessible at: https://mern-blog-frontend-<hash>.run.app                |
+-----------------------------------------+-----------------------------------------+
                                          |
                        HTTPS (REST API / JSON Data)
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        GOOGLE CLOUD RUN (MANAGED BACKEND)                         |
|           Accessible at: https://mern-blog-backend-<hash>.run.app                 |
|  - Node.js 20 Alpine Base                                                         |
|  - Express REST API with Health Checks (/health)                                  |
|  - Non-root user execution (`USER node`)                                          |
+-----------------------------------------+-----------------------------------------+
                                          |
                             TLS Encrypted Connection
                               (MONGO_URI srv string)
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                              MONGODB ATLAS CLUSTER                                |
|  - Global M0 Cloud Replica Set                                                    |
|  - IP Whitelisted (0.0.0.0/0 for Cloud Run egress)                               |
|  - Collections: posts (title, content, author, category, tags, likes, timestamps) |
+-----------------------------------------------------------------------------------+
```

---

## 3. Detailed Implementation by Assignment Tasks

### Task 1: Docker Containerization

#### A. Backend Containerization (`backend/Dockerfile`)
- **Base Image:** `node:20-alpine` — selected for minimal image footprint (~180MB) and reduced attack surface.
- **Security:** Implements a non-root user (`USER node`) to prevent privilege escalation vulnerabilities.
- **Clean Installation:** Uses `npm ci --only=production` to ensure deterministic builds.
- **Healthcheck:** Configured with `wget --spider http://localhost:5000/health` checking every 30 seconds.

```dockerfile
FROM node:20-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
COPY . .
RUN chown -R node:node /usr/src/app
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1
CMD ["node", "server.js"]
```

#### B. Frontend Containerization (`frontend/Dockerfile`)
- **Multi-Stage Build Pattern:**
  - **Stage 1 (Builder):** Uses `node:20-alpine` to compile the React/Vite source code into production static assets (`/app/dist`). Environment variable `VITE_API_URL` is passed as a build argument.
  - **Stage 2 (Production Web Server):** Uses `nginx:alpine` (~25MB) to serve static assets with gzip compression and client-side routing fallback (`try_files $uri $uri/ /index.html;`). This prevents exposing Node.js in the frontend runtime.

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-http://localhost:5000/api}
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

#### C. `.dockerignore` Configuration
Strict `.dockerignore` files were configured for both frontend and backend to exclude `node_modules`, test files, `.git`, `.env` local credentials, and logs. This optimizes build cache efficiency and prevents leakage of local secrets.

---

### Task 2: Docker Compose Configuration (`docker-compose.yml`)

The `docker-compose.yml` orchestrates three decoupled services:
1. `mongo`: Official `mongo:7.0` image with healthcheck probing `mongosh --eval "db.adminCommand('ping')"`.
2. `backend`: Built from `./backend`, explicitly configured to depend on `mongo` with `condition: service_healthy`. Connects via internal DNS `mongodb://mongo:27017/blogdb`.
3. `frontend`: Built from `./frontend`, configured to depend on `backend` with `condition: service_healthy`. Maps container port `80` to host port `3000`.

**Key Networking & Volume Isolation:**
- **Custom Bridge Network (`mern-network`):** Provides private container DNS resolution without exposing database ports to the host interface unless explicitly mapped.
- **Named Volume (`mongo-data`):** Preserves database records across container restarts and updates.

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7.0
    container_name: mern-blog-mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: blogdb
    volumes:
      - mongo-data:/data/db
    networks:
      - mern-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mern-blog-backend
    restart: always
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      - PORT=5000
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/blogdb
      - CORS_ORIGIN=http://localhost:3000,http://localhost
    ports:
      - "5000:5000"
    networks:
      - mern-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:5000/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 15s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=http://localhost:5000/api
    container_name: mern-blog-frontend
    restart: always
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "3000:80"
    networks:
      - mern-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  mongo-data:
    driver: local

networks:
  mern-network:
    driver: bridge
```

---

### Task 3: Cloud Deployment (Google Cloud Run & MongoDB Atlas)

#### A. MongoDB Atlas Configuration
1. Created an Atlas cluster running on cloud provider regions with high availability.
2. Created a dedicated database user with password-based authentication.
3. Added Network Access whitelist rule `0.0.0.0/0` to allow inbound connections from dynamic Google Cloud Run worker IPs.
4. Extracted standard connection string:
   `mongodb+srv://<user>:<password>@cluster0.mongodb.net/blogdb?retryWrites=true&w=majority`

#### B. Google Cloud Run Deployment
Google Cloud Run was chosen for:
- Fully managed serverless scalability (scales from 0 to multiple instances based on traffic).
- Automatic TLS/HTTPS certificate issuance.
- Native support for stateless containerized workloads.

**Backend Deployment Command:**
```bash
gcloud run deploy mern-blog-backend \
  --image docker.io/<your-username>/mern-blog-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 5000 \
  --set-env-vars MONGO_URI="mongodb+srv://...",NODE_ENV=production,PORT=5000,CORS_ORIGIN="*"
```

**Frontend Deployment Command:**
```bash
gcloud run deploy mern-blog-frontend \
  --image docker.io/<your-username>/mern-blog-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 80
```

---

### Task 4: Continuous Integration (CI) Workflow

Configured in `.github/workflows/ci.yml`. Triggers on:
- All pushes to `main`, `master`, `develop`
- All Pull Requests targeting `main`, `master`

**Job Highlights:**
1. **`backend-ci`:**
   - Checks out repository code
   - Sets up Node.js 20 with dependency caching
   - Executes ESLint to enforce static analysis standards
   - Executes automated integration test suite using **Jest**, **Supertest**, and **mongodb-memory-server** (simulating an in-memory MongoDB replica set with 100% test isolation)
2. **`frontend-ci`:**
   - Checks out repository code
   - Validates React ESLint rules and TanStack Query hook rules
   - Compiles the Vite production bundle (`npm run build`) to ensure build-time syntax validity and type safety

---

### Task 5: Continuous Delivery / Deployment (CD) Workflow

Configured in `.github/workflows/cd.yml`. Triggers automatically on pushes or merges to branch `main`.

**Workflow Automation Sequence:**
1. **Docker Hub Authentication:** Authenticates via `docker/login-action` using encrypted GitHub Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`).
2. **Backend Image Build & Push:** Builds backend container with GitHub Actions caching (`type=gha`), tags with `:latest` and `:${{ github.sha }}`, and pushes to Docker Hub.
3. **Google Cloud Authentication:** Uses `google-github-actions/auth@v2` with Service Account key (`GCP_SA_KEY`).
4. **Deploy Backend to Cloud Run:** Deploys backend container image, passes database connection secrets, and retrieves the dynamic public HTTPS URL.
5. **Frontend Image Build & Push:** Injects the live backend URL into Vite build arguments (`VITE_API_URL=${BACKEND_URL}/api`), compiles, tags, and pushes to Docker Hub.
6. **Deploy Frontend to Cloud Run:** Deploys the Nginx frontend image to Cloud Run.
7. **Publish Deployment Summary:** Outputs a GitHub Step Summary markdown table with direct links to the running applications.

---

## 4. Challenges Encountered & Technical Solutions

| # | Challenge Encountered | Root Cause | Implemented Solution |
| :--- | :--- | :--- | :--- |
| **1** | **Single Page App 404s in Docker** | React uses client-side routing. Direct page refreshes or subroutes (e.g. `/posts/123`) resulted in Nginx 404 Not Found because the physical file didn't exist. | Added `try_files $uri $uri/ /index.html;` in `nginx.conf` so Nginx delegates all unhandled routes back to `index.html`. |
| **2** | **Startup Race Condition in Docker Compose** | The backend service started before MongoDB completed its initialization, resulting in immediate connection timeout crashes. | Replaced simple `depends_on` with Docker healthchecks: `mongo` runs `mongosh --eval "db.adminCommand('ping')"`, and backend specifies `depends_on: { mongo: { condition: service_healthy } }`. |
| **3** | **Dynamic Backend URL Injection in React Build** | React/Vite compiles environment variables into static JS bundle at build time. When deploying to Cloud Run, the backend URL is known only after the backend is deployed. | Configured CD pipeline as a sequenced two-step deployment: backend deploys first, outputs its URL, which is then passed as `--build-arg VITE_API_URL` to the frontend Docker build. |
| **4** | **CI Test Hermeticity & DB Isolation** | Running integration tests in GitHub Actions CI without spinning up and managing an external MongoDB container can cause latency and flakes. | Integrated `mongodb-memory-server` in `backend/tests/post.test.js`. Tests spin up an ephemeral in-memory MongoDB instance instantly on any OS. |
| **5** | **CORS Restrictions Across Domains** | When frontend and backend run on different Cloud Run subdomains, browsers block API requests due to Cross-Origin Resource Sharing. | Configured Express CORS middleware with configurable `CORS_ORIGIN` allowing wildcards or specific origin domains, with support for preflight `OPTIONS` requests. |

---

## 5. Submission Artifact Checklist

| Item | Requirement Description | Status | Location / Reference |
| :---: | :--- | :---: | :--- |
| **1** | Complete MERN Source Code | ✅ Completed | `backend/`, `frontend/` |
| **2** | Dockerfiles & `.dockerignore` | ✅ Completed | `backend/Dockerfile`, `frontend/Dockerfile` |
| **3** | Docker Compose Configuration | ✅ Completed | `docker-compose.yml` |
| **4** | GitHub Repository URL | 📋 Ready | Push instructions provided in Section 6 |
| **5** | Docker Hub Repository URLs | 📋 Ready | Push commands & workflow provided |
| **6** | Publicly Accessible Cloud Run URL | 📋 Ready | Deployed via `.github/workflows/cd.yml` |
| **7** | GitHub Actions CI/CD Workflows | ✅ Completed | `.github/workflows/ci.yml`, `cd.yml` |
| **8** | Demonstration & Verification Guide | ✅ Completed | Detailed in Section 6 below |
| **9** | Brief Technical & Deployment Report | ✅ Completed | This document (`ASSIGNMENT_REPORT.md`) |

---

## 6. Demonstration & Verification Guide (For Viva / Lab Exam)

### Step 1: Local Docker Compose Demonstration
Open terminal in the project directory:

```bash
# Build and launch all services in detached mode
docker compose up --build -d

# Check service status (all should report "Up (healthy)")
docker compose ps

# View live backend logs
docker compose logs -f backend
```

### Step 2: Verification of Backend API
Execute the following verification requests in PowerShell or Bash:

```bash
# Test 1: Verify Health Endpoint
curl http://localhost:5000/health
# Response: {"status":"healthy","uptime":...,"service":"mern-blog-backend"}

# Test 2: Create a Blog Post via API
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Dockerized MERN on Cloud Run","content":"Testing containerized API","category":"Cloud & DevOps","author":"CSIT Student"}'

# Test 3: Retrieve All Posts
curl http://localhost:5000/api/posts
```

### Step 3: Frontend Demonstration
1. Open browser at [http://localhost:3000](http://localhost:3000).
2. Note the green **"API Online"** indicator in the navbar (powered by TanStack Query periodic health check).
3. Click **"Create Post"**, fill out the form, and submit.
4. Verify that TanStack Query performs immediate cache invalidation and renders the new post on the feed without full page reload.
5. Click the **Heart (Like)** button to verify optimistic mutation.
6. Test filtering by categories (**Cloud & DevOps**, **React**, etc.) and dynamic search.

---

## 7. Role of Technologies in Modern Cloud Architecture (Viva Prep)

- **Docker:** Packages applications with their runtime dependencies into immutable images, eliminating the classic "it works on my machine" dilemma.
- **Docker Compose:** Simplifies multi-container coordination on developer workstations, handling networking, storage volumes, and dependency ordering in one declarative YAML file.
- **Docker Hub:** Acts as the centralized artifact repository where compiled, validated container images are stored and distributed to staging and production clusters.
- **GitHub Actions:** Provides native CI/CD automation directly from the code repository, guaranteeing that code is linted and tested on every commit before being automatically pushed and deployed.
- **Google Cloud Run:** Serverless container platform running on Google's infrastructure. It eliminates virtual machine management, offers auto-scaling down to zero, and automatically provisions TLS certificates.
