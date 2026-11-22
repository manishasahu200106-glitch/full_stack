# Cloud-Native MERN Stack Blog Application with Docker, CI/CD & Google Cloud Run

> **Course:** Web Application Projects with React (CSE 3395)  
> **Program:** B.Tech CSIT – 5th Semester  
> **Academic Year:** 2026–2027  
> **Topic:** Containerization, Cloud Deployment and CI/CD Automation of a MERN Stack Blog Application  

---

## 📌 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Local Development & Docker Compose](#local-development--docker-compose)
7. [Testing & Code Quality](#testing--code-quality)
8. [Continuous Integration (CI) Workflow](#continuous-integration-ci-workflow)
9. [Continuous Delivery / Deployment (CD) Workflow](#continuous-delivery--deployment-cd-workflow)
10. [Cloud Deployment: Google Cloud Run & MongoDB Atlas](#cloud-deployment-google-cloud-run--mongodb-atlas)
11. [Troubleshooting & Verification](#troubleshooting--verification)

---

## 1. Project Overview

This project is a production-grade full-stack Blog Application built using the **MERN stack** (MongoDB, Express.js, React.js, Node.js) with **TanStack Query (React Query v5)** for robust client-side state caching, optimistic updates, and background synchronization.

The application is completely containerized with **Docker**, orchestrated locally using **Docker Compose**, continuously integrated and deployed via **GitHub Actions**, and hosted globally on **Google Cloud Run** backed by **MongoDB Atlas**.

---

## 2. System Architecture

```
                                  +------------------------------------+
                                  |         GitHub Repository          |
                                  |     (Triggers GitHub Actions)      |
                                  +-----------------+------------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
                         v                                                     v
          +------------------------------+                      +------------------------------+
          |      CI Pipeline (.yml)      |                      |      CD Pipeline (.yml)      |
          | - Linting (Backend/Frontend) |                      | - Build Docker Images        |
          | - Unit/Integration Tests     |                      | - Push to Docker Hub         |
          | - Vite Production Build      |                      | - Deploy to Google Cloud Run |
          +------------------------------+                      +--------------+---------------+
                                                                               |
                                      +----------------------------------------+
                                      |
                     +----------------v----------------+
                     |        Docker Hub Registry      |
                     | - /mern-blog-backend:latest     |
                     | - /mern-blog-frontend:latest    |
                     +----------------+----------------+
                                      |
                                      v
                     +---------------------------------+
                     |        Google Cloud Run         |
                     |                                 |
                     |  +---------------------------+  |
                     |  |  Frontend Container (Nginx)| |
                     |  |  Port: 80 / Single Page App| |
                     |  +-------------+-------------+  |
                     |                |                |
                     |                | HTTP / REST    |
                     |                v                |
                     |  +---------------------------+  |
                     |  |  Backend Container (Node) |  |
                     |  |  Port: 5000 / REST API    |  |
                     |  +-------------+-------------+  |
                     +----------------|----------------+
                                      |
                                      v
                     +---------------------------------+
                     |       MongoDB Atlas Cloud       |
                     |   (Managed Database Cluster)    |
                     +---------------------------------+
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Component-based modern UI |
| **Data Fetching** | TanStack Query v5 | Server-state caching, mutations, query invalidation |
| **Styling & Icons**| Modern CSS3, Lucide React | Clean dark-mode UI with responsive design |
| **Web Server** | Nginx Alpine | High-performance static web server & SPA fallback |
| **Backend** | Node.js (v20), Express.js | RESTful API service & business logic |
| **Database** | MongoDB & Mongoose ODM | Document store for articles, categories & metadata |
| **Containerization**| Docker & Docker Compose | Multi-stage container builds & local orchestration |
| **CI/CD** | GitHub Actions | Automated linting, test suites, Docker Hub pushes & deployment |
| **Cloud Platform** | Google Cloud Run | Fully managed serverless container runtime |
| **Cloud DB** | MongoDB Atlas | Highly available managed database cluster |

---

## 4. Folder Structure

```
mern-blog-docker-cicd/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Continuous Integration pipeline (Test & Lint)
│       └── cd.yml                 # Continuous Deployment pipeline (Docker Hub & Cloud Run)
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection logic
│   ├── controllers/
│   │   └── postController.js      # CRUD handler functions
│   ├── models/
│   │   └── Post.js                # Mongoose schema for blog posts
│   ├── routes/
│   │   └── postRoutes.js          # Express route definitions
│   ├── tests/
│   │   └── post.test.js           # Jest & Supertest integration test suite
│   ├── .dockerignore              # Ignore rules for backend container
│   ├── .env.example               # Sample backend environment variables
│   ├── .eslintrc.json             # Code quality rules for backend
│   ├── Dockerfile                 # Node.js Alpine container configuration
│   ├── package.json               # Backend dependencies & test scripts
│   └── server.js                  # Express application entrypoint
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── postsApi.js        # Axios client with TanStack Query helpers
│   │   ├── components/
│   │   │   ├── CreatePostModal.jsx# Modal to publish articles
│   │   │   ├── EditPostModal.jsx  # Modal to update articles
│   │   │   ├── Navbar.jsx         # Header with live health check indicator
│   │   │   ├── PostCard.jsx       # Individual article presentation & actions
│   │   │   └── PostList.jsx       # Feed, category filters, and search bar
│   │   ├── App.jsx                # Root UI container & hero section
│   │   ├── index.css              # Custom styling & responsive layouts
│   │   └── main.jsx               # React DOM & QueryClientProvider setup
│   ├── .dockerignore              # Ignore rules for frontend container
│   ├── .eslintrc.json             # Code quality rules for frontend
│   ├── Dockerfile                 # Multi-stage build (Node -> Nginx Alpine)
│   ├── index.html                 # HTML shell
│   ├── nginx.conf                 # Nginx SPA proxy configuration
│   ├── package.json               # Frontend dependencies & scripts
│   └── vite.config.js             # Vite development & build setup
├── docker-compose.yml             # Orchestration for mongo, backend, and frontend
└── README.md                      # Documentation & deployment guide
```

---

## 5. Prerequisites

Before running the application, ensure the following tools are installed:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+)
- [Node.js](https://nodejs.org/) (v20+ LTS)
- [Git](https://git-scm.com/)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (for CLI deployment)

---

## 6. Local Development & Docker Compose

### Step 1: Start All Services with Docker Compose
Run the following single command from the project root:

```bash
docker compose up --build -d
```

Docker Compose will:
1. Spin up an official `mongo:7.0` database container on port `27017` with healthchecks.
2. Build the `backend` image, wait for MongoDB to become healthy, and launch on port `5000`.
3. Build the `frontend` multi-stage image, launch Nginx on port `3000` (mapped to internal `80`).

### Step 2: Verify Running Containers
Check the status of running containers:

```bash
docker compose ps
```

Expected output:
```
NAME                 IMAGE                        STATUS                   PORTS
mern-blog-mongodb    mongo:7.0                    Up (healthy)             0.0.0.0:27017->27017/tcp
mern-blog-backend    mern-blog-docker-cicd-backend Up (healthy)             0.0.0.0:5000->5000/tcp
mern-blog-frontend   mern-blog-docker-cicd-frontend Up (healthy)            0.0.0.0:3000->80/tcp
```

### Step 3: Access the Application
- **Frontend Web Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API Root:** [http://localhost:5000/api](http://localhost:5000/api)
- **Backend Health Check:** [http://localhost:5000/health](http://localhost:5000/health)
- **Posts Endpoint:** [http://localhost:5000/api/posts](http://localhost:5000/api/posts)

### Step 4: Stop Containers
To stop and remove containers while preserving database volume data:
```bash
docker compose down
```

To remove containers and wipe database volumes:
```bash
docker compose down -v
```

---

## 7. Testing & Code Quality

### Backend Automated Tests
The backend includes automated integration tests utilizing `jest`, `supertest`, and `mongodb-memory-server` to run tests without needing an external MongoDB instance:

```bash
cd backend
npm install
npm test
```

### Linting Check
```bash
# In backend
cd backend && npm run lint

# In frontend
cd frontend && npm run lint
```

---

## 8. Continuous Integration (CI) Workflow

The CI workflow is configured in `.github/workflows/ci.yml`. It runs automatically on every `push` and `pull_request` targeting `main`:
1. **Backend CI Job:**
   - Installs dependencies using `npm ci`
   - Executes ESLint to enforce coding standards
   - Executes Jest integration tests with code coverage
2. **Frontend CI Job:**
   - Installs dependencies using `npm ci`
   - Runs ESLint on React components and hooks
   - Compiles Vite production bundle to guarantee build integrity

---

## 9. Continuous Delivery / Deployment (CD) Workflow

The CD workflow is configured in `.github/workflows/cd.yml`. It runs automatically on every push or merge to the `main` branch:

### Required GitHub Secrets
Navigate to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Value Description |
| :--- | :--- |
| `DOCKERHUB_USERNAME` | Your Docker Hub account username |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token (PAT) with Read & Write permissions |
| `GCP_PROJECT_ID` | Your Google Cloud project ID (e.g. `mern-blog-project-12345`) |
| `GCP_SA_KEY` | Google Cloud Service Account JSON key (with Cloud Run Admin & Storage Admin roles) |
| `GCP_REGION` | Cloud Run deployment region (e.g. `us-central1` or `asia-south1`) |
| `MONGO_URI` | Production MongoDB Atlas connection string |

---

## 10. Cloud Deployment: Google Cloud Run & MongoDB Atlas

### A. Setting Up MongoDB Atlas
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (e.g. M0 tier).
3. Under **Database Access**, create a user (e.g. `blogadmin`) with read/write privileges.
4. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit Cloud Run container IP connections.
5. Click **Connect** -> **Drivers** -> Copy the connection URI:
   ```
   mongodb+srv://blogadmin:<password>@cluster0.abcde.mongodb.net/blogdb?retryWrites=true&w=majority
   ```

### B. Manual Docker Hub Build & Push (Alternative to GitHub Actions)
```bash
# Authenticate
docker login

# Build & Push Backend
docker build -t <your-dockerhub-username>/mern-blog-backend:latest ./backend
docker push <your-dockerhub-username>/mern-blog-backend:latest

# Build & Push Frontend
docker build --build-arg VITE_API_URL=https://<your-backend-cloud-run-url>/api -t <your-dockerhub-username>/mern-blog-frontend:latest ./frontend
docker push <your-dockerhub-username>/mern-blog-frontend:latest
```

### C. Deploying to Google Cloud Run via gcloud CLI

```bash
# 1. Deploy Backend API
gcloud run deploy mern-blog-backend \
  --image <your-dockerhub-username>/mern-blog-backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 5000 \
  --set-env-vars MONGO_URI="mongodb+srv://blogadmin:<password>@cluster0.abcde.mongodb.net/blogdb?retryWrites=true&w=majority",NODE_ENV=production,PORT=5000,CORS_ORIGIN="*"

# 2. Note down the returned backend URL (e.g. https://mern-blog-backend-xyz.run.app)

# 3. Deploy Frontend Service
gcloud run deploy mern-blog-frontend \
  --image <your-dockerhub-username>/mern-blog-frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 80
```

---

## 11. Troubleshooting & Verification

- **CORS Error:** Verify backend environment variable `CORS_ORIGIN=*` or that it includes your frontend Cloud Run URL.
- **MongoDB Connection Timeout:** Ensure your MongoDB Atlas Network Access whitelist includes `0.0.0.0/0`.
- **Healthcheck Failures:** Verify `/health` responds with HTTP 200 via `curl http://localhost:5000/health`.
