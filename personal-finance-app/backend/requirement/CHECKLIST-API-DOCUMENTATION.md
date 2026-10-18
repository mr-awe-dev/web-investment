# Checklist API Documentation — Sisa Utang & Skala Perubahan Besar

Status per **2026-10-17**. Berkas ini dibuat setelah Sprint dokumentasi API (3 commit `[DEV]`) diverifikasi runtime, lalu diperbarui setelah audit lanjutan.

> Dokumen ini **berbeda** dari `../../requirement/Fitur-yang-belum-ada.md` (fitur produk).
> Ini khusus kualitas & pemeliharaan lapisan dokumentasi API.

---

## 0. Ringkas posisi sekarang (sudah diverifikasi runtime)

| Item | Status | Bukti |
|---|---|---|
| springdoc UI | ✅ | `/swagger-ui.html` → 302 → `index.html` (200) |
| OpenAPI JSON | ✅ | `/v3/api-docs` → 200, ±42 KB |
| Coverage `@Tag` | ✅ | 7/7 controller |
| Coverage `@Operation` | ✅ | 46/46 operasi |
| Coverage kode error | ✅ | 46/46 punya response sukses + error |
| Schema response sukses | ✅ | 46/46 punya schema (via `useReturnTypeSchema`) |
| Security scheme | ✅ | `bearerAuth` (JWT), tombol Authorize aktif |
| `/api/**` tetap tertutup | ✅ | `GET /api/accounts` tanpa token → **401** |
| `@SecurityRequirements` | ✅ | register/login punya `security: []`, 44 operasi lain warisi global |
| Error codes nyata | ✅ | `GET /api/accounts/99999999` → 404, body invalid → 400 |
| CSV export | ✅ | 200, `Content-Type: text/csv`, schema `text/csv: string` |
| Kontrak frontend vs spec | ✅ | **0** path frontend hilang dari spec (tanpa drift) |
| Client input salah -> 4xx | ✅ | param hilang/tipe salah/body rusak = 400, metode salah = 405, path tak dikenal = 404 |
| Error internal tetap 500 | ✅ | `Exception` umum tetap jadi `INTERNAL_ERROR` |
| Swagger dimatikan di prod | ✅ | docs tidak tersaji, `/v3/api-docs` -> 404 bersih |

---

## 1. Utang yang masih terbuka

### 1.1. [SELESAI] Salah input klien dulu dibalas 500 - sudah diperbaiki
**Ditemukan** saat memverifikasi profile `prod`, **sudah diperbaiki** dan diverifikasi live.

Kelima exception Spring ini dulu tertelan catch-all `handleGeneric(Exception)` dan dibalas **500**, padahal semuanya adalah salah input klien:

| Exception | Contoh | Hasil |
|---|---|---|
| `MissingServletRequestParameterException` | `GET /api/budgets` tanpa `period` | 400 `MISSING_PARAMETER` |
| `MethodArgumentTypeMismatchException` | `?page=abc`, `?type=BUKAN_ENUM`, `?from=bukan-tanggal` | 400 `INVALID_PARAMETER` |
| `HttpMessageNotReadableException` | body JSON rusak | 400 `MALFORMED_BODY` |
| `HttpRequestMethodNotSupportedException` | `DELETE /api/dashboard` | 405 `METHOD_NOT_ALLOWED` |
| `NoResourceFoundException` | path tak dikenal di area `permitAll` | 404 `NOT_FOUND` |

Konsekuensi yang pernah nyata: dokumentasi menyebut `GET /api/budgets` mengembalikan **400**, padahal kenyataannya **500**. Spec jadi tidak akurat.

Kini ke-5 exception punya handler sendiri di `GlobalExceptionHandler`, dengan test di `api/ErrorHandlingApiTest` (gate JaCoCo 100% memaksa tiap handler ter-cover).

- [x] 5 handler ditambahkan di `GlobalExceptionHandler`
- [x] 5 test ditambahkan di `api/ErrorHandlingApiTest`
- [x] Verifikasi live: 400 / 400 / 400 / 405 / 404
- [x] Dokumentasi jadi akurat **tanpa revisi spec**
- [ ] Saat menambah endpoint baru, cek apakah ada sumber error input baru yang perlu handler

### Catatan untuk endpoint baru

`NoResourceFoundException` hanya terpicu pada path yang lolos security. Path di bawah `/api/**` yang tidak dikenal tetap dibalas **401** oleh filter chain - itu perilaku yang benar (tidak membocorkan keberadaan endpoint), jadi jangan dikejar jadi 404.

### 1.2. Schema error masih generik
- [ ] Kalau butuh detail field-level, buat DTO error terpisah, contoh `ValidationErrorResponse` (daftar field + pesan), `NotFoundErrorResponse`, `ConflictErrorResponse`
- [ ] Ganti `@Schema(implementation = ApiResponse.class)` pada `@ApiResponse` error dengan DTO spesifik
- [ ] **Trade-off:** menambah 3–4 file DTO. Hanya lakukan kalau konsumen API benar-benar butuh detail. Error envelope yang sekarang sudah jujur & konsisten

### 1.3. Tidak ada regression test untuk dokumentasi
- [ ] Tambah test MockMvc: `GET /v3/api-docs` → 200
- [ ] Tambah test MockMvc: **setiap operasi punya minimal satu response 2xx** - inilah regresi yang harus dicegah, lihat §2.5
- [ ] Tambah test MockMvc: `GET /swagger-ui.html` → bukan 401 (menjaga fix `SecurityConfig`)
- [ ] Tambah test MockMvc: `GET /api/accounts` tanpa token → 401 (menjaga agar `/api/**` tidak ikut terbuka)
- [ ] Tambah test MockMvc: `POST /api/auth/login` punya `security: []` (menjaga `@SecurityRequirements`)
- [ ] Semua test ini bisa jalan di profile `test` (H2 in-memory, tanpa butuh PostgreSQL/Docker)

### 1.4. Tidak ada CI sama sekali
- [ ] Tidak ada `.github/workflows/` — semua verifikasi manual
- [ ] Minimal: workflow `mvn -o test` + gate JaCoCo 100% line & branch
- [ ] Tambahkan: smoke test `/v3/api-docs` + cek tidak ada operasi tanpa response sukses
- [ ] Opsional: deteksi drift dokumentasi (bandingkan hasil generate vs snapshot yang di-commit)

### 1.5. Docker image basi tanpa peringatan
- [ ] `docker compose up` **tidak** rebuild image — sudah kejadian sekali (image 25 hari, sumber 1 hari)
- [ ] Dokumentasikan di README: selalu `docker compose up --build`, bukan `up` polos
- [ ] Tambahkan `--pull` di README agar base image ikut ter-update

### 1.6. Dokumentasi environment tidak sinkron
- [ ] `README.md` menyebut "create `.env` di project root", padahal `docker-compose.yml` membacanya dari `personal-finance-app/`
- [ ] Dokumentasikan bahwa Spring Boot **tidak** membaca `.env` otomatis — env var wajib di-set di shell kalau menjalankan backend tanpa Docker
- [ ] Jelaskan urutan: `cp .env.example .env` (sudah ada template)

### 1.7. Belum diuji (sisa)
- [ ] Swagger UI di browser sungguhan — baru diverifikasi lewat HTTP, belum pernah diklik Authorize lalu menjalankan endpoint dari UI
- [ ] Menjalankan backend **tanpa** Docker (`mvn spring-boot:run`) — credential PostgreSQL lokal tidak cocok dengan isi `.env`
- [ ] Token kedaluwarsa / tidak valid (yang diuji baru token **absen**)
- [ ] `409 EMAIL_EXISTS`, `500 UNBALANCED_JOURNAL`, dan `400 INSUFFICIENT_STOCK` belum dipicu langsung
- [ ] Perilaku CORS dari origin berbeda (preflight) belum diuji
- [ ] Frontend end-to-end terhadap spec — baru dicek kesamaan path, belum ada uji kontrak otomatis

### 1.8. Warisan platform Emergent
- [x] `memory/api-documentation-prompt.md` — sudah di-commit sebagai spesifikasi
- [ ] `test_result.md` masih berisi scaffold protokol `main_agent`/`testing_agent` — sudah diputuskan **dipertahankan**, tapi tidak jelas gunanya bagi developer

---

## 2. Sebelum perubahan skala besar

### 2.1. Wajibkan dampak dokumentasi
- [ ] Endpoint baru/berubah → wajib `@Operation` (summary + description) + response sukses + `@ApiResponses` untuk kode error nyata
- [ ] Error code baru → catat di sini, jangan hanya muncul di log
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

### 2.4. Risiko teknis yang sudah ditemukan
- [ ] `ApiResponse` bentrok nama dengan anotasi swagger → **harus pakai FQN** `io.swagger.v3.oas.annotations.responses.ApiResponse`. Jangan ganti ke import biasa, build akan gagal dengan 96 error
- [ ] springdoc hanya membaca `responses` dari annotation `@Operation` langsung — **meta-annotation/composed annotation TIDAK akan terbaca** (diverifikasi dari source springdoc)
- [ ] Nama `@Operation`/`@ApiResponse` bentrok dengan DTO bila ada DTO bernama sama → suffix `Response`

### 2.5. ⚠️ WAJIB INGAT: `@Operation(responses = ...)` mematikan response sukses otomatis
Ini **regresi nyata yang sudah terjadi** dan diperbaiki. Jangan diulang.

Di `GenericResponseService` (springdoc):
```java
if (!CollectionUtils.isEmpty(apiResponsesOp) && apiResponsesOp.size() > genericMapResponse.size()) {
    // ... tidak menambah response sukses otomatis
} else {
    // baru di sini sukses otomatis ditambahkan
}
```

Artinya: begitu `@Operation` diisi `responses` eksplisit, springdoc **berhenti meng-generate 200/201**. Akibatnya 35 dari 46 operasi kehilangan response sukses di Swagger UI. Endpoint `@ResponseStatus(CREATED)` masih aman karena ditangani jalur terpisah.

**Aturan:** setiap operasi **wajib** punya entry sukses eksplisit dengan `useReturnTypeSchema = true`:
```java
@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Success", useReturnTypeSchema = true),
```
`useReturnTypeSchema = true` membuat schema diturunkan dari return type (mis. `ApiResponseListAccountResponse`), jadi tidak perlu menulis schema generik manual.

- [ ] Terapkan pola ini di setiap operasi baru
- [ ] Tambahkan test (lihat 1.3) agar regresi ini tidak bisa lolos lagi

---

## 3. Urutan pengerjaan yang disarankan

| Prioritas | Item | Estimasi |
|---|---|---|
| 1 | 1.1 guard `@ConditionalOnProperty` → 404 bersih | 15 menit |
| 2 | 1.3 regression test MockMvc | 1–2 jam |
| 3 | 1.6 sinkronkan README | 15 menit |
| 4 | 1.4 CI dasar | 2–3 jam |
| 5 | 1.7 uji manual sisanya | 1 jam |
| 6 | 1.2 DTO error spesifik | 3–4 jam (opsional) |
| 7 | 2.2 versioning + contract test | 1–2 hari (sebelum integrator) |

---

## 4. Cara verifikasi cepat (manual)

```bash
cd personal-finance-app
docker compose up --build -d backend      # WAJIB --build, bukan up polos
docker compose logs -f backend            # tunggu "Started PersonalFinanceApplication"

curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/v3/api-docs        # HARUS 200
curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/swagger-ui.html    # HARUS 302 (bukan 401!)
curl -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/accounts       # HARUS 401 (API tetap tertutup)
```

Lalu buka `http://localhost:8080/swagger-ui.html`.

Untuk mengecek spec tanpa browser:
```bash
curl -s http://localhost:8080/v3/api-docs | python -c "import json,sys; d=json.load(sys.stdin); print(len(d['paths']),'paths')"
```

Untuk memastikan tidak ada operasi yang kehilangan response sukses (regresi §2.5):
```bash
curl -s http://localhost:8080/v3/api-docs | python -c "
import json,sys
d=json.load(sys.stdin)
bad=[(m.upper(),p) for p,v in d['paths'].items() for m in v
     if m in ('get','post','put','delete','patch')
     and not any(c.startswith('2') for c in v[m]['responses'])]
print('tanpa response sukses:',len(bad)); [print(' ',m,p) for m,p in bad]"
```

Stop: `docker compose down`

---

**Catatan:** checklist ini perlu diupdate setelah setiap sprint yang menyentuh lapisan API.