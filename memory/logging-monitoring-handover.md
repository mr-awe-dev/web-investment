# Handover - Logging & Monitoring (Grafana Cloud + Better Stack)

Status per 2026-11-25: implementasi kode dan konfigurasi **selesai dan terverifikasi lokal**.
Yang tersisa hanya aktivasi layanan eksternal (butuh kredensial/domain dari pemilik project).

## Sudah selesai

- JSON logging untuk profil non-`dev`/`test` (`logback-spring.xml`): `@timestamp`, `level`, `logger`,
  `thread`, `message`, `stack_trace`, `service`, `env`, plus MDC `requestId`, `userId`, `method`,
  `path`, `status`, `durationMs`.
- Access log + `X-Request-Id` di setiap response (`RequestAuditFilter`); level INFO (<400), WARN (4xx),
  ERROR (5xx); MDC selalu dibersihkan.
- `GET /api/health` publik dengan envelope standar.
- Actuator di port internal `8081`, endpoint `health,info,prometheus`; `show-details: never`;
  metrics diberi tag `application="personal-finance"`.
- Collector Grafana Alloy: Docker logs -> Loki, scrape `/actuator/prometheus` -> Prometheus remote write.
- Dashboard awal: `personal-finance-app/observability/grafana/dashboard.json`.
- Dokumentasi: `personal-finance-app/README.md`, `AGENTS.md`, `personal-finance-app/.env.example`,
  desain: `docs/superpowers/specs/2026-11-25-logging-monitoring-design.md`.

## Bukti verifikasi

- `mvn test`: 33 test lulus; JaCoCo 100% LINE dan 100% BRANCH.
- `docker compose config`: valid.
- `alloy fmt` (image `grafana/alloy:latest`): config valid.
- Runtime dev: `GET /api/health` -> 200, header `X-Request-Id` terisi.
- Runtime internal: `http://localhost:8081/actuator/health` -> `{"status":"UP","groups":["liveness","readiness"]}`;
  `/actuator/prometheus` mengeluarkan `http_server_requests_seconds_count`.
- Uji profil `prod`: log keluar sebagai JSON dan memuat field MDC (`requestId`, `path`, `method`,
  `durationMs`, `status`).

## Sisa pekerjaan (manual, butuh kredensial)

1. Buat akun **Grafana Cloud Free**, catat URL + username Loki dan Prometheus, buat access token
   dengan scope `logs:write` dan `metrics:write`.
2. Isi `personal-finance-app/.env`:
   - `APP_ENV=production`
   - `SPRING_PROFILES_ACTIVE=prod` (wajib, agar JSON log aktif)
   - `GRAFANA_CLOUD_LOKI_URL`, `GRAFANA_CLOUD_LOKI_USER`
   - `GRAFANA_CLOUD_PROM_URL`, `GRAFANA_CLOUD_PROM_USER`
   - `GRAFANA_CLOUD_API_TOKEN`
3. Jalankan `docker compose up -d --build` dari `personal-finance-app/`.
4. Import `observability/grafana/dashboard.json` ke Grafana; pilih datasource Prometheus & Loki.
5. Buat alert rule: 5xx rate > 1% (5 menit), muncul `level="ERROR"`, p95 latency > 1s, heap > 85%.
6. Buat uptime monitor **Better Stack Free** ke `https://<domain>/api/health` (interval 3 menit),
   aktifkan alert email/Slack dan status page.
7. Verifikasi log & metrics masuk di Grafana Cloud Explore.

## Yang masih menunggu keputusan/input

- URL/domain publik production untuk monitor Better Stack.
- Apakah perlu error tracking Better Stack (Sentry-compatible) sekarang; default rencana: belum,
  cukup Loki + alert.

## Catatan penting

- Tanpa kredensial Grafana, container `alloy` tetap jalan tetapi `remote_write` akan gagal (wajar).
- Port `8081` sengaja hanya `expose`, tidak dipublish ke host.
- JSON log TIDAK aktif pada `SPRING_PROFILES_ACTIVE=dev` (kompatibel dengan setup lokal saat ini).
- `backend/target/` ikut ter-track di git dan berubah setiap build; sebaiknya dibersihkan dari
  tracking pada commit berikutnya (belum dilakukan).

## File utama

- `personal-finance-app/backend/src/main/resources/logback-spring.xml`
- `personal-finance-app/backend/src/main/resources/application.yml`
- `personal-finance-app/backend/src/main/java/com/example/personalfinance/config/RequestAuditFilter.java`
- `personal-finance-app/backend/src/main/java/com/example/personalfinance/config/SecurityConfig.java`
- `personal-finance-app/backend/src/main/java/com/example/personalfinance/controller/HealthController.java`
- `personal-finance-app/observability/alloy/config.alloy`
- `personal-finance-app/observability/grafana/dashboard.json`
- `personal-finance-app/docker-compose.yml`
- `personal-finance-app/.env.example`
