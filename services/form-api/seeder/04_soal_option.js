/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('soal_option').del()
  await knex('soal_option').insert([

    // ==========================================
    // MATEMATIKA (Soal 1 - 50)
    // ==========================================

    // 1
    { soal_id: 1, option_value: 'f’(x) = 6x + 5', is_correct: true },
    { soal_id: 1, option_value: 'f’(x) = 6x - 5', is_correct: false },
    { soal_id: 1, option_value: 'f’(x) = 3x + 5', is_correct: false },
    { soal_id: 1, option_value: 'f’(x) = 6x² + 5', is_correct: false },

    // 2
    { soal_id: 2, option_value: 'x² + 3x + C', is_correct: true },
    { soal_id: 2, option_value: '2x² + 3x + C', is_correct: false },
    { soal_id: 2, option_value: 'x² + C', is_correct: false },
    { soal_id: 2, option_value: '2x + 3 + C', is_correct: false },

    // 3
    { soal_id: 3, option_value: '4', is_correct: true },
    { soal_id: 3, option_value: '0', is_correct: false },
    { soal_id: 3, option_value: '2', is_correct: false },
    { soal_id: 3, option_value: '8', is_correct: false },

    // 4
    { soal_id: 4, option_value: '5', is_correct: true },
    { soal_id: 4, option_value: '11', is_correct: false },
    { soal_id: 4, option_value: '8', is_correct: false },
    { soal_id: 4, option_value: '3', is_correct: false },

    // 5
    { soal_id: 5, option_value: '32', is_correct: true },
    { soal_id: 5, option_value: '35', is_correct: false },
    { soal_id: 5, option_value: '30', is_correct: false },
    { soal_id: 5, option_value: '27', is_correct: false },

    // 6
    { soal_id: 6, option_value: '486', is_correct: true },
    { soal_id: 6, option_value: '162', is_correct: false },
    { soal_id: 6, option_value: '243', is_correct: false },
    { soal_id: 6, option_value: '1458', is_correct: false },

    // 7
    { soal_id: 7, option_value: '9', is_correct: true },
    { soal_id: 7, option_value: '7', is_correct: false },
    { soal_id: 7, option_value: '8', is_correct: false },
    { soal_id: 7, option_value: '10', is_correct: false },

    // 8
    { soal_id: 8, option_value: '1', is_correct: true },
    { soal_id: 8, option_value: '0', is_correct: false },
    { soal_id: 8, option_value: '1/2', is_correct: false },
    { soal_id: 8, option_value: '2', is_correct: false },

    // 9
    { soal_id: 9, option_value: '2x² – 5', is_correct: true },
    { soal_id: 9, option_value: '2x² – 6', is_correct: false },
    { soal_id: 9, option_value: '4x² – 2', is_correct: false },
    { soal_id: 9, option_value: '2x² + 1', is_correct: false },

    // 10
    { soal_id: 10, option_value: '8/3', is_correct: true },
    { soal_id: 10, option_value: '4/3', is_correct: false },
    { soal_id: 10, option_value: '2', is_correct: false },
    { soal_id: 10, option_value: '8', is_correct: false },

    // 11
    { soal_id: 11, option_value: 'f’(x) = 15x² – 8x', is_correct: true },
    { soal_id: 11, option_value: 'f’(x) = 15x² – 8', is_correct: false },
    { soal_id: 11, option_value: 'f’(x) = 5x² – 4x', is_correct: false },
    { soal_id: 11, option_value: 'f’(x) = 15x³ – 8x', is_correct: false },

    // 12
    { soal_id: 12, option_value: '(4/3)x³ – 3x² + C', is_correct: true },
    { soal_id: 12, option_value: '4x³ – 6x² + C', is_correct: false },
    { soal_id: 12, option_value: '(4/3)x³ – 6x² + C', is_correct: false },
    { soal_id: 12, option_value: '2x³ – 3x² + C', is_correct: false },

    // 13
    { soal_id: 13, option_value: '3', is_correct: true },
    { soal_id: 13, option_value: '1', is_correct: false },
    { soal_id: 13, option_value: '2', is_correct: false },
    { soal_id: 13, option_value: 'Tak hingga', is_correct: false },

    // 14
    { soal_id: 14, option_value: '22', is_correct: true },
    { soal_id: 14, option_value: '10', is_correct: false },
    { soal_id: 14, option_value: '14', is_correct: false },
    { soal_id: 14, option_value: '18', is_correct: false },

    // 15
    { soal_id: 15, option_value: '77', is_correct: true },
    { soal_id: 15, option_value: '72', is_correct: false },
    { soal_id: 15, option_value: '82', is_correct: false },
    { soal_id: 15, option_value: '67', is_correct: false },

    // 16
    { soal_id: 16, option_value: '136', is_correct: true },
    { soal_id: 16, option_value: '120', is_correct: false },
    { soal_id: 16, option_value: '144', is_correct: false },
    { soal_id: 16, option_value: '112', is_correct: false },

    // 17
    { soal_id: 17, option_value: '64', is_correct: true },
    { soal_id: 17, option_value: '32', is_correct: false },
    { soal_id: 17, option_value: '128', is_correct: false },
    { soal_id: 17, option_value: '16', is_correct: false },

    // 18
    { soal_id: 18, option_value: 'x = ±√13', is_correct: true },
    { soal_id: 18, option_value: 'x = ±3', is_correct: false },
    { soal_id: 18, option_value: 'x = ±√5', is_correct: false },
    { soal_id: 18, option_value: 'x = ±13', is_correct: false },

    // 19
    { soal_id: 19, option_value: '1', is_correct: true },
    { soal_id: 19, option_value: '1/2', is_correct: false },
    { soal_id: 19, option_value: '3/4', is_correct: false },
    { soal_id: 19, option_value: '1/4', is_correct: false },

    // 20
    { soal_id: 20, option_value: '2x² + 1', is_correct: true },
    { soal_id: 20, option_value: '2x² - 1', is_correct: false },
    { soal_id: 20, option_value: '4x² + 8', is_correct: false },
    { soal_id: 20, option_value: '2x² + 3', is_correct: false },

    // 21
    { soal_id: 21, option_value: '24', is_correct: true },
    { soal_id: 21, option_value: '12', is_correct: false },
    { soal_id: 21, option_value: '36', is_correct: false },
    { soal_id: 21, option_value: '48', is_correct: false },

    // 22
    { soal_id: 22, option_value: 'f’(x) = 1/(2√x)', is_correct: true },
    { soal_id: 22, option_value: 'f’(x) = 1/√x', is_correct: false },
    { soal_id: 22, option_value: 'f’(x) = 2√x', is_correct: false },
    { soal_id: 22, option_value: 'f’(x) = 1/(x√x)', is_correct: false },

    // 23
    { soal_id: 23, option_value: 'ln|x| + C', is_correct: true },
    { soal_id: 23, option_value: '1/x² + C', is_correct: false },
    { soal_id: 23, option_value: '-1/x² + C', is_correct: false },
    { soal_id: 23, option_value: 'e^x + C', is_correct: false },

    // 24
    { soal_id: 24, option_value: '1', is_correct: true },
    { soal_id: 24, option_value: '0', is_correct: false },
    { soal_id: 24, option_value: 'Tak hingga', is_correct: false },
    { soal_id: 24, option_value: '1/2', is_correct: false },

    // 25
    { soal_id: 25, option_value: '–1', is_correct: true },
    { soal_id: 25, option_value: '1', is_correct: false },
    { soal_id: 25, option_value: '13', is_correct: false },
    { soal_id: 25, option_value: '–13', is_correct: false },

    // 26
    { soal_id: 26, option_value: '155', is_correct: true },
    { soal_id: 26, option_value: '145', is_correct: false },
    { soal_id: 26, option_value: '165', is_correct: false },
    { soal_id: 26, option_value: '135', is_correct: false },

    // 27
    { soal_id: 27, option_value: '315/16', is_correct: true },
    { soal_id: 27, option_value: '315/32', is_correct: false },
    { soal_id: 27, option_value: '155/32', is_correct: false },
    { soal_id: 27, option_value: '63/8', is_correct: false },

    // 28
    { soal_id: 28, option_value: '10000', is_correct: true },
    { soal_id: 28, option_value: '1000', is_correct: false },
    { soal_id: 28, option_value: '40', is_correct: false },
    { soal_id: 28, option_value: '100000', is_correct: false },

    // 29
    { soal_id: 29, option_value: '1/2', is_correct: true },
    { soal_id: 29, option_value: '1/4', is_correct: false },
    { soal_id: 29, option_value: '1', is_correct: false },
    { soal_id: 29, option_value: '1/√2', is_correct: false },

    // 30
    { soal_id: 30, option_value: '58', is_correct: true },
    { soal_id: 30, option_value: '40', is_correct: false },
    { soal_id: 30, option_value: '20', is_correct: false },
    { soal_id: 30, option_value: '118', is_correct: false },

    // 31
    { soal_id: 31, option_value: '4', is_correct: true },
    { soal_id: 31, option_value: '2', is_correct: false },
    { soal_id: 31, option_value: '8', is_correct: false },
    { soal_id: 31, option_value: '16', is_correct: false },

    // 32
    { soal_id: 32, option_value: '3x² – 6x + 1', is_correct: true },
    { soal_id: 32, option_value: '3x² + 6x + 1', is_correct: false },
    { soal_id: 32, option_value: '2x² – 6x', is_correct: false },
    { soal_id: 32, option_value: '3x² – 3', is_correct: false },

    // 33
    { soal_id: 33, option_value: '2e^x + C', is_correct: true },
    { soal_id: 33, option_value: 'e^(2x) + C', is_correct: false },
    { soal_id: 33, option_value: 'e^x + C', is_correct: false },
    { soal_id: 33, option_value: '2e^(2x) + C', is_correct: false },

    // 34
    { soal_id: 34, option_value: '5/2', is_correct: true },
    { soal_id: 34, option_value: '3/7', is_correct: false },
    { soal_id: 34, option_value: '1', is_correct: false },
    { soal_id: 34, option_value: 'Tak hingga', is_correct: false },

    // 35
    { soal_id: 35, option_value: '22', is_correct: true },
    { soal_id: 35, option_value: '12', is_correct: false },
    { soal_id: 35, option_value: '2', is_correct: false },
    { soal_id: 35, option_value: '32', is_correct: false },

    // 36
    { soal_id: 36, option_value: '204', is_correct: true },
    { soal_id: 36, option_value: '180', is_correct: false },
    { soal_id: 36, option_value: '216', is_correct: false },
    { soal_id: 36, option_value: '192', is_correct: false },

    // 37
    { soal_id: 37, option_value: '12288', is_correct: true },
    { soal_id: 37, option_value: '3072', is_correct: false },
    { soal_id: 37, option_value: '4096', is_correct: false },
    { soal_id: 37, option_value: '8192', is_correct: false },

    // 38
    { soal_id: 38, option_value: '4', is_correct: true },
    { soal_id: 38, option_value: '-2', is_correct: false },
    { soal_id: 38, option_value: '4 dan -2', is_correct: false },
    { soal_id: 38, option_value: '8', is_correct: false },

    // 39
    { soal_id: 39, option_value: '1', is_correct: true },
    { soal_id: 39, option_value: '0', is_correct: false },
    { soal_id: 39, option_value: '1/2', is_correct: false },
    { soal_id: 39, option_value: '√3', is_correct: false },

    // 40
    { soal_id: 40, option_value: '32', is_correct: true },
    { soal_id: 40, option_value: '19', is_correct: false },
    { soal_id: 40, option_value: '16', is_correct: false },
    { soal_id: 40, option_value: '25', is_correct: false },

    // 41
    { soal_id: 41, option_value: '52/3', is_correct: true },
    { soal_id: 41, option_value: '26/3', is_correct: false },
    { soal_id: 41, option_value: '18', is_correct: false },
    { soal_id: 41, option_value: '54/3', is_correct: false },

    // 42
    { soal_id: 42, option_value: '6x – 12', is_correct: true },
    { soal_id: 42, option_value: '3x² – 12x', is_correct: false },
    { soal_id: 42, option_value: '6x', is_correct: false },
    { soal_id: 42, option_value: '6', is_correct: false },

    // 43
    { soal_id: 43, option_value: 'sin x + C', is_correct: true },
    { soal_id: 43, option_value: '-sin x + C', is_correct: false },
    { soal_id: 43, option_value: 'cos x + C', is_correct: false },
    { soal_id: 43, option_value: '-cos x + C', is_correct: false },

    // 44
    { soal_id: 44, option_value: '1/2', is_correct: true },
    { soal_id: 44, option_value: '0', is_correct: false },
    { soal_id: 44, option_value: '1', is_correct: false },
    { soal_id: 44, option_value: '2', is_correct: false },

    // 45
    { soal_id: 45, option_value: '10', is_correct: true },
    { soal_id: 45, option_value: '14', is_correct: false },
    { soal_id: 45, option_value: '12', is_correct: false },
    { soal_id: 45, option_value: '8', is_correct: false },

    // 46
    { soal_id: 46, option_value: '242', is_correct: true },
    { soal_id: 46, option_value: '162', is_correct: false },
    { soal_id: 46, option_value: '80', is_correct: false },
    { soal_id: 46, option_value: '243', is_correct: false },

    // 47
    { soal_id: 47, option_value: '1/2', is_correct: true },
    { soal_id: 47, option_value: '1/3', is_correct: false },
    { soal_id: 47, option_value: '1/6', is_correct: false },
    { soal_id: 47, option_value: '2/3', is_correct: false },

    // 48
    { soal_id: 48, option_value: '5/8', is_correct: true },
    { soal_id: 48, option_value: '3/8', is_correct: false },
    { soal_id: 48, option_value: '5/3', is_correct: false },
    { soal_id: 48, option_value: '1/8', is_correct: false },

    // 49
    { soal_id: 49, option_value: '1/2', is_correct: true },
    { soal_id: 49, option_value: '1', is_correct: false },
    { soal_id: 49, option_value: '1/4', is_correct: false },
    { soal_id: 49, option_value: '0', is_correct: false },

    // 50
    { soal_id: 50, option_value: '5', is_correct: true },
    { soal_id: 50, option_value: '4', is_correct: false },
    { soal_id: 50, option_value: '2', is_correct: false },
    { soal_id: 50, option_value: '3', is_correct: false },


    // ==========================================
    // PENDIDIKAN PANCASILA (Soal 51 - 100)
    // ==========================================

    // 51
    { soal_id: 51, option_value: 'Bintang', is_correct: true },
    { soal_id: 51, option_value: 'Rantai', is_correct: false },
    { soal_id: 51, option_value: 'Pohon Beringin', is_correct: false },
    { soal_id: 51, option_value: 'Kepala Banteng', is_correct: false },

    // 52
    { soal_id: 52, option_value: 'Persatuan dan kesatuan bangsa', is_correct: true },
    { soal_id: 52, option_value: 'Keadilan sosial', is_correct: false },
    { soal_id: 52, option_value: 'Demokrasi musyawarah', is_correct: false },
    { soal_id: 52, option_value: 'Penghormatan HAM', is_correct: false },

    // 53
    { soal_id: 53, option_value: 'Alinea ke-4', is_correct: true },
    { soal_id: 53, option_value: 'Alinea ke-1', is_correct: false },
    { soal_id: 53, option_value: 'Alinea ke-2', is_correct: false },
    { soal_id: 53, option_value: 'Alinea ke-3', is_correct: false },

    // 54
    { soal_id: 54, option_value: 'Menghargai hak orang lain dan tidak semena-mena', is_correct: true },
    { soal_id: 54, option_value: 'Mengutamakan kepentingan pribadi', is_correct: false },
    { soal_id: 54, option_value: 'Memaksa orang lain mengikuti kehendak kita', is_correct: false },
    { soal_id: 54, option_value: 'Melakukan perundungan di sekolah', is_correct: false },

    // 55
    { soal_id: 55, option_value: 'Sila ke-4', is_correct: true },
    { soal_id: 55, option_value: 'Sila ke-2', is_correct: false },
    { soal_id: 55, option_value: 'Sila ke-3', is_correct: false },
    { soal_id: 55, option_value: 'Sila ke-5', is_correct: false },

    // 56
    { soal_id: 56, option_value: 'Pembukaan UUD 1945', is_correct: true },
    { soal_id: 56, option_value: 'Piagam Jakarta', is_correct: false },
    { soal_id: 56, option_value: 'Batang Tubuh UUD 1945', is_correct: false },
    { soal_id: 56, option_value: 'Ketetapan MPR', is_correct: false },

    // 57
    { soal_id: 57, option_value: 'Ir. Soekarno', is_correct: true },
    { soal_id: 57, option_value: 'Mr. Soepomo', is_correct: false },
    { soal_id: 57, option_value: 'Moh. Yamin', is_correct: false },
    { soal_id: 57, option_value: 'Drs. Moh. Hatta', is_correct: false },

    // 58
    { soal_id: 58, option_value: 'Padi dan Kapas', is_correct: true },
    { soal_id: 58, option_value: 'Rantai Emas', is_correct: false },
    { soal_id: 58, option_value: 'Pohon Beringin', is_correct: false },
    { soal_id: 58, option_value: 'Bintang', is_correct: false },

    // 59
    { soal_id: 59, option_value: 'Pancasila menjadi pedoman bertingkah laku bagi bangsa Indonesia', is_correct: true },
    { soal_id: 59, option_value: 'Pancasila hanya sebagai lambang negara saja', is_correct: false },
    { soal_id: 59, option_value: 'Pancasila menjadi landasan hukum luar negeri', is_correct: false },
    { soal_id: 59, option_value: 'Pancasila bersifat sementara mengikuti perkembangan zaman', is_correct: false },

    // 60
    { soal_id: 60, option_value: 'Kemanusiaan yang adil dan beradab', is_correct: true },
    { soal_id: 60, option_value: 'Kebebasan mutlak tanpa batas', is_correct: false },
    { soal_id: 60, option_value: 'Kekuasaan tertinggi di tangan pemerintah', is_correct: false },
    { soal_id: 60, option_value: 'Persamaan kedudukan berdasarkan kekayaan', is_correct: false },

    // 61
    { soal_id: 61, option_value: 'Sila ke-1', is_correct: true },
    { soal_id: 61, option_value: 'Sila ke-2', is_correct: false },
    { soal_id: 61, option_value: 'Sila ke-3', is_correct: false },
    { soal_id: 61, option_value: 'Sila ke-5', is_correct: false },

    // 62
    { soal_id: 62, option_value: 'Sila ke-3', is_correct: true },
    { soal_id: 62, option_value: 'Sila ke-1', is_correct: false },
    { soal_id: 62, option_value: 'Sila ke-4', is_correct: false },
    { soal_id: 62, option_value: 'Sila ke-2', is_correct: false },

    // 63
    { soal_id: 63, option_value: 'Majelis Permusyawaratan Rakyat (MPR)', is_correct: true },
    { soal_id: 63, option_value: 'Dewan Perwakilan Rakyat (DPR)', is_correct: false },
    { soal_id: 63, option_value: 'Presiden', is_correct: false },
    { soal_id: 63, option_value: 'Mahkamah Konstitusi (MK)', is_correct: false },

    // 64
    { soal_id: 64, option_value: 'Berbeda-beda tetapi tetap satu jua', is_correct: true },
    { soal_id: 64, option_value: 'Bersatu kita teguh bercerai kita runtuh', is_correct: false },
    { soal_id: 64, option_value: 'Kebebasan untuk seluruh rakyat', is_correct: false },
    { soal_id: 64, option_value: 'Persatuan dalam keterikatan', is_correct: false },

    // 65
    { soal_id: 65, option_value: 'Sila ke-2', is_correct: true },
    { soal_id: 65, option_value: 'Sila ke-1', is_correct: false },
    { soal_id: 65, option_value: 'Sila ke-4', is_correct: false },
    { soal_id: 65, option_value: 'Sila ke-5', is_correct: false },

    // 66
    { soal_id: 66, option_value: 'Mampu menyesuaikan diri dengan perkembangan zaman tanpa mengubah nilai dasarnya', is_correct: true },
    { soal_id: 66, option_value: 'Bebas diubah kapan saja oleh siapapun', is_correct: false },
    { soal_id: 66, option_value: 'Menerima seluruh ideologi asing secara mentah-mentah', is_correct: false },
    { soal_id: 66, option_value: 'Tidak memiliki pedoman dasar yang pasti', is_correct: false },

    // 67
    { soal_id: 67, option_value: 'Hari Lahir Pancasila', is_correct: true },
    { soal_id: 67, option_value: 'Hari Kemerdekaan Indonesia', is_correct: false },
    { soal_id: 67, option_value: 'Hari Kesaktian Pancasila', is_correct: false },
    { soal_id: 67, option_value: 'Hari Sumpah Pemuda', is_correct: false },

    // 68
    { soal_id: 68, option_value: '1 Maret 1945', is_correct: true },
    { soal_id: 68, option_value: '29 Mei 1945', is_correct: false },
    { soal_id: 68, option_value: '17 Agustus 1945', is_correct: false },
    { soal_id: 68, option_value: '18 Agustus 1945', is_correct: false },

    // 69
    { soal_id: 69, option_value: 'Dr. K.R.T. Radjiman Wedyodiningrat', is_correct: true },
    { soal_id: 69, option_value: 'Ir. Soekarno', is_correct: false },
    { soal_id: 69, option_value: 'Drs. Moh. Hatta', is_correct: false },
    { soal_id: 69, option_value: 'Ichibangase Yosio', is_correct: false },

    // 70
    { soal_id: 70, option_value: 'Piagam Jakarta (Jakarta Charter)', is_correct: true },
    { soal_id: 70, option_value: 'Teks Proklamasi', is_correct: false },
    { soal_id: 70, option_value: 'Sumpah Pemuda', is_correct: false },
    { soal_id: 70, option_value: 'Naskah Deklarasi', is_correct: false },

    // 71
    { soal_id: 71, option_value: 'Musyawarah mufakat', is_correct: true },
    { soal_id: 71, option_value: 'Pengambilan suara terbanyak saja', is_correct: false },
    { soal_id: 71, option_value: 'Kehendak pemimpin tertinggi', is_correct: false },
    { soal_id: 71, option_value: 'Keinginan kelompok mayoritas', is_correct: false },

    // 72
    { soal_id: 72, option_value: 'Sila ke-5', is_correct: true },
    { soal_id: 72, option_value: 'Sila ke-1', is_correct: false },
    { soal_id: 72, option_value: 'Sila ke-3', is_correct: false },
    { soal_id: 72, option_value: 'Sila ke-4', is_correct: false },

    // 73
    { soal_id: 73, option_value: 'Sila ke-3', is_correct: true },
    { soal_id: 73, option_value: 'Sila ke-2', is_correct: false },
    { soal_id: 73, option_value: 'Sila ke-4', is_correct: false },
    { soal_id: 73, option_value: 'Sila ke-5', is_correct: false },

    // 74
    { soal_id: 74, option_value: 'Semua peraturan hukum tidak boleh bertentangan dengan Pancasila', is_correct: true },
    { soal_id: 74, option_value: 'Pancasila diletakkan di bawah UUD 1945', is_correct: false },
    { soal_id: 74, option_value: 'Hukum internasional lebih tinggi dari Pancasila', is_correct: false },
    { soal_id: 74, option_value: 'Pancasila hanya berlaku untuk hukum pidana', is_correct: false },

    // 75
    { soal_id: 75, option_value: 'Norma Adat', is_correct: true },
    { soal_id: 75, option_value: 'Norma Agama', is_correct: false },
    { soal_id: 75, option_value: 'Norma Hukum', is_correct: false },
    { soal_id: 75, option_value: 'Norma Kesusilaan', is_correct: false },

    // 76
    { soal_id: 76, option_value: 'Mendapatkan pendidikan yang layak', is_correct: true },
    { soal_id: 76, option_value: 'Membayar pajak tepat waktu', is_correct: false },
    { soal_id: 76, option_value: 'Mentaati lalu lintas', is_correct: false },
    { soal_id: 76, option_value: 'Menjaga ketertiban umum', is_correct: false },

    // 77
    { soal_id: 77, option_value: 'Pasal 27 Ayat 3', is_correct: true },
    { soal_id: 77, option_value: 'Pasal 28', is_correct: false },
    { soal_id: 77, option_value: 'Pasal 29 Ayat 2', is_correct: false },
    { soal_id: 77, option_value: 'Pasal 31 Ayat 1', is_correct: false },

    // 78
    { soal_id: 78, option_value: 'Bhinneka Tunggal Ika', is_correct: true },
    { soal_id: 78, option_value: 'Tut Wuri Handayani', is_correct: false },
    { soal_id: 78, option_value: 'Ing Ngarsa Sung Tuladha', is_correct: false },
    { soal_id: 78, option_value: 'Pancasila Sakti', is_correct: false },

    // 79
    { soal_id: 79, option_value: '45 helai', is_correct: true },
    { soal_id: 79, option_value: '17 helai', is_correct: false },
    { soal_id: 80, option_value: '8 helai', is_correct: false },
    { soal_id: 79, option_value: '19 helai', is_correct: false },

    // 80
    { soal_id: 80, option_value: '17 Agustus', is_correct: true },
    { soal_id: 80, option_value: '18 Agustus', is_correct: false },
    { soal_id: 80, option_value: '1 Juni', is_correct: false },
    { soal_id: 80, option_value: '28 Oktober', is_correct: false },

    // 81
    { soal_id: 81, option_value: 'Mengenakan seragam sesuai aturan', is_correct: true },
    { soal_id: 81, option_value: 'Meninggalkan kelas saat pelajaran berlangsung', is_correct: false },
    { soal_id: 81, option_value: 'Mencontek saat ujian', is_correct: false },
    { soal_id: 81, option_value: 'Datang terlambat ke sekolah', is_correct: false },

    // 82
    { soal_id: 82, option_value: 'Sila ke-3', is_correct: true },
    { soal_id: 82, option_value: 'Sila ke-1', is_correct: false },
    { soal_id: 82, option_value: 'Sila ke-4', is_correct: false },
    { soal_id: 82, option_value: 'Sila ke-5', is_correct: false },

    // 83
    { soal_id: 83, option_value: 'PPKI (Panitia Persiapan Kemerdekaan Indonesia)', is_correct: true },
    { soal_id: 83, option_value: 'KNPI', is_correct: false },
    { soal_id: 83, option_value: 'Panitia Sembilan', is_correct: false },
    { soal_id: 83, option_value: 'BPUPKI', is_correct: false },

    // 84
    { soal_id: 84, option_value: '22 Juni 1945', is_correct: true },
    { soal_id: 84, option_value: '1 Juni 1945', is_correct: false },
    { soal_id: 84, option_value: '17 Agustus 1945', is_correct: false },
    { soal_id: 84, option_value: '18 Agustus 1945', is_correct: false },

    // 85
    { soal_id: 85, option_value: 'Persatuan dan kesatuan bangsa Indonesia', is_correct: true },
    { soal_id: 85, option_value: 'Keinginan salah satu kelompok saja', is_correct: false },
    { soal_id: 85, option_value: 'Tekanan dari pihak asing', is_correct: false },
    { soal_id: 85, option_value: 'Kepentingan ekonomi', is_correct: false },

    // 86
    { soal_id: 86, option_value: 'UUD NRI Tahun 1945', is_correct: true },
    { soal_id: 86, option_value: 'Peraturan Presiden', is_correct: false },
    { soal_id: 86, option_value: 'Peraturan Daerah', is_correct: false },
    { soal_id: 86, option_value: 'Hukum Adat', is_correct: false },

    // 87
    { soal_id: 87, option_value: 'Rakyat', is_correct: true },
    { soal_id: 87, option_value: 'Presiden', is_correct: false },
    { soal_id: 87, option_value: 'DPR', is_correct: false },
    { soal_id: 87, option_value: 'TNI/Polri', is_correct: false },

    // 88
    { soal_id: 88, option_value: 'Kehidupan nyata sehari-hari', is_correct: true },
    { soal_id: 88, option_value: 'Naskah tertulis undang-undang saja', is_correct: false },
    { soal_id: 88, option_value: 'Cita-cita yang belum terwujud', is_correct: false },
    { soal_id: 88, option_value: 'Buku teks pelajaran sekolah', is_correct: false },

    // 89
    { soal_id: 89, option_value: 'Meningkatkan kesadaran hukum dan toleransi', is_correct: true },
    { soal_id: 89, option_value: 'Menghakimi sendiri pelaku kejahatan', is_correct: false },
    { soal_id: 89, option_value: 'Apatis terhadap lingkungan sekitar', is_correct: false },
    { soal_id: 89, option_value: 'Membatasi hak orang lain', is_correct: false },

    // 90
    { soal_id: 90, option_value: 'Negara Kesatuan', is_correct: true },
    { soal_id: 90, option_value: 'Negara Serikat (Federasi)', is_correct: false },
    { soal_id: 90, option_value: 'Negara Monarki', is_correct: false },
    { soal_id: 90, option_value: 'Negara Konfederasi', is_correct: false },

    // 91
    { soal_id: 91, option_value: 'DPR (Dewan Perwakilan Rakyat)', is_correct: true },
    { soal_id: 91, option_value: 'Mahkamah Agung', is_correct: false },
    { soal_id: 91, option_value: 'Presiden', is_correct: false },
    { soal_id: 91, option_value: 'Badan Pemeriksa Keuangan', is_correct: false },

    // 92
    { soal_id: 92, option_value: 'Sila ke-5', is_correct: true },
    { soal_id: 92, option_value: 'Sila ke-1', is_correct: false },
    { soal_id: 92, option_value: 'Sila ke-3', is_correct: false },
    { soal_id: 92, option_value: 'Sila ke-4', is_correct: false },

    // 93
    { soal_id: 93, option_value: 'Presidensial', is_correct: true },
    { soal_id: 93, option_value: 'Parlementer', is_correct: false },
    { soal_id: 93, option_value: 'Semi-Presidensial', is_correct: false },
    { soal_id: 93, option_value: 'Monarki Absolut', is_correct: false },

    // 94
    { soal_id: 94, option_value: 'Mengembangkan usaha koperasi', is_correct: true },
    { soal_id: 94, option_value: 'Menerapkan sistem monopoli pasar', is_correct: false },
    { soal_id: 94, option_value: 'Mengutamakan impor barang asing', is_correct: false },
    { soal_id: 94, option_value: 'Menimbun bahan pokok demi keuntungan', is_correct: false },

    // 95
    { soal_id: 95, option_value: 'Sila ke-3', is_correct: true },
    { soal_id: 95, option_value: 'Sila ke-1', is_correct: false },
    { soal_id: 95, option_value: 'Sila ke-2', is_correct: false },
    { soal_id: 95, option_value: 'Sila ke-4', is_correct: false },

    // 96
    { soal_id: 96, option_value: 'Diri sendiri dan lingkungannya dalam kehidupan berbangsa', is_correct: true },
    { soal_id: 96, option_value: 'Penguasaan wilayah negara lain', is_correct: false },
    { soal_id: 96, option_value: 'Persaingan dengan bangsa-bangsa Barat', is_correct: false },
    { soal_id: 96, option_value: 'Pemisahan kekuasaan wilayah', is_correct: false },

    // 97
    { soal_id: 97, option_value: 'Kesejahteraan bagi seluruh rakyat Indonesia', is_correct: true },
    { soal_id: 97, option_value: 'Keuntungan bagi para pengusaha', is_correct: false },
    { soal_id: 97, option_value: 'Pemusatan kekayaan pada pejabat negara', is_correct: false },
    { soal_id: 97, option_value: 'Pembangunan yang terpusat di pulau tertentu', is_correct: false },

    // 98
    { soal_id: 98, option_value: 'Sila ke-4', is_correct: true },
    { soal_id: 98, option_value: 'Sila ke-1', is_correct: false },
    { soal_id: 98, option_value: 'Sila ke-2', is_correct: false },
    { soal_id: 98, option_value: 'Sila ke-3', is_correct: false },

    // 99
    { soal_id: 99, option_value: 'Pasal 27 Ayat 2', is_correct: true },
    { soal_id: 99, option_value: 'Pasal 29', is_correct: false },
    { soal_id: 99, option_value: 'Pasal 30', is_correct: false },
    { soal_id: 99, option_value: 'Pasal 34', is_correct: false },

    // 100
    { soal_id: 100, option_value: 'Seluruh warga negara Indonesia', is_correct: true },
    { soal_id: 100, option_value: 'TNI dan Polri saja', is_correct: false },
    { soal_id: 100, option_value: 'Pemerintah pusat saja', is_correct: false },
    { soal_id: 100, option_value: 'Tokoh-tokoh adat saja', is_correct: false },
  ]);
};
