# User API

Service autentikasi untuk aplikasi Form Maker yang dibangun menggunakan Express.js dan PostgreSQL. Service ini menangani proses register dan login pengguna, serta menghasilkan token JWT untuk autentikasi selanjutnya.

## Fitur
- Registrasi pengguna baru
- Login pengguna dengan validasi password
- Pembuatan token JWT dengan masa berlaku 365 hari
- Integrasi dengan database PostgreSQL

## Teknologi yang Digunakan
- Node.js
- Express.js
- PostgreSQL
- JWT
- bcrypt
- dotenv

## Persyaratan
- Node.js 22+
- PostgreSQL 16.x
- npm atau pnpm

## Struktur Folder
- `server.js` - entry point API
- `db.js` - konfigurasi koneksi database PostgreSQL
- `migrate.js` - membuat database dan tabel users serta seed data awal
- `dropDatabase.js` - menghapus database user_db

## Variabel Lingkungan
Ubah file `.env.example` menjadi `.env` pada root service `user-api` dengan isi berikut:

```env
APP_PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=user_db
SECRET=your_jwt_secret
```

Untuk Secret
```bash
openssl rand -base64 64
```

## Langkah Instalasi
1. Masuk ke folder service:

```bash
cd services/user-api
```

2. Install dependency:

```bash
npm install
```

3. Buat database PostgreSQL dan sesuaikan konfigurasi `.env`.

4. Jalankan migrasi untuk membuat tabel dan seed awal:

```bash
node migrate.js
```

5. Jalankan server:

```bash
node server.js
```

## Endpoint API

### 1. Register User
- Method: `POST`
- URL: `/user/register`

Request body:

```json
{
  "username": "testing",
  "password": "test123"
}
```

Response contoh:

```json
{
  "status": 201,
  "message": "Berhasil Register Akun",
  "token": "<jwt_token>"
}
```

### 2. Login User
- Method: `POST`
- URL: `/user/login`

Request body:

```json
{
  "username": "abdi coy",
  "password": "abdi123"
}
```

Response contoh:

```json
{
  "status": 200,
  "message": "Berhasil Login",
  "token": "<jwt_token>"
}
```

## Kode Status Respons
- `200` - sukses
- `201` - data berhasil dibuat
- `400` - input tidak lengkap atau tidak valid
- `401` - password salah
- `404` - user tidak ditemukan
- `409` - username sudah ada
- `500` - kesalahan server

## Catatan
- Default database yang dipakai adalah `user_db`.
- Jika membutuhkan reset database, dapat menjalankan:

```bash
node dropDatabase.js
```

## Dokumentasi
Kami sudah menyediakan Swagger untuk API 
```bash
# jalankan server terlebih dahulu jika belum
node server.js

# jalankan swagger
node swagger-server.js
```