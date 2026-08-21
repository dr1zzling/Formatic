/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Hapus data lama di tabel soal_option
  await knex('soal_option').del()

  const rows = [
    // --- Form 1: Matematika ---
    // Soal 1: 2 + 2 = ? (radio)
    { soal_id: 1, value: '4', image: null, is_correct: true },
    { soal_id: 1, value: '5', image: null, is_correct: false },
    { soal_id: 1, value: '6', image: null, is_correct: false },
    { soal_id: 1, value: '7', image: null, is_correct: false },

    // Soal 2: Pilih semua angka genap (checkbox)
    { soal_id: 2, value: '4', image: null, is_correct: true },
    { soal_id: 2, value: '5', image: null, is_correct: false },
    { soal_id: 2, value: '6', image: null, is_correct: true },
    { soal_id: 2, value: '2', image: null, is_correct: true },

    // Soal 5: Berapakah hasil dari 5 x 6? (radio)
    { soal_id: 5, value: '30', image: null, is_correct: true },
    { soal_id: 5, value: '25', image: null, is_correct: false },

    // --- Form 2: Pendidikan Pancasila ---
    // Soal 6: Pancasila terdiri dari berapa sila? (radio)
    { soal_id: 6, value: '3 Sila', image: null, is_correct: false },
    { soal_id: 6, value: '5 Sila', image: null, is_correct: true },
    { soal_id: 6, value: '7 Sila', image: null, is_correct: false },

    // Soal 7: Pilih semua simbol yang ada pada Garuda Pancasila (checkbox)
    { soal_id: 7, value: 'Bintang', image: '/uploads/options/bintang.png', is_correct: true },
    { soal_id: 7, value: 'Rantai', image: '/uploads/options/rantai.png', is_correct: true },
    { soal_id: 7, value: 'Pohon Beringin', image: '/uploads/options/pohon-beringin.png', is_correct: true },

    // Soal 10: Lambang sila ke-3 adalah? (radio)
    { soal_id: 10, value: 'Pohon Beringin', image: '/uploads/options/pohon-beringin.png', is_correct: true },
    { soal_id: 10, value: 'Kepala Banteng', image: '/uploads/options/kepala-banteng.png', is_correct: false },

    // --- Form 3: Bahasa Asing ---
    // Soal 11: Apa terjemahan dari "Thank you"? (radio)
    { soal_id: 11, value: 'Terima kasih', image: null, is_correct: true },
    { soal_id: 11, value: 'Sama-sama', image: null, is_correct: false },
    { soal_id: 11, value: 'Halo', image: null, is_correct: false },

    // Soal 12: Pilih semua kata dalam Bahasa Inggris yang merupakan kata benda (noun) (checkbox)
    { soal_id: 12, value: 'Book', image: '/uploads/options/book.png', is_correct: true },
    { soal_id: 12, value: 'Run', image: null, is_correct: false },
    { soal_id: 12, value: 'Beautiful', image: null, is_correct: false },
    { soal_id: 12, value: 'Pen', image: '/uploads/options/pen.png', is_correct: true },

    // Soal 15: Manakah penulisan kata yang benar? (radio)
    { soal_id: 15, value: 'Receive', image: null, is_correct: true },
    { soal_id: 15, value: 'Recieve', image: null, is_correct: false },

    // --- Form 4: Fisika Dasar ---
    // Soal 16: Satuan Internasional (SI) untuk gaya adalah? (radio)
    { soal_id: 16, value: 'Joule', image: null, is_correct: false },
    { soal_id: 16, value: 'Newton', image: null, is_correct: true },
    { soal_id: 16, value: 'Pascal', image: null, is_correct: false },

    // Soal 17: Pilih semua yang termasuk hukum Newton (checkbox)
    { soal_id: 17, value: 'Hukum I Newton', image: null, is_correct: true },
    { soal_id: 17, value: 'Hukum II Newton', image: null, is_correct: true },
    { soal_id: 17, value: 'Hukum Ohm', image: null, is_correct: false },

    // Soal 20: Alat untuk mengukur arus listrik adalah? (radio)
    { soal_id: 20, value: 'Voltmeter', image: '/uploads/options/voltmeter.png', is_correct: false },
    { soal_id: 20, value: 'Ampermeter', image: '/uploads/options/ampermeter.png', is_correct: true },

    // --- Form 5: Survei Kepuasan Siswa ---
    // Soal 21: Seberapa puas Anda dengan fasilitas sekolah saat ini? (radio)
    { soal_id: 21, value: 'Sangat Puas', image: null, is_correct: false },
    { soal_id: 21, value: 'Puas', image: null, is_correct: false },
    { soal_id: 21, value: 'Kurang Puas', image: null, is_correct: false },

    // Soal 22: Fasilitas mana saja yang paling sering Anda gunakan? (checkbox)
    { soal_id: 22, value: 'Perpustakaan', image: null, is_correct: false },
    { soal_id: 22, value: 'Kantin', image: null, is_correct: false },
    { soal_id: 22, value: 'Laboratorium', image: null, is_correct: false },

    // Soal 25: Apakah jam pelajaran saat ini sudah efektif? (radio)
    { soal_id: 25, value: 'Ya', image: null, is_correct: false },
    { soal_id: 25, value: 'Tidak', image: null, is_correct: false },

    // --- Form 6: Kimia Organik ---
    // Soal 26: Unsur utama dalam senyawa organik adalah? (radio)
    { soal_id: 26, value: 'Oksigen', image: null, is_correct: false },
    { soal_id: 26, value: 'Karbon', image: null, is_correct: true },
    { soal_id: 26, value: 'Nitrogen', image: null, is_correct: false },

    // Soal 27: Pilih semua kelompok turunan alkana (checkbox)
    { soal_id: 27, value: 'Alkanol', image: null, is_correct: true },
    { soal_id: 27, value: 'Alkanal', image: null, is_correct: true },
    { soal_id: 27, value: 'Benzena', image: '/uploads/options/benzena-structure.png', is_correct: false },

    // Soal 30: Jumlah ikatan kovalen yang bisa dibentuk atom Karbon adalah? (radio)
    { soal_id: 30, value: '2', image: null, is_correct: false },
    { soal_id: 30, value: '4', image: null, is_correct: true },

    // --- Form 7: Pendaftaran Ekstrakurikuler ---
    // Soal 31: Pilih hari latihan yang Anda sanggupi (radio)
    { soal_id: 31, value: 'Senin & Rabu', image: null, is_correct: false },
    { soal_id: 31, value: 'Selasa & Kamis', image: null, is_correct: false },
    { soal_id: 31, value: 'Sabtu', image: null, is_correct: false },

    // Soal 32: Pilih ekstrakurikuler yang ingin Anda ikuti (checkbox)
    { soal_id: 32, value: 'Pramuka', image: '/uploads/options/pramuka-logo.png', is_correct: false },
    { soal_id: 32, value: 'Paskibra', image: '/uploads/options/paskibra-logo.png', is_correct: false },
    { soal_id: 32, value: 'Futsal', image: '/uploads/options/futsal-logo.png', is_correct: false },

    // Soal 35: Apakah Anda pernah memiliki pengalaman di bidang ini sebelumnya? (radio)
    { soal_id: 35, value: 'Pernah', image: null, is_correct: false },
    { soal_id: 35, value: 'Belum Pernah', image: null, is_correct: false },

    // --- Form 8: Biologi Umum ---
    // Soal 36: Organel sel yang berfungsi sebagai pusat respirasi sel adalah? (radio)
    { soal_id: 36, value: 'Mitokondria', image: '/uploads/options/mitokondria.png', is_correct: true },
    { soal_id: 36, value: 'Ribosom', image: '/uploads/options/ribosom.png', is_correct: false },

    // Soal 37: Pilih semua mahluk hidup yang tergolong vertebrata (checkbox)
    { soal_id: 37, value: 'Kucing', image: null, is_correct: true },
    { soal_id: 37, value: 'Burung', image: null, is_correct: true },
    { soal_id: 37, value: 'Cacing', image: null, is_correct: false },

    // Soal 40: Proses pembelahan sel tubuh disebut? (radio)
    { soal_id: 40, value: 'Mitosis', image: null, is_correct: true },
    { soal_id: 40, value: 'Meiosis', image: null, is_correct: false },

    // --- Form 9: Kuesioner Fasilitas Sekolah ---
    // Soal 41: Bagaimana kondisi kebersihan laboratorium komputer? (radio)
    { soal_id: 41, value: 'Sangat Bersih', image: null, is_correct: false },
    { soal_id: 41, value: 'Cukup Bersih', image: null, is_correct: false },
    { soal_id: 41, value: 'Kotor', image: null, is_correct: false },

    // Soal 42: Pilih area sekolah yang membutuhkan pencahayaan tambahan (checkbox)
    { soal_id: 42, value: 'Kantin Belakang', image: null, is_correct: false },
    { soal_id: 42, value: 'Samping Lab', image: null, is_correct: false },

    // Soal 45: Apakah koneksi Wi-Fi sekolah cukup stabil? (radio)
    { soal_id: 45, value: 'Sangat Stabil', image: null, is_correct: false },
    { soal_id: 45, value: 'Sering Putus', image: null, is_correct: false },

    // --- Form 10: Sejarah Indonesia ---
    // Soal 46: Kapan Proklamasi Kemerdekaan Indonesia dibacakan? (radio)
    { soal_id: 46, value: '17 Agustus 1945', image: null, is_correct: true },
    { soal_id: 46, value: '18 Agustus 1945', image: null, is_correct: false },
    { soal_id: 46, value: '20 Mei 1908', image: null, is_correct: false },

    // Soal 47: Pilih semua nama pahlawan nasional yang berasal dari Jawa (checkbox)
    { soal_id: 47, value: 'Pangeran Diponegoro', image: '/uploads/options/diponegoro.png', is_correct: true },
    { soal_id: 47, value: 'Jenderal Soedirman', image: '/uploads/options/soedirman.png', is_correct: true },
    { soal_id: 47, value: 'Sisingamangaraja', image: '/uploads/options/sisingamangaraja.png', is_correct: false },

    // Soal 50: Kota tempat dibacakannya Proklamasi Kemerdekaan adalah? (radio)
    { soal_id: 50, value: 'Jakarta', image: null, is_correct: true },
    { soal_id: 50, value: 'Bandung', image: null, is_correct: false }
  ]

  await knex('soal_option').insert(rows)
}