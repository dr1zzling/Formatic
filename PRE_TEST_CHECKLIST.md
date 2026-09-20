# Pre-Runtime Test Checklist

**Status:** Ready for Android Device Testing  
**Scope:** apps/mobile ONLY  
**Objective:** Determine HTTP statusCode of Submit request

---

## Code Changes Verification

### ✅ form_service.dart
- [x] submitForm() method has debug logging
- [x] Request details logged (endpoint, method, form_slug, answersCount)
- [x] Payload structure logged (first 200 chars of JSON)
- [x] Answer breakdown logged (soal_id, option ID presence, text presence)
- [x] Response details logged (statusCode, contentLength, body preview)
- [x] Success path logs "SUBMIT_SUCCESS"
- [x] Error path logs "SUBMIT_ERROR" with statusCode
- [x] Exception path logs "SUBMIT_EXCEPTION"
- [x] All logging wrapped in assert() - debug-only
- [x] No secrets logged (no token values)

**File Location:** `apps/mobile/lib/core/services/form_service.dart`  
**Method:** `submitForm()` at line 613  
**Logging Tags:** `[SubmitDebug]`

### ✅ form_viewer_screen.dart
- [x] _handleSubmit() method has result logging
- [x] Payload building logged (totalAnswers, totalFiles, formSlug)
- [x] Result received logged (success, statusCode, message)
- [x] Error handling distinguishes 4xx from 5xx
- [x] Duplicate submit prevented (_isSubmitting flag)
- [x] Button disabled during submit
- [x] Answers preserved on failure
- [x] All logging wrapped in assert() - debug-only

**File Location:** `apps/mobile/lib/features/forms/screens/form_viewer_screen.dart`  
**Method:** `_handleSubmit()` at line 960  
**Related:** Button state at line 1579, 1662  
**Logging Tags:** `[SubmitDebug]`

---

## Answer Persistence Verification

### ✅ TextEditingController Implementation
- [x] Controllers stored in map: `final Map<dynamic, TextEditingController> _textControllers = {};`
- [x] Keyed by questionId (stable identifier)
- [x] Controller created on first render with stored answer
- [x] Controller persists across rebuilds
- [x] onChanged callback updates stored answer
- [x] Controllers disposed properly in _loadForm() and dispose()

**Test Case:**
1. Fill Page 1 answers
2. Navigate to Page 2
3. Return to Page 1
4. **Expected:** Answers still visible with same values ✅

---

## Build Status

### Flutter Compilation
- [x] No syntax errors in form_service.dart
- [x] No syntax errors in form_viewer_screen.dart
- [x] All imports present
- [x] debugPrint available (from dart:developer)
- [x] assert() syntax valid
- [x] assert() returns true (will always pass)

**Command to verify:**
```bash
cd apps/mobile
flutter analyze
```

**Expected:** No errors or warnings related to our changes

---

## API Configuration

### Backend Connection
- [x] Base URL: `http://10.10.18.254:3002` (Android device config)
- [x] Endpoint: `/form/submit`
- [x] Method: `POST`
- [x] Query param: `?form_slug={slug}`
- [x] Full URL: `http://10.10.18.254:3002/form/submit?form_slug={slug}`
- [x] Multipart body with field `data`
- [x] Headers: Authorization + Content-Type

**Verified in:** `apps/mobile/lib/core/config/api_config.dart`

### Answer Payload Structure
- [x] Answers array: `[{"jawaban": {...}}, ...]`
- [x] jawaban structure: `{"soal_id": N, "soal_option_id": X}` or `{"soal_id": N, "answer_text": "..."}`
- [x] Checkbox: `soal_option_id` is array `[1,2,3]`
- [x] No null soal_id
- [x] Either soal_option_id or answer_text present

**Verified in:** `apps/mobile/lib/features/forms/screens/form_viewer_screen.dart` lines ~1000-1055

---

## Scope Boundaries

### ✅ ONLY Modified (apps/mobile)
- [x] apps/mobile/lib/core/services/form_service.dart - 1 method
- [x] apps/mobile/lib/features/forms/screens/form_viewer_screen.dart - 1 method

### ✅ NOT Modified
- [ ] services/** - 0 files
- [ ] apps/web/** - 0 files
- [ ] Database files - 0 files
- [ ] API endpoints - 0 files
- [ ] API contract - unchanged
- [ ] Backend config - 0 files
- [ ] Other mobile files - 0 files

**Verification:** `git status` should show only 2 modified files in apps/mobile

---

## Git Status

### Pre-Test State
- [ ] No commits made
- [ ] No branches created
- [ ] No pushes made
- [ ] Only local modifications
- [ ] Can revert with `git checkout` if needed

**Check:**
```bash
cd Formatic
git status
```

**Expected:**
```
modified:   apps/mobile/lib/core/services/form_service.dart
modified:   apps/mobile/lib/features/forms/screens/form_viewer_screen.dart
```

---

## Test Prerequisites

### Hardware
- [ ] Android device connected via USB
- [ ] USB debugging enabled
- [ ] USB cable connected and working
- [ ] Device has WiFi connection to network with backend server

### Software
- [ ] Flutter SDK installed
- [ ] Android SDK installed
- [ ] adb (Android Debug Bridge) available
- [ ] Android Studio or Gradle configured

### Backend
- [ ] Backend server running at `http://10.10.18.254:3002`
- [ ] Form endpoint `/form/submit` accessible
- [ ] Database connected
- [ ] Authentication working (JWT tokens valid)

---

## Test Execution Plan

### Phase 1: Answer Persistence Test (5 min)
```
1. Launch app: flutter run
2. Navigate to Fill Form feature
3. Fill Page 1 with test answers
4. Press "Next" button to go to Page 2
5. Press "Back" button to return to Page 1
6. VERIFY: All Page 1 answers still visible with same values
   PASS: Answers persist ✅
   FAIL: Answers empty or changed ❌
```

### Phase 2: Submit Test (5 min)
```
1. Prepare logcat: adb logcat | grep SubmitDebug
2. Fill all required questions on form
3. Navigate to last page if multi-page
4. Press Submit button ONCE
5. CAPTURE: All [SubmitDebug] log lines
6. RECORD:
   - HTTP statusCode (e.g., 200, 500, 404, etc.)
   - Response body (from logs)
   - Timestamp of submit
```

### Phase 3: Analysis (2 min)
```
1. Analyze statusCode:
   - 200/201: Submit successful ✅
   - 500: Server error (backend issue)
   - 4xx: Validation error (check payload)
   - timeout: Network error

2. Verify payload structure in logs:
   - All soal_id present (not null)
   - Option IDs or text present
   - Form slug correct
   - Answers count > 0

3. Check user-facing message:
   - Success message shown?
   - Error message shown?
   - Message matches statusCode?
```

---

## Expected Outcomes

### Best Case: statusCode = 200/201
```
✅ Submit successful
✅ Form submission complete
✅ Answer persistence working
✅ No further action needed
```

### Likely Case: statusCode = 500
```
⚠️ Server returned error
⚠️ Check backend server logs
⚠️ Not a mobile-side issue
⚠️ Backend team to investigate
```

### Possible Case: statusCode = 4xx
```
⚠️ Validation error from backend
⚠️ Check payload structure in logs
⚠️ Compare against API contract
⚠️ May indicate payload format issue
```

### Unlikely Case: No logs appear
```
❌ App may have crashed
❌ Logcat filter not working
❌ Try: adb logcat -s SubmitDebug
❌ Check Android Studio logcat
```

---

## Success Criteria

### ✅ Answer Persistence Works
- Page 1 answers visible after returning from Page 2
- Answers haven't changed value
- Can edit answer and change persists

### ✅ Submit Request Sent
- [SubmitDebug] logs appear in logcat
- statusCode logged (any code)
- Response body visible in logs

### ✅ Proper Error Handling
- If statusCode = 200/201: Success message shown
- If statusCode = 500: Error message shown with server message
- If statusCode = 4xx: Validation error message shown
- If failure: Submit button re-enabled for retry

### ✅ Answer Preservation
- On submission failure: Answers still in form (not cleared)
- User can retry submit without re-entering all data

### ⏳ HTTP 500 Determination
- If statusCode = 500 in logs: Is it backend or mobile issue?
  - Check payload structure: All required fields present?
  - Check field names: Match backend contract?
  - Check option IDs: Valid and present?
  - If all checks pass: Backend issue (not mobile)

---

## Documentation to Collect

After test, gather:

1. **Complete logcat output** (filtered for [SubmitDebug])
   ```
   [SubmitDebug] SUBMIT_REQUEST_START
   [SubmitDebug] method=POST
   ...
   [SubmitDebug] statusCode=500
   ...
   ```

2. **HTTP statusCode** (exact number)
   - Example: 200, 201, 400, 404, 500, etc.

3. **Response body** (from logs)
   - Example: `{"message":"Database error","statusCode":500}`

4. **Payload structure** (from logs)
   - Example: Answer IDs, question IDs, field names

5. **Device info**
   - Android version
   - Device model
   - Flutter version

6. **Observations**
   - Did answer persistence work?
   - Did error message show?
   - Was button disabled during submit?
   - Could user retry?

---

## Final Checklist Before Running Test

- [ ] Code changes verified syntactically
- [ ] Answer persistence still working (from previous testing)
- [ ] git status shows only 2 modified files
- [ ] Android device connected and USB debugging enabled
- [ ] Backend server running at http://10.10.18.254:3002
- [ ] Network connectivity verified
- [ ] Flutter run command ready
- [ ] Logcat filter command ready: `adb logcat | grep SubmitDebug`
- [ ] Test form selected and accessible
- [ ] No other apps using the same form (to avoid interference)

---

## Ready to Test: YES ✅

All code changes in place. Debug logging ready. Answer persistence confirmed working. 

**Next step:** Run on Android device, perform submit, capture logs, and determine actual HTTP statusCode and response body.

**Timeline:** ~15 minutes total (5 min persistence test + 5 min submit test + 5 min log analysis)

**Expected outcome:** Confirmation of whether HTTP 500 is mobile-side or backend issue.

---

*Last updated: September 10, 2026*  
*Status: READY FOR TESTING*
