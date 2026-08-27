/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('soal_option').del()
  await knex('soal').del()

  const soal = [
    // Form 1: Soal Matematika 2026
    { question: '2 + 2 = ?', form_id: 1, type: 'radio', image: null, page: 1 },
    { question: 'Pilih semua angka genap', form_id: 1, type: 'checkbox', image: null, page: 2 },
    { question: 'Berapakah hasil dari 5 x 6?', form_id: 1, type: 'radio', image: null, page: 2 },
    { question: 'Tuliskan rumus luas persegi panjang', form_id: 1, type: 'text', image: '/uploads/soal/persegi-panjang.png', page: 3 },
    { question: 'Upload foto lembar jawaban orat-oret', form_id: 1, type: 'file', image: null, page: 3 },

    // Form 2: Soal Pendidikan Pancasila 2026
    { question: 'Pancasila terdiri dari berapa sila?', form_id: 2, type: 'radio', image: null, page: 1 },
    { question: 'Pilih semua simbol yang ada pada Garuda Pancasila', form_id: 2, type: 'checkbox', image: '/uploads/soal/garuda-pancasila.png', page: 2 },
    { question: 'Lambang sila ke-3 adalah?', form_id: 2, type: 'radio', image: '/uploads/soal/pohon-beringin.png', page: 2 },
    { question: 'Tuliskan bunyi sila pertama Pancasila', form_id: 2, type: 'text', image: null, page: 3 },
    { question: 'Upload tugas rangkuman bab 1', form_id: 2, type: 'file', image: null, page: 3 },

    // Form 3: Soal Bahasa Asing 2026
    { question: 'Apa terjemahan dari "Thank you"?', form_id: 3, type: 'radio', image: null, page: 1 },
    { question: 'Pilih semua kata dalam Bahasa Inggris yang merupakan kata benda (noun)', form_id: 3, type: 'checkbox', image: null, page: 2 },
    { question: 'Manakah penulisan kata yang benar?', form_id: 3, type: 'radio', image: null, page: 2 },
    { question: 'Tuliskan arti kata "Konnichiwa"', form_id: 3, type: 'text', image: null, page: 3 },
    { question: 'Upload rekaman audio perkenalan diri', form_id: 3, type: 'file', image: null, page: 3 },

    // Form 4: Soal Fisika Dasar 2026
    { question: 'Satuan Internasional (SI) untuk gaya adalah?', form_id: 4, type: 'radio', image: null, page: 1 },
    { question: 'Pilih semua yang termasuk hukum Newton', form_id: 4, type: 'checkbox', image: null, page: 2 },
    { question: 'Alat untuk mengukur arus listrik adalah?', form_id: 4, type: 'radio', image: '/uploads/soal/amperemeter.png', page: 2 },
    { question: 'Tuliskan rumus kecepatan rata-rata', form_id: 4, type: 'text', image: '/uploads/soal/grafik-kecepatan.png', page: 3 },
    { question: 'Upload grafik hasil praktikum', form_id: 4, type: 'file', image: null, page: 3 },

    // Form 5: Survei Kepuasan Siswa 2026
    { question: 'Seberapa puas Anda dengan fasilitas sekolah saat ini?', form_id: 5, type: 'radio', image: null, page: 1 },
    { question: 'Fasilitas mana saja yang paling sering Anda gunakan?', form_id: 5, type: 'checkbox', image: null, page: 2 },
    { question: 'Apakah jam pelajaran saat ini sudah efektif?', form_id: 5, type: 'radio', image: null, page: 2 },
    { question: 'Tuliskan saran perbaikan untuk kantin sekolah', form_id: 5, type: 'text', image: null, page: 3 },
    { question: 'Upload bukti dokumentasi berupa foto fasilitas yang rusak', form_id: 5, type: 'file', image: null, page: 3 },

    // Form 6: Soal Kimia Organik 2026
    { question: 'Unsur utama dalam senyawa organik adalah?', form_id: 6, type: 'radio', image: null, page: 1 },
    { question: 'Pilih semua kelompok turunan alkana', form_id: 6, type: 'checkbox', image: null, page: 2 },
    { question: 'Jumlah ikatan kovalen yang bisa dibentuk atom Karbon adalah?', form_id: 6, type: 'radio', image: null, page: 2 },
    { question: 'Tuliskan rumus kimia dari Methane', form_id: 6, type: 'text', image: '/uploads/soal/struktur-metana.png', page: 3 },
    { question: 'Upload hasil foto struktur molekul', form_id: 6, type: 'file', image: null, page: 3 },

    // Form 7: Pendaftaran Ekstrakurikuler 2026
    { question: 'Pilih hari latihan yang Anda sanggupi', form_id: 7, type: 'radio', image: null, page: 1 },
    { question: 'Pilih ekstrakurikuler yang ingin Anda ikuti', form_id: 7, type: 'checkbox', image: null, page: 2 },
    { question: 'Apakah Anda pernah memiliki pengalaman di bidang ini sebelumnya?', form_id: 7, type: 'radio', image: null, page: 2 },
    { question: 'Tuliskan alasan Anda tertarik bergabung', form_id: 7, type: 'text', image: null, page: 3 },
    { question: 'Upload pas foto terbaru 3x4', form_id: 7, type: 'file', image: null, page: 3 },

    // Form 8: Soal Biologi Umum 2026
    { question: 'Organel sel yang berfungsi sebagai pusat respirasi sel adalah?', form_id: 8, type: 'radio', image: '/uploads/soal/struktur-sel.png', page: 1 },
    { question: 'Pilih semua mahluk hidup yang tergolong vertebrata', form_id: 8, type: 'checkbox', image: null, page: 2 },
    { question: 'Proses pembelahan sel tubuh disebut?', form_id: 8, type: 'radio', image: null, page: 2 },
    { question: 'Tuliskan pengertian dari fotosintesis', form_id: 8, type: 'text', image: '/uploads/soal/skema-fotosintesis.png', page: 3 },
    { question: 'Upload foto pengamatan mikroskop', form_id: 8, type: 'file', image: null, page: 3 },

    // Form 9: Kuesioner Fasilitas Sekolah 2026
    { question: 'Bagaimana kondisi kebersihan laboratorium komputer?', form_id: 9, type: 'radio', image: null, page: 1 },
    { question: 'Pilih area sekolah yang membutuhkan pencahayaan tambahan', form_id: 9, type: 'checkbox', image: null, page: 2 },
    { question: 'Apakah koneksi Wi-Fi sekolah cukup stabil?', form_id: 9, type: 'radio', image: null, page: 2 },
    { question: 'Berikan kritik konstruktif untuk layanan perpustakaan', form_id: 9, type: 'text', image: null, page: 3 },
    { question: 'Upload foto bukti kendala fasilitas jika ada', form_id: 9, type: 'file', image: null, page: 3 },

    // Form 10: Soal Sejarah Indonesia 2026
    { question: 'Kapan Proklamasi Kemerdekaan Indonesia dibacakan?', form_id: 10, type: 'radio', image: '/uploads/soal/teks-proklamasi.png', page: 1 },
    { question: 'Pilih semua nama pahlawan nasional yang berasal dari Jawa', form_id: 10, type: 'checkbox', image: null, page: 2 },
    { question: 'Kota tempat dibacakannya Proklamasi Kemerdekaan adalah?', form_id: 10, type: 'radio', image: null, page: 2 },
    { question: 'Tuliskan nama tokoh pembaca teks Proklamasi', form_id: 10, type: 'text', image: null, page: 3 },
    { question: 'Upload rangkuman sejarah peristiwa Rengasdengklok', form_id: 10, type: 'file', image: null, page: 3 }
  ]

  await knex('soal').insert(soal)
}