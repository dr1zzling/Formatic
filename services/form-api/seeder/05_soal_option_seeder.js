/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('soal_option').del()

  const rows = [
    // --- Form 1: Matematika ---
    // Soal 1: 2 + 2 = ? (radio)
    { soal_id: 1, option_value_id: 1, is_correct: true },  // 4
    { soal_id: 1, option_value_id: 2, is_correct: false }, // 5
    { soal_id: 1, option_value_id: 3, is_correct: false }, // 6
    { soal_id: 1, option_value_id: 4, is_correct: false }, // 7

    // Soal 2: Pilih semua angka genap (checkbox)
    { soal_id: 2, option_value_id: 1, is_correct: true },  // 4
    { soal_id: 2, option_value_id: 2, is_correct: false }, // 5
    { soal_id: 2, option_value_id: 3, is_correct: true },  // 6
    { soal_id: 2, option_value_id: 5, is_correct: true },  // 2

    // Soal 5: Berapakah hasil dari 5 x 6? (radio)
    { soal_id: 5, option_value_id: 7, is_correct: true },  // 30
    { soal_id: 5, option_value_id: 8, is_correct: false }, // 25

    // --- Form 2: Pendidikan Pancasila ---
    // Soal 6: Pancasila terdiri dari berapa sila? (radio)
    { soal_id: 6, option_value_id: 9, is_correct: false },  // 3 Sila
    { soal_id: 6, option_value_id: 10, is_correct: true },  // 5 Sila
    { soal_id: 6, option_value_id: 11, is_correct: false }, // 7 Sila

    // Soal 7: Pilih semua simbol yang ada pada Garuda Pancasila (checkbox)
    { soal_id: 7, option_value_id: 12, is_correct: true }, // Bintang
    { soal_id: 7, option_value_id: 13, is_correct: true }, // Rantai
    { soal_id: 7, option_value_id: 14, is_correct: true }, // Pohon Beringin

    // Soal 10: Lambang sila ke-3 adalah? (radio)
    { soal_id: 10, option_value_id: 14, is_correct: true },  // Pohon Beringin
    { soal_id: 10, option_value_id: 15, is_correct: false }, // Kepala Banteng

    // --- Form 3: Bahasa Asing ---
    // Soal 11: Apa terjemahan dari "Thank you"? (radio)
    { soal_id: 11, option_value_id: 16, is_correct: true },  // Terima kasih
    { soal_id: 11, option_value_id: 17, is_correct: false }, // Sama-sama
    { soal_id: 11, option_value_id: 18, is_correct: false }, // Halo

    // Soal 12: Pilih semua kata dalam Bahasa Inggris yang merupakan kata benda (noun) (checkbox)
    { soal_id: 12, option_value_id: 19, is_correct: true },  // Book
    { soal_id: 12, option_value_id: 20, is_correct: false }, // Run
    { soal_id: 12, option_value_id: 21, is_correct: false }, // Beautiful
    { soal_id: 12, option_value_id: 22, is_correct: true },  // Pen

    // Soal 15: Manakah penulisan kata yang benar? (radio)
    { soal_id: 15, option_value_id: 23, is_correct: true },  // Receive
    { soal_id: 15, option_value_id: 24, is_correct: false }, // Recieve

    // --- Form 4: Fisika Dasar ---
    // Soal 16: Satuan Internasional (SI) untuk gaya adalah? (radio)
    { soal_id: 16, option_value_id: 25, is_correct: false }, // Joule
    { soal_id: 16, option_value_id: 26, is_correct: true },  // Newton
    { soal_id: 16, option_value_id: 27, is_correct: false }, // Pascal

    // Soal 17: Pilih semua yang termasuk hukum Newton (checkbox)
    { soal_id: 17, option_value_id: 28, is_correct: true },  // Hukum I Newton
    { soal_id: 17, option_value_id: 29, is_correct: true },  // Hukum II Newton
    { soal_id: 17, option_value_id: 30, is_correct: false }, // Hukum Ohm

    // Soal 20: Alat untuk mengukur arus listrik adalah? (radio)
    { soal_id: 20, option_value_id: 31, is_correct: false }, // Voltmeter
    { soal_id: 20, option_value_id: 32, is_correct: true },  // Ampermeter

    // --- Form 5: Survei Kepuasan Siswa ---
    // Soal 21: Seberapa puas Anda dengan fasilitas sekolah saat ini? (radio)
    { soal_id: 21, option_value_id: 33, is_correct: false }, // Sangat Puas
    { soal_id: 21, option_value_id: 34, is_correct: false }, // Puas
    { soal_id: 21, option_value_id: 35, is_correct: false }, // Kurang Puas

    // Soal 22: Fasilitas mana saja yang paling sering Anda gunakan? (checkbox)
    { soal_id: 22, option_value_id: 36, is_correct: false }, // Perpustakaan
    { soal_id: 22, option_value_id: 37, is_correct: false }, // Kantin
    { soal_id: 22, option_value_id: 38, is_correct: false }, // Laboratorium

    // Soal 25: Apakah jam pelajaran saat ini sudah efektif? (radio)
    { soal_id: 25, option_value_id: 39, is_correct: false }, // Ya
    { soal_id: 25, option_value_id: 40, is_correct: false }, // Tidak

    // --- Form 6: Kimia Organik ---
    // Soal 26: Unsur utama dalam senyawa organik adalah? (radio)
    { soal_id: 26, option_value_id: 41, is_correct: false }, // Oksigen
    { soal_id: 26, option_value_id: 42, is_correct: true },  // Karbon
    { soal_id: 26, option_value_id: 43, is_correct: false }, // Nitrogen

    // Soal 27: Pilih semua kelompok turunan alkana (checkbox)
    { soal_id: 27, option_value_id: 44, is_correct: true },  // Alkanol
    { soal_id: 27, option_value_id: 45, is_correct: true },  // Alkanal
    { soal_id: 27, option_value_id: 46, is_correct: false }, // Benzena

    // Soal 30: Jumlah ikatan kovalen yang bisa dibentuk atom Karbon adalah? (radio)
    { soal_id: 30, option_value_id: 47, is_correct: false }, // 2
    { soal_id: 30, option_value_id: 48, is_correct: true },  // 4

    // --- Form 7: Pendaftaran Ekstrakurikuler ---
    // Soal 31: Pilih hari latihan yang Anda sanggupi (radio)
    { soal_id: 31, option_value_id: 49, is_correct: false }, // Senin & Rabu
    { soal_id: 31, option_value_id: 50, is_correct: false }, // Selasa & Kamis
    { soal_id: 31, option_value_id: 51, is_correct: false }, // Sabtu

    // Soal 32: Pilih ekstrakurikuler yang ingin Anda ikuti (checkbox)
    { soal_id: 32, option_value_id: 52, is_correct: false }, // Pramuka
    { soal_id: 32, option_value_id: 53, is_correct: false }, // Paskibra
    { soal_id: 32, option_value_id: 54, is_correct: false }, // Futsal

    // Soal 35: Apakah Anda pernah memiliki pengalaman di bidang ini sebelumnya? (radio)
    { soal_id: 35, option_value_id: 55, is_correct: false }, // Pernah
    { soal_id: 35, option_value_id: 56, is_correct: false }, // Belum Pernah

    // --- Form 8: Biologi Umum ---
    // Soal 36: Organel sel yang berfungsi sebagai pusat respirasi sel adalah? (radio)
    { soal_id: 36, option_value_id: 57, is_correct: true },  // Mitokondria
    { soal_id: 36, option_value_id: 58, is_correct: false }, // Ribosom

    // Soal 37: Pilih semua mahluk hidup yang tergolong vertebrata (checkbox)
    { soal_id: 37, option_value_id: 59, is_correct: true },  // Kucing
    { soal_id: 37, option_value_id: 60, is_correct: true },  // Burung
    { soal_id: 37, option_value_id: 61, is_correct: false }, // Cacing

    // Soal 40: Proses pembelahan sel tubuh disebut? (radio)
    { soal_id: 40, option_value_id: 62, is_correct: true },  // Mitosis
    { soal_id: 40, option_value_id: 63, is_correct: false }, // Meiosis

    // --- Form 9: Kuesioner Fasilitas Sekolah ---
    // Soal 41: Bagaimana kondisi kebersihan laboratorium komputer? (radio)
    { soal_id: 41, option_value_id: 64, is_correct: false }, // Sangat Bersih
    { soal_id: 41, option_value_id: 65, is_correct: false }, // Cukup Bersih
    { soal_id: 41, option_value_id: 66, is_correct: false }, // Kotor

    // Soal 42: Pilih area sekolah yang membutuhkan pencahayaan tambahan (checkbox)
    { soal_id: 42, option_value_id: 67, is_correct: false }, // Kantin Belakang
    { soal_id: 42, option_value_id: 68, is_correct: false }, // Samping Lab

    // Soal 45: Apakah koneksi Wi-Fi sekolah cukup stabil? (radio)
    { soal_id: 45, option_value_id: 69, is_correct: false }, // Sangat Stabil
    { soal_id: 45, option_value_id: 70, is_correct: false }, // Sering Putus

    // --- Form 10: Sejarah Indonesia ---
    // Soal 46: Kapan Proklamasi Kemerdekaan Indonesia dibacakan? (radio)
    { soal_id: 46, option_value_id: 71, is_correct: true },  // 17 Agustus 1945
    { soal_id: 46, option_value_id: 72, is_correct: false }, // 18 Agustus 1945
    { soal_id: 46, option_value_id: 73, is_correct: false }, // 20 Mei 1908

    // Soal 47: Pilih semua nama pahlawan nasional yang berasal dari Jawa (checkbox)
    { soal_id: 47, option_value_id: 74, is_correct: true },  // Pangeran Diponegoro
    { soal_id: 47, option_value_id: 75, is_correct: true },  // Jenderal Soedirman
    { soal_id: 47, option_value_id: 76, is_correct: false }, // Sisingamangaraja

    // Soal 50: Kota tempat dibacakannya Proklamasi Kemerdekaan adalah? (radio)
    { soal_id: 50, option_value_id: 77, is_correct: true },  // Jakarta
    { soal_id: 50, option_value_id: 78, is_correct: false }  // Bandung
  ]

  await knex('soal_option').insert(rows)
}