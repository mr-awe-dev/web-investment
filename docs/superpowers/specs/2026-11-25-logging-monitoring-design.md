# Design: Production Logging & Monitoring (Free-tier SaaS)

Date: 2026-11-25
Status: approved

## Intent

Make production failures easy to diagnose: every request traceable, every error
searchable, and the team alerted before users report the problem. Keep cost at
zero by using permanent free tiers only.

## Goals

- Structured JSON logs shipped off the server, searchable by request ID and user.
- Access log per request (method, path, status, duration, user).
- Metrics (HTTP, JVM, Hikari) scraped and visualized.
- Alerts for 5xx rate, error logs, p95 latency, heap pressure.
- External uptime check plus a public status page.

## Non-goals

- Self-hosted observability stack (no extra servers to operate).
- Distributed tracing, frontend session replay, APM agents.
- Changing the API response envelope (only add the `X-Request-Id` header).

## Chosen approach

- **Grafana Cloud Free** for logs (Loki), metrics (Prometheus), dashboards and
  alerting. Free tier: 10k active series, 50 GB logs, 14-day retention, 3 users.
- **Better Stack Free** for uptime monitoring, email/Slack alerts and one status
  page. Free tier: 10 monitors, 100k exceptions, 1 status page, no card.
- **Grafana Alloy** container as the collector: tails Docker logs for the backend
  container and scrapes `/actuator/prometheus` over the internal network.

Alternatives considered: self-hosted Grafana+Loki+Prometheus (full control, but
more RAM and on-call effort) and self-hosted SigNoz/OpenObserve (single UI, but
ClickHouse/younger ecosystem and still server cost). Both rejected because the
priority is zero operational overhead.

## Application changes

- Dependencies: `spring-boot-starter-actuator`, `micrometer-registry-prometheus`,
  `logstash-logback-encoder`.
- Actuator on management port `8081`, not published to the host; only
  `health,info,prometheus` exposed.
- `logback-spring.xml`: JSON console output for non-dev profiles, plain text for
  `dev` and `test`. MDC fields become top-level JSON fields.
- `RequestAuditFilter`: accepts or generates `X-Request-Id`, publishes it in MDC
  and the response header, logs one access line (INFO < 400, WARN 4xx, ERROR 5xx),
  then clears MDC.
- `HealthController`: public `GET /api/health` for Better Stack.
- Security: permit `/api/health` and `/actuator/**`; actuator is only reachable
  inside the Docker network.

## Infrastructure changes

- Compose: Docker `json-file` rotation for backend, plus an `alloy` service with
  the Docker socket and a mounted config file.
- Alloy config ships logs to Grafana Cloud Loki and remote-writes metrics to
  Grafana Cloud Prometheus using credentials from `.env` (never committed).
- A starter Grafana dashboard JSON lives in `observability/grafana/`.

## Risks / trade-offs

- Telemetry leaves the server. No request bodies, passwords or tokens are logged.
- 14-day retention means long-term audit needs a different store.
- Free tiers are permanent but capped; volume growth would require Pro.

## Acceptance

- `mvn test` keeps JaCoCo LINE and BRANCH at 100%.
- `GET /api/health` returns 200 with an `X-Request-Id` header.
- Backend logs appear in Grafana Cloud Loki within one minute.
- Prometheus target is `up`; the starter dashboard renders.
- Forcing a 5xx raises the Grafana alert and Better Stack monitors stay green.
