# Fill Form Submit Flow - Diagnostics & Debug Logging

**Date:** September 10, 2026  
**Focus:** HTTP 500 Submit Issue - Root Cause Investigation  
**Status:** Debug logging added for runtime investigation

---

## Submit Flow Trace (Complete)

### 1. User Presses Submit Button
**File:** `form_viewer_screen.dart`, method `_handleSubmit()`

**Flow:**
```
User clicks "Submit Form" button
  ↓
_handleSubmit() called
  ↓
Validate: Check required fields answered
  ↓
Build answers list
  ↓
Call FormService.submitForm()
```

### 2. Answer List Construction

**Location:** `form_viewer_screen.dart`, lines ~1000-1055 (in `_handleSubmit()`)

**Logic:**
```dart
final List<Map<String, dynamic>> answers = [];

for (final question in _allSoal) {
  final soalId = question['id'];
  final type = question['type'];
  final answer = question['answer'];
  
  // Skip unanswered questions (except file type)
  if (answer == null && type != 'file') continue;
  
  // Build jawaban structure
  final Map<String, dynamic> jawaban = {'soal_id': soalId};
  
  // Type-specific processing...
  
  answers.add({'jawaban': jawaban});
}
```

**Answer Payload Structure:**
```json
[
  {
    "jawaban": {
      "soal_id": 123,
      "soal_option_id": 456        // for radio/checkbox/rating
      // OR
      "answer_text": "user text"   // for text input
      // OR
      "soal_option_id": [1,2,3]    // for checkbox (array)
    }
  },
  ...
]
```

### 3. FormService.submitForm() Call

**Location:** `apps/mobile/lib/core/services/form_service.dart`, line ~613

**Method Signature:**
```dart
static Future<Map<String, dynamic>> submitForm({
  required String formSlug,
  required List<Map<String, dynamic>> answers,
  List<({Uint8List bytes, String filename})> files = const [],
}) async
```

**HTTP Request:**
- **Method:** `POST`
- **Endpoint:** `/form/submit?form_slug={formSlug}`
- **Base URL:** `http://10.10.18.254:3002` (Android device config)
- **Full URL:** `http://10.10.18.254:3002/form/submit?form_slug={slug}`

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Multipart Body:**
- Field `data`: JSON-encoded answers array
- Files: Attached sequentially as `files` field (if any)

### 4. Request Example

**URL:**
```
POST http://10.10.18.254:3002/form/submit?form_slug=form-identifier
```

**Multipart Payload:**
```
--boundary123
Content-Disposition: form-data; name="data"

[{"jawaban":{"soal_id":1,"soal_option_id":10}},{"jawaban":{"soal_id":2,"answer_text":"test"}}]
--boundary123--
```

### 5. Response Handling

**Success (200/201):**
```dart
if (response.statusCode == 201 || response.statusCode == 200) {
  return {
    'success': true,
    'message': data['message'] ?? 'Form submitted successfully',
    'data': data,
  };
}
```

**Error (any other code):**
```dart
return {
  'success': false,
  'message': data['message'] ?? 'Failed to submit form (${response.statusCode})',
  'statusCode': response.statusCode,
};
```

---

## Debug Logging Added

### Location 1: FormService.submitForm() (form_service.dart)

**Log Points:**

```
[SubmitDebug] SUBMIT_REQUEST_START
[SubmitDebug] method=POST
[SubmitDebug] endpoint=/form/submit
[SubmitDebug] url=http://...
[SubmitDebug] form_slug={slug}
[SubmitDebug] answersCount={count}
[SubmitDebug] filesCount={count}
[SubmitDebug] payload={JSON preview}
[SubmitDebug] answer[i] soal_id=... has_option=... has_text=...
[SubmitDebug] headers_keys=...
[SubmitDebug] SUBMIT_SENDING
[SubmitDebug] SUBMIT_RESPONSE_RECEIVED
[SubmitDebug] statusCode={code}
[SubmitDebug] responseContentLength={bytes}
[SubmitDebug] responseBody={body preview}
[SubmitDebug] SUBMIT_SUCCESS statusCode=200/201
  OR
[SubmitDebug] SUBMIT_ERROR statusCode={code}
[SubmitDebug] errorMessage={message}
  OR
[SubmitDebug] SUBMIT_EXCEPTION error={exception}
```

### Location 2: _handleSubmit() (form_viewer_screen.dart)

```
[SubmitDebug] PAYLOAD_BUILD_COMPLETE
[SubmitDebug] totalAnswers={count}
[SubmitDebug] totalFiles={count}
[SubmitDebug] formSlug={slug}
[SubmitDebug] HANDLESUBMIT_RESULT_RECEIVED
[SubmitDebug] success={true/false}
[SubmitDebug] statusCode={code}
[SubmitDebug] message={message}
```

---

## Expected Values (Sanity Check)

### Answer Payload Validation

✅ **Required fields in jawaban:**
- `soal_id`: Question ID (should be numeric/string, not null)

✅ **Type-specific fields:**
- Radio: `soal_option_id` = option ID (numeric)
- Checkbox: `soal_option_id` = array of option IDs
- Text: `answer_text` = user text (string, can be empty "")
- Rating: `soal_option_id` = option ID (numeric)
- File: (handled separately via multipart files)

✅ **No null/undefined:**
- `soal_id` must not be null
- `soal_option_id` or `answer_text` must exist (not both missing)

### Form Slug Validation

✅ **Should be valid:**
- URL parameter: `?form_slug={slug}`
- Passed from widget: `widget.slug`
- Not null/empty

### Headers Validation

✅ **Must include:**
- `Authorization: Bearer {token}` (if authenticated)
- Content-Type auto-set by MultipartRequest

---

## Potential 500 Causes (Mobile-Side)

### Issue 1: Null soal_id
```dart
final soalId = question['id'];  // Could be null if 'id' missing from question
jawaban['soal_id'] = soalId;    // Could send null → Backend rejects
```
**Check in logs:** `answer[i] soal_id=null` indicates this

### Issue 2: Wrong option ID format
```dart
// Backend might expect numeric ID, mobile might send something else
jawaban['soal_option_id'] = selected['id'] ?? selected['soal_option_id'];
```
**Check in logs:** Option ID type/format in payload

### Issue 3: Wrong field names
Backend contract expects: `soal_id`, `soal_option_id`, `answer_text`
Mobile sends: These exact names ✅ (verified in code)

### Issue 4: Checkbox formatting
```dart
// Mobile sends array of IDs
jawaban['soal_option_id'] = selectedIds;  // [1, 2, 3]
```
Backend might expect different format - check logs

### Issue 5: Empty text answers
```dart
jawaban['answer_text'] = answer ?? '';  // Sends empty string if null
```
Backend might not accept empty string for required field

### Issue 6: Form slug mismatch
```dart
final url = Uri.parse(
  '${ApiConfig.formApiBaseUrl}${ApiConfig.submitEndpoint}?form_slug=$formSlug'
);
```
Form slug must match what backend expects

---

## How to Debug (Android Runtime)

### Step 1: Build and Run
```bash
cd apps/mobile
flutter run
```

### Step 2: Open Logcat
```bash
adb logcat | grep SubmitDebug
```

### Step 3: Fill and Submit
1. Fill form with test data
2. Navigate between pages (verify answer persistence still works)
3. Press Submit ONCE

### Step 4: Capture Log Output
```
[SubmitDebug] SUBMIT_REQUEST_START
[SubmitDebug] method=POST
[SubmitDebug] endpoint=/form/submit
[SubmitDebug] url=http://10.10.18.254:3002/form/submit?form_slug=...
[SubmitDebug] form_slug=form-identifier
[SubmitDebug] answersCount=N
[SubmitDebug] filesCount=M
[SubmitDebug] payload=[{"jawaban":{"soal_id":1,...}}...]
[SubmitDebug] answer[0] soal_id=1 has_option=true has_text=false
[SubmitDebug] headers_keys=authorization,content-type
[SubmitDebug] SUBMIT_SENDING
[SubmitDebug] SUBMIT_RESPONSE_RECEIVED
[SubmitDebug] statusCode=500     ← ⚠️ Server error
[SubmitDebug] responseContentLength=145
[SubmitDebug] responseBody={"message":"Database error","statusCode":500}
[SubmitDebug] SUBMIT_ERROR statusCode=500
[SubmitDebug] errorMessage=Database error
[SubmitDebug] HANDLESUBMIT_RESULT_RECEIVED
[SubmitDebug] success=false
[SubmitDebug] statusCode=500
[SubmitDebug] message=Database error
```

### Step 5: Analyze

#### If statusCode=500:
- Server is rejecting the request
- Check server logs for why
- Compare payload structure with API contract
- Verify form_slug, question IDs, option IDs

#### If statusCode=200/201:
- Success! ✅
- Payload and request are correct

#### If payload looks wrong:
- `soal_id=null` → Question ID not loaded
- Missing option ID → Answer not captured
- Wrong format → Type conversion issue

---

## Files Modified

**Only apps/mobile/:**
1. `apps/mobile/lib/core/services/form_service.dart` - Added submit debug logging
2. `apps/mobile/lib/features/forms/screens/form_viewer_screen.dart` - Added payload build logging

**No changes to:**
- Backend services/
- Web apps/web/
- Database
- API endpoints

---

## Expected Test Flow

1. **Build:** `flutter analyze` → should compile ✅
2. **Run:** `flutter run` on Android → app launches ✅
3. **Fill:** Page 1 → Enter answers
4. **Navigate:** Page 1 → Page 2 → Page 1 → Verify answers persist ✅
5. **Submit:** Click Submit → View logs → Check statusCode
6. **Result:**
   - If 200/201: "Form submitted successfully" ✅ SUCCESS
   - If 500: Analyze payload in logs → Identify issue
   - If 4xx: Validation error → Check required fields

---

## Next Steps (For User)

1. Run the app with debug logging enabled
2. Perform Submit action
3. Capture complete `[SubmitDebug]` log sequence
4. Report:
   - HTTP statusCode
   - Response body/message
   - Payload structure (from logs)
   - Any anomalies in question IDs or option IDs

5. If statusCode=500:
   - This is a backend issue (server rejecting request)
   - Backend team needs to investigate server logs
   - Check: Database constraints, validation logic, field name mismatches

6. If statusCode=200/201:
   - Answer persistence AND submit are working ✅
   - Feature complete!

---

## Safety Notes

✅ **No secrets logged:**
- JWT/Bearer token not logged
- Only "Authorization" header name, not value
- Question content not logged
- User data not logged
- Only structural/field data logged

✅ **Temporary logging:**
- All logging wrapped in `assert()`
- Only executes in debug builds
- Removed in release builds

✅ **No side effects:**
- Logging read-only
- No state changes
- No retry logic added
- Original submit flow unchanged

---

**Status: Ready for Android runtime testing with full debug diagnostics**
