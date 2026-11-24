# AGENTS.md — Personal Finance Application

## Quickstart

| Action | Command |
|--------|---------|
| Run backend (Maven) | `cd personal-finance-app/backend && mvn spring-boot:run` |
| Run frontend (Vite) | `cd personal-finance-app/frontend && npm run dev` |
| Run both (Docker) | `cd personal-finance-app && docker compose up --build` |
| Backend tests | `cd personal-finance-app/backend && mvn test` |
| Frontend typecheck | `cd personal-finance-app/frontend && npm run typecheck` |
| Frontend build | `cd personal-finance-app/frontend && npm run build` |

## Tech Stack

- **Backend**: Java 21, Spring Boot 3.3.5, Maven, PostgreSQL, Flyway, JWT (jjwt), Lombok
- **Frontend**: React 18.3.1, TypeScript (strict), Vite 5.4.10, TailwindCSS 3.4.14, TanStack Query, React Router 6.27.0
- **Database**: PostgreSQL with Flyway migrations V1–V5
- **Observability**: Logback JSON logs, Actuator/Prometheus (internal port 8081), Grafana Alloy → Grafana Cloud Free, Better Stack uptime

## Project Structure

```
web-investment/
├── personal-finance-app/          # Full-stack application
│   ├── backend/                  # Spring Boot REST API
│   ├── frontend/                 # React + TypeScript
│   ├── database/                 # Schema & seed data
│   └── docker-compose.yml
├── README.md                     # Project overview (see also)
├── .gitignore
├── memory/PRD.md                 # Product requirements
└── test_reports/                 # Test execution reports
```

## Development

### Backend

- Source: `personal-finance-app/backend/src/main/java/com/example/personalfinance/`
- API contracts: `personal-finance-app/shared/` (enums, DTOs, response envelope `{success, data, message, code, timestamp}`)
- DB migrations: `personal-finance-app/database/migrations/` (Flyway V1–V5)
- 100% JaCoCo coverage gate: LINE & BRANCH must both be >= 1.00
- Tests: JUnit 5 + Mockito; 24 tests total
- Run: `cd personal-finance-app/backend && mvn test`
- JaCoCo report: `mvn jacoco:report`

### Frontend

- Source: `personal-finance-app/frontend/src/`
- API calls: `personal-finance-app/frontend/src/api/`
- Types: `personal-finance-app/frontend/src/types/`
- Components: `personal-finance-app/frontend/src/components/`
- Pages: `personal-finance-app/frontend/src/pages/`
- Vite config: `personal-finance-app/frontend/vite.config.ts`
- Typecheck: `npm run typecheck`
- Dev: `npm run dev` (runs Vite at http://localhost:5173)
- Build: `npm run build`

### Environment Variables

Create/extend `.env` in repo root:

```
# Backend
DB_URL=jdbc:postgresql://localhost:5432/personal_finance
DB_USERNAME=personal_finance
DB_PASSWORD=personal_finance_2026
JWT_SECRET=replace-with-secure-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173
SPRING_PROFILES_ACTIVE=dev
APP_ENV=local

# Frontend
VITE_API_URL=http://localhost:8080

# Grafana Cloud (free tier)
GRAFANA_CLOUD_LOKI_URL=
GRAFANA_CLOUD_LOKI_USER=
GRAFANA_CLOUD_PROM_URL=
GRAFANA_CLOUD_PROM_USER=
GRAFANA_CLOUD_API_TOKEN=
```

## Key Conventions

- **Money**: `BigDecimal` in Java, avoids floating-point; stored as `NUMERIC(19,2)` in PostgreSQL
- **Double-entry accounting**: Every transaction generates balanced journal entries (Total Debit = Total Kredit); balances computed via `SUM(debit) − SUM(credit)`, nothing denormalized
- **User isolation**: All queries scope by `user_id`; per-user data separation
- **API envelope**: `{success: boolean, data: T, message: string, code: string, timestamp: string}`
- **Frontend**: TypeScript strict mode; Zod validation for forms; TanStack Query for data fetching
- **Cost basis**: FIFO / Average / Specific methods for investment lots
- **Logging**: never log tokens/passwords; include request context via MDC. Non-dev profiles emit JSON (`requestId`, `userId`, `method`, `path`, `status`, `durationMs`); every response carries `X-Request-Id`

## Testing

- Backend: `mvn test` — 33 tests, JaCoCo 100% LINE + BRANCH gate
- Frontend: `npm run typecheck` — TypeScript strict mode
- No integration test prerequisites beyond a running PostgreSQL

## Docker

- `docker compose up --build` starts all services (backend, frontend, PostgreSQL, Alloy)
- DB migrations run automatically on startup via Flyway
- Frontend proxies to backend at `http://localhost:8080` (see `vite.config.ts`)
- Actuator lives on internal port `8081` (not published); Alloy scrapes it and ships Docker logs to Grafana Cloud
- Swagger UI: `http://localhost:8080/swagger-ui.html`; health: `/api/health`

## Code Quality

- Backend: JaCoCo 100% coverage gate enforced by Maven
- Frontend: `npm run typecheck` fails on strict TypeScript errors
- Git hooks: pre-commit not configured; run `mvn test` locally before committing