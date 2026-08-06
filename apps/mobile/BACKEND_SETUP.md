# Backend Integration Setup

## Overview
Mobile app sudah terintegrasi dengan backend API:
- **User API** (Port 3001) - untuk authentication (login/register)
- **Form API** (Port 3000) - untuk manage forms

## Setup Backend

### 1. Setup User API
```bash
cd services/user-api
npm install
```

Buat file `.env`:
```
APP_PORT=3001
SECRET=your_jwt_secret_key
DATABASE_URL=your_postgres_connection_string
```

Run migrations dan start server:
```bash
npm run migrate
npm start
```

### 2. Setup Form API
```bash
cd services/form-api
npm install
```

Setup database dan run migrations:
```bash
npx knex migrate:latest
npx knex seed:run
npm run start:dev
```

## API Configuration

Edit `lib/core/config/api_config.dart` untuk mengatur base URL:

```dart
class ApiConfig {
  static const String userApiBaseUrl = 'http://localhost:3001';
  static const String formApiBaseUrl = 'http://localhost:3000';
}
```

### Untuk Testing di Device/Emulator:
- **Android Emulator**: gunakan `http://10.0.2.2:3001`
- **iOS Simulator**: gunakan `http://localhost:3001`
- **Physical Device**: gunakan IP address komputer (contoh: `http://192.168.1.100:3001`)

## Mobile App Features

### ✅ Authentication
- **Login** - POST `/user/login`
  - Input: username, password
  - Output: JWT token
  
- **Register** - POST `/user/register`
  - Input: username, password
  - Output: JWT token

### ✅ Forms Management
- **Create Form** - POST `/forms`
  - Input: title, visibility
  - Headers: Authorization Bearer token

- **Get Forms** - GET `/forms`
  - Headers: Authorization Bearer token

## Services Structure

```
lib/core/
├── config/
│   └── api_config.dart          # API endpoints configuration
├── services/
│   ├── auth_service.dart        # Login, Register, Logout
│   ├── form_service.dart        # Create, Get forms
│   └── storage_service.dart     # Local storage (token, user data)
```

## How It Works

1. **Login/Register Flow**:
   - User masukkan credentials
   - App kirim request ke backend
   - Jika sukses, token disimpan di local storage
   - User diarahkan ke Home screen

2. **Create Form Flow**:
   - User klik + button
   - Isi form title dan visibility
   - App kirim request dengan JWT token
   - Form berhasil dibuat

3. **Token Management**:
   - Token disimpan menggunakan `shared_preferences`
   - Token otomatis ditambahkan ke header setiap request
   - Logout akan clear semua data local

## Testing

1. Pastikan backend sudah running
2. Run mobile app: `flutter run`
3. Test Login/Register
4. Test Create Form

## Troubleshooting

### Connection Refused
- Pastikan backend sudah running
- Check API base URL sesuai dengan device/emulator
- Check firewall tidak block port

### CORS Error
- Pastikan backend sudah enable CORS
- User API sudah ada `app.use(cors())`

### Token Invalid
- Check JWT secret di backend dan token format
- Token expired? Default 365 hari

## Next Steps

- [ ] Implement Get Forms dari backend
- [ ] Add Pagination
- [ ] Add Pull to Refresh
- [ ] Add Form Detail
- [ ] Add Edit/Delete Form
- [ ] Add Response History
