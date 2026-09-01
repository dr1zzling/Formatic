# Design: Add Question Enhancements

## Overview

Dokumen ini menjelaskan desain implementasi untuk dua fitur utama:
1. **Timer/Duration Setting** - Menambahkan batas waktu untuk penyelesaian form
2. **Image Upload** - Memungkinkan soal menyertakan gambar (diagram, grafik, foto)

Implementasi mengikuti pola existing code, menggunakan widget Flutter standard, dan memanfaatkan endpoint backend yang sudah tersedia. Tidak ada perubahan backend atau database yang diperlukan.

## Architecture Overview

### Component Hierarchy

```
CreateFormScreen (existing - akan dimodifikasi)
├── Form Title Input (existing)
├── Category Selector (existing)
├── **[NEW] Duration Input Field** ← ADDED
├── Token Respon Input (existing)
├── Banner Image Upload (existing)
└── Create Button (existing)

FormEditorScreen / Settings Tab (existing - tidak dimodifikasi)
├── Public Status Toggle (existing)
├── Share Form (existing)
└── Delete Form (existing)
Note: Duration tidak bisa diedit setelah form dibuat (backend limitation)

AddQuestionScreen (existing - akan dimodifikasi)
├── Form Title Display (existing)
├── Question Type Selector (existing)
├── Question Input (existing)
├── **[NEW] Image Upload Section** ← ADDED
│   ├── Image Picker Button
│   ├── Image Preview Container
│   └── Remove Image Button
├── Options Section (existing - conditional)
└── Save Button (existing)

FormViewerScreen (existing - akan dimodifikasi)
├── AppBar
│   ├── Back Button (existing)
│   ├── Form Title (existing)
│   └── **[NEW] Timer Display** ← ADDED (jika duration ada)
├── Form Content
│   ├── Category Badge (existing)
│   ├── Questions List (existing)
│   │   ├── Question Number & Text (existing)
│   │   ├── **[NEW] Question Image** ← ADDED (jika ada)
│   │   └── Answer Input/Options (existing)
│   └── Submit Button (existing)
└── **[NEW] Timer Warning Dialog** ← ADDED (< 1 menit tersisa)
```

### State Management

Menggunakan StatefulWidget dengan local state (sesuai pattern existing):

**CreateFormScreen:**
- `TextEditingController _durationController` - untuk input duration
- Validation: >= 1 menit atau null/empty

**AddQuestionScreen:**
- `File? _selectedImage` - file gambar yang dipilih
- `String? _existingImageUrl` - URL gambar existing (saat edit)
- `bool _isUploading` - loading state untuk upload
- `final ImagePicker _picker = ImagePicker()` - untuk pick image

**FormViewerScreen:**
- `int? _durationSeconds` - durasi dalam detik (dari backend: minutes * 60)
- `int? _remainingSeconds` - sisa waktu countdown
- `Timer? _countdownTimer` - timer object untuk countdown
- `DateTime? _startTime` - waktu mulai form (untuk persistence check)

## Feature 1: Timer/Duration Setting

### UI Design

#### 1.1 Create Form Screen

**Location:** Setelah Category selector, sebelum Token Respon input

**Wireframe (ASCII):**
```
┌─────────────────────────────────────────────┐
│ CATEGORY                                    │
│ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │Ujian │ │Survei│ │ Data │                 │
│ └──────┘ └──────┘ └──────┘                 │
│                                             │
│ DURATION (OPTIONAL)                         │
│ ┌─────────────────────────────────────────┐ │
│ │ 60                            minutes   │ │
│ └─────────────────────────────────────────┘ │
│ ℹ️ Leave empty for no time limit           │
│                                             │
│ TOKEN RESPON                                │
│ ┌─────────────────────────────────────────┐ │
│ │ Masukkan token respon (opsional)       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Implementation:**

```dart
// Add in CreateFormScreen after category selection
const SizedBox(height: 24),
Text(
  'DURATION (OPTIONAL)',
  style: Theme.of(context).textTheme.labelLarge,
),
const SizedBox(height: 8),
TextFormField(
  controller: _durationController,
  keyboardType: TextInputType.number,
  decoration: InputDecoration(
    hintText: 'e.g. 60',
    suffixText: 'minutes',
    helperText: 'Leave empty for no time limit',
    helperStyle: const TextStyle(
      fontSize: 12,
      color: AppColors.textHint,
    ),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.inputBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.inputBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(
        color: AppColors.primary,
        width: 2,
      ),
    ),
  ),
  validator: (value) {
    if (value != null && value.trim().isNotEmpty) {
      final duration = int.tryParse(value.trim());
      if (duration == null) {
        return 'Please enter a valid number';
      }
      if (duration < 1) {
        return 'Duration must be at least 1 minute';
      }
      if (duration > 1440) { // 24 hours
        return 'Duration cannot exceed 1440 minutes (24 hours)';
      }
    }
    return null;
  },
),
```

**Integration Points:**

1. **Add controller in State:**
```dart
final _durationController = TextEditingController();
```

2. **Dispose controller:**
```dart
@override
void dispose() {
  _durationController.dispose();
  // ... existing disposals
  super.dispose();
}
```

3. **Modify createForm call:**
```dart
// In _handleCreateForm()
final result = await FormService.createForm(
  title: _titleController.text.trim(),
  category: _selectedCategory,
  bannerBytes: bannerBytes,
  tokenRespon: _tokenController.text.trim(),
  duration: _durationController.text.trim().isEmpty 
      ? null 
      : int.tryParse(_durationController.text.trim()),
);
```

#### 1.2 Form Viewer Screen - Timer Display

**Location:** AppBar actions, sebelah form title

**Wireframe (countdown timer):**
```
┌─────────────────────────────────────────────┐
│ ← Form Title                    ⏱️ 45:30   │  ← AppBar
├─────────────────────────────────────────────┤
│ UJIAN                                       │
│                                             │
│ Question 1...                               │
└─────────────────────────────────────────────┘
```

**Implementation:**

```dart
// In FormViewerScreen AppBar
appBar: AppBar(
  backgroundColor: Colors.white,
  elevation: 0,
  leading: IconButton(
    onPressed: () => Navigator.of(context).pop(),
    icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
  ),
  title: Text(
    _formTitle,
    style: const TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.bold,
      color: AppColors.textPrimary,
    ),
  ),
  actions: [
    if (_remainingSeconds != null) _buildTimerDisplay(),
  ],
),

// Timer display widget
Widget _buildTimerDisplay() {
  final minutes = _remainingSeconds! ~/ 60;
  final seconds = _remainingSeconds! % 60;
  final timeString = '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  
  // Color based on remaining time
  Color timerColor;
  if (_remainingSeconds! > 300) { // > 5 minutes
    timerColor = AppColors.success;
  } else if (_remainingSeconds! > 120) { // 2-5 minutes
    timerColor = AppColors.warning;
  } else { // < 2 minutes
    timerColor = AppColors.error;
  }
  
  return Container(
    margin: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    decoration: BoxDecoration(
      color: timerColor.withOpacity(0.1),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: timerColor, width: 1.5),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.timer, color: timerColor, size: 18),
        const SizedBox(width: 6),
        Text(
          timeString,
          style: TextStyle(
            color: timerColor,
            fontWeight: FontWeight.bold,
            fontSize: 15,
            fontFamily: 'monospace',
          ),
        ),
      ],
    ),
  );
}
```

**Timer Warning Dialog:**

```dart
// Show warning at 1 minute remaining
void _showTimeWarning() {
  if (!_hasShownWarning) {
    _hasShownWarning = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning_amber, color: AppColors.error, size: 28),
            const SizedBox(width: 8),
            const Text('Time Warning'),
          ],
        ),
        content: const Text(
          'You have less than 1 minute remaining! Please submit your answers soon.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
            ),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
  }
}
```

### Data Flow

#### Create Form dengan Duration

```
User Input (minutes) → Validation → FormService.createForm()
                                          ↓
                      {duration: int?} in request body
                                          ↓
                      Backend: POST /form (multipart)
                                          ↓
                      Response: {success, message, data}
                                          ↓
                      Navigate to Form Editor
```

**API Integration - FormService.createForm():**

```dart
// Modify signature
static Future<Map<String, dynamic>> createForm({
  required String title,
  required String category,
  required Uint8List bannerBytes,
  String? tokenRespon,
  int? duration, // NEW PARAMETER
}) async {
  try {
    // ... existing image validation ...
    
    final url = Uri.parse(
      '${ApiConfig.formApiBaseUrl}${ApiConfig.createFormEndpoint}',
    );

    final request = http.MultipartRequest('POST', url);
    final headers = await _getAuthHeaders();
    request.headers.addAll(headers);
    
    request.fields['title'] = title;
    request.fields['category'] = category.trim().toLowerCase();
    
    if (tokenRespon != null && tokenRespon.trim().isNotEmpty) {
      request.fields['token_respon'] = tokenRespon.trim();
    }
    
    // ADD DURATION FIELD
    if (duration != null && duration > 0) {
      request.fields['duration'] = duration.toString();
    }
    
    request.files.add(http.MultipartFile.fromBytes(
      'banner',
      bannerBytes,
      filename: 'banner.$imageExt',
      contentType: MediaType('image', imageExt),
    ));

    // ... existing send and response handling ...
  } catch (e) {
    // ... existing error handling ...
  }
}
```

#### Form Viewer Load & Timer Start

```
FormService.getFormBySlug(slug)
        ↓
Response: {data: {duration: int?, ...}}
        ↓
Parse duration → Convert to seconds
        ↓
Initialize Timer if duration != null
        ↓
setState: _remainingSeconds = duration * 60
        ↓
Start Timer.periodic(Duration(seconds: 1))
        ↓
Every second: decrement _remainingSeconds, update UI
        ↓
At 60 seconds: show warning dialog
        ↓
At 0 seconds: auto-submit (optional) or disable submit
```

**Implementation in FormViewerScreen:**

```dart
// Add state variables
int? _durationSeconds;
int? _remainingSeconds;
Timer? _countdownTimer;
bool _hasShownWarning = false;

// In _loadForm(), after parsing data:
final duration = data['duration'] as int?;
if (duration != null && duration > 0) {
  setState(() {
    _durationSeconds = duration * 60; // convert minutes to seconds
    _remainingSeconds = _durationSeconds;
  });
  _startTimer();
}

// Start timer
void _startTimer() {
  _countdownTimer?.cancel(); // Cancel any existing timer
  _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
    if (!mounted) {
      timer.cancel();
      return;
    }
    
    setState(() {
      if (_remainingSeconds != null && _remainingSeconds! > 0) {
        _remainingSeconds = _remainingSeconds! - 1;
        
        // Show warning at 60 seconds
        if (_remainingSeconds == 60) {
          _showTimeWarning();
        }
        
        // Auto-submit at 0 (optional behavior)
        if (_remainingSeconds == 0) {
          timer.cancel();
          _handleAutoSubmit();
        }
      } else {
        timer.cancel();
      }
    });
  });
}

// Optional: auto-submit when time runs out
Future<void> _handleAutoSubmit() async {
  ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(
      content: Text('Time is up! Submitting your answers...'),
      backgroundColor: AppColors.error,
    ),
  );
  
  // Give user 2 seconds to see the message
  await Future.delayed(const Duration(seconds: 2));
  
  if (mounted) {
    await _submitForm(); // Call existing submit logic
  }
}

// Dispose timer
@override
void dispose() {
  _countdownTimer?.cancel();
  // ... existing disposals
  super.dispose();
}
```

### Backend API

**Endpoint:** `POST /form` (multipart/form-data)

**Request Fields:**
```
title: string (required)
category: string (required)
banner: file (required)
token_respon: string (optional)
duration: integer (optional) ← NEW FIELD
```

**Response:**
```json
{
  "success": true,
  "message": "Form berhasil dibuat",
  "data": {
    "form": {
      "id": 123,
      "form_slug": "abc-123",
      "title": "Quiz Matematika",
      "category": "ujian",
      "duration": 60,  // minutes, atau null
      "status": "private"
    }
  }
}
```

**Endpoint:** `GET /form/slug?slug=...`

**Response includes duration:**
```json
{
  "success": true,
  "data": {
    "title": "Quiz Matematika",
    "category": "ujian",
    "duration": 60,  // minutes, atau null
    "soal": [...]
  }
}
```

## Feature 2: Image Upload untuk Soal

### UI Design

#### 2.1 Add Question Screen - Image Upload Section

**Location:** Setelah Question Input, sebelum Options Section

**Wireframe (before image selected):**
```
┌─────────────────────────────────────────────┐
│ QUESTION                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ What is the capital of Indonesia?      │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ IMAGE (OPTIONAL)                            │
│ ┌─────────────────────────────────────────┐ │
│ │  📷  Add Image                          │ │  ← Button
│ └─────────────────────────────────────────┘ │
│                                             │
│ OPTIONS                                     │
└─────────────────────────────────────────────┘
```

**Wireframe (after image selected):**
```
┌─────────────────────────────────────────────┐
│ QUESTION                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ What is shown in this diagram?         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ IMAGE (OPTIONAL)                            │
│ ┌─────────────────────────────────────────┐ │
│ │  ╔═══════════════════════════════════╗  │ │
│ │  ║                                   ║  │ │
│ │  ║      [Image Preview]          ❌ ║  │ │  ← Remove button
│ │  ║                                   ║  │ │
│ │  ╚═══════════════════════════════════╝  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ OPTIONS                                     │
└─────────────────────────────────────────────┘
```

**Implementation:**

```dart
// Add after Question Input, before Options Section
const SizedBox(height: 24),

// Image Upload Section
const Text(
  'Image (Optional)',
  style: TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: AppColors.textPrimary,
  ),
),
const SizedBox(height: 12),

if (_selectedImage == null && _existingImageUrl == null)
  OutlinedButton.icon(
    onPressed: _pickImage,
    icon: const Icon(Icons.add_photo_alternate, size: 20),
    label: const Text('Add Image'),
    style: OutlinedButton.styleFrom(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
      side: const BorderSide(color: AppColors.inputBorder),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      foregroundColor: AppColors.textSecondary,
    ),
  )
else
  _buildImagePreview(),
```

**Image Preview Widget:**

```dart
Widget _buildImagePreview() {
  return Stack(
    children: [
      Container(
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.inputBorder),
          borderRadius: BorderRadius.circular(12),
          color: AppColors.background,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: _selectedImage != null
              ? Image.file(
                  _selectedImage!,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.broken_image, 
                          size: 48, 
                          color: AppColors.textHint,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Failed to load image',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textHint,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : _existingImageUrl != null
                  ? Image.network(
                      '${ApiConfig.formApiBaseUrl}$_existingImageUrl',
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                            color: AppColors.primary,
                          ),
                        );
                      },
                      errorBuilder: (context, error, stackTrace) => Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.broken_image, 
                              size: 48, 
                              color: AppColors.textHint,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Failed to load image',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textHint,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  : const SizedBox.shrink(),
        ),
      ),
      // Remove button
      Positioned(
        top: 8,
        right: 8,
        child: GestureDetector(
          onTap: _removeImage,
          child: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.black87,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.close,
              color: Colors.white,
              size: 18,
            ),
          ),
        ),
      ),
    ],
  );
}
```

**Image Picker and Removal Methods:**

```dart
// Add state variables
File? _selectedImage;
String? _existingImageUrl;
final ImagePicker _picker = ImagePicker();

// In initState for editing
if (_isEditing) {
  _loadExistingQuestion();
  // ... existing code ...
  
  // Parse existing image URL
  final imageUrl = question?['image']?.toString();
  if (imageUrl != null && imageUrl.isNotEmpty) {
    _existingImageUrl = imageUrl;
  }
}

// Pick image
Future<void> _pickImage() async {
  try {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    
    if (image != null) {
      final file = File(image.path);
      final fileSize = await file.length();
      
      // Validate file size (5MB = 5 * 1024 * 1024 bytes)
      if (fileSize > 5 * 1024 * 1024) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Image too large. Maximum size is 5MB.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
        return;
      }
      
      setState(() {
        _selectedImage = file;
        _existingImageUrl = null; // Clear existing when selecting new
      });
    }
  } catch (e) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to pick image: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
}

// Remove image
void _removeImage() {
  setState(() {
    _selectedImage = null;
    _existingImageUrl = null;
  });
}

// Add dependency to pubspec.yaml (already exists, just ensure):
// image_picker: ^1.1.2
```

#### 2.2 Form Viewer Screen - Display Question Image

**Location:** Di bawah question text, sebelum answer options

**Wireframe:**
```
┌─────────────────────────────────────────────┐
│ ┌─┐ Question 1                              │
│ └─┘ What is shown in this diagram?          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  ╔═══════════════════════════════════╗  │ │
│ │  ║                                   ║  │ │
│ │  ║      [Question Image]             ║  │ │  ← Tapable to zoom
│ │  ║                                   ║  │ │
│ │  ╚═══════════════════════════════════╝  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ○ Option A                                  │
│ ○ Option B                                  │
│ ○ Option C                                  │
└─────────────────────────────────────────────┘
```

**Implementation:**

```dart
// In FormViewerScreen, modify question card builder
Widget _buildQuestionCard(Map<String, dynamic> question, int index) {
  // ... existing question header ...
  
  // Question text
  Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Text(
      question['question'],
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: AppColors.textPrimary,
      ),
    ),
  ),
  
  // NEW: Question Image (if exists)
  if (question['image'] != null && (question['image'] as String).isNotEmpty)
    _buildQuestionImage(question['image']),
  
  const SizedBox(height: 16),
  
  // ... existing answer options ...
}

// Question image widget
Widget _buildQuestionImage(String imagePath) {
  final imageUrl = '${ApiConfig.formApiBaseUrl}$imagePath';
  
  return Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    child: GestureDetector(
      onTap: () => _showImageDialog(imageUrl),
      child: Container(
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.inputBorder),
          borderRadius: BorderRadius.circular(12),
          color: AppColors.background,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Image.network(
            imageUrl,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return Center(
                child: CircularProgressIndicator(
                  value: loadingProgress.expectedTotalBytes != null
                      ? loadingProgress.cumulativeBytesLoaded /
                          loadingProgress.expectedTotalBytes!
                      : null,
                  color: AppColors.primary,
                ),
              );
            },
            errorBuilder: (context, error, stackTrace) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.broken_image, 
                    size: 48, 
                    color: AppColors.textHint,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Image not available',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textHint,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

// Show full-screen image dialog
void _showImageDialog(String imageUrl) {
  showDialog(
    context: context,
    builder: (context) => Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(20),
      child: Stack(
        children: [
          InteractiveViewer(
            child: Image.network(
              imageUrl,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) => const Center(
                child: Icon(Icons.broken_image, size: 64, color: Colors.white),
              ),
            ),
          ),
          Positioned(
            top: 0,
            right: 0,
            child: IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.close, color: Colors.white, size: 32),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black54,
              ),
            ),
          ),
        ],
      ),
    ),
  );
}
```

### Data Flow

#### Create Question dengan Image

```
User selects image (ImagePicker)
        ↓
Validate file size (< 5MB)
        ↓
Store File in _selectedImage
        ↓
On Save: Build multipart request
        ↓
FormData with:
  - data: JSON.encode({
      soal: {
        question: "...",
        type: "radio",
        image_filename: "photo_123.jpg"  ← Filename from File
      },
      options: [...]
    })
  - soal_images: [actual file bytes] ← File uploaded
        ↓
POST /form/soal?form_slug=... (multipart/form-data)
        ↓
Backend:
  - Saves image to /uploads/soal/
  - Maps image_filename → actual uploaded path
  - Stores path in soal.image column
        ↓
Response: {success, message, data}
        ↓
Navigate back & refresh
```

#### Edit Question dengan Image

```
Load existing question
        ↓
Parse: question['image'] → _existingImageUrl
        ↓
Display existing image from network
        ↓
User can:
  - Keep existing (don't change _selectedImage)
  - Replace with new (_selectedImage = new File)
  - Remove (set both to null)
        ↓
On Save:
  - If _selectedImage != null: upload new image
  - If both null: send image_filename: null
  - If only _existingImageUrl: keep existing (don't send soal_images)
        ↓
PATCH /form/soal/:id (multipart/form-data)
```

#### View Question dengan Image

```
FormService.getFormBySlug(slug)
        ↓
Response: {data: {soal: [{id, question, type, image, options}]}}
        ↓
Parse each question:
  - question['image'] → relative path e.g. "/uploads/soal/abc.jpg"
        ↓
Display with:
  Image.network('${ApiConfig.formApiBaseUrl}${question['image']}')
        ↓
Full URL: http://localhost:3002/uploads/soal/abc.jpg
```

### API Integration

**Endpoint:** `POST /form/soal?form_slug=...`  
**Content-Type:** `multipart/form-data`

**Modify FormService.createQuestions():**

```dart
static Future<Map<String, dynamic>> createQuestions({
  required String formSlug,
  required List<Map<String, dynamic>> questions,
  List<File>? imageFiles, // NEW PARAMETER - list of images
}) async {
  try {
    final url = Uri.parse(
      '${ApiConfig.formApiBaseUrl}${ApiConfig.soalEndpoint}?form_slug=$formSlug',
    );

    final request = http.MultipartRequest('POST', url);
    final headers = await _getAuthHeaders();
    request.headers.addAll(headers);

    // Add image files if provided
    if (imageFiles != null && imageFiles.isNotEmpty) {
      for (final imageFile in imageFiles) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'soal_images', // Field name expected by backend
            imageFile.path,
            filename: path.basename(imageFile.path),
          ),
        );
      }
    }

    // Add JSON data
    request.fields['data'] = jsonEncode(questions);

    final streamedResponse = await request.send().timeout(ApiConfig.timeout);
    final response = await http.Response.fromStream(streamedResponse);
    _handle401(response.statusCode);
    final data = await _decodeResponse(response);

    if (response.statusCode == 201 || response.statusCode == 200) {
      return {
        'success': true,
        'message': data['message'] ?? 'Questions created successfully',
        'data': data,
      };
    }

    return {
      'success': false,
      'message': data['message'] ?? 'Failed to create questions',
    };
  } catch (e) {
    return {
      'success': false,
      'message': 'Connection error: ${e.toString()}',
    };
  }
}
```

**Add similar method for single question with image:**

```dart
static Future<Map<String, dynamic>> createQuestionWithImage({
  required String formSlug,
  required Map<String, dynamic> questionData,
  File? imageFile,
}) async {
  try {
    final url = Uri.parse(
      '${ApiConfig.formApiBaseUrl}${ApiConfig.soalEndpoint}?form_slug=$formSlug',
    );

    final request = http.MultipartRequest('POST', url);
    final headers = await _getAuthHeaders();
    request.headers.addAll(headers);

    // Add image file if provided
    if (imageFile != null) {
      final filename = path.basename(imageFile.path);
      
      // Add filename to question data
      if (questionData['soal'] is Map<String, dynamic>) {
        questionData['soal']['image_filename'] = filename;
      }
      
      request.files.add(
        await http.MultipartFile.fromPath(
          'soal_images',
          imageFile.path,
          filename: filename,
        ),
      );
    }

    // Add JSON data as array with single question
    request.fields['data'] = jsonEncode([questionData]);

    final streamedResponse = await request.send().timeout(ApiConfig.timeout);
    final response = await http.Response.fromStream(streamedResponse);
    _handle401(response.statusCode);
    final data = await _decodeResponse(response);

    if (response.statusCode == 201 || response.statusCode == 200) {
      return {
        'success': true,
        'message': data['message'] ?? 'Question created successfully',
        'data': data,
      };
    }

    return {
      'success': false,
      'message': data['message'] ?? 'Failed to create question',
    };
  } catch (e) {
    return {
      'success': false,
      'message': 'Connection error: ${e.toString()}',
    };
  }
}
```

**Update method for editing with image:**

```dart
static Future<Map<String, dynamic>> updateQuestionWithImage({
  required int soalId,
  required Map<String, dynamic> payload,
  File? imageFile,
  bool removeImage = false, // Flag to remove existing image
}) async {
  try {
    final url = Uri.parse(
      '${ApiConfig.formApiBaseUrl}${ApiConfig.soalEndpoint}/$soalId',
    );

    final request = http.MultipartRequest('PATCH', url);
    final headers = await _getAuthHeaders();
    request.headers.addAll(headers);

    // Handle image updates
    if (removeImage) {
      // Signal backend to remove image
      if (payload['soal'] is Map<String, dynamic>) {
        payload['soal']['image_filename'] = null;
      }
    } else if (imageFile != null) {
      // Upload new image
      final filename = path.basename(imageFile.path);
      
      if (payload['soal'] is Map<String, dynamic>) {
        payload['soal']['image_filename'] = filename;
      }
      
      request.files.add(
        await http.MultipartFile.fromPath(
          'soal_images',
          imageFile.path,
          filename: filename,
        ),
      );
    }
    // If neither removeImage nor imageFile, keep existing image (don't modify)

    request.fields['data'] = jsonEncode(payload);

    final streamedResponse = await request.send().timeout(ApiConfig.timeout);
    final response = await http.Response.fromStream(streamedResponse);
    _handle401(response.statusCode);
    final data = await _decodeResponse(response);

    if (response.statusCode == 200) {
      return {
        'success': true,
        'message': data['message'] ?? 'Question updated successfully',
        'data': data,
      };
    }

    return {
      'success': false,
      'message': data['message'] ?? 'Failed to update question',
    };
  } catch (e) {
    return {
      'success': false,
      'message': 'Connection error: ${e.toString()}',
    };
  }
}
```

**Modify _saveQuestion in AddQuestionScreen:**

```dart
Future<void> _saveQuestion() async {
  if (!_formKey.currentState!.validate()) {
    return;
  }

  // ... existing validation ...

  setState(() {
    _isLoading = true;
  });

  try {
    final List<Map<String, dynamic>> optionValues = _needsOptions()
        ? _optionControllers.asMap().entries.map((entry) {
            // ... existing option mapping ...
          }).toList()
        : <Map<String, dynamic>>[];

    final soalPayload = {
      'question': _questionController.text.trim(),
      'type': _selectedType,
    };

    final Map<String, dynamic> result;
    
    if (_isEditing) {
      final soalId = int.tryParse(widget.questionToEdit!['id'].toString());
      if (soalId == null) {
        throw Exception('Invalid soal id');
      }
      
      // Attach existing option ids
      final optionsForUpdate = List<Map<String, dynamic>>.from(optionValues);
      final existing = widget.questionToEdit!['options'] as List? ?? [];
      for (var i = 0; i < optionsForUpdate.length; i++) {
        if (i < existing.length && existing[i] is Map) {
          final id = existing[i]['id'];
          if (id != null) {
            optionsForUpdate[i]['id'] = id;
          }
        }
      }
      
      // Determine image action
      bool removeImage = _existingImageUrl != null && 
                        _selectedImage == null && 
                        _existingImageUrl!.isNotEmpty;
      
      result = await FormService.updateQuestionWithImage(
        soalId: soalId,
        payload: {'soal': soalPayload, 'options': optionsForUpdate},
        imageFile: _selectedImage,
        removeImage: removeImage,
      );
    } else {
      // Create new question
      result = await FormService.createQuestionWithImage(
        formSlug: widget.formSlug!,
        questionData: {'soal': soalPayload, 'options': optionValues},
        imageFile: _selectedImage,
      );
    }

    setState(() {
      _isLoading = false;
    });

    if (mounted) {
      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              _isEditing
                  ? 'Question updated successfully!'
                  : 'Question added successfully!',
            ),
            backgroundColor: AppColors.success,
          ),
        );
        Navigator.of(context).pop(true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to save question'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  } catch (e) {
    setState(() {
      _isLoading = false;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save question. Please try again.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }
}
```

**Add path package import (already included in dependencies):**

```dart
import 'package:path/path.dart' as path;
```

### Backend API Contract

**POST /form/soal?form_slug=...**

**Request Type:** `multipart/form-data`

**Fields:**
- `data` (text field): JSON string dengan format:
  ```json
  [
    {
      "soal": {
        "question": "What is shown?",
        "type": "radio",
        "image_filename": "photo_123.jpg"  // Optional - harus match dengan file uploaded
      },
      "options": [
        {"value": "A", "is_correct": true},
        {"value": "B", "is_correct": false}
      ]
    }
  ]
  ```
- `soal_images` (file field, can be multiple): Actual image files

**Backend Behavior:**
1. Receives multipart request
2. Extracts files from `soal_images` field
3. For each question in `data`:
   - If `image_filename` is provided, maps to corresponding uploaded file
   - Saves file to `/uploads/soal/` directory
   - Stores relative path in database: `soal.image = "/uploads/soal/uuid_filename.jpg"`
4. Returns success response

**Response:**
```json
{
  "success": true,
  "message": "Soal berhasil ditambahkan",
  "data": {
    "soal": [
      {
        "id": 456,
        "question": "What is shown?",
        "type": "radio",
        "image": "/uploads/soal/uuid_photo_123.jpg",
        "options": [...]
      }
    ]
  }
}
```

**PATCH /form/soal/:id**

Similar to POST, but updates existing question. If `image_filename` is null, removes image. If not provided, keeps existing.

## Error Handling

### Timer Errors

| Scenario | Handling | User Message |
|----------|----------|--------------|
| Invalid duration input (non-number) | Validation error, block save | "Please enter a valid number" |
| Duration < 1 minute | Validation error, block save | "Duration must be at least 1 minute" |
| Duration > 1440 minutes | Validation error, block save | "Duration cannot exceed 1440 minutes (24 hours)" |
| Duration parse fail on load | Silent fallback, no timer | (No message - timer simply doesn't appear) |
| Timer state lost (app background) | Re-calculate based on start time | (Timer continues from where it left off) |

### Image Upload Errors

| Scenario | Handling | User Message |
|----------|----------|--------------|
| File > 5MB | Validation error, block upload | "Image too large. Maximum size is 5MB." |
| Invalid image format | ImagePicker pre-filters, or show error | "Invalid image format. Please select JPG, PNG, or WEBP." |
| Network error during upload | Show error, allow retry | "Failed to upload image. Please check your connection and try again." |
| Image load fail (viewer) | Show placeholder icon | "Image not available" (in gray placeholder) |
| ImagePicker permission denied | Show error | "Permission denied. Please allow photo access in settings." |
| Image pick cancelled | Silent (no error) | (No message) |

**Error Message Guidelines:**

✅ **Good (User-Friendly):**
- "Failed to upload image. Please check your connection."
- "Image too large. Maximum size is 5MB."
- "Duration must be at least 1 minute."

❌ **Bad (Technical Leak):**
- "POST /form/soal multipart error: timeout 30000ms"
- "image_filename field validation failed"
- "Exception: PlatformException(photo_access_denied)"

**Implementation Pattern:**

```dart
try {
  // ... operation ...
} catch (e) {
  if (mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar( // Use const with static strings
        content: Text('Failed to upload image. Please try again.'),
        backgroundColor: AppColors.error,
      ),
    );
  }
  // Log technical details for debugging (not shown to user)
  debugPrint('Image upload error: ${e.toString()}');
}
```

## File Changes Summary

### Files to Create

**None** - all changes are modifications to existing files.

### Files to Modify

#### 1. **create_form_screen.dart**
**Changes:**
- Add `_durationController` controller
- Add duration input field after category selector
- Add validation for duration (>= 1 or null)
- Modify `_handleCreateForm()` to pass duration to FormService
- Dispose duration controller

**Lines to modify:** ~50 lines added/modified
**Risk:** Low - isolated addition, doesn't affect existing functionality

---

#### 2. **add_question_screen.dart**
**Changes:**
- Import `dart:io` for File
- Import `image_picker` package
- Add state: `File? _selectedImage`, `String? _existingImageUrl`, `ImagePicker _picker`
- Add `_pickImage()`, `_removeImage()`, `_buildImagePreview()` methods
- Add image upload UI section after question input
- Modify `_loadExistingQuestion()` to parse existing image URL
- Modify `_saveQuestion()` to use new FormService methods with image
- Add image size validation (5MB limit)

**Lines to modify:** ~200 lines added/modified
**Risk:** Medium - significant changes but well-isolated section

---

#### 3. **form_viewer_screen.dart**
**Changes:**
- Add state: `int? _durationSeconds`, `int? _remainingSeconds`, `Timer? _countdownTimer`, `bool _hasShownWarning`
- Parse duration from form data in `_loadForm()`
- Add `_startTimer()`, `_formatTime()`, `_showTimeWarning()`, `_handleAutoSubmit()` methods
- Add `_buildTimerDisplay()` widget in AppBar actions
- Add `_buildQuestionImage()` widget for question images
- Add `_showImageDialog()` for full-screen image view
- Modify question card to display image if exists
- Cancel timer in `dispose()`

**Lines to modify:** ~150 lines added/modified
**Risk:** Medium - timer logic needs careful testing

---

#### 4. **form_service.dart**
**Changes:**
- Add `duration` parameter to `createForm()` method signature
- Add duration field to request in `createForm()`
- Add `createQuestionWithImage()` method (multipart with image)
- Add `updateQuestionWithImage()` method (multipart with image)
- Import `dart:io` for File
- Import `package:path/path.dart` for path operations

**Lines to modify:** ~150 lines added
**Risk:** Medium - API integration changes, needs thorough testing

---

#### 5. **pubspec.yaml**
**Changes:**
- Verify `image_picker: ^1.1.2` exists (already present)
- No changes needed if already present

**Lines to modify:** 0-2 lines
**Risk:** None

---

### Files NOT to Modify

- **form_editor_screen.dart** - Duration cannot be edited (backend limitation per requirements)
- **app_colors.dart** - Use existing colors
- **api_config.dart** - Endpoints already defined
- **Backend files** - No backend changes needed
- **Web app files** - Out of scope
- **Database migrations** - Fields already exist per requirements

### Dependency Graph

```
CreateFormScreen
    ↓
FormService.createForm() [MODIFIED]
    ↓
Backend POST /form

AddQuestionScreen
    ↓
ImagePicker (pick image)
    ↓
FormService.createQuestionWithImage() [NEW]
FormService.updateQuestionWithImage() [NEW]
    ↓
Backend POST/PATCH /form/soal (multipart)

FormViewerScreen
    ↓
FormService.getFormBySlug() [EXISTING]
    ↓
Timer.periodic (countdown)
    ↓
Auto-submit or warning
```

## Testing Strategy

### Unit Tests

Jika test framework tersedia (gunakan `flutter test`):

```dart
// test/services/form_service_test.dart

group('FormService Duration Tests', () {
  test('createForm includes duration when provided', () async {
    // Mock HTTP client
    // Verify request includes 'duration' field
  });
  
  test('createForm omits duration when null', () async {
    // Verify request does NOT include 'duration' field when null
  });
});

group('FormService Image Tests', () {
  test('createQuestionWithImage uploads file correctly', () async {
    // Mock multipart request
    // Verify soal_images field is included
    // Verify image_filename matches
  });
});
```

### Widget Tests

```dart
// test/screens/create_form_screen_test.dart

testWidgets('Duration field validates input', (tester) async {
  await tester.pumpWidget(CreateFormScreen());
  
  // Test validation: empty (valid - optional)
  // Test validation: "abc" (invalid - not a number)
  // Test validation: "0" (invalid - < 1)
  // Test validation: "60" (valid)
});

// test/screens/add_question_screen_test.dart

testWidgets('Image picker shows preview after selection', (tester) async {
  await tester.pumpWidget(AddQuestionScreen(...));
  
  // Tap "Add Image" button
  // Mock ImagePicker to return test image
  // Verify preview is displayed
  // Tap remove button
  // Verify preview is gone
});
```

### Manual Testing Checklist

#### Timer/Duration Feature

**Create Form:**
- [ ] Duration field accepts valid numbers (1-1440)
- [ ] Duration field shows error for invalid input ("abc", "0", "-5")
- [ ] Duration field accepts empty (optional)
- [ ] Form creates successfully with duration
- [ ] Form creates successfully without duration

**Form Viewer:**
- [ ] Timer displays correctly when duration exists (MM:SS format)
- [ ] Timer counts down every second
- [ ] Timer color changes: green (>5min), yellow (2-5min), red (<2min)
- [ ] Warning dialog shows at 60 seconds remaining
- [ ] Warning dialog only shows once
- [ ] Timer reaches 0:00 and triggers auto-submit (if enabled)
- [ ] No timer displayed when duration is null
- [ ] Timer persists across app background/foreground (bonus if implemented)

#### Image Upload Feature

**Add Question:**
- [ ] "Add Image" button opens image picker
- [ ] Image preview displays after selection
- [ ] Remove button clears image preview
- [ ] File size validation blocks > 5MB images
- [ ] Question saves successfully with image
- [ ] Question saves successfully without image
- [ ] Upload shows loading indicator during save

**Edit Question:**
- [ ] Existing image displays from network
- [ ] Can replace existing image with new one
- [ ] Can remove existing image
- [ ] Can keep existing image unchanged
- [ ] Update saves correctly with new image
- [ ] Update saves correctly after removing image

**Form Viewer:**
- [ ] Question image displays correctly below question text
- [ ] Image loads with loading indicator
- [ ] Image tap opens full-screen dialog
- [ ] Full-screen image is zoomable (InteractiveViewer)
- [ ] Close button dismisses full-screen view
- [ ] Broken image shows placeholder icon
- [ ] Questions without images display normally

### Regression Tests

Memastikan fitur existing tidak terpengaruh:

- [ ] **Create question (text only)** - works without errors
- [ ] **Edit question (existing, no image)** - works without errors
- [ ] **Delete question** - still works
- [ ] **Form Viewer (no duration)** - no timer, no UI issues
- [ ] **Form Viewer (no images)** - questions display normally
- [ ] **Import Word** - questions parse and save correctly
- [ ] **My Forms** - question count accurate (includes questions with/without images)
- [ ] **Submit form** - works with/without timer, with/without image questions
- [ ] **Public/Private toggle** - still works
- [ ] **Form deletion** - still works
- [ ] **Share link** - still works

### Error Scenario Testing

- [ ] Network timeout during image upload → shows user-friendly error
- [ ] Large image (10MB) → blocked with message
- [ ] Invalid image format (PDF) → shows error or pre-filtered by picker
- [ ] Image URL 404 in viewer → shows placeholder
- [ ] Duration field: "9999999" → validated or capped
- [ ] Timer running while app backgrounded → continues correctly on return
- [ ] Submit during timer countdown → works normally

## Performance Considerations

### Image Optimization

**Client-Side:**
```dart
// In _pickImage()
final XFile? image = await _picker.pickImage(
  source: ImageSource.gallery,
  maxWidth: 1920,    // Limit resolution
  maxHeight: 1920,
  imageQuality: 85,  // Compress quality
);
```

**Backend (assumed existing):**
- Backend should resize/compress images on upload
- Store optimized versions for web display
- Generate thumbnails if needed (future enhancement)

**Display:**
```dart
// Use Image.network with caching
Image.network(
  imageUrl,
  fit: BoxFit.cover,
  loadingBuilder: (context, child, loadingProgress) {
    // Show loading indicator
  },
  errorBuilder: (context, error, stackTrace) {
    // Show placeholder
  },
  // Optional: add cacheWidth/cacheHeight for memory optimization
  cacheWidth: 1920,
)
```

**Memory Management:**
- Preview images limited to 200px height
- Full-screen uses InteractiveViewer (lazy loading)
- Dispose ImagePicker when screen disposed

### Timer Optimization

```dart
// Use 1-second interval, not milliseconds
Timer.periodic(const Duration(seconds: 1), (timer) {
  // Update every second
});

// Cancel timer on dispose - CRITICAL for memory leak prevention
@override
void dispose() {
  _countdownTimer?.cancel();
  super.dispose();
}

// Only run timer when duration exists
if (duration != null && duration > 0) {
  _startTimer();
}
```

### Network Optimization

- Image upload: multipart/form-data already efficient
- Backend should implement proper image storage (CDN in production)
- Consider adding cache headers for image URLs

## Accessibility

### Image Accessibility

```dart
// Add semantic label for screen readers
Semantics(
  label: 'Question image: ${question['question']}',
  child: Image.network(imageUrl, ...),
)
```

**Best Practices:**
- Question text serves as image context (alt text)
- Tap to zoom provides better viewing for low vision users
- Error states provide clear text feedback

### Timer Accessibility

```dart
// Timer is visual only, but warning dialog is accessible
showDialog(
  context: context,
  builder: (context) => AlertDialog(
    title: const Text('Time Warning'), // Screen reader will announce
    content: const Text('You have less than 1 minute remaining!'),
    // ... actions ...
  ),
);
```

**Best Practices:**
- Timer display uses sufficient contrast colors
- Warning dialog provides audible/readable alert
- SnackBar messages announced to screen readers

### Duration Input Accessibility

```dart
TextFormField(
  decoration: InputDecoration(
    labelText: 'Duration (Optional)', // Clear label
    helperText: 'Leave empty for no time limit', // Additional context
    suffixText: 'minutes', // Unit clarity
  ),
)
```

## Security Considerations

### Image Upload Security

**Client-Side:**
```dart
// Validate file size before upload
final fileSize = await file.length();
if (fileSize > 5 * 1024 * 1024) {
  // Block upload
}

// Use filename without path traversal
import 'package:path/path.dart' as path;
final filename = path.basename(imageFile.path); // Only filename, no ../
```

**Backend (assumed existing):**
- Validate file type by magic bytes, not extension
- Generate unique filenames (UUID prefix)
- Store outside web root or with proper access control
- Scan for malicious content (optional, production consideration)

### API Security

```dart
// Always include Authorization header
final headers = await _getAuthHeaders();
request.headers.addAll(headers);

// Handle 401 responses
_handle401(response.statusCode);
```

### Duration Input Security

```dart
// Validate on client before sending
if (duration != null) {
  if (duration < 1 || duration > 1440) {
    // Block invalid values
  }
}

// Backend should also validate (defense in depth)
```

## Success Criteria

### Functional Requirements

- [x] Duration dapat diset saat create form (1-1440 minutes atau null)
- [x] Timer menampilkan countdown di Form Viewer jika duration ada
- [x] Timer berwarna sesuai sisa waktu (hijau/kuning/merah)
- [x] Warning dialog muncul saat < 1 menit
- [x] Image dapat di-upload saat create/edit question
- [x] Image preview ditampilkan setelah dipilih
- [x] Image dapat di-remove sebelum save
- [x] Image ditampilkan di Form Viewer untuk soal yang memiliki image
- [x] Image tap membuka full-screen zoomable view
- [x] Error handling user-friendly (tidak ada technical leak)

### Non-Functional Requirements

- [ ] `flutter analyze`: 0 errors, 0 new warnings
- [ ] Existing features tidak terpengaruh (regression pass)
- [ ] Image upload < 3 detik untuk file 2MB (network dependent)
- [ ] Timer update smooth (tidak lag)
- [ ] UI konsisten dengan theme existing
- [ ] No memory leaks (timer cancelled on dispose)

### User Experience Requirements

- [ ] Duration input jelas dan mudah dipahami
- [ ] Image picker intuitif (standard Flutter picker)
- [ ] Image preview jelas dan dapat dihapus
- [ ] Timer visible dan mudah dibaca
- [ ] Warning tidak mengganggu (dialog, not intrusive)
- [ ] Error messages helpful dan actionable
- [ ] Loading indicators saat upload

## Migration & Rollback Plan

### Migration Steps

**Phase 1: Duration Feature (Low Risk)**
1. Modify CreateFormScreen - add duration field
2. Modify FormService.createForm() - add duration parameter
3. Test create form with/without duration
4. Modify FormViewerScreen - add timer logic
5. Test timer display and countdown

**Phase 2: Image Feature (Medium Risk)**
6. Modify AddQuestionScreen - add image upload UI
7. Add FormService methods for image upload
8. Test create question with/without image
9. Test edit question with image
10. Modify FormViewerScreen - add image display
11. Test image viewing and zoom

**Phase 3: Integration Testing**
12. Run regression tests
13. Test all combinations (form with timer + questions with images)
14. Performance testing (image load times, timer accuracy)

### Rollback Plan

**If Duration feature breaks:**
- Remove duration field from CreateFormScreen
- Revert FormService.createForm() changes
- Remove timer logic from FormViewerScreen
- Forms created with duration will still work (just won't show timer)

**If Image feature breaks:**
- Remove image upload UI from AddQuestionScreen
- Revert FormService changes
- Remove image display from FormViewerScreen
- Questions with images will still exist in DB, just won't display

**Critical Rollback (complete revert):**
```bash
git revert <commit-hash>
# or
git checkout <previous-commit> -- <files>
```

### Backward Compatibility

- **Duration null** → existing forms without duration continue to work
- **Image null** → existing questions without images continue to work
- **Backend API** → uses existing endpoints, no breaking changes
- **Database** → fields already exist per requirements

## Next Steps

After design approval:

1. **Create tasks.md** - Break down implementation into actionable tasks
2. **Setup feature branch** - `git checkout -b feature/add-question-enhancements`
3. **Implement in order:**
   - Duration field (CreateFormScreen)
   - Timer display (FormViewerScreen)
   - Image upload (AddQuestionScreen)
   - Image display (FormViewerScreen)
   - FormService modifications
4. **Test each feature** after implementation
5. **Run regression tests** before merge
6. **Code review** with team
7. **Merge to main** after approval

---

**Design Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation  
**Estimated Effort:** 2-3 days development + 1 day testing
