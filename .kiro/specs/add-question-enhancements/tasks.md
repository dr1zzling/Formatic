# Implementation Plan: Add Question Enhancements

## Overview

Implementasi 2 fitur enhancement untuk Add/Edit Question di Android Flutter:
1. **Timer/Duration Setting** - Batas waktu penyelesaian form
2. **Image Upload** - Upload gambar untuk soal (diagram, grafik, foto)

**Fitur yang TIDAK diimplementasikan** (backend tidak support):
- WYSIWYG/Rich Text Editor (backend field hanya TEXT)
- Required Question Toggle (tidak ada field required di soal)
- Shuffle Options per Question (hanya form-level shuffle)

**Target:** Android only (`apps/mobile/**`), no backend/web/database changes.

## Tasks

- [x] 1. Pre-Implementation Audit & Context Gathering
  - Read and analyze current implementation of create_form_screen.dart
  - Read and analyze current implementation of add_question_screen.dart
  - Read and analyze current implementation of form_viewer_screen.dart
  - Read and analyze current implementation of form_service.dart
  - Verify API config and endpoints in api_config.dart
  - Document current FormService method signatures
  - Verify pubspec.yaml contains image_picker dependency
  - Document current behavior to preserve (baseline for regression)
  - _Requirements: TR-1, TR-2, TR-5_

- [x] 2. FormService - Add Duration Support
  - [x] 2.1 Modify createForm() method signature
    - Add optional parameter: `int? duration`
    - Add duration field to multipart request body
    - Preserve all existing parameters and behavior
    - _Requirements: US-1, TR-1_
  
  - [x] 2.2 Test createForm with duration via manual API call
    - Test case: duration = 60 (should succeed)
    - Test case: duration = null (should succeed, no field sent)
    - Verify backend response includes duration in form data
    - _Requirements: US-1, TR-1_

- [x] 3. FormService - Add Image Upload Support
  - [x] 3.1 Add createQuestionWithImage() method
    - Accept parameters: formSlug, questionData, File? imageFile
    - Build multipart request with 'soal_images' field for file
    - Build multipart request with 'data' field for JSON string
    - If imageFile provided, add image_filename to questionData
    - Return {success, message, data} format matching existing methods
    - _Requirements: US-2, TR-2_
  
  - [x] 3.2 Add updateQuestionWithImage() method
    - Accept parameters: soalId, payload, File? imageFile, bool removeImage
    - Handle three scenarios: keep existing, replace with new, remove
    - Build multipart PATCH request similar to create
    - If removeImage=true, set image_filename to null in payload
    - _Requirements: US-2, TR-2_
  
  - [x] 3.3 Add necessary imports
    - Import dart:io for File class
    - Import package:path/path.dart for basename() function
    - Verify http package already imported
    - _Requirements: TR-2_

- [x] 4. Create Form Screen - Duration Input Field
  - [x] 4.1 Add duration state and controller
    - Add TextEditingController _durationController
    - Initialize in initState or as instance variable
    - Dispose controller in dispose() method
    - _Requirements: US-1_
  
  - [x] 4.2 Add duration input UI
    - Add section after category selector, before token input
    - Use TextFormField with numeric keyboard
    - Add label: "DURATION (OPTIONAL)"
    - Add hint: "e.g. 60"
    - Add suffix: "minutes"
    - Add helper text: "Leave empty for no time limit"
    - Follow existing theme: AppColors, border radius 12, existing border styles
    - _Requirements: US-1, TR-4_
  
  - [x] 4.3 Add duration validation
    - Validator: if not empty, must be valid integer
    - Validator: if provided, must be >= 1
    - Validator: if provided, must be <= 1440 (24 hours)
    - Show user-friendly error messages (no technical terms)
    - _Requirements: US-1, TR-1, TR-3_
  
  - [x] 4.4 Integrate duration with form creation
    - Modify _handleCreateForm() to parse duration from controller
    - Pass duration to FormService.createForm() call
    - Convert empty string to null
    - Parse using int.tryParse() with null safety
    - _Requirements: US-1, TR-1_

- [x] 5. Add Question Screen - Image Upload UI
  - [x] 5.1 Add image state variables
    - Add File? _selectedImage (for new/replacement image)
    - Add String? _existingImageUrl (for edit mode)
    - Add final ImagePicker _picker = ImagePicker()
    - Import dart:io and image_picker package
    - _Requirements: US-2, TR-2_
  
  - [x] 5.2 Add image upload button (when no image)
    - Add section after question input, before options
    - Add label: "IMAGE (OPTIONAL)"
    - Add OutlinedButton.icon with Icons.add_photo_alternate
    - Label: "Add Image"
    - Style: match existing outlined buttons (border radius 12, AppColors)
    - _Requirements: US-2, TR-4_
  
  - [x] 5.3 Implement _pickImage() method
    - Use ImagePicker.pickImage(source: ImageSource.gallery)
    - Set maxWidth: 1920, maxHeight: 1920, imageQuality: 85
    - Validate file size (must be <= 5MB)
    - Show SnackBar error if > 5MB: "Image too large. Maximum size is 5MB."
    - Update state: _selectedImage = file, clear _existingImageUrl
    - Handle errors with user-friendly messages (no technical leak)
    - _Requirements: US-2, TR-2, NFR-1_
  
  - [x] 5.4 Build _buildImagePreview() widget
    - Container with height: 200, border radius 12, border
    - Show Image.file() if _selectedImage exists
    - Show Image.network() if _existingImageUrl exists (edit mode)
    - Add loading indicator for network image
    - Add error builder with placeholder icon (Icons.broken_image)
    - Add remove button (X) in top-right corner (black87 background)
    - _Requirements: US-2, TR-4_
  
  - [x] 5.5 Implement _removeImage() method
    - setState: _selectedImage = null, _existingImageUrl = null
    - Should work for both new and existing images
    - _Requirements: US-2_
  
  - [x] 5.6 Handle existing image in edit mode
    - In _loadExistingQuestion(), parse question['image']
    - If image exists and not empty, set _existingImageUrl
    - Display existing image preview on load
    - _Requirements: US-2_
  
  - [x] 5.7 Integrate image with question save
    - Modify _saveQuestion() to use FormService.createQuestionWithImage() for create
    - Modify _saveQuestion() to use FormService.updateQuestionWithImage() for edit
    - Determine removeImage flag: true if _existingImageUrl != null && _selectedImage == null
    - Pass _selectedImage (File?) to service methods
    - Preserve all existing save logic (validation, options handling)
    - _Requirements: US-2, TR-2_

- [x] 6. Form Viewer Screen - Timer Display
  - [x] 6.1 Add timer state variables
    - Add int? _durationSeconds (total duration in seconds)
    - Add int? _remainingSeconds (countdown state)
    - Add Timer? _countdownTimer (timer object)
    - Add bool _hasShownWarning = false (warning dialog flag)
    - Import dart:async for Timer
    - _Requirements: US-1_
  
  - [x] 6.2 Parse duration from form data
    - In _loadForm(), after parsing form data
    - Read duration field: final duration = data['duration'] as int?
    - Convert minutes to seconds: _durationSeconds = duration * 60
    - Initialize: _remainingSeconds = _durationSeconds
    - Only proceed if duration != null && duration > 0
    - _Requirements: US-1, TR-1_
  
  - [x] 6.3 Implement _startTimer() method
    - Cancel any existing timer first
    - Create Timer.periodic(Duration(seconds: 1))
    - Each tick: decrement _remainingSeconds, call setState
    - At 60 seconds: call _showTimeWarning() if not shown
    - At 0 seconds: cancel timer, call _handleAutoSubmit() (optional)
    - Check mounted before setState
    - _Requirements: US-1_
  
  - [x] 6.4 Build _buildTimerDisplay() widget
    - Format time: MM:SS with padLeft(2, '0')
    - Color coding: green (>300s), yellow (120-300s), red (<120s)
    - Container with colored border, background opacity 0.1
    - Icon: Icons.timer, Text: monospace font
    - Border radius: 8, padding: horizontal 12, vertical 6
    - _Requirements: US-1, TR-4_
  
  - [x] 6.5 Add timer to AppBar
    - In AppBar actions array
    - Conditional: if (_remainingSeconds != null) _buildTimerDisplay()
    - Position: right side, before any existing actions
    - _Requirements: US-1, TR-4_
  
  - [x] 6.6 Implement _showTimeWarning() dialog
    - Check _hasShownWarning flag to show only once
    - AlertDialog with warning icon (Icons.warning_amber, error color)
    - Title: "Time Warning"
    - Content: "You have less than 1 minute remaining! Please submit your answers soon."
    - Action: "Continue" button (closes dialog)
    - barrierDismissible: false
    - _Requirements: US-1_
  
  - [x] 6.7 Handle timer lifecycle
    - Call _startTimer() after loading form if duration exists
    - Cancel timer in dispose(): _countdownTimer?.cancel()
    - Handle app backgrounding (optional enhancement, not required)
    - _Requirements: US-1, TR-3_

- [x] 7. Form Viewer Screen - Image Display
  - [x] 7.1 Modify _buildQuestionCard() to show image
    - After question text, before answer options
    - Check: if (question['image'] != null && (question['image'] as String).isNotEmpty)
    - Call _buildQuestionImage(question['image'])
    - Add spacing: SizedBox(height: 16) after image
    - _Requirements: US-2_
  
  - [x] 7.2 Implement _buildQuestionImage() widget
    - Build URL: '${ApiConfig.formApiBaseUrl}$imagePath'
    - Padding: horizontal 16, vertical 12
    - GestureDetector with onTap: _showImageDialog(imageUrl)
    - Container: height 200, border radius 12, border
    - Image.network() with fit: BoxFit.cover
    - Add loadingBuilder: CircularProgressIndicator
    - Add errorBuilder: placeholder with Icons.broken_image, "Image not available"
    - _Requirements: US-2, TR-4_
  
  - [x] 7.3 Implement _showImageDialog() for zoom
    - Show Dialog with transparent background
    - InteractiveViewer for pinch-to-zoom
    - Image.network() with fit: BoxFit.contain
    - Close button (X) in top-right: IconButton with white icon, black54 background
    - Error builder for broken images
    - _Requirements: US-2, NFR-2_

- [x] 8. Checkpoint - Integration Testing
  - Test complete flow: Create form with duration → Add question with image → View form
  - Verify timer countdown works correctly
  - Verify image displays correctly in viewer
  - Verify image zoom works
  - Verify warning dialog shows at 60 seconds
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Regression Testing - Existing Features
  - [x] 9.1 Test form creation without duration
    - Create form with empty duration field
    - Verify form saves successfully
    - Verify no duration field in UI/API
    - _Requirements: TR-3, TR-5_
  
  - [x] 9.2 Test question creation without image
    - Create question with text only (no image selected)
    - Verify question saves successfully
    - Verify no image upload or field sent to API
    - _Requirements: TR-3, TR-5_
  
  - [x] 9.3 Test form viewer without duration
    - Open form created before this feature
    - Verify no timer appears
    - Verify no errors or UI breaks
    - _Requirements: TR-5_
  
  - [x] 9.4 Test form viewer without images
    - Open form with questions created before this feature
    - Verify questions display normally
    - Verify no broken images or placeholders appear
    - _Requirements: TR-5_
  
  - [x] 9.5 Test edit existing question (no image)
    - Edit question created before this feature
    - Verify no image preview appears
    - Verify can add image to existing question
    - Verify can save without adding image (no changes)
    - _Requirements: TR-5_
  
  - [x] 9.6 Test other existing features
    - Test: Login flow (should be unaffected)
    - Test: Delete question (should work)
    - Test: Delete form (should work)
    - Test: Submit form (should work with/without timer)
    - Test: Import Word (should still work)
    - Test: My Forms list (should show correct question counts)
    - Test: Public/Private toggle (should work)
    - Test: Share form link (should work)
    - _Requirements: TR-5_

- [x] 10. Error Handling & Edge Cases
  - [x] 10.1 Test duration validation errors
    - Input "abc" → Should show: "Please enter a valid number"
    - Input "0" → Should show: "Duration must be at least 1 minute"
    - Input "9999" → Should show: "Duration cannot exceed 1440 minutes (24 hours)"
    - Input empty → Should succeed (optional field)
    - _Requirements: TR-3_
  
  - [x] 10.2 Test image validation errors
    - Select 10MB file → Should show: "Image too large. Maximum size is 5MB."
    - Network timeout during upload → Should show: "Failed to upload image. Please try again."
    - No technical errors leaked (no endpoint names, field names in user messages)
    - _Requirements: TR-2, TR-3_
  
  - [x] 10.3 Test image load failures in viewer
    - Backend returns 404 for image → Should show placeholder icon
    - Network error during load → Should show placeholder with message
    - No crashes or UI breaks
    - _Requirements: TR-2, TR-3_
  
  - [x] 10.4 Test timer edge cases
    - Invalid duration in API response → No timer, no error
    - Timer running when navigating away → Timer cancelled, no memory leak
    - Warning dialog shown twice → Should only show once (_hasShownWarning flag)
    - _Requirements: US-1, TR-3_

- [x] 11. Code Quality & Analysis
  - [x] 11.1 Run flutter analyze
    - Execute: flutter analyze in apps/mobile directory
    - Verify: 0 errors
    - Verify: 0 new warnings (existing warnings acceptable)
    - Fix any new issues before proceeding
    - _Requirements: TR-5_
  
  - [x] 11.2 Verify null safety
    - All new code uses proper null checks (?, ??, !)
    - No nullable values used without checks
    - All JSON parsing includes type casting and null handling
    - _Requirements: TR-3_
  
  - [x] 11.3 Verify UI consistency
    - All new widgets follow existing theme (AppColors)
    - Border radius matches existing (12 for containers, 8 for small)
    - Spacing matches existing (SizedBox with 8, 12, 16, 24)
    - Font styles match existing (labelLarge, textPrimary, etc)
    - _Requirements: TR-4_
  
  - [x] 11.4 Check for technical leaks in error messages
    - Search codebase for any user-facing strings
    - Verify no endpoint URLs in SnackBar messages
    - Verify no field names (duration, soal_images, image_filename) in UI
    - Verify no stack traces or exception details shown to user
    - _Requirements: TR-3_

- [x] 12. Final Checkpoint & Documentation
  - Ensure all tests pass, ask the user if questions arise.
  - Create summary of changes:
    - List files modified (4 files expected)
    - List features added (2 features)
    - List features skipped (3 features with reasons)
  - Report flutter analyze results
  - Report regression test results
  - Confirm no backend/web/database changes made
  - _Requirements: ALL_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["2.2", "4.1", "5.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "5.2", "5.3", "6.1", "6.2"] },
    { "id": 4, "tasks": ["4.4", "5.4", "5.5", "5.6", "6.3", "6.4", "7.1"] },
    { "id": 5, "tasks": ["5.7", "6.5", "6.6", "6.7", "7.2", "7.3"] },
    { "id": 6, "tasks": ["8"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3", "10.4"] },
    { "id": 9, "tasks": ["11.1", "11.2", "11.3", "11.4"] },
    { "id": 10, "tasks": ["12"] }
  ]
}
```
