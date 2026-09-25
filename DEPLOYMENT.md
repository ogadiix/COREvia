# COREvia Deployment Architecture

## Architecture Overview

COREvia uses a unified full-stack architecture built on modern Node.js, Express, React, and Drizzle ORM.

### Conceptual Flow

```text
[User / Browser]
       │ (HTTPS)
       ▼
[Load Balancer / Ingress]
       │ (Port 3000)
       ▼
[COREvia Node.js Server]
       │
   ┌───┴────────────────────────┐
   │                            │
   ▼                            ▼
[PostgreSQL DB]           [Gemini API] (Server-Side Only)
```

## Environment Strategy

We separate configuration strictly across environments:

1. **Development**: Local or containerized database. Synthetic seeding allowed. Debug logging enabled.
2. **Staging**: Production-like environment. Strict data access rules. Testing integrations.
3. **Production**: Hardened configuration. No synthetic seed execution allowed. Strict CORS and logging policies.

## Containerization

COREvia provides a production-grade `Dockerfile` optimized for Cloud Run or Kubernetes deployments. The multi-stage build securely separates development tools from the final runtime image.

## Security Controls

1. **Secret Management**: All secrets (e.g., `GEMINI_API_KEY`, `SESSION_SECRET`, Database passwords) must be injected via secure cloud secret managers at runtime. No secrets are baked into the container.
2. **Gemini API Proxying**: The Gemini API is ONLY invoked from the secure Node.js backend. The `GEMINI_API_KEY` is never exposed to the frontend.
3. **CORS**: Wildcard CORS is disabled in production.

## Database Migrations

During a production deployment, database schema changes must be applied predictably using the `db:migrate` script. Data seed scripts (`db:seed`) are safeguarded against accidental execution in production.
