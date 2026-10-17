## TASK: Implement Dynamic API Documentation for Spring Boot Backend

Saya ingin menambahkan **API Documentation yang dinamis** ke project backend Spring Boot yang sedang berjalan.

### TUJUAN UTAMA

Implementasikan API Documentation menggunakan **OpenAPI 3 / Swagger UI** yang:

* Otomatis membaca endpoint dari source code Spring Boot.
* Menampilkan seluruh REST API yang tersedia.
* Menampilkan HTTP method, endpoint/path, parameter, request body, response body, status code, dan schema DTO/model.
* Dokumentasi harus mengikuti perubahan pada source code tanpa perlu membuat file dokumentasi API secara manual.
* Swagger UI harus dapat digunakan untuk melakukan testing endpoint secara langsung.
* Jangan membuat dokumentasi API statis yang terpisah dari source code.
* Jangan menduplikasi informasi endpoint ke file JSON/YAML manual kecuali memang diperlukan oleh framework.

---

# RULES

## 1. ANALISIS PROJECT TERLEBIH DAHULU

Sebelum melakukan perubahan:

1. Inspect struktur project.
2. Identifikasi:

   * Spring Boot version
   * Java version
   * Maven/Gradle
   * Controller
   * REST endpoint
   * DTO/request/response
   * Entity/model
   * Security configuration
   * Authentication mechanism
   * Existing dependency yang berkaitan dengan Swagger/OpenAPI
   * Existing API documentation jika ada
3. Jangan mengubah arsitektur existing hanya untuk menambahkan documentation.
4. Jangan membuat asumsi terhadap struktur project yang belum diperiksa.

---

# 2. GUNAKAN OPENAPI 3

Gunakan library OpenAPI yang sesuai dengan versi Spring Boot dan dependency stack project.

Jika project menggunakan Maven:

* Tambahkan dependency OpenAPI/Swagger yang kompatibel dengan versi Spring Boot yang digunakan.
* Jangan menambahkan dependency yang redundant.
* Jangan menggunakan library Swagger/OpenAPI yang sudah deprecated apabila terdapat alternatif yang kompatibel.

Jika project sudah memiliki dependency OpenAPI/Swagger:

* Gunakan konfigurasi existing jika masih valid.
* Jangan membuat konfigurasi kedua yang menyebabkan conflict.

---

# 3. SWAGGER UI

Expose Swagger UI melalui endpoint yang sesuai.

Contoh:

`/swagger-ui.html`

atau endpoint default yang disediakan library.

OpenAPI JSON harus tersedia melalui endpoint OpenAPI yang sesuai, misalnya:

`/v3/api-docs`

Jangan hardcode daftar endpoint di Swagger configuration.

Endpoint harus diambil otomatis dari Spring MVC/WebFlux controller yang benar-benar terdapat di project.

---

# 4. DOKUMENTASI HARUS DINAMIS

Dokumentasi harus bersumber dari source code.

Gunakan annotation OpenAPI hanya jika diperlukan untuk meningkatkan kualitas dokumentasi.

Contoh informasi yang dapat didokumentasikan:

* `@Tag`
* `@Operation`
* `@Parameter`
* `@ApiResponse`
* `@Schema`
* `@SecurityScheme`

Namun:

**JANGAN menambahkan annotation secara berlebihan.**

Prioritaskan dokumentasi yang benar-benar membantu developer memahami API.

Jangan menambahkan deskripsi generik seperti:

> "This endpoint is used to process data."

Jika maksud endpoint sudah jelas dari method dan struktur kode.

---

# 5. CONTROLLER

Periksa seluruh controller.

Untuk setiap endpoint, dokumentasikan minimal:

* HTTP method
* Path
* Summary
* Description jika memang diperlukan
* Path variable
* Query parameter
* Header parameter jika diperlukan
* Request body
* Response
* HTTP status code
* Authentication requirement jika ada

Contoh struktur yang diharapkan:

```java
@Operation(
    summary = "Get user by ID",
    description = "Retrieve user information based on the specified user ID"
)
@ApiResponses({
    @ApiResponse(
        responseCode = "200",
        description = "User successfully retrieved"
    ),
    @ApiResponse(
        responseCode = "404",
        description = "User not found"
    )
})
```

Jangan mengubah business logic controller hanya demi dokumentasi.

---

# 6. DTO DAN SCHEMA

Pastikan Swagger/OpenAPI dapat membaca struktur:

* Request DTO
* Response DTO
* Nested DTO
* Generic response
* Pagination response
* Error response

Schema harus menampilkan:

* Field name
* Data type
* Required/optional
* Nullable jika relevan
* Description jika relevan
* Example jika memang berguna

Jika DTO sudah memiliki validation seperti:

```java
@NotNull
@NotBlank
@Size
@Email
@Min
@Max
```

pastikan informasi validation tersebut tercermin secara wajar dalam OpenAPI schema jika library mendukungnya.

Jangan mengubah validation existing.

---

# 7. STANDARD ERROR RESPONSE

Jika project sudah memiliki global exception handler seperti:

```java
@RestControllerAdvice
```

atau:

```java
@ExceptionHandler
```

gunakan struktur error response existing untuk dokumentasi OpenAPI.

Jangan membuat error response baru hanya untuk Swagger.

Jika project memiliki response seperti:

```json
{
  "timestamp": "...",
  "status": 400,
  "message": "...",
  "path": "..."
}
```

maka dokumentasikan schema tersebut.

---

# 8. SECURITY / AUTHENTICATION

Inspect security configuration.

Jika API menggunakan:

* JWT
* Bearer Token
* Basic Authentication
* OAuth2
* API Key
* Cookie/session authentication

dokumentasikan security scheme tersebut pada OpenAPI.

Untuk JWT/Bearer, gunakan security scheme yang sesuai sehingga Swagger UI memiliki mekanisme:

`Authorize`

dan user dapat memasukkan token untuk melakukan testing endpoint protected.

Contoh konsep:

```java
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer"
)
```

Jangan mengubah mekanisme authentication existing.

---

# 9. ENDPOINT ACCESS

Perhatikan endpoint yang bersifat:

* Public
* Authenticated
* Admin-only
* Role-based

Dokumentasikan security requirement berdasarkan konfigurasi security existing.

Jangan menganggap semua endpoint membutuhkan authentication.

Jangan mengubah authorization rules.

---

# 10. GROUPING API

Jika project memiliki banyak controller/module, kelompokkan API secara logical menggunakan OpenAPI tags.

Contoh:

* Authentication
* User
* Product
* Order
* Payment
* Admin

Gunakan struktur module/controller yang memang sudah ada.

Jangan membuat grouping berdasarkan asumsi.

---

# 11. OPENAPI METADATA

Tambahkan metadata API seperti:

* API title
* Description
* Version

Contoh:

```java
@OpenAPIDefinition(
    info = @Info(
        title = "Backend API",
        version = "1.0.0",
        description = "REST API documentation"
    )
)
```

Gunakan informasi project yang sebenarnya jika tersedia.

Jangan mengarang nama perusahaan, versi API, URL, contact, atau license.

---

# 12. ENVIRONMENT

Pastikan konfigurasi documentation tidak merusak environment:

* local
* development
* staging
* production

Jika project memiliki konfigurasi Spring profile, ikuti pola existing.

Jangan membuat konfigurasi environment baru jika tidak diperlukan.

Jika Swagger UI seharusnya hanya aktif pada environment tertentu, ikuti requirement/configuration existing project.

Jangan mengubah production security policy hanya agar Swagger dapat dibuka.

---

# 13. JANGAN MENGUBAH BUSINESS LOGIC

Ini aturan STRICT.

Jangan melakukan perubahan terhadap:

* Business logic
* Database schema
* Entity relationship
* Repository behavior
* Service behavior
* Authentication mechanism
* Authorization rules
* Existing API contract

kecuali perubahan tersebut benar-benar diperlukan agar OpenAPI dapat membaca metadata.

Fokus pekerjaan hanya pada API documentation.

---

# 14. MINIMAL CHANGE

Gunakan prinsip:

> **Minimum required changes.**

Jangan melakukan refactoring unrelated.

Jangan:

* Rename class
* Rename method
* Rename endpoint
* Rename DTO
* Memindahkan package
* Mengubah architecture
* Mengubah database
* Mengubah response existing
* Mengubah HTTP status existing
* Mengubah dependency yang tidak berhubungan
* Menghapus code existing

hanya untuk membuat documentation.

---

# 15. VALIDATION

Setelah implementasi:

1. Build project.
2. Pastikan tidak ada compilation error.
3. Pastikan application dapat startup.
4. Pastikan Swagger UI dapat diakses.
5. Pastikan OpenAPI JSON dapat diakses.
6. Pastikan seluruh controller terdeteksi.
7. Pastikan request/response schema muncul.
8. Pastikan authentication Swagger bekerja jika API menggunakan authentication.
9. Pastikan endpoint existing tetap bekerja.
10. Jangan menganggap implementasi selesai hanya karena dependency berhasil ditambahkan.

Jika terdapat error, perbaiki hanya error yang berkaitan dengan implementasi API Documentation.

---

# 16. ACCEPTANCE CRITERIA

Implementasi dianggap berhasil jika:

* Swagger UI dapat dibuka.
* OpenAPI specification dapat diakses.
* Endpoint terdeteksi otomatis dari controller.
* HTTP methods tampil benar.
* Path variable tampil benar.
* Query parameter tampil benar.
* Request body tampil benar.
* Response schema tampil benar.
* HTTP response code terdokumentasi.
* Authentication/security scheme terdokumentasi jika digunakan.
* DTO/schema terbaca dengan benar.
* Error response terdokumentasi jika project memiliki global exception handler.
* Swagger UI dapat digunakan untuk mencoba endpoint.
* Tidak ada perubahan business logic.
* Tidak ada endpoint existing yang berubah.
* Project berhasil build dan startup.

---

# STRICT EXECUTION RULE

**DO NOT DO ANYTHING THAT IS NOT REQUIRED FOR THIS TASK.**

Kerjakan hanya pekerjaan yang diperlukan untuk membuat **dynamic API documentation menggunakan OpenAPI/Swagger**.

Jangan melakukan:

* UI redesign
* Code cleanup
* Refactoring
* Performance optimization
* Database optimization
* Security redesign
* Architecture redesign
* Dependency upgrade yang tidak diperlukan
* Perubahan business logic
* Perubahan API contract
* Penambahan fitur baru yang tidak berkaitan dengan documentation

Jika suatu perubahan **tidak diperlukan untuk memenuhi acceptance criteria di atas, jangan lakukan perubahan tersebut.**

Sebelum membuat perubahan, inspect existing implementation terlebih dahulu dan gunakan konfigurasi/project pattern yang sudah tersedia.

Setelah selesai, tampilkan secara ringkas:

1. File yang dibuat.
2. File yang diubah.
3. Dependency yang ditambahkan.
4. URL Swagger UI.
5. URL OpenAPI JSON.
6. Validasi/build result.
7. Jika ada hal yang tidak dapat didokumentasikan otomatis, jelaskan alasannya.

Jangan memberikan perubahan atau rekomendasi tambahan di luar scope task ini.
