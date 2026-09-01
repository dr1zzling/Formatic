# Requirements: Add Question Enhancements

## Overview
Menambahkan fitur Timer dan Image Upload ke Add/Edit Question screen di Android Flutter, menggunakan endpoint dan schema backend yang sudah tersedia.

## Scope
- **IN SCOPE:**
  - Timer/Duration setting untuk form
  - Image upload untuk soal
  - Image display di Form Viewer
  
- **OUT OF SCOPE:**
  - WYSIWYG editor (backend tidak support HTML/markdown)
  - Required question toggle (field tidak ada di backend)
  - Shuffle options toggle (field tidak ada di backend)
  - Perubahan backend/database
  - Perubahan web frontend

## User Stories

### US-1: Form Creator dapat mengatur durasi/timer form
**As a** form creator  
**I want to** set duration (timer) saat membuat atau mengedit form  
**So that** responden memiliki batas waktu untuk menyelesaikan form

**Acceptance Criteria:**
- [ ] Create Form screen memiliki input field untuk duration (menit)
- [ ] Edit Form screen menampilkan nilai duration existing
- [ ] Duration disimpan via PATCH `/form` dengan field `duration` (INTEGER)
- [ ] Jika duration kosong/null, form tanpa batas waktu
- [ ] Validasi: duration harus >= 1 menit atau null
- [ ] Form Viewer menampilkan countdown timer jika duration tersedia

### US-2: Form Creator dapat upload gambar ke soal
**As a** form creator  
**I want to** upload gambar saat membuat atau mengedit soal  
**So that** soal dapat menyertakan visualisasi (diagram, grafik, foto, dll)

**Acceptance Criteria:**
- [ ] Add Question screen memiliki button "Upload Image"
- [ ] Image picker membuka gallery/camera
- [ ] Preview image ditampilkan setelah dipilih
- [ ] Image dikirim via multipart `soal_images` ke POST `/form/soal`
- [ ] Edit Question menampilkan image existing jika ada
- [ ] Edit Question support update/replace/remove image
- [ ] Image disimpan ke `/uploads/soal/` di backend
- [ ] Form Viewer menampilkan image dari `soal.image` field
- [ ] Error handling: file size, format, upload gagal

## Technical Requirements

### TR-1: Duration Field Integration
- Gunakan endpoint: PATCH `/form` dengan body `{duration: number | null}`
- Read duration dari `GET /form/slug` response: `data.duration`
- UI: TextField dengan suffix "menit", default null/empty
- Validation: >= 1 atau null, tampilkan error user-friendly

### TR-2: Image Upload Integration
- Package: `image_picker` (sudah tersedia di pubspec.yaml)
- Endpoint: POST `/form/soal` multipart dengan field `soal_images[]` dan `data` (JSON string)
- Endpoint: PATCH `/form/soal/:id` multipart dengan field `soal_images[]` dan `data` (JSON string)
- Image filename convention: kirim `image_filename` di JSON, backend akan map ke file uploaded
- Display: `Image.network()` untuk load dari backend `/uploads/soal/...`
- Error: tampilkan SnackBar jika upload gagal, jangan crash

### TR-3: Null Safety & Error Handling
- Semua parsing `image`, `duration` harus null-safe
- Jika image load gagal, tampilkan placeholder icon
- Jika upload gagal, tampilkan pesan error user-friendly (tidak bocorkan endpoint/field name)
- Jika duration tidak valid, blokir submit dengan validation message

### TR-4: UI Consistency
- Follow theme existing: `AppColors`, spacing, typography
- Duration input: TextFormField dengan border existing
- Image picker button: ElevatedButton atau IconButton dengan icon `Icons.image`
- Image preview: Container dengan border radius 12, max height 200px
- Remove image button: IconButton dengan `Icons.close` di corner preview

### TR-5: Regression Prevention
- Fitur existing tidak boleh terpengaruh:
  - Create/Edit Question (text, options, type)
  - Delete Question
  - Form Viewer (soal tanpa image tetap tampil)
  - Submit form
  - Import Word (soal dari import tetap berfungsi)
  - My Forms (question count tetap akurat)

## Non-Functional Requirements

### NFR-1: Performance
- Image upload tidak blokir UI (async dengan loading indicator)
- Image size limit: 5MB (tampilkan error jika exceed)
- Image preview di-resize untuk tidak memberatkan memory

### NFR-2: Accessibility
- Image harus memiliki semantic label untuk screen reader
- Duration input harus memiliki label jelas ("Durasi (menit)")

### NFR-3: Maintainability
- Tidak membuat component/service baru jika tidak perlu
- Gunakan `FormService` existing untuk API call
- Follow naming convention existing

## Out of Scope (Explained)

1. **WYSIWYG / Rich Text Editor**
   - Reason: Backend field `soal.question` hanya TEXT, tidak ada parser HTML/markdown
   - Alternative: Tetap gunakan plain TextField, support image terpisah via `soal.image`

2. **Required Question Toggle**
   - Reason: Database schema tidak memiliki field `required` atau `is_required` di table soal
   - Impact: Semua soal dianggap optional, validasi harus di client-side
   - Blocker: Butuh backend migration untuk menambah field

3. **Shuffle Options Toggle**
   - Reason: `forms.is_random` hanya shuffle soal, tidak ada field untuk shuffle option per-soal
   - Alternative: Shuffle hanya bisa di level form (sudah implemented di `getSoalByForm`)

## Dependencies
- `image_picker: ^1.1.2` (already in pubspec.yaml)
- Backend endpoint: POST/PATCH `/form/soal` dengan multipart support
- Backend endpoint: PATCH `/form` dengan `duration` field

## Risks & Mitigations
- **Risk:** Image upload gagal karena network
  - **Mitigation:** Error handling dengan retry option, tampilkan pesan user-friendly
  
- **Risk:** Large image memperlambat Form Viewer
  - **Mitigation:** Backend harus resize/compress image, Flutter tampilkan loading indicator

- **Risk:** Duration field diubah setelah responden mulai mengisi
  - **Mitigation:** Document behavior - duration diambil saat form viewer dibuka pertama kali

## Success Metrics
- [ ] Form dengan duration dapat dibuat dan timer berfungsi di Form Viewer
- [ ] Soal dengan image dapat dibuat, diedit, dan ditampilkan
- [ ] flutter analyze: 0 error, 0 warning baru
- [ ] Regression check: semua fitur existing tetap berfungsi
- [ ] No text leak: tidak ada endpoint/field name yang tampil ke user
