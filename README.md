# CodeForge

A full-stack CI/CD platform for managing GitHub-triggered build, test, and deployment pipelines.

## Features

- GitHub webhook integration with HMAC-SHA256 verification
- YAML-based workflow configuration
- Pipeline execution and status tracking
- Interactive DAG pipeline visualization
- Terminal-style build and test logs
- Repository and webhook management
- Pipeline re-run and cancellation
- System health and infrastructure monitoring

## Architecture

```text
GitHub Push
    ↓
Webhook
    ↓
Spring Boot Backend
    ↓
Kafka
    ↓
Pipeline
    ↓
Build → Test → Deploy
    ↓
PostgreSQL / Redis
    ↓
React Dashboard
````

## Tech Stack

* **Backend:** Java, Spring Boot
* **Frontend:** React, TypeScript
* **Database:** PostgreSQL
* **Messaging:** Kafka
* **Caching:** Redis
* **Infrastructure:** Docker, Kubernetes

## Running Locally

### Requirements

* Java 21
* Maven
* Node.js 18+
* npm

### Start the application

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

### Start Spring Boot backend

```bash
cd backend
mvn spring-boot:run
```

## Project Structure

```text
CodeForge/
├── backend/          # Spring Boot backend
├── src/               # React frontend
├── server.ts          # Node/Express host
├── package.json
└── vite.config.ts
```

## Author

**Ayushi Gupta** 
