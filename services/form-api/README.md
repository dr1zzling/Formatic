# Form API

Backend Form Maker berbasis NestJS dan PostgreSQL. Service ini menangani form, soal dan pilihan jawaban, upload gambar, impor soal dari DOCX, submit responden, serta pembuatan QR code.

## Teknologi

- Node.js dan NestJS
- TypeScript
- PostgreSQL
- Knex.js untuk migrasi dan seeder database
- JWT untuk route yang membutuhkan autentikasi

## Persiapan

Pastikan perangkat berikut sudah tersedia:

- Node.js dan npm
- PostgreSQL
- Database yang sudah dibuat
- JWT secret yang sama dengan `user-api`

Masuk ke direktori service:

```bash
cd services/form-api
npm install
```

## Konfigurasi environment

```bash
cp .env.example .env
```

```env
PORT=4000

DB_NAME=nama_database
DB_HOST=localhost
DB_PORT=5432
DB_USER=nama_user
DB_PASS=password_database

SECRET=secret-yang-sama-dengan-user-api
```


## Database

Jalankan migrasi dari direktori `services/form-api`:

```bash
npx knex migrate:latest
```

Jalankan seeder

```bash
npx knex seed:run
```

Perintah rollback:

```bash
npx knex migrate:rollback
npx knex migrate:rollback --all
```

## Menjalankan service

```bash
# development
npm run start

# development dengan hot reload
npm run start:dev

# build dan production
npm run build
npm run start:prod
```

API tersedia di `http://localhost:4000` jika menggunakan contoh konfigurasi di atas, atau di port yang ditentukan oleh `PORT`.

## Swagger

Swagger dijalankan sebagai server dokumentasi terpisah. Jalankan API terlebih dahulu, lalu pada terminal lain jalankan:

```bash
node swagger.js
```

Buka dokumentasi di:

```text
http://localhost:3001/api-docs
```

## Autentikasi

Route yang dilindungi membutuhkan JWT dari `user-api` pada header berikut:

```http
Authorization: Bearer <JWT>
```

Route publik dapat dipanggil tanpa header autentikasi. Pastikan nilai `SECRET` di service ini sama dengan secret yang digunakan `user-api`.

## Endpoint utama

### Form

| Method | Endpoint | Keterangan | Auth |
| --- | --- | --- | --- |
| `GET` | `/form` | Mendapatkan semua form | Tidak |
| `GET` | `/form/category?category=<kategori>` | Mendapatkan form berdasarkan kategori | Tidak |
| `GET` | `/form/slug/?slug=<slug>` | Mendapatkan detail form berdasarkan slug | Tidak |
| `POST` | `/form` | Membuat form dengan upload banner | Ya |
| `PATCH` | `/form?form_slug=<slug>` | Mengubah status form | Ya |
| `DELETE` | `/form?form_slug=<slug>` | Menghapus form | Ya |
| `GET` | `/form/user` | Mendapatkan form milik user | Ya |
| `POST` | `/form/share?form_slug=<slug>` | Mengatur kolaborator form | Ya |

### Soal

| Method | Endpoint | Keterangan | Auth |
| --- | --- | --- | --- |
| `GET` | `/form/soal/:id` | Mendapatkan soal berdasarkan ID form | Ya |
| `POST` | `/form/soal?form_slug=<slug>` | Membuat soal dan pilihan jawaban | Ya |
| `POST` | `/form/soal/import?form_slug=<slug>` | Mengimpor soal dari file `.docx` | Ya |
| `DELETE` | `/form/soal/:soal_id` | Menghapus soal | Ya |

### Submit

| Method | Endpoint | Keterangan | Auth |
| --- | --- | --- | --- |
| `POST` | `/form/submit/check-token?form_slug=<slug>` | Memeriksa token responden | Ya |
| `GET` | `/form/submit?form_slug=<slug>` | Mendapatkan daftar submit form | Ya |
| `GET` | `/form/submit/detail?form_slug=<slug>` | Mendapatkan detail jawaban submit | Ya |

## Upload file

File yang diunggah disimpan pada direktori berikut dan dapat diakses melalui static path `/uploads/`:

- Banner form: `uploads/banner`
- Gambar soal dan pilihan: `uploads/soal`

Banner menerima format JPEG, PNG, atau WebP dengan ukuran maksimal 5 MB. Import soal hanya menerima file `.docx`.


## Struktur penting

```text
src/          Source code NestJS
migration/    Migrasi database Knex
seeder/       Data awal database
uploads/      File upload banner dan soal
swagger.js    Server dokumentasi Swagger
```
