# Checklist API Documentation — Sisa Utang & Skala Perubahan Besar

Status per **2026-10-17**. Berkas ini dibuat setelah Sprint dokumentasi API (3 commit `[DEV]`) diverifikasi runtime.

> Dokumen ini **berbeda** dari `../../requirement/Fitur-yang-belum-ada.md` (fitur produk).
> Ini khusus kualitas & pemeliharaan lapisan dokumentasi API.

---

## 0. Ringkas posisi sekarang (terverifikasi runtime)

| Item | Status | Bukti |
|---|---|---|
| springdoc UI | ✅ | `/swagger-ui.html` → 302 → `index.html` (200) |
| OpenAPI JSON | ✅ | `/v3/api-docs` → 200, ±42 KB |
| Coverage `@Tag` | ✅ | 7/7 controller |
| Coverage `@Operation` | ✅ | 46/46 operasi |
| Coverage error response | ✅ | 0 operasi tanpa kode error |
| Security scheme | ✅ | `bearerAuth` (JWT), tombol Authorize aktif |
| Swagger dimatikan di prod | ⚠️ | belum diverifikasi runtime (lihat 1.1) |

---

## 1. Utang yang masih terbuka

### 1.1. Verifikasi runtime untuk profile `prod` — PRIORITAS TINGGI
- [ ] Jalankan dengan `SPRING_PROFILES_ACTIVE=prod`, pastikan `/v3/api-docs` **404** dan `/swagger-ui/index.html` tidak tersaji
- [ ] Pastikan tidak ada kebocoran: `curl -i http://localhost:8080/v3/api-docs` → bukan 200
- [ ] Konfirmasi `application-prod.yml` (`springdoc.api-docs.enabled: false`) benar-benar dibaca, bukan hanya ada di file
- [ ] **Risiko:** kalau ternyata tidak aktif, seluruh surface API publik terekspos di produksi

### 1.2. Schema error masih generik
- [ ] Kalau butuh detail field-level, buat DTO error terpisah, contoh `ValidationErrorResponse` (daftar field + pesan), `NotFoundErrorResponse`, `ConflictErrorResponse`
- [ ] Ganti `@Schema(implementation = ApiResponse.class)` pada `@ApiResponse` error dengan DTO spesifik
- [ ] **Trade-off:** menambah 3–4 file DTO. Hanya lakukan kalau konsumen API benar-benar butuh detail. Error envelope yang sekarang sudah jujur & konsisten.

### 1.3. Tidak ada regression test untuk dokumentasi
- [ ] Tambah test MockMvc: `GET /v3/api-docs` → 200
- [ ] Tambah test MockMvc: `GET /swagger-ui.html` → bukan 401 (menjaga fix `SecurityConfig`)
- [ ] Tambah test MockMvc: `POST /api/auth/login` → **tidak** punya security requirement (menjaga `@SecurityRequirements`)
- [ ] Test otomatis: setiap operasi wajib punya minimal satu kode error
- [ ] Semua test ini bisa jalan di profile `test` (H2 in-memory, tanpa butuh PostgreSQL/Docker)

### 1.4. Tidak ada CI sama sekali
- [ ] Tidak ada `.github/workflows/` — semua verifikasi manual
- [ ] Minimal: workflow `mvn -o test` + gate JaCoCo 100% line & branch
- [ ] Tambahkan: `mvn compile` gating + smoke test `/v3/api-docs`
- [ ] Opsional: deteksi drift dokumentasi (compare hasil generate vs committed snapshot)

### 1.5. Docker image basi tanpa peringatan
- [ ] `docker compose up` **tidak** rebuild image — sudah kejadian sekali (image 25 hari, sumber 1 hari)
- [ ] Dokumentasikan di README: selalu `docker compose up --build`, bukan `up` polos
- [ ] Tambahkan `--pull` di README agar base image ikut ter-update

### 1.6. Dokumentasi environment tidak sinkron
- [ ] `README.md` menyebut "create `.env` di project root", padahal `docker-compose.yml` membacanya dari `personal-finance-app/`
- [ ] Dokumentasikan bahwa Spring Boot **tidak** membaca `.env` otomatis — env var wajib di-set di shell kalau menjalankan backend tanpa Docker
- [ ] Jelaskan urutan: `cp .env.example .env` (sudah ada template)

### 1.7. Warisan platform Emergent
- [ ] `test_result.md` masih berisi scaffold protokol `main_agent`/`testing_agent` — sudah diputuskan **dipertahankan**, tapi tidak jelas gunanya bagi developer
- [ ] `memory/api-documentation-prompt.md` masih untracked — putuskan: commit sebagai spesifikasi, atau pindahkan ke arsip

---

## 2. Sebelum perubahan skala besar

### 2.1. Wajibkun dampak dokumentasi
- [ ] Endpoint baru/w berubah → wajib `@Operation` (summary + description) + `@ApiResponses` untuk kode error nyata
- [ ] Error code baru → catat di tabel ini, jangan hanya muncul di log
- [ ] Perubahan response shape → `ApiResponse` record berubah → impacted **semua** 46 operasi

### 2.2. Kunci kontrak API
- [ ] Belum ada versioning (`/api` polos). Pertimbangkan `/api/v1` sebelum breaking change pertama
- [ ] Belum ada contract test. Tambahkan sebelum endpoint dipakai integrator luar
- [ ] Field yang akan dihapus/rename → tandai deprecated dulu satu siklus

### 2.3. Invariant yang tidak boleh dilanggar
Dokumentasi harus tetap konsisten dengan aturan akuntansi berikut (sumber: `../../requirement/`):
- [ ] Double-entry: total debit = total kredit
- [ ] Transfer bukan pendapatan/biaya
- [ ] Unrealized P/L tidak pernah menyentuh ledger
- [ ] Jumlah lot tidak boleh minus (`INSUFFICIENT_STOCK`)
- [ ] User isolation — 404, bukan 403, untuk resource milik user lain (info leak)

### 2.4. Risiko teknis yang belum teratasi
- [ ] `ApiResponse` bentrok nama dengan anotasi swagger → **harus pakai FQN** `io.swagger.v3.oas.annotations.responses.ApiResponse`. Jangan ganti ke import biasa, build akan gagal dengan 96 error
- [ ] springdoc hanya membaca `responses` dari annotation `@Operation` langsung — **meta-annotation/composed annotation TIDAK akan terbaca** (sudah diverifikasi dari source springdoc 2.5.0)
- [ ] Nama `@Operation` bentrok dengan DTO bila ada DTO bernama sama → suffix `Response`

---

## 3. Urutan pengerjaan yang disarankan

| Prioritas | Item | Estimasi |
|---|---|---|
| 1 | 1.1 verifikasi profile prod | 15 menit |
| 2 | 1.3 regression test MockMvc | 1–2 jam |
| 3 | 1.6 sinkronkan README | 15 menit |
| 4 | 1.4 CI dasar | 2–3 jam |
| 5 | 1.2 DTO error spesifik | 3–4 jam (opsional) |
| 6 | 2.2 versioning + contract test | 1–2 hari (sebelum integrator) |

---

## 4. Cara verifikasi cepat (manual)

```bash
cd personal-finance-app
docker compose up --build -d backend      # WAJIB --build, bukan up polos
docker compose logs -f backend            # tunggu "Started PersonalFinanceApplication"

curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/v3/api-docs        # HARUS 200
curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/swagger-ui.html    # HARUS 302 (bukan 401!)
```

Lalu buka `http://localhost:8080/swagger-ui.html`.

Untuk mengecek spec tanpa browser:
```bash
curl -s http://localhost:8080/v3/api-docs | python -c "import json,sys; d=json.load(sys.stdin); print(len(d['paths']),'paths')"
```

Stop: `docker compose down`

---

**Catatan:** checklist ini perlu diupdate setelah setiap sprint yang menyentuh lapisan API.