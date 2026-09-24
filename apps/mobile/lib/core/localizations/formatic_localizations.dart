import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

/// Localized user-facing strings for the Formatic app, loaded by the same
/// [Localizations] mechanism used by the framework's own Material/Cupertino
/// localizations ([MaterialLocalizations], [WidgetsLocalizations]).
///
/// Widgets look up strings with:
///
/// ```dart
/// FormaticLocalizations.of(context).signIn
/// ```
///
/// [LocaleService] switches the app locale; the [Localizations] widget rebuilds
/// every dependent widget automatically, so the UI updates instantly.
abstract class FormaticLocalizations {
  FormaticLocalizations();

  /// The [FormaticLocalizations] from the closest [Localizations] instance
  /// that encloses the given context.
  static FormaticLocalizations of(BuildContext context) {
    return Localizations.of<FormaticLocalizations>(context, FormaticLocalizations)!;
  }

  // ── Common / Global ─────────────────────────────────────────────────────
  String get retry;
  String get cancel;
  String get save;
  String get delete;
  String get add;
  String get edit;
  String get search;
  String get loading;
  String get back;
  String get next;
  String get missingData;
  String get unknown;

  // ── Auth: Login / Register ──────────────────────────────────────────────
  String get tagline;
  String get welcomeBack;
  String get enterYourDetails;
  String get username;
  String get usernameHint;
  String get usernameRequired;
  String get loginIdentifier;
  String get loginIdentifierHint;
  String get password;
  String get passwordRequired;
  String get email;
  String get emailHint;
  String get emailRequired;
  String get emailInvalid;
  String get forgotPassword;
  String get signIn;
  String get noAccountYet;
  String get haveAccount;
  String get signUp;
  String get createAccount;
  String get account;
  String get enterYourPassword;
  String get confirmPassword;
  String get confirmPasswordRequired;
  String get passwordsDoNotMatch;
  String get signUpFailed;
  String get pwMin8;
  String get pwUpper;
  String get pwLower;
  String get pwNumber;

  // ── Auth: Forgot password ───────────────────────────────────────────────
  String get resetPasswordTitle;
  String get resetPasswordSubtitle;
  String get newPassword;
  String get newPassword1;
  String get confirmNewPassword;
  String get confirmNewPasswordRequired;
  String get resetPasswordButton;
  String get rememberPassword;
  String get backToLogin;
  String get resetSuccess;
  String get resetFailed;
  String get resetSuccessSubtitle;
  String get goToLogin;

  // ── Auth: OTP ────────────────────────────────────────────────────────────
  String get otpTitle;
  String otpBody(String email);
  String get otpCodeLabel;
  String get otpVerify;
  String get otpVerifying;
  String get otpVerifyFailed;
  String get otpInvalidCode;
  String get otpResendHint;
  String get otpResend;
  String otpResendCooldown(int seconds);
  String get otpResent;
  String get otpResendFailed;
  String get otpWrongEmail;

  // ── Bottom navigation / Home ────────────────────────────────────────────
  String get tabHome;
  String get tabMyForms;
  String get tabDiscovery;
  String get tabProfile;
  String homeGreetingPrefix(String username);
  String get searchTemplates;
  String get trendingForms;
  String get viewAll;
  String noFormsForCategory(String category);
  String get categoryFallback;
  String get fillForm;
  String get homeEmptyTitle;
  String get homeEmptySubtitle;
  String get createFormButton;
  String get createFormTooltip;
  String get untitled;
  String get untitledForm;
  String formMeta(int questions, Object responses);
  String get formCreated;

  // ── Categories ──────────────────────────────────────────────────────────
  String get catAll;
  String get catUjian;
  String get catSurvei;
  String get catPengumpulanData;

  // ── Cards / meta ─────────────────────────────────────────────────────────
  String responsesLabel(int count);

  // ── Create form / description ───────────────────────────────────────────
  String get formDescriptionLabel;
  String get formDescriptionHint;
  String get formDescriptionSection;
  String get formDescriptionSubtitle;
  String get formDescriptionInputHint;
  String get subCategoryLoadFailed;
  String get themeColorOptional;
  String get pts;

  // ── Form editor ──────────────────────────────────────────────────────────
  String get statusSaveFailed;
  String get descriptionSaveFailed;
  String get settingsSaveFailed;
  String get bannerUploadButton;
  String get bannerFormTitle;
  String get bannerFormSubtitle;

  // ── QR scanner ───────────────────────────────────────────────────────────
  String get scanSlugHint;

  // ── Import Word ──────────────────────────────────────────────────────────
  String get importPickDialogTitle;
  String importPickErrorMessage(String detail);
  String importReadErrorMessage(String detail);
  String get importInvalidFile;
  String get importPickFirst;
  String get importFailedMessage;
  String get importTemplateHint;
  String importSuccessBody(int count, String filename, String formTitle);
  String get importSubtitle;
  String get importTapToChoose;
  String importFileReady(String size);
  String get importOnlyDocx;
  String get importSeeTemplate;
  String get importButton;
  String get importChooseFirst;
  String get importTemplateContentNote;
  String get importTemplateInstructions;

  // ── Profile ─────────────────────────────────────────────────────────────
  String get profile;
  String get formCreatorRole;
  String get changePassword;
  String get updateYourPassword;
  String get about;
  String get aboutSubtitle;
  String get aboutDescription;
  String get aboutTitle;
  String get languageMenu;
  String get languageSubtitle;
  String get bahasaIndonesia;
  String get english;
  String get languageChanged;

  // Change Password dialog
  String get cpTitle;
  String cpAccount(String username);
  String get cpCurrentLabel;
  String get cpCurrentHint;
  String get cpNewLabel;
  String get cpNewHint;
  String get cpConfirmLabel;
  String get cpConfirmHint;
  String get cpSubmit;
  String get cpFillAll;
  String get cpMismatch;
  String get cpSuccess;
  String get cpFailed;
  String get showPassword;
  String get hidePassword;

  // Logout dialog
  String get logout;
  String get logoutConfirm;
  String get logoutConfirmBody;

  // ── My Forms ────────────────────────────────────────────────────────────
  String get myForms;
  String get join;
  String get searchForms;
  String get tabShared;
  String get joinDialogTitle;
  String get joinDialogBody;
  String get joinLinkHint;
  String get joinButton;
  String get joinInvalid;
  String get deleteFormTitle;
  String deleteFormBody(String title);
  String get movedToTrash;
  String get noFormsTitle;
  String get noFormsBody;

  // ── Discovery ───────────────────────────────────────────────────────────
  String get discovery;
  String get searchPublicForms;
  String get noFormsFoundTitle;
  String get noFormsFoundBody;
  String get viewQuestions;
  String get copiedToClipboard;
  String get copyFailed;
  String get noOwnForms;
  String get copyToMyForms;
  String copyDialogTitle(int count);
  String copyDialogBody(int count);
  String get copying;
  String copyQuestionsButton(int count);
  String get noQuestions;

  // ── Create Form ─────────────────────────────────────────────────────────
  String get createFormTitle;
  String get createFormSubtitle;
  String get formTitleLabel;
  String get formTitleHint;
  String get formTitleRequired;
  String get category;
  String get categoryLoadFailed;
  String get durationLabel;
  String get durationHint;
  String get durationUnit;
  String get durationEmptyHint;
  String get durationInvalid;
  String get durationMin;
  String get durationMax;
  String get tokenResponLabel;
  String get tokenResponHint;
  String get tokenResponEmptyHint;
  String get themeColorLabel;
  String get bannerLabel;
  String get bannerOptionalLabel;
  String get bannerTapHint;
  String get bannerFormats;
  String get createFailed;
  String get createSuccessThemeNote;
  String get bannerRequired;
  String get bannerReadFailed;
  String get colorBiru;
  String get colorMerah;
  String get colorHijau;
  String get colorUngu;
  String get colorKuning;
  String get colorPink;
  String get colorCyan;
  String get colorIndigo;
  String get colorAbu;
  String get colorTeal;
  String themeColorName(String color);

  // ── Monitoring ──────────────────────────────────────────────────────────
  String get monitoring;
  String get refresh;
  String get tryAgain;
  String get noParticipantsTitle;
  String get noParticipantsBody;
  String get total;
  String get progress;
  String get completed;
  String get statusCompleted;
  String get statusInProgress;
  String get statusReset;
  String get resetParticipantTitle;
  String resetParticipantBody(String username);
  String get loadFailed;
  String get resetParticipantTooltip;
  String startedAt(String time);
  String completedAt(String time);
  String pageOf(int current, int total);
  String pageOnly(int current);

  // ── Form detail / shared widgets ────────────────────────────────────────
  String get missingSlug;
  String get singleChoice;
  String get multipleChoice;
  String get textAnswer;
  String get fileUpload;
  String get rating;
  String get showQrCode;
  String get submissions;
  String get active;
  String get inactive;
  String get status;
  String questionsCount(int count);
  String get noQuestionsYet;
  String get noQuestionsBody;
  String get addQuestion;
  String get questionType;
  String get questionPage;
  String get questionPageHelper;
  String get questionLabel;
  String get mathKeyboard;
  String get closeMath;
  String get questionRequiredError;
  String get optionalScore;
  String get optionalImage;
  String get addImage;
  String get optionalAudio;
  String get addAudio;
  String get ratingScale;
  String get ratingPreview;
  String get answerOptions;
  String get correctAnswerHint;
  String optionPlaceholder(int index);
  String correctOptionMessage(int index);
  String get updateQuestion;
  String get saveQuestion;
  String get replaceFile;
  String get audioPreviewAfterSave;
  String get deleteQuestion;
  String deleteQuestionBody(String question);
  String get questionDeleted;
  String get questionDeleteFailed;
  String get correct;
  String get required;

  // ── Form Editor ─────────────────────────────────────────────────────────
  String get statusPublic;
  String get statusDraft;
  String get formPublic;
  String get formPrivate;
  String get tabQuestions;
  String get tabResponses;
  String get tabSettings;
  String get saveChanges;
  String get saved;
  String get saveFailed;
  String statusChanged(String status);
  String get deleteFormTitle2;
  String get deleteFormBody2;
  String get deleted;
  String get deletedFailed;
  String get emptyQuestionsBoard;
  String get slugCopied;
  String page(String page);
  String get addPage;
  String pageEmpty(String page);
  String pageWithCount(String pageLabel, Object count);
  String get score;
  String get importWord;
  String scoreQuestion(String index);
  String get editScoreTitle;
  String questionsCountShort(int count);
  String get autoScore;
  String get manualScore;
  String get saveScore;
  String get distributeNote;
  String get targetTotalScore;
  String get targetScoreHint;
  String get distributionPreview;
  String andMore(int count);
  String get totalScorePreview;
  String get currentScoreTotal;
  String get invalidTotalScore;
  String get invalidScoreValues;
  String scoreSaveFailed(int index);
  String get autoScoreSaved;
  String get manualScoreSaved;
  String get genericError;
  String get questionNoText;
  String get responsesTab;
  String get answersTab;
  String get exportExcel;
  String get totalSubmit;
  String get soalLabel;
  String textAnswers(int count);
  String get noAnswers;
  String get noAnswer;
  String get noResponsesTitle;
  String get noResponsesBody;
  String get excelDownloaded;
  String get saveExcel;
  String get excelSaved;
  String get excelFailed;
  String get tokenUjian;
  String get tokenAccess;
  String get tokenAccessHint;
  String get tokenExample;
  String get tokenCopied;
  String get ubah;
  String get requireToken;
  String get requireTokenBody;
  String get tokenEmptyNote;
  String get minutesInvalid;
  String get durationRemoved;
  String durationSaved(int minutes);
  String get durationSaveFailed;
  String get tokenRemoved;
  String get tokenSaved;
  String get tokenSaveFailed;
  String get settingsSaved;
  String get timeSettings;
  String get workDuration;
  String get durationHelper;
  String get minutesUnit;
  String get m30;
  String get m45;
  String get m60;
  String get m90;
  String get m120;
  String get noLimit;
  String get questionOrder;
  String get shuffleQuestions;
  String get shuffleBody;
  String get fixedOrderBody;
  String get themeColorTitle;
  String get themeColorHint;
  String get visibility;
  String get formStatus;
  String get publicHint;
  String get privateHint;
  String get linkCopied;
  String get shareForm;
  String get shareFormHint;
  String get monitoringSection;
  String get monitoringBody;
  String get participantStatusSection;
  String get participantStatusBody;
  String get deleteFormSection;
  String get deleteFormSectionBody;
  String get imageTooLarge;
  String get bannerUpdated;
  String get bannerUploadFailed;
  String get bannerRemoved;
  String get bannerRemoveFailed;
  String get themeSaveFailed;
  String get themeRemoved;
  String get themeSaved;
  String themeActive(String color);

  // ── Form Viewer / Fill Form ─────────────────────────────────────────────
  String get fillLoading;
  String get fillFinished;
  String get fillFormTitle;
  String get thankYou;
  String get thankYouBody;
  String get backToForm;
  String minutesCount(int count);
  String get noTimeLimit;
  String get jumlahSoal;
  String questionsLabel(int count);
  String get duration;
  String get tokenNeeded;
  String get startForm;
  String get tokenEmptySubmit;
  String tokenServerError(String detail);
  String get tokenNoConnection;
  String get tokenInvalid;
  String questionNotAnswered(String question);
  String doubtfulWarning(int count);
  String get timeWarningTitle;
  String get timeWarningBody;
  String get continueButton;
  String get timeUpBody;
  String get submitMismatch;
  String get checkAnswers;
  String get submitServerError;
  String get submitFailedTimeUp;
  String get submitFailedGeneric;
  String get submitSuccess;
  String get alreadySubmitted;
  String get submitDeviceError;
  String get tokenDialogTitle;
  String get tokenDialogEmpty;
  String get tokenDialogServerError;
  String get tokenDialogNoConnection;
  String get tokenDialogInvalid;
  String answeredOf(int answered, int total);
  String pageOfTotal(int current, int total);
  String get submitting;
  String get submitButton;
  String get nextButton;
  String doubtfulCount(int count);
  String get submitForm;
  String get noQuestionsTitle;
  String get noQuestionsBody2;
  String questionPrefix(int number);
  String get doubt;
  String get answerPlaceholder;
  String get tapToUpload;
  String get fileSelected;
  String get imageUnavailable;
  String get fileSelectError;

  // ── QR / share ──────────────────────────────────────────────────────────
  String get qrCodeTitle;
  String get qrScanToFill;
  String get qrCopied;
  String get qrShareBody;
  String get qrRetry;
  String get qrShareIntro;
  String get qrHowToUse;
  String get qrHowToUse1;
  String get qrHowToUse2;
  String get qrHowToUse3;
  String get qrDownloadSoon;
  String get qrShareSoon;
  String get qrPreviewForm;
  String get qrShareCode;
  String get qrDownloadCode;
  String get qrInvalid;
  String get qrGenerateFailed;

  // ── Collaborate ─────────────────────────────────────────────────────────
  String get collaborateJoinFailed;
  String get collaborateTitle;
  String get collaborateJoinAs;
  String collaborateFormLabel(String slug);
  String get collaborateBody;
  String get collaborateJoining;
  String get collaborateJoin;
  String get collaborateSuccess;
  String get collaborateSuccessBody;
  String get collaborateOpenForm;
  String get collaborateBack;

  String get loginFailed;
  String get restore;
  String get permanentlyDelete;
  String get formRestored;
  String get permanentDeleteSuccess;
  String get trashSearchHint;
  String get trashEmptyTitle;
  String get trashEmptyBody;
  String get clearHistory;
  String get clearHistoryBody;
  String get historySearchHint;
  String get historyEmptyTitle;
  String get historyEmptyBody;
  String get close;
  String get importSuccess;
  String get importTemplateFormat;
  String get importTemplateDocx;
  String get invalidImageFormat;
  String get unsupportedAudioFormat;
  String get audioPickFailed;
  String get fillAllOptions;
  String buildMatrix(int rows, int columns);
  String get insert;
  String get numerator;
  String get denominator;
  String get scanFormCode;
  String get scanFormInstruction;
  String get enterCode;
  String get scanQrInstruction;
  String get scanQrStart;
  String get previewForm;
  String get genericUser;
  String get questionHistoryEmptyTitle;
  String get questionHistoryEmptyBody;
  String get completedLabel;
  String attemptLabel(int count);
  String get singleChoiceLabel;
  String get multipleChoiceLabel;
  String get textAnswerLabel;
  String get fileUploadLabel;
  String get ratingLabel;
  String get errorLoadingQuestions;
  String get errorLoadingForms;
  String get trashTitle;
  String get trashRetentionInfo;
  String get expired;
  String daysRemaining(int count);
  String get deletedToday;
  String deletedDaysAgo(int count);
  String get historyTitle;
  String relativeMinutes(int count);
  String relativeHours(int count);
  String relativeDays(int count);
  String relativeMonths(int count);
}

/// Bahasa Indonesia (default) resource strings.
class FormaticLocalizationsId extends FormaticLocalizations {
  @override
  String get retry => 'Coba Lagi';
  @override
  String get cancel => 'Batal';
  @override
  String get save => 'Simpan';
  @override
  String get delete => 'Hapus';
  @override
  String get add => 'Tambah';
  @override
  String get edit => 'Ganti';
  @override
  String get search => 'Buscar';
  @override
  String get loading => 'Memuat...';
  @override
  String get back => 'Kembali';
  @override
  String get next => 'Lanjut';
  @override
  String get missingData => 'Data tidak tersedia';
  @override
  String get unknown => 'Tidak diketahui';

  @override
  String get tagline => 'Buat form, kolektora respons,\ne basta insight dengan mudah';
  @override
  String get welcomeBack => 'Selamat';
  @override
  String get enterYourDetails => 'Silakan masukkan detail akun Anda';
  @override
  String get username => 'Nama Pengguna';
  @override
  String get usernameHint => 'Nama Anda';
  @override
  String get usernameRequired => 'Silakan masukkan nama pengguna';
  @override
  String get loginIdentifier => 'Nama Pengguna / Email';
  @override
  String get loginIdentifierHint => 'Nama atau email';
  @override
  String get password => 'Kata Sandi';
  @override
  String get passwordRequired => 'Silakan masukkan kata sandi';
  @override
  String get email => 'Email';
  @override
  String get emailHint => 'your@email.com';
  @override
  String get emailRequired => 'Silakan masukkan email';
  @override
  String get emailInvalid => 'Silakan masukkan email yang valid';
  @override
  String get forgotPassword => 'Lupa kata sandi?';
  @override
  String get signIn => 'Masuk';
  @override
  String get noAccountYet => "Belum memiliki akun? ";
  @override
  String get haveAccount => 'Al sudah memiliki akun? ';
  @override
  String get signUp => 'Registrasi';
  @override
  String get createAccount => 'Buata ';
  @override
  String get account => 'Akun';
  @override
  String get enterYourPassword => 'Silakan masukkan kata sandi';
  @override
  String get confirmPassword => 'Konfirmasi Kata Sandi';
  @override
  String get confirmPasswordRequired => 'Silakan konfirmasi kata sandi';
  @override
  String get passwordsDoNotMatch => 'Kata sandi tidak cocok';
  @override
  String get signUpFailed => 'Registrasi gagal';
  @override
  String get pwMin8 => 'Password minimal 8 karakter';
  @override
  String get pwUpper => 'Password harus mengandung 1 huruf kapital';
  @override
  String get pwLower => 'Password harus mengandung 1 huruf kecil';
  @override
  String get pwNumber => 'Password harus mengandung 1 angka';

  @override
  String get resetPasswordTitle => 'Reset Kata Sandi';
  @override
  String get resetPasswordSubtitle => 'Masukkan nama pengguna dan kata sandi baru';
  @override
  String get newPassword => 'Kata Sandi Baru';
  @override
  String get newPassword1 => 'Masukkan kata sandi baru';
  @override
  String get confirmNewPassword => 'Konfirmasi Kata Sandi Baru';
  @override
  String get confirmNewPasswordRequired => 'Konfirmasi kata sandi bar';
  @override
  String get resetPasswordButton => 'Reset Kata Sandi';
  @override
  String get rememberPassword => 'Ingat kata sandi? ';
  @override
  String get backToLogin => 'Back ke Login';
  @override
  @override
  String get resetSuccess => 'Kata sandi berhasil diubah!';
  @override
  String get resetFailed => 'Gagal mengubah kata sandi.';
  @override
  String get resetSuccessSubtitle => 'Silakan masuk dengan kata sandi baru Anda.';
  @override
  String get goToLogin => 'Ke Halaman Login';
  @override

  @override
  String get otpTitle => 'Cek email kamu';
  @override
  String otpBody(String email) => 'Kami mengirim kode verifikasi 6 digit ke $email';
  @override
  String get otpCodeLabel => 'KODE OTP';
  @override
  String get otpVerify => 'Verifikasi';
  @override
  String get otpVerifying => 'Memverifikasi...';
  @override
  String get otpVerifyFailed => 'Kode OTP salah atau sudah kadaluarsa. Periksa kode dan coba lagi.';
  @override
  String get otpInvalidCode => 'Kode OTP harus terdiri dari 6 angka';
  @override
  String get otpResendHint => 'Masih belum sampai? ';
  @override
  String get otpResend => 'Kirim ulang kode';
  @override
  String otpResendCooldown(int seconds) => 'Kirim ulang ($seconds s)';
  @override
  String get otpResent => 'Kode baru terkirim ke email kamu.';
  @override
  String get otpResendFailed => 'Gagal mengirim ulang kode.';
  @override
  String get otpWrongEmail => 'salah email?';

  @override
  String get tabHome => 'Home';
  @override
  String get tabMyForms => 'My Forms';
  @override
  String get tabDiscovery => 'Discovery';
  @override
  String get tabProfile => 'Profile';
  @override
  String homeGreetingPrefix(String username) => 'Hi, $username';
  @override
  String get searchTemplates => 'Buscar templates...';
  @override
  String get trendingForms => 'Form Trending';
  @override
  String get viewAll => 'Lihat Semua';
  @override
  String noFormsForCategory(String category) => 'Tidak ada form "$category"';
  @override
  String get categoryFallback => 'Form';
  @override
  String get fillForm => 'Isi Form';
  @override
  String get homeEmptyTitle => 'Belum Ada Form';
  @override
  String get homeEmptySubtitle => 'Buat form pertama kamu dengan\nmenekan tombol + di bawah.';
  @override
  String get createFormButton => 'Buat Form';
  @override
  String get createFormTooltip => 'Buat Form';
  @override
  String get untitled => 'Untitled';
  @override
  String get untitledForm => 'Untitled Form';
  @override
  String formMeta(int questions, Object responses) =>
      '$questions Pertanyaan  ·  $responses Jawaban';
  @override
  String get formCreated => 'Form berhasil dibuat';

  @override
  String get catAll => 'Semua';
  @override
  String get catUjian => 'Ujian';
  @override
  String get catSurvei => 'Survei';
  @override
  String get catPengumpulanData => 'Pengumpulan Data';

  @override
  String responsesLabel(int count) => '$count Jawaban';
  @override
  String get formDescriptionLabel => 'Deskripsi (Opsional)';
  @override
  String get formDescriptionHint => 'Tambahkan deskripsi form';
  @override
  String get formDescriptionSection => 'DESKRIPSI FORM';
  @override
  String get formDescriptionSubtitle => 'Tambahkan penjelasan yang akan dilihat peserta.';
  @override
  String get formDescriptionInputHint => 'Masukkan deskripsi form';
  @override
  String get subCategoryLoadFailed => 'Gagal memuat sub-kategori';
  @override
  String get themeColorOptional => 'WARNA TEMA (OPSIONAL)';
  @override
  String get pts => 'pts';
  @override
  String get statusSaveFailed => 'Gagal menyimpan status form.';
  @override
  String get descriptionSaveFailed => 'Gagal menyimpan deskripsi.';
  @override
  String get settingsSaveFailed => 'Gagal menyimpan pengaturan.';
  @override
  String get bannerUploadButton => 'Upload';
  @override
  String get bannerFormTitle => 'Banner Form';
  @override
  String get bannerFormSubtitle => 'Upload gambar banner untuk form (opsional).';
  @override
  String get scanSlugHint => 'Contoh: survey-kepuasan-1234567890';
  @override
  String get importPickDialogTitle => 'Pilih file .docx';
  @override
  String importPickErrorMessage(String detail) => 'Gagal membuka file picker: $detail';
  @override
  String importReadErrorMessage(String detail) => 'Gagal membaca file: $detail';
  @override
  String get importInvalidFile => 'File yang dipilih bukan file .docx yang valid. Silakan pilih ulang.';
  @override
  String get importPickFirst => 'Pilih file .docx terlebih dahulu.';
  @override
  String get importFailedMessage => 'Gagal mengimpor soal.';
  @override
  String get importTemplateHint => 'Pastikan format mengikuti template_import.docx yang tersedia di repositori.';
  @override
  String importSuccessBody(int count, String filename, String formTitle) =>
      'Berhasil mengimpor $count soal dari file $filename ke form "$formTitle".';
  @override
  String get importSubtitle => 'Impor soal dari file .docx ke form ini';
  @override
  String get importTapToChoose => 'Tap untuk memilih file .docx';
  @override
  String importFileReady(String size) => '$size · siap diimpor (ketuk untuk ganti)';
  @override
  String get importOnlyDocx => 'Hanya menerima file .docx';
  @override
  String get importSeeTemplate => 'Lihat format template';
  @override
  String get importButton => 'Import Soal';
  @override
  String get importChooseFirst => 'Pilih file terlebih dahulu';
  @override
  String get importTemplateContentNote =>
      'Ini adalah isi file template resmi (template_import.docx). Buat file .docx Anda '
      'mengikuti pola yang sama: setiap soal diawali nomor, pilihan jawaban dilengkapi '
      'Kunci dan Tipe.';
  @override
  String get importTemplateInstructions =>
      'File template (template_import.docx) tersedia di folder apps/mobile.\n\n'
      'Format soal di dalam file .docx harus mengikuti urutan berikut (satu soal per blok):\n\n'
      '1. Pertanyaan soal...\n'
      'A. Pilihan pertama\n'
      'B. Pilihan kedua\n'
      'C. Pilihan ketiga\n'
      'Kunci: A\n'
      'Tipe: radio\n\n'
      'Keterangan:\n'
      '• Nomor soal diawali angka, contoh "1." atau "1)"\n'
      '• Pilihan jawaban diawali huruf A/B/C, contoh "A." atau "A)"\n'
      '• "Kunci:" atau "Jawaban:" diisi huruf pilihan benar (A/B/C). Lebih dari satu huruf '
      '(misal "A,C") otomatis menjadi tipe checkbox.\n'
      '• "Tipe:" (opsional) berisi radio, checkbox, text, atau file. Tanpa baris tipe, '
      'soal otomatis radio/checkbox bila ada pilihan, atau text bila tanpa pilihan.\n\n'
      'Catatan: tipe "rating" tidak didukung oleh database backend saat ini.';

  @override
  String get profile => 'Profile';
  @override
  String get formCreatorRole => 'Form Creator';
  @override
  String get changePassword => 'Change Password';
  @override
  String get updateYourPassword => 'Perbarui password Anda';
  @override
  String get about => 'About';
  @override
  String get aboutSubtitle => 'Dudung versi app dan informasi';
  @override
  String get aboutDescription => 'Sebuwa form builder aplikasi modern hijeen';
  @override
  String get aboutTitle => 'Formatic';
  @override
  String get languageMenu => 'Bahasa / Language';
  @override
  String get languageSubtitle => 'Dudung bahasa preferido';
  @override
  String get bahasaIndonesia => 'Bahasa Indonesia';
  @override
  String get english => 'English';
  @override
  String get languageChanged => 'Bahasa diubah!';

  @override
  String get cpTitle => 'Change Password';
  @override
  String cpAccount(String username) => 'Akun: $username';
  @override
  String get cpCurrentLabel => 'Password Saat Ini';
  @override
  String get cpCurrentHint => 'Masukkan password saat ini';
  @override
  String get cpNewLabel => 'Password Baru';
  @override
  String get cpNewHint => 'Masukkan password baru';
  @override
  String get cpConfirmLabel => 'Konfirmasi Password Baru';
  @override
  String get cpConfirmHint => 'Ulangi password baru';
  @override
  String get cpSubmit => 'Simpan';
  @override
  String get cpFillAll => 'Isi semua field terlebih dahulu';
  @override
  String get cpMismatch => 'Konfirmasi password tidak cocok';
  @override
  String get cpSuccess => 'Password berhasil diubah';
  @override
  String get cpFailed => 'Gagal mengubah password';
  @override
  String get showPassword => 'Tampilkan password';
  @override
  String get hidePassword => 'Sembunyikan password';

  @override
  String get logout => 'Logout';
  @override
  String get logoutConfirm => 'Are you sure you want to logout?';
  @override
  String get logoutConfirmBody => 'Are you sure you want to logout?';

  @override
  String get myForms => 'My Forms';
  @override
  String get join => 'Join';
  @override
  String get searchForms => 'Cari form...';
  @override
  String get tabShared => 'Dibagikan';
  @override
  String get joinDialogTitle => 'Join Kolaborasi';
  @override
  String get joinDialogBody => 'Tempelkan link undangan yang diberikan pemilik form:';
  @override
  String get joinLinkHint => '.../form/{slug}/collaborate?token=...';
  @override
  String get joinButton => 'Bergabung';
  @override
  String get joinInvalid => 'Link tidak valid. Pastikan link undangan lengkap.';
  @override
  String get deleteFormTitle => 'Hapus Form';
  @override
  String deleteFormBody(String title) =>
      'Form "$title" akan dipindahkan ke Trash. Kamu bisa memulihkannya dalam 30 hari.';
  @override
  String get movedToTrash => 'Form dipindahkan ke Trash.';
  @override
  String get noFormsTitle => 'No Forms Yet';
  @override
  String get noFormsBody => 'Create your first form to get started';

  @override
  String get discovery => 'Discovery';
  @override
  String get searchPublicForms => 'Cari form publik...';
  @override
  String get noFormsFoundTitle => 'Tidak ada form';
  @override
  String get noFormsFoundBody => 'Belum ada form publik yang tersedia.';
  @override
  String get viewQuestions => 'Lihat soal';
  @override
  String get copiedToClipboard => 'Soal berhasil disalin ke form Anda.';
  @override
  String get copyFailed => 'Gagal menyalin soal.';
  @override
  String get noOwnForms => 'Tidak ada form milik Anda. Buat form terlebih dahulu.';
  @override
  String get copyToMyForms => 'Salin ke Form Saya';
  @override
  String copyDialogTitle(int count) => 'Pilih form tujuan ($count soal akan disalin):';
  @override
  String copyDialogBody(int count) => 'Pilih form tujuan ($count soal akan disalin):';
  @override
  String get copying => 'Menyalin...';
  @override
  String copyQuestionsButton(int count) => 'Salin $count Soal ke Form Saya';
  @override
  String get noQuestions => 'Tidak ada soal';

  @override
  String get createFormTitle => 'Buat Form Baru';
  @override
  String get createFormSubtitle => 'Isi detail form untuk mulai mengumpulkan data.';
  @override
  String get formTitleLabel => 'JUDUL FORM';
  @override
  String get formTitleHint => 'Contoh: Kuesioner Kepuasan Siswa';
  @override
  String get formTitleRequired => 'Judul wajib diisi';
  @override
  String get category => 'KATEGORI';
  @override
  String get categoryLoadFailed => 'Gagal memuat kategori';
  @override
  String get durationLabel => 'DURASI (OPSIONAL)';
  @override
  String get durationHint => 'Contoh: 60';
  @override
  String get durationUnit => 'menit';
  @override
  String get durationEmptyHint => 'Kosongkan jika tidak ada batas waktu';
  @override
  String get durationInvalid => 'Masukkan angka yang valid';
  @override
  String get durationMin => 'Minimal 1 menit';
  @override
  String get durationMax => 'Maksimal 1440 menit (24 jam)';
  @override
  String get tokenResponLabel => 'TOKEN RESPON (OPSIONAL)';
  @override
  String get tokenResponHint => 'Contoh: TOKEN123';
  @override
  String get tokenResponEmptyHint => 'Kosongkan jika form terbuka untuk umum';
  @override
  String get themeColorLabel => 'WARNA TEMA (OPSIONAL)';
  @override
  String get bannerLabel => 'BANNER FORM';
  @override
  String get bannerOptionalLabel => 'BANNER FORM (OPSIONAL)';
  @override
  String get bannerTapHint => 'Tap untuk upload banner (opsional)';
  @override
  String get bannerFormats => 'JPG, PNG, WEBP (maks 5MB)';
  @override
  String get createFailed => 'Gagal membuat form';
  @override
  String get createSuccessThemeNote =>
      'Form berhasil dibuat. Warna tema tidak tersimpan lebih — atur kembali di Form Settings.';
  @override
  String get bannerRequired => 'Banner image wajib diunggah';
  @override
  String get bannerReadFailed => 'Gagal membaca banner. Silakan pilih ulang.';
  @override
  String get colorBiru => 'Biru';
  @override
  String get colorMerah => 'Merah';
  @override
  String get colorHijau => 'Hijau';
  @override
  String get colorUngu => 'Ungu';
  @override
  String get colorKuning => 'Kuning';
  @override
  String get colorPink => 'Pink';
  @override
  String get colorCyan => 'Cyan';
  @override
  String get colorIndigo => 'Indigo';
  @override
  String get colorAbu => 'Abu';
  @override
  String get colorTeal => 'Teal';
  @override
  String themeColorName(String color) => color;

  @override
  String get monitoring => 'Monitoring';
  @override
  String get refresh => 'Refresh';
  @override
  String get tryAgain => 'Coba Lagi';
  @override
  String get noParticipantsTitle => 'Belum Ada Peserta';
  @override
  String get noParticipantsBody => 'Belum ada peserta yang mengerjakan form ini.';
  @override
  String get total => 'Total';
  @override
  String get progress => 'Progress';
  @override
  String get completed => 'Selesai';
  @override
  String get statusCompleted => 'Selesai';
  @override
  String get statusInProgress => 'Sedang Mengerjakan';
  @override
  String get statusReset => 'Direset';
  @override
  String get resetParticipantTitle => 'Reset Peserta';
  @override
  String resetParticipantBody(String username) =>
      'Yakin ingin mereset pengerjaan "$username"?\n\nPeserta akan dapat mengerjakan form ini kembali dari awal.';
  @override
  String get resetParticipantTooltip => 'Reset peserta ini';
  @override
  @override
  @override
  String get loadFailed => 'Gagal memuat data monitoring.';
  @override
  String startedAt(String time) => 'Mulai: $time';
  @override
  String completedAt(String time) => 'Selesai: $time';
  @override
  String pageOf(int current, int total) => 'Halaman $current/$total';
  @override
  String pageOnly(int current) => 'Halaman $current';

  @override
  String get missingSlug => 'Missing form slug';
  @override
  String get singleChoice => 'SINGLE CHOICE';
  @override
  String get multipleChoice => 'MULTIPLE CHOICE';
  @override
  String get textAnswer => 'TEXT';
  @override
  String get fileUpload => 'FILE UPLOAD';
  @override
  String get rating => 'RATING';
  @override
  String get showQrCode => 'Show QR Code';
  @override
  String get submissions => 'SUBMISSIONS';
  @override
  String get active => 'Active';
  @override
  String get inactive => 'Inactive';
  @override
  String get status => 'STATUS';
  @override
  String questionsCount(int count) => 'Questions ($count)';
  @override
  String get noQuestionsYet => 'No Questions Yet';
  @override
  String get noQuestionsBody => 'Start adding questions to your form';
  @override
  String get addQuestion => 'Tambah Soal';
  @override
  String get questionType => 'Tipe Soal';
  @override
  String get questionPage => 'Halaman';
  @override
  String get questionPageHelper => 'Halaman penempatan soal';
  @override
  String get questionLabel => 'Pertanyaan';
  @override
  String get mathKeyboard => 'Matematika';
  @override
  String get closeMath => 'Tutup Matematika';
  @override
  String get questionRequiredError => 'Pertanyaan tidak boleh kosong';
  @override
  String get optionalScore => 'Skor Soal (Opsional)';
  @override
  String get optionalImage => 'Gambar (Opsional)';
  @override
  String get addImage => 'Tambah Gambar';
  @override
  String get optionalAudio => 'Audio (Opsional)';
  @override
  String get addAudio => 'Tambah Audio';
  @override
  String get ratingScale => 'Skala Rating';
  @override
  String get ratingPreview => 'Preview: Bintang 1–5';
  @override
  String get answerOptions => 'Pilihan Jawaban';
  @override
  String get correctAnswerHint => 'Centang ✓ untuk menandai jawaban benar';
  @override
  String optionPlaceholder(int index) => 'Opsi $index';
  @override
  String correctOptionMessage(int index) => 'Opsi $index ditandai sebagai jawaban benar';
  @override
  String get updateQuestion => 'Perbarui Soal';
  @override
  String get saveQuestion => 'Simpan Soal';
  @override
  String get replaceFile => 'Ganti';
  @override
  String get audioPreviewAfterSave => 'Preview audio tersedia setelah soal disimpan.';
  @override
  String get deleteQuestion => 'Hapus Soal';
  @override
  String deleteQuestionBody(String question) =>
      'Yakin ingin menghapus soal ini?\n\n$question';
  @override
  String get questionDeleted => 'Soal dihapus';
  @override
  String get questionDeleteFailed => 'Gagal menghapus';
  @override
  String get correct => 'CORRECT';
  @override
  String get required => 'WAJIB';

  @override
  String get statusPublic => 'Public';
  @override
  String get statusDraft => 'Draft';
  @override
  String get formPublic => 'Public';
  @override
  String get formPrivate => 'Private';
  @override
  String get tabQuestions => 'Questions';
  @override
  String get tabResponses => 'Responses';
  @override
  String get tabSettings => 'Settings';
  @override
  String get saveChanges => 'Save Changes';
  @override
  String get saved => 'Perubahan berhasil disimpan.';
  @override
  String get saveFailed => 'Gagal menyimpan perubahan.';
  @override
  String statusChanged(String status) => 'Status changed to $status';
  @override
  String get deleteFormTitle2 => 'Delete Form';
  @override
  String get deleteFormBody2 => 'Are you sure you want to delete this form? This action cannot be undone.';
  @override
  String get deleted => 'Form deleted successfully';
  @override
  String get deletedFailed => 'Failed to delete form';
  @override
  String get emptyQuestionsBoard => 'Tambahkan soal terlebih dahulu.';
  @override
  String get slugCopied => 'Slug copied!';
  @override
  String page(String page) => 'Halaman $page';
  @override
  String get addPage => 'Tambah Halaman';
  @override
  String pageEmpty(String page) => 'Halaman $page kosong';
  @override
  String pageWithCount(String pageLabel, Object count) => 'Halaman ${pageLabel} ($count)';
  @override
  String get score => 'Skor';
  @override
  String get importWord => 'Import Word';
  @override
  String scoreQuestion(String index) => 'Skor soal $index';
  @override
  String get editScoreTitle => 'Atur Skor Soal';
  @override
  String questionsCountShort(int count) => '$count soal';
  @override
  String get autoScore => 'Otomatis';
  @override
  String get manualScore => 'Manual';
  @override
  String get saveScore => 'Simpan Skor';
  @override
  String get distributeNote =>
      'Sistem membagi total skor secara merata ke seluruh soal. Jika tidak habis dibagi, soal pertama mendapat 1 poin lebih.';
  @override
  String get targetTotalScore => 'Target Total Skor';
  @override
  String get targetScoreHint => 'Contoh: 100 atau 200';
  @override
  String get distributionPreview => 'Distribusi Preview';
  @override
  String andMore(int count) => '... dan $count soal lainnya';
  @override
  String get totalScorePreview => 'Total: ... pts';
  @override
  String get currentScoreTotal => 'Total skor saat ini: ... pts';
  @override
  String get invalidTotalScore => 'Masukkan total skor yang valid (> 0).';
  @override
  String get invalidScoreValues => 'Skor tidak valid. Pastikan semua nilai >= 0.';
  @override
  String scoreSaveFailed(int index) => 'Gagal menyimpan skor soal ${index}.';
  @override
  String get autoScoreSaved => 'Skor otomatis berhasil disimpan';
  @override
  String get manualScoreSaved => 'Skor manual berhasil disimpan.';
  @override
  String get genericError => 'Terjadi kesalahan:';
  @override
  String get questionNoText => '(Soal tanpa teks)';
  @override
  String get responsesTab => 'Ringkasan';
  @override
  String get answersTab => 'Jawaban';
  @override
  String get exportExcel => 'Export Excel';
  @override
  String get totalSubmit => 'Total Submit';
  @override
  String get soalLabel => 'Soal';
  @override
  String textAnswers(int count) => '$count jawaban teks';
  @override
  String get noAnswers => 'Belum ada jawaban';
  @override
  String get noAnswer => 'No answer';
  @override
  String get noResponsesTitle => 'No Responses Yet';
  @override
  String get noResponsesBody => 'Responses will appear here once users submit the form';
  @override
  String get excelDownloaded => 'File Excel berhasil diunduh.';
  @override
  String get saveExcel => 'Simpan file Excel';
  @override
  String get excelSaved => 'File Excel berhasil disimpan.';
  @override
  String get excelFailed => 'Gagal mengunduh file Excel.';
  @override
  String get tokenUjian => 'TOKEN UJIAN';
  @override
  String get tokenAccess => 'Token Akses';
  @override
  String get tokenAccessHint => 'Masukkan atau ubah token kode akses untuk peserta ujian.';
  @override
  String get tokenExample => 'cth. UBI-2024';
  @override
  String get tokenCopied => 'Token disalin!';
  @override
  String get ubah => 'Ubah';
  @override
  String get requireToken => 'Wajibkan Token untuk Masuk';
  @override
  String get requireTokenBody => 'Siswa harus memasukkan form dengan token ini.';
  @override
  String get tokenEmptyNote => 'Kosongkan token untuk akses bebas.';
  @override
  String get minutesInvalid => 'Masukkan angka menit yang valid (0 = tanpa batas).';
  @override
  String get durationRemoved => 'Durasi dihapus — form tanpa batasan waktu.';
  @override
  String durationSaved(int minutes) => 'Durasi disimpan: $minutes menit.';
  @override
  String get durationSaveFailed => 'Gagal menyimpan durasi.';
  @override
  String get tokenRemoved => 'Token dihapus — form dapat diakses tanpa token.';
  @override
  String get tokenSaved => 'Token berhasil disimpan.';
  @override
  String get tokenSaveFailed => 'Gagal menyimpan token.';
  @override
  String get settingsSaved => 'Perubahan berhasil disimpan.';
  @override
  String get timeSettings => 'PENGATURAN WAKTU';
  @override
  String get workDuration => 'Durasi Pengerjaan';
  @override
  String get durationHelper => 'Isi 0 atau kosongkan untuk tanpa batasan waktu.';
  @override
  String get minutesUnit => 'menit';
  @override
  String get m30 => '30 mnt';
  @override
  String get m45 => '45 mnt';
  @override
  String get m60 => '60 mnt';
  @override
  String get m90 => '90 mnt';
  @override
  String get m120 => '120 mnt';
  @override
  String get noLimit => 'Tanpa batas';
  @override
  String get questionOrder => 'URUTAN SOAL';
  @override
  String get shuffleQuestions => 'Acak Urutan Soal';
  @override
  String get shuffleBody => 'Urutan soal akan diacak setiap kali form dibuka';
  @override
  String get fixedOrderBody => 'Urutan soal tetap sesuai yang dibuat';
  @override
  String get themeColorTitle => 'WARNA TEMA';
  @override
  String get themeColorHint => 'Pilih warna untuk tampilan form.';
  @override
  String get visibility => 'VISIBILITAS';
  @override
  String get formStatus => 'Status Form';
  @override
  String get publicHint => 'Public — siapapun bisa mengisi form ini';
  @override
  String get privateHint => 'Private — hanya kamu yang bisa melihat';
  @override
  String get linkCopied => 'Link form disalin!';
  @override
  String get shareForm => 'Bagikan Form';
  @override
  String get shareFormHint => 'Salin slug form untuk dibagikan';
  @override
  String get monitoringSection => 'MONITORING';
  @override
  String get monitoringBody => 'Monitoring Peserta';
  @override
  String get participantStatusSection => 'Status Peserta';
  @override
  String get participantStatusBody => 'Lihat dan kelola status pengerjaan peserta';
  @override
  String get deleteFormSection => 'Hapus Form';
  @override
  String get deleteFormSectionBody => 'Hapus form ini secara permanen';
  @override
  String get imageTooLarge => 'Gambar terlalu besar. Maksimal 5MB.';
  @override
  String get bannerUpdated => 'Banner berhasil diupdate!';
  @override
  String get bannerUploadFailed => 'Gagal upload banner.';
  @override
  String get bannerRemoved => 'Banner berhasil dihapus.';
  @override
  String get bannerRemoveFailed => 'Gagal hapus banner.';
  @override
  String get themeSaveFailed => 'Gagal menyimpan warna tema.';
  @override
  String get themeRemoved => 'Warna tema dihapus.';
  @override
  String get themeSaved => 'Warna tema berhasil disimpan.';
  @override
  String themeActive(String color) => 'Warna aktif: $color';

  @override
  String get fillLoading => 'Memuat...';
  @override
  String get fillFinished => 'Selesai';
  @override
  String get fillFormTitle => 'Isi Form';
  @override
  String get thankYou => 'Thank You!';
  @override
  String get thankYouBody => 'Your response has been submitted successfully.';
  @override
  String get backToForm => 'Back to Form';
  @override
  String minutesCount(int count) => '$count Menit';
  @override
  String get noTimeLimit => 'Tanpa Batasan Waktu';
  @override
  String get jumlahSoal => 'Jumlah Soal';
  @override
  String questionsLabel(int count) => '$count Pertanyaan';
  @override
  String get duration => 'Durasi';
  @override
  String get tokenNeeded => 'Form ini memerlukan token responden.';
  @override
  String get startForm => 'Mulai Form';
  @override
  String get tokenEmptySubmit => 'Token wajib diisi.';
  @override
  String tokenServerError(String detail) =>
      'Server mengalami gangguan saat memproses token ($detail). Coba beberapa saat lagi atau hubungi penyelenggara form.';
  @override
  String get tokenNoConnection => 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  @override
  String get tokenInvalid => 'Token yang Anda masukkan salah. Silakan periksa kembali.';
  @override
  String questionNotAnswered(String question) => '"$question" belum dijawab.';
  @override
  String doubtfulWarning(int count) =>
      'Ada $count soal yang ditandai ragu-ragu. Periksa kembali sebelum submit.';
  @override
  String get timeWarningTitle => 'Time Warning';
  @override
  String get timeWarningBody => 'You have less than 1 minute remaining! Please submit your answers soon.';
  @override
  String get continueButton => 'Continue';
  @override
  String get timeUpBody => 'Waktu habis! Jawaban kamu otomatis dikumpulkan.';
  @override
  String get submitMismatch => 'Isi Tidak Sesuai';
  @override
  String get checkAnswers => 'Periksa kembali jawaban Anda.';
  @override
  String get submitServerError => 'Terjadi kesalahan pada server. Silakan coba lagi.';
  @override
  String get submitFailedTimeUp => 'Gagal mengirim, tapi waktu telah habis.';
  @override
  String get submitFailedGeneric => 'Terjadi kesalahan. Silakan coba lagi.';
  @override
  String get submitSuccess => 'Form submitted successfully!';
  @override
  String get alreadySubmitted => 'Anda sudah mengisi form ini sebelumnya.';
  @override
  String get submitDeviceError => 'Gagal mengirim. Periksa koneksi internet Anda kemudian coba lagi.';
  @override
  String get tokenDialogTitle => 'Token Responden';
  @override
  String get tokenDialogEmpty => 'Token wajib diisi untuk mengirim jawaban';
  @override
  String get tokenDialogServerError => 'Server mengalami gangguan. Coba beberapa saat lagi.';
  @override
  String get tokenDialogNoConnection => 'Tidak dapat terhubung ke server.';
  @override
  String get tokenDialogInvalid => 'Token salah.';
  @override
  String answeredOf(int answered, int total) => '$answered/$total dijawab';
  @override
  String pageOfTotal(int current, int total) => 'Halaman $current dari $total';
  @override
  String get submitting => 'Mengirim...';
  @override
  String get submitButton => 'Submit';
  @override
  String get nextButton => 'Lanjut';
  @override
  String doubtfulCount(int count) => '$count soal ditandai ragu-ragu';
  @override
  String get submitForm => 'Submit Form';
  @override
  String get noQuestionsTitle => 'No Questions';
  @override
  String get noQuestionsBody2 => 'This form doesn\'t have any questions yet';
  @override
  String questionPrefix(int number) => 'Q$number';
  @override
  String get doubt => 'Ragu';
  @override
  String get answerPlaceholder => 'Type your answer here...';
  @override
  String get tapToUpload => 'Tap to upload a file';
  @override
  String get fileSelected => 'File selected';
  @override
  String get imageUnavailable => 'Image not available';
  @override
  String get fileSelectError => 'Gagal memilih file. Coba lagi.';

  @override
  String get qrCodeTitle => 'QR Code Form';
  @override
  String get qrScanToFill => 'Scan untuk mengisi form ini';
  @override
  String get qrCopied => 'Slug disalin!';
  @override
  String get qrShareBody =>
      'Bagikan QR code atau slug ini kepada responden. Mereka cukup scan QR untuk langsung membuka form.';
  @override
  String get qrRetry => 'Retry';
  @override
  String get qrShareIntro => 'Share this QR code to let others access your form';
  @override
  String get qrHowToUse => 'How to use';
  @override
  String get qrHowToUse1 => 'Share this QR code with others';
  @override
  String get qrHowToUse2 => 'They scan it with their camera';
  @override
  String get qrHowToUse3 => 'They can access your form instantly';
  @override
  String get qrDownloadSoon => 'Download feature coming soon!';
  @override
  String get qrShareSoon => 'Share feature coming soon!';
  @override
  String get qrPreviewForm => 'Preview Form';
  @override
  String get qrShareCode => 'Share QR Code';
  @override
  String get qrDownloadCode => 'Download QR Code';
  @override
  String get qrInvalid => 'QR code format tidak valid';
  @override
  String get qrGenerateFailed => 'Failed to generate QR code';

  @override
  String get collaborateJoinFailed => 'Gagal bergabung. Periksa link undangan.';
  @override
  String get collaborateTitle => 'Undangan Kolaborasi';
  @override
  String get collaborateJoinAs => 'Bergabung sebagai Collaborator';
  @override
  String collaborateFormLabel(String slug) => 'Form: $slug';
  @override
  String get collaborateBody =>
      'Sebagai Collaborator kamu dapat melihat dan mengedit pertanyaan form ini.';
  @override
  String get collaborateJoining => 'Bergabung...';
  @override
  String get collaborateJoin => 'Bergabung';
  @override
  String get collaborateSuccess => 'Berhasil Bergabung!';
  @override
  String get collaborateSuccessBody =>
      'Kamu sekarang menjadi Collaborator. Kamu bisa melihat dan mengedit pertanyaan form ini.';
  @override
  String get collaborateOpenForm => 'Buka Form';
  @override
  String get collaborateBack => 'Kembali';
  String get loginFailed => 'Gagal masuk';
  String get restore => 'Pulihkan';
  String get permanentlyDelete => 'Hapus Permanen';
  String get formRestored => 'Form dipulihkan. Cek di Form Saya.';
  String get permanentDeleteSuccess => 'Form berhasil dihapus permanen.';
  String get trashSearchHint => 'Cari form di sampah...';
  String get trashEmptyTitle => 'Sampah kosong';
  String get trashEmptyBody => 'Form yang dihapus akan muncul di sini sebelum dihapus permanen.';
  String get clearHistory => 'Hapus Semua Riwayat';
  String get clearHistoryBody => 'Seluruh riwayat pengisian form akan dihapus. Lanjutkan?';
  String get historySearchHint => 'Cari riwayat...';
  String get historyEmptyTitle => 'Belum ada riwayat';
  String get historyEmptyBody => 'Riwayat pengisian form akan muncul di sini setelah kamu mengisi form.';
  String get close => 'Tutup';
  String get importSuccess => 'Import Berhasil';
  String get importTemplateFormat => 'Contoh Format (template_import.docx)';
  String get importTemplateDocx => 'Format Template DOCX';
  String get invalidImageFormat => 'Format tidak valid. Pilih JPG, PNG, atau WEBP.';
  String get unsupportedAudioFormat => 'Format audio tidak didukung.';
  String get audioPickFailed => 'Gagal memilih audio. Coba lagi.';
  String get fillAllOptions => 'Isi semua opsi terlebih dahulu';
  String buildMatrix(int rows, int columns) => 'Buat Matriks $rows×$columns';
  String get insert => 'Sisipkan';
  String get numerator => 'pembilang';
  String get denominator => 'penyebut';
  String get scanFormCode => 'Masukkan Kode Form';
  String get scanFormInstruction => 'Masukkan slug form Formatic secara manual';
  String get enterCode => 'Masukkan Kode';
  String get scanQrInstruction => 'Arahkan kode QR ke dalam bingkai';
  String get scanQrStart => 'Arahkan ke kode QR Formatic untuk mulai';
  String get previewForm => 'Pratinjau Form';
  String get genericUser => 'Pengguna';
  String get questionHistoryEmptyTitle => 'Belum ada riwayat';
  String get questionHistoryEmptyBody => 'Riwayat pengisian form akan muncul di sini setelah kamu mengisi form.';
  String get completedLabel => 'Selesai';
  String attemptLabel(int count) => 'Percobaan ke-$count';
  String get singleChoiceLabel => 'Pilihan Tunggal';
  String get multipleChoiceLabel => 'Pilihan Ganda';
  String get textAnswerLabel => 'Teks';
  String get fileUploadLabel => 'Unggah File';
  String get ratingLabel => 'Rating';
  String get errorLoadingQuestions => 'Gagal memuat soal';
  String get errorLoadingForms => 'Gagal memuat form';
  String get trashTitle => 'Sampah';
  String get trashRetentionInfo => 'Form akan dihapus permanen setelah 30 hari.';
  String get expired => 'Kedaluwarsa';
  String daysRemaining(int count) => '$count hari tersisa';
  String get deletedToday => 'Dihapus hari ini';
  String deletedDaysAgo(int count) => 'Dihapus $count hari lalu';
  String get historyTitle => 'Riwayat';
  String relativeMinutes(int count) => '$count menit lalu';
  String relativeHours(int count) => '$count jam lalu';
  String relativeDays(int count) => '$count hari lalu';
  String relativeMonths(int count) => '$count bulan lalu';
}

/// English resource strings.
class FormaticLocalizationsEn extends FormaticLocalizations {
  @override
  String get retry => 'Retry';
  @override
  String get cancel => 'Cancel';
  @override
  String get save => 'Save';
  @override
  String get delete => 'Delete';
  @override
  String get add => 'Add';
  @override
  String get edit => 'Edit';
  @override
  String get search => 'Search';
  @override
  String get loading => 'Loading...';
  @override
  String get back => 'Back';
  @override
  String get next => 'Next';
  @override
  String get missingData => 'Data unavailable';
  @override
  String get unknown => 'Unknown';

  @override
  String get tagline => 'Create forms, collect responses,\nand gain insights with ease';
  @override
  String get welcomeBack => 'Welcome ';
  @override
  String get enterYourDetails => 'Please enter your details';
  @override
  String get username => 'Username';
  @override
  String get usernameHint => 'Your name';
  @override
  String get usernameRequired => 'Please enter your username';
  @override
  String get loginIdentifier => 'Username / Email';
  @override
  String get loginIdentifierHint => 'Username or email';
  @override
  String get password => 'Password';
  @override
  String get passwordRequired => 'Please enter your password';
  @override
  String get email => 'Email';
  @override
  String get emailHint => 'your@email.com';
  @override
  String get emailRequired => 'Please enter your email';
  @override
  String get emailInvalid => 'Please enter a valid email address';
  @override
  String get forgotPassword => 'Forgot password?';
  @override
  String get signIn => 'Sign In';
  @override
  String get noAccountYet => "Don't have an account? ";
  @override
  String get haveAccount => 'Already have an account? ';
  @override
  String get signUp => 'Sign up';
  @override
  String get createAccount => 'Create ';
  @override
  String get account => 'Account';
  @override
  String get enterYourPassword => 'Please enter a password';
  @override
  String get confirmPassword => 'Enter your password';
  @override
  String get confirmPasswordRequired => 'Please confirm your password';
  @override
  String get passwordsDoNotMatch => 'Passwords do not match';
  @override
  String get signUpFailed => 'Registration failed';
  @override
  String get pwMin8 => 'Password must be at least 8 characters';
  @override
  String get pwUpper => 'Password must contain 1 capital letter';
  @override
  String get pwLower => 'Password must contain 1 lowercase letter';
  @override
  String get pwNumber => 'Password must contain 1 number';

  @override
  String get resetPasswordTitle => 'Reset Password';
  @override
  String get resetPasswordSubtitle => 'Enter your username and new password';
  @override
  String get newPassword => 'New Password';
  @override
  String get newPassword1 => 'Enter your new password';
  @override
  String get confirmNewPassword => 'Confirm New Password';
  @override
  String get confirmNewPasswordRequired => 'Confirm your new password';
  @override
  String get resetPasswordButton => 'Reset Password';
  @override
  String get rememberPassword => 'Remember password? ';
  @override
  String get backToLogin => 'Back to Login';
  @override
  @override
  String get resetSuccess => 'Password changed successfully!';
  @override
  String get resetFailed => 'Failed to change password.';
  @override
  String get resetSuccessSubtitle => 'Please sign in with your new password.';
  @override
  String get goToLogin => 'Go to Login';
  @override

  @override
  String get otpTitle => 'Check your email';
  @override
  String otpBody(String email) => 'We sent a 6-digit verification code to $email';
  @override
  String get otpCodeLabel => 'OTP CODE';
  @override
  String get otpVerify => 'Verify';
  @override
  String get otpVerifying => 'Verifying...';
  @override
  String get otpVerifyFailed => 'The OTP code is wrong or has expired. Please check the code and try again.';
  @override
  String get otpInvalidCode => 'The OTP code must be 6 digits';
  @override
  String get otpResendHint => "Haven't received it? ";
  @override
  String get otpResend => 'Resend code';
  @override
  String otpResendCooldown(int seconds) => 'Resend ($seconds s)';
  @override
  String get otpResent => 'A new code has been sent to your email.';
  @override
  String get otpResendFailed => 'Failed to resend the code.';
  @override
  String get otpWrongEmail => 'Wrong email?';

  @override
  String get tabHome => 'Home';
  @override
  String get tabMyForms => 'My Forms';
  @override
  String get tabDiscovery => 'Discovery';
  @override
  String get tabProfile => 'Profile';
  @override
  String homeGreetingPrefix(String username) => 'Hi, $username';
  @override
  String get searchTemplates => 'Search templates...';
  @override
  String get trendingForms => 'Trending Forms';
  @override
  String get viewAll => 'View all';
  @override
  String noFormsForCategory(String category) => 'No forms in "$category"';
  @override
  String get categoryFallback => 'Form';
  @override
  String get fillForm => 'Fill Form';
  @override
  String get homeEmptyTitle => 'No Forms Yet';
  @override
  String get homeEmptySubtitle => 'Create your first form by\ntapping the + button below.';
  @override
  String get createFormButton => 'Create Form';
  @override
  String get createFormTooltip => 'Create Form';
  @override
  String get untitled => 'Untitled';
  @override
  String get untitledForm => 'Untitled Form';
  @override
  String formMeta(int questions, Object responses) =>
      '$questions Questions  ·  $responses Responses';
  @override
  String get formCreated => 'Form created successfully';

  @override
  String get catAll => 'All';
  @override
  String get catUjian => 'Quiz';
  @override
  String get catSurvei => 'Survey';
  @override
  String get catPengumpulanData => 'Data Collection';

  @override
  String responsesLabel(int count) => '$count Responses';
  @override
  String get formDescriptionLabel => 'Description (Optional)';
  @override
  String get formDescriptionHint => 'Add a description to your form';
  @override
  String get formDescriptionSection => 'FORM DESCRIPTION';
  @override
  String get formDescriptionSubtitle => 'Add an explanation participants will see.';
  @override
  String get formDescriptionInputHint => 'Enter form description';
  @override
  String get subCategoryLoadFailed => 'Failed to load sub categories';
  @override
  String get themeColorOptional => 'THEME COLOR (OPTIONAL)';
  @override
  String get pts => 'pts';
  @override
  String get statusSaveFailed => 'Failed to save form status.';
  @override
  String get descriptionSaveFailed => 'Failed to save description.';
  @override
  String get settingsSaveFailed => 'Failed to save settings.';
  @override
  String get bannerUploadButton => 'Upload';
  @override
  String get bannerFormTitle => 'Form Banner';
  @override
  String get bannerFormSubtitle => 'Upload a banner image for the form (optional).';
  @override
  String get scanSlugHint => 'Example: survey-kepuasan-1234567890';
  @override
  String get importPickDialogTitle => 'Choose a .docx file';
  @override
  String importPickErrorMessage(String detail) => 'Failed to open the file picker: $detail';
  @override
  String importReadErrorMessage(String detail) => 'Failed to read the file: $detail';
  @override
  String get importInvalidFile => 'The selected file is not a valid .docx file. Please choose again.';
  @override
  String get importPickFirst => 'Choose a .docx file first.';
  @override
  String get importFailedMessage => 'Failed to import questions.';
  @override
  String get importTemplateHint => 'Make sure the format follows the template_import.docx available in the repository.';
  @override
  String importSuccessBody(int count, String filename, String formTitle) =>
      'Successfully imported $count questions from $filename into form "$formTitle".';
  @override
  String get importSubtitle => 'Import questions from a .docx file into this form';
  @override
  String get importTapToChoose => 'Tap to choose a .docx file';
  @override
  String importFileReady(String size) => '$size · ready to import (tap to change)';
  @override
  String get importOnlyDocx => 'Only .docx files are accepted';
  @override
  String get importSeeTemplate => 'View template format';
  @override
  String get importButton => 'Import Questions';
  @override
  String get importChooseFirst => 'Choose a file first';
  @override
  String get importTemplateContentNote =>
      'This is the content of the official template file (template_import.docx). Build '
      'your .docx file following the same pattern: each question starts with a number, '
      'and answer choices include Key and Type.';
  @override
  String get importTemplateInstructions =>
      'The template file (template_import.docx) is available in the apps/mobile folder.\n\n'
      'The format of each question inside the .docx must follow this order (one question per block):\n\n'
      '1. Question text...\n'
      'A. First choice\n'
      'B. Second choice\n'
      'C. Third choice\n'
      'Key: A\n'
      'Type: radio\n\n'
      'Notes:\n'
      '• The question number starts with a digit, e.g. "1." or "1)"\n'
      '• Answer choices start with letters A/B/C, e.g. "A." or "A)"\n'
      '• "Key:" or "Answer:" holds the letter of the correct choice (A/B/C). More than one '
      'letter (e.g. "A,C") automatically becomes a checkbox question.\n'
      '• "Type:" (optional) can be radio, checkbox, text, or file. Without a type line, '
      'the question automatically becomes radio/checkbox when it has choices, or text when it has none.\n\n'
      'Note: type "rating" is not supported by the backend database at this time.';

  @override
  String get profile => 'Profile';
  @override
  String get formCreatorRole => 'Form Creator';
  @override
  String get changePassword => 'Change Password';
  @override
  String get updateYourPassword => 'Update your password';
  @override
  String get about => 'About';
  @override
  String get aboutSubtitle => 'App version and information';
  @override
  String get aboutDescription => 'A modern form builder application';
  @override
  String get aboutTitle => 'Formatic';
  @override
  String get languageMenu => 'Language';
  @override
  String get languageSubtitle => 'Choose your preferred language';
  @override
  String get bahasaIndonesia => 'Bahasa Indonesia';
  @override
  String get english => 'English';
  @override
  String get languageChanged => 'Language changed!';

  @override
  String get cpTitle => 'Change Password';
  @override
  String cpAccount(String username) => 'Account: $username';
  @override
  String get cpCurrentLabel => 'Current Password';
  @override
  String get cpCurrentHint => 'Enter your current password';
  @override
  String get cpNewLabel => 'New Password';
  @override
  String get cpNewHint => 'Enter your new password';
  @override
  String get cpConfirmLabel => 'Confirm New Password';
  @override
  String get cpConfirmHint => 'Repeat your new password';
  @override
  String get cpSubmit => 'Save';
  @override
  String get cpFillAll => 'Please fill in all fields first';
  @override
  String get cpMismatch => 'Confirm password does not match';
  @override
  String get cpSuccess => 'Password changed successfully';
  @override
  String get cpFailed => 'Failed to change password';
  @override
  String get showPassword => 'Show password';
  @override
  String get hidePassword => 'Hide password';

  @override
  String get logout => 'Logout';
  @override
  String get logoutConfirm => 'Are you sure you want to logout?';
  @override
  String get logoutConfirmBody => 'Are you sure you want to logout?';

  @override
  String get myForms => 'My Forms';
  @override
  String get join => 'Join';
  @override
  String get searchForms => 'Search forms...';
  @override
  String get tabShared => 'Shared';
  @override
  String get joinDialogTitle => 'Join Collaboration';
  @override
  String get joinDialogBody => 'Paste the invitation link provided by the form owner:';
  @override
  String get joinLinkHint => '.../form/{slug}/collaborate?token=...';
  @override
  String get joinButton => 'Join';
  @override
  String get joinInvalid => 'Invalid link. Please make sure the invitation link is complete.';
  @override
  String get deleteFormTitle => 'Delete Form';
  @override
  String deleteFormBody(String title) =>
      'Form "$title" will be moved to the Trash. You can restore it within 30 days.';
  @override
  String get movedToTrash => 'Form moved to Trash.';
  @override
  String get noFormsTitle => 'No Forms Yet';
  @override
  String get noFormsBody => 'Create your first form to get started';

  @override
  String get discovery => 'Discovery';
  @override
  String get searchPublicForms => 'Search public forms...';
  @override
  String get noFormsFoundTitle => 'No forms found';
  @override
  String get noFormsFoundBody => 'No public forms are available yet.';
  @override
  String get viewQuestions => 'View questions';
  @override
  String get copiedToClipboard => 'Questions copied to your form.';
  @override
  String get copyFailed => 'Failed to copy questions.';
  @override
  String get noOwnForms => 'You have no forms yet. Create a form first.';
  @override
  String get copyToMyForms => 'Copy to My Forms';
  @override
  String copyDialogTitle(int count) => 'Choose destination form ($count questions will be copied):';
  @override
  String copyDialogBody(int count) => 'Choose destination form ($count questions will be copied):';
  @override
  String get copying => 'Copying...';
  @override
  String copyQuestionsButton(int count) => 'Copy $count Questions to My Forms';
  @override
  String get noQuestions => 'No questions';

  @override
  String get createFormTitle => 'Create New Form';
  @override
  String get createFormSubtitle => 'Fill in the form details to start collecting data.';
  @override
  String get formTitleLabel => 'FORM TITLE';
  @override
  String get formTitleHint => 'e.g. Student Satisfaction Survey';
  @override
  String get formTitleRequired => 'Title is required';
  @override
  String get category => 'CATEGORY';
  @override
  String get categoryLoadFailed => 'Failed to load categories';
  @override
  String get durationLabel => 'DURATION (OPTIONAL)';
  @override
  String get durationHint => 'e.g. 60';
  @override
  String get durationUnit => 'min';
  @override
  String get durationEmptyHint => 'Leave empty if there is no time limit';
  @override
  String get durationInvalid => 'Please enter a valid number';
  @override
  String get durationMin => 'Minimum 1 minute';
  @override
  String get durationMax => 'Maximum 1440 minutes (24 hours)';
  @override
  String get tokenResponLabel => 'RESPONSE TOKEN (OPTIONAL)';
  @override
  String get tokenResponHint => 'e.g. TOKEN123';
  @override
  String get tokenResponEmptyHint => 'Leave empty if the form is open to everyone';
  @override
  String get themeColorLabel => 'THEME COLOR (OPTIONAL)';
  @override
  String get bannerLabel => 'FORM BANNER';
  @override
  String get bannerOptionalLabel => 'FORM BANNER (OPTIONAL)';
  @override
  String get bannerTapHint => 'Tap to upload banner (optional)';
  @override
  String get bannerFormats => 'JPG, PNG, WEBP (up to 5MB)';
  @override
  String get createFailed => 'Failed to create form';
  @override
  String get createSuccessThemeNote =>
      'Form created successfully. Theme color was not saved — set it again in Form Settings.';
  @override
  String get bannerRequired => 'Banner image is required';
  @override
  String get bannerReadFailed => 'Failed to read banner. Please select again.';
  @override
  String get colorBiru => 'Blue';
  @override
  String get colorMerah => 'Red';
  @override
  String get colorHijau => 'Green';
  @override
  String get colorUngu => 'Purple';
  @override
  String get colorKuning => 'Yellow';
  @override
  String get colorPink => 'Pink';
  @override
  String get colorCyan => 'Cyan';
  @override
  String get colorIndigo => 'Indigo';
  @override
  String get colorAbu => 'Grey';
  @override
  String get colorTeal => 'Teal';
  @override
  String themeColorName(String color) => color;

  @override
  String get monitoring => 'Monitoring';
  @override
  String get refresh => 'Refresh';
  @override
  String get tryAgain => 'Try Again';
  @override
  String get noParticipantsTitle => 'No Participants';
  @override
  String get noParticipantsBody => 'No participants have worked on this form yet.';
  @override
  String get total => 'Total';
  @override
  String get progress => 'Progress';
  @override
  String get completed => 'Completed';
  @override
  String get statusCompleted => 'Completed';
  @override
  String get statusInProgress => 'In Progress';
  @override
  String get statusReset => 'Reset';
  @override
  String get resetParticipantTitle => 'Reset Participant';
  @override
  String resetParticipantBody(String username) =>
      'Are you sure you want to reset "$username"?\n\nThey will be able to work on this form again from the start.';
  @override
  String get resetParticipantTooltip => 'Reset this participant';
  @override
  @override
  @override
  String get loadFailed => 'Failed to load monitoring data.';
  @override
  String startedAt(String time) => 'Started: $time';
  @override
  String completedAt(String time) => 'Completed: $time';
  @override
  String pageOf(int current, int total) => 'Page $current/$total';
  @override
  String pageOnly(int current) => 'Page $current';

  @override
  String get missingSlug => 'Missing form slug';
  @override
  String get singleChoice => 'SINGLE CHOICE';
  @override
  String get multipleChoice => 'MULTIPLE CHOICE';
  @override
  String get textAnswer => 'TEXT';
  @override
  String get fileUpload => 'FILE UPLOAD';
  @override
  String get rating => 'RATING';
  @override
  String get showQrCode => 'Show QR Code';
  @override
  String get submissions => 'SUBMISSIONS';
  @override
  String get active => 'Active';
  @override
  String get inactive => 'Inactive';
  @override
  String get status => 'STATUS';
  @override
  String questionsCount(int count) => 'Questions ($count)';
  @override
  String get noQuestionsYet => 'No Questions Yet';
  @override
  String get noQuestionsBody => 'Start adding questions to your form';
  @override
  String get addQuestion => 'Add Question';
  @override
  String get questionType => 'Question Type';
  @override
  String get questionPage => 'Page';
  @override
  String get questionPageHelper => 'Page where the question is placed';
  @override
  String get questionLabel => 'Question';
  @override
  String get mathKeyboard => 'Math';
  @override
  String get closeMath => 'Close Math';
  @override
  String get questionRequiredError => 'Question cannot be empty';
  @override
  String get optionalScore => 'Question Score (Optional)';
  @override
  String get optionalImage => 'Image (Optional)';
  @override
  String get addImage => 'Add Image';
  @override
  String get optionalAudio => 'Audio (Optional)';
  @override
  String get addAudio => 'Add Audio';
  @override
  String get ratingScale => 'Rating Scale';
  @override
  String get ratingPreview => 'Preview: 1–5 Stars';
  @override
  String get answerOptions => 'Answer Options';
  @override
  String get correctAnswerHint => 'Check ✓ to mark the correct answer';
  @override
  String optionPlaceholder(int index) => 'Option $index';
  @override
  String correctOptionMessage(int index) => 'Option $index marked as correct';
  @override
  String get updateQuestion => 'Update Question';
  @override
  String get saveQuestion => 'Save Question';
  @override
  String get replaceFile => 'Replace';
  @override
  String get audioPreviewAfterSave => 'Audio preview is available after the question is saved.';
  @override
  String get deleteQuestion => 'Delete Question';
  @override
  String deleteQuestionBody(String question) =>
      'Are you sure you want to delete this question?\n\n$question';
  @override
  String get questionDeleted => 'Question deleted';
  @override
  String get questionDeleteFailed => 'Failed to delete question';
  @override
  String get correct => 'CORRECT';
  @override
  String get required => 'REQUIRED';

  @override
  String get statusPublic => 'Public';
  @override
  String get statusDraft => 'Draft';
  @override
  String get formPublic => 'Public';
  @override
  String get formPrivate => 'Private';
  @override
  String get tabQuestions => 'Questions';
  @override
  String get tabResponses => 'Responses';
  @override
  String get tabSettings => 'Settings';
  @override
  String get saveChanges => 'Save Changes';
  @override
  String get saved => 'Changes saved successfully.';
  @override
  String get saveFailed => 'Failed to save changes.';
  @override
  String statusChanged(String status) => 'Status changed to $status';
  @override
  String get deleteFormTitle2 => 'Delete Form';
  @override
  String get deleteFormBody2 => 'Are you sure you want to delete this form? This action cannot be undone.';
  @override
  String get deleted => 'Form deleted successfully';
  @override
  String get deletedFailed => 'Failed to delete form';
  @override
  String get emptyQuestionsBoard => 'Add questions first.';
  @override
  String get slugCopied => 'Slug copied!';
  @override
  String page(String page) => 'Page $page';
  @override
  String get addPage => 'Add Page';
  @override
  String pageEmpty(String page) => 'Page $page is empty';
  @override
  String pageWithCount(String pageLabel, Object count) => 'Page ${pageLabel} ($count)';
  @override
  String get score => 'Score';
  @override
  String get importWord => 'Import Word';
  @override
  String scoreQuestion(String index) => 'Score question $index';
  @override
  String get editScoreTitle => 'Adjust Question Score';
  @override
  String questionsCountShort(int count) => '$count questions';
  @override
  String get autoScore => 'Automatic';
  @override
  String get manualScore => 'Manual';
  @override
  String get saveScore => 'Save Score';
  @override
  String get distributeNote =>
      'The system distributes the total score evenly across all questions. If it does not divide evenly, the first questions get 1 extra point.';
  @override
  String get targetTotalScore => 'Target Total Score';
  @override
  String get targetScoreHint => 'e.g. 100 or 200';
  @override
  String get distributionPreview => 'Distribution Preview';
  @override
  String andMore(int count) => '... and $count more questions';
  @override
  String get totalScorePreview => 'Total: ... pts';
  @override
  String get currentScoreTotal => 'Current total score: ... pts';
  @override
  String get invalidTotalScore => 'Please enter a valid total score (> 0).';
  @override
  String get invalidScoreValues => 'Invalid score. Make sure all values are >= 0.';
  @override
  String scoreSaveFailed(int index) => 'Failed to save score for question ${index}.';
  @override
  String get autoScoreSaved => 'Automatic score saved';
  @override
  String get manualScoreSaved => 'Manual score saved.';
  @override
  String get genericError => 'An error occurred:';
  @override
  String get questionNoText => '(Question without text)';
  @override
  String get responsesTab => 'Summary';
  @override
  String get answersTab => 'Answers';
  @override
  String get exportExcel => 'Export Excel';
  @override
  String get totalSubmit => 'Total Submit';
  @override
  String get soalLabel => 'Question';
  @override
  String textAnswers(int count) => '$count text answers';
  @override
  String get noAnswers => 'No answers yet';
  @override
  String get noAnswer => 'No answer';
  @override
  String get noResponsesTitle => 'No Responses Yet';
  @override
  String get noResponsesBody => 'Responses will appear here once users submit the form';
  @override
  String get excelDownloaded => 'Excel file downloaded.';
  @override
  String get saveExcel => 'Save Excel file';
  @override
  String get excelSaved => 'Excel file saved.';
  @override
  String get excelFailed => 'Failed to download Excel file.';
  @override
  String get tokenUjian => 'EXAM TOKEN';
  @override
  String get tokenAccess => 'Access Token';
  @override
  String get tokenAccessHint => 'Enter or change the access token code for exam participants.';
  @override
  String get tokenExample => 'e.g. UBI-2024';
  @override
  String get tokenCopied => 'Token copied!';
  @override
  String get ubah => 'Change';
  @override
  String get requireToken => 'Require Token to Enter';
  @override
  String get requireTokenBody => 'Students must enter this token to open the form.';
  @override
  String get tokenEmptyNote => 'Clear the token for free access.';
  @override
  String get minutesInvalid => 'Please enter a valid number of minutes (0 = unlimited).';
  @override
  String get durationRemoved => 'Duration removed — the form has no time limit.';
  @override
  String durationSaved(int minutes) => 'Duration saved: $minutes minutes.';
  @override
  String get durationSaveFailed => 'Failed to save duration.';
  @override
  String get tokenRemoved => 'Token removed — the form can be accessed without a token.';
  @override
  String get tokenSaved => 'Token saved successfully.';
  @override
  String get tokenSaveFailed => 'Failed to save token.';
  @override
  String get settingsSaved => 'Changes saved successfully.';
  @override
  String get timeSettings => 'TIME SETTINGS';
  @override
  String get workDuration => 'Work Duration';
  @override
  String get durationHelper => 'Set to 0 or leave empty for no time limit.';
  @override
  String get minutesUnit => 'min';
  @override
  String get m30 => '30m';
  @override
  String get m45 => '45m';
  @override
  String get m60 => '60m';
  @override
  String get m90 => '90m';
  @override
  String get m120 => '120m';
  @override
  String get noLimit => 'No limit';
  @override
  String get questionOrder => 'QUESTION ORDER';
  @override
  String get shuffleQuestions => 'Shuffle Question Order';
  @override
  String get shuffleBody => 'Question order will be shuffled every time the form is opened';
  @override
  String get fixedOrderBody => 'Question order stays as created';
  @override
  String get themeColorTitle => 'THEME COLOR';
  @override
  String get themeColorHint => 'Pick a color for the form display.';
  @override
  String get visibility => 'VISIBILITY';
  @override
  String get formStatus => 'Form Status';
  @override
  String get publicHint => 'Public — anyone can fill in this form';
  @override
  String get privateHint => 'Private — only you can see it';
  @override
  String get linkCopied => 'Form link copied!';
  @override
  String get shareForm => 'Share Form';
  @override
  String get shareFormHint => 'Copy the form slug to share';
  @override
  String get monitoringSection => 'MONITORING';
  @override
  String get monitoringBody => 'Participant Monitoring';
  @override
  String get participantStatusSection => 'Participant Status';
  @override
  String get participantStatusBody => 'View and manage participant work status';
  @override
  String get deleteFormSection => 'Delete Form';
  @override
  String get deleteFormSectionBody => 'Permanently delete this form';
  @override
  String get imageTooLarge => 'Image is too large. Maximum 5MB.';
  @override
  String get bannerUpdated => 'Banner updated!';
  @override
  String get bannerUploadFailed => 'Failed to upload banner.';
  @override
  String get bannerRemoved => 'Banner removed.';
  @override
  String get bannerRemoveFailed => 'Failed to remove banner.';
  @override
  String get themeSaveFailed => 'Failed to save theme color.';
  @override
  String get themeRemoved => 'Theme color removed.';
  @override
  String get themeSaved => 'Theme color saved.';
  @override
  String themeActive(String color) => 'Active color: $color';

  @override
  String get fillLoading => 'Loading...';
  @override
  String get fillFinished => 'Finished';
  @override
  String get fillFormTitle => 'Fill Form';
  @override
  String get thankYou => 'Thank You!';
  @override
  String get thankYouBody => 'Your response has been submitted successfully.';
  @override
  String get backToForm => 'Back to Form';
  @override
  String minutesCount(int count) => '$count min';
  @override
  String get noTimeLimit => 'No Time Limit';
  @override
  String get jumlahSoal => 'Number of Questions';
  @override
  String questionsLabel(int count) => '$count questions';
  @override
  String get duration => 'Duration';
  @override
  String get tokenNeeded => 'This form requires a respondent token.';
  @override
  String get startForm => 'Start Form';
  @override
  String get tokenEmptySubmit => 'Token is required.';
  @override
  String tokenServerError(String detail) =>
      'The server had trouble processing the token ($detail). Try again in a moment or contact the form organizer.';
  @override
  String get tokenNoConnection => 'Cannot reach the server. Check your internet connection.';
  @override
  String get tokenInvalid => 'The token you entered is incorrect. Please check it again.';
  @override
  String questionNotAnswered(String question) => '"$question" is not answered.';
  @override
  String doubtfulWarning(int count) =>
      'There are $count questions marked as doubtful. Please review them before submitting.';
  @override
  String get timeWarningTitle => 'Time Warning';
  @override
  String get timeWarningBody => 'You have less than 1 minute remaining! Please submit your answers soon.';
  @override
  String get continueButton => 'Continue';
  @override
  String get timeUpBody => 'Time is up! Your answers are automatically collected.';
  @override
  String get submitMismatch => 'Incomplete Response';
  @override
  String get checkAnswers => 'Please check your answers.';
  @override
  String get submitServerError => 'A server error occurred. Please try again.';
  @override
  String get submitFailedTimeUp => 'Submission failed, but time is up.';
  @override
  String get submitFailedGeneric => 'An error occurred. Please try again.';
  @override
  String get submitSuccess => 'Form submitted successfully!';
  @override
  String get alreadySubmitted => 'You have already filled in this form before.';
  @override
  String get submitDeviceError => 'Submission failed. Check your internet connection and try again.';
  @override
  String get tokenDialogTitle => 'Respondent Token';
  @override
  String get tokenDialogEmpty => 'A token is required to submit your answers';
  @override
  String get tokenDialogServerError => 'The server is having trouble. Try again in a moment.';
  @override
  String get tokenDialogNoConnection => 'Cannot reach the server.';
  @override
  String get tokenDialogInvalid => 'Invalid token.';
  @override
  String answeredOf(int answered, int total) => '$answered/$total answered';
  @override
  String pageOfTotal(int current, int total) => 'Page $current of $total';
  @override
  String get submitting => 'Submitting...';
  @override
  String get submitButton => 'Submit';
  @override
  String get nextButton => 'Next';
  @override
  String doubtfulCount(int count) => '$count questions marked as doubtful';
  @override
  String get submitForm => 'Submit Form';
  @override
  String get noQuestionsTitle => 'No Questions';
  @override
  String get noQuestionsBody2 => 'This form doesn\'t have any questions yet';
  @override
  String questionPrefix(int number) => 'Q$number';
  @override
  String get doubt => 'Doubt';
  @override
  String get answerPlaceholder => 'Type your answer here...';
  @override
  String get tapToUpload => 'Tap to upload a file';
  @override
  String get fileSelected => 'File selected';
  @override
  String get imageUnavailable => 'Image not available';
  @override
  String get fileSelectError => 'Failed to select file. Try again.';

  @override
  String get qrCodeTitle => 'QR Code Form';
  @override
  String get qrScanToFill => 'Scan to fill in this form';
  @override
  String get qrCopied => 'Slug copied!';
  @override
  String get qrShareBody =>
      'Share this QR code or slug with respondents. They can just scan the QR to open the form.';
  @override
  String get qrRetry => 'Retry';
  @override
  String get qrShareIntro => 'Share this QR code to let others access your form';
  @override
  String get qrHowToUse => 'How to use';
  @override
  String get qrHowToUse1 => 'Share this QR code with others';
  @override
  String get qrHowToUse2 => 'They scan it with their camera';
  @override
  String get qrHowToUse3 => 'They can access your form instantly';
  @override
  String get qrDownloadSoon => 'Download feature coming soon!';
  @override
  String get qrShareSoon => 'Share feature coming soon!';
  @override
  String get qrPreviewForm => 'Preview Form';
  @override
  String get qrShareCode => 'Share QR Code';
  @override
  String get qrDownloadCode => 'Download QR Code';
  @override
  String get qrInvalid => 'Invalid QR code format';
  @override
  String get qrGenerateFailed => 'Failed to generate QR code';

  @override
  String get collaborateJoinFailed => 'Failed to join. Check the invitation link.';
  @override
  String get collaborateTitle => 'Collaboration Invitation';
  @override
  String get collaborateJoinAs => 'Join as Collaborator';
  @override
  String collaborateFormLabel(String slug) => 'Form: $slug';
  @override
  String get collaborateBody =>
      'As a Collaborator you can view and edit this form\'s questions.';
  @override
  String get collaborateJoining => 'Joining...';
  @override
  String get collaborateJoin => 'Join';
  @override
  String get collaborateSuccess => 'Successfully Joined!';
  @override
  String get collaborateSuccessBody =>
      'You are now a Collaborator. You can view and edit this form\'s questions.';
  @override
  String get collaborateOpenForm => 'Open Form';
  @override
  String get collaborateBack => 'Back';
  String get loginFailed => 'Login failed';
  String get restore => 'Restore';
  String get permanentlyDelete => 'Permanently Delete';
  String get formRestored => 'Form restored. Check My Forms.';
  String get permanentDeleteSuccess => 'Form permanently deleted.';
  String get trashSearchHint => 'Search forms in trash...';
  String get trashEmptyTitle => 'Trash is empty';
  String get trashEmptyBody => 'Deleted forms will appear here before permanent deletion.';
  String get clearHistory => 'Clear All History';
  String get clearHistoryBody => 'All form-filling history will be deleted. Continue?';
  String get historySearchHint => 'Search history...';
  String get historyEmptyTitle => 'No history yet';
  String get historyEmptyBody => 'Your form-filling history will appear here after you complete a form.';
  String get close => 'Close';
  String get importSuccess => 'Import Successful';
  String get importTemplateFormat => 'Example Format (template_import.docx)';
  String get importTemplateDocx => 'DOCX Template Format';
  String get invalidImageFormat => 'Invalid format. Choose JPG, PNG, or WEBP.';
  String get unsupportedAudioFormat => 'Unsupported audio format.';
  String get audioPickFailed => 'Failed to select audio. Try again.';
  String get fillAllOptions => 'Complete all options first';
  String buildMatrix(int rows, int columns) => 'Build $rows×$columns Matrix';
  String get insert => 'Insert';
  String get numerator => 'numerator';
  String get denominator => 'denominator';
  String get scanFormCode => 'Enter Form Code';
  String get scanFormInstruction => 'Enter the Formatic form slug manually';
  String get enterCode => 'Enter Code';
  String get scanQrInstruction => 'Align the QR code inside the frame';
  String get scanQrStart => 'Point at any Formatic QR code to start';
  String get previewForm => 'Preview Form';
  String get genericUser => 'User';
  String get questionHistoryEmptyTitle => 'No history yet';
  String get questionHistoryEmptyBody => 'Your form-filling history will appear here after you complete a form.';
  String get completedLabel => 'Completed';
  String attemptLabel(int count) => 'Attempt $count';
  String get singleChoiceLabel => 'Single Choice';
  String get multipleChoiceLabel => 'Multiple Choice';
  String get textAnswerLabel => 'Text';
  String get fileUploadLabel => 'File Upload';
  String get ratingLabel => 'Rating';
  String get errorLoadingQuestions => 'Failed to load questions';
  String get errorLoadingForms => 'Failed to load forms';
  String get trashTitle => 'Trash';
  String get trashRetentionInfo => 'Forms will be permanently deleted after 30 days.';
  String get expired => 'Expired';
  String daysRemaining(int count) => '$count days remaining';
  String get deletedToday => 'Deleted today';
  String deletedDaysAgo(int count) => 'Deleted $count days ago';
  String get historyTitle => 'History';
  String relativeMinutes(int count) => '$count minutes ago';
  String relativeHours(int count) => '$count hours ago';
  String relativeDays(int count) => '$count days ago';
  String relativeMonths(int count) => '$count months ago';
}

/// A [LocalizationsDelegate] that loads [FormaticLocalizations] for the
/// supported languages (id, en).
class FormaticLocalizationsDelegate extends LocalizationsDelegate<FormaticLocalizations> {
  const FormaticLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    final String code = locale.languageCode;
    return code == 'id' || code == 'en';
  }

  @override
  Future<FormaticLocalizations> load(Locale locale) {
    final FormaticLocalizations resources =
        locale.languageCode == 'en' ? FormaticLocalizationsEn() : FormaticLocalizationsId();
    return SynchronousFuture<FormaticLocalizations>(resources);
  }

  @override
  bool shouldReload(FormaticLocalizationsDelegate old) => false;

  /// Register this delegate in [WidgetsApp.localizationsDelegates].
  static const FormaticLocalizationsDelegate delegate = FormaticLocalizationsDelegate();
}