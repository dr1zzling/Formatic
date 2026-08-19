/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('soal_option').del()
  await knex('soal').del()

  const soal = [
    // Form 1: Soal Matematika 2026
    { question: '2 + 2 = ?', form_id: 1, type: 'radio', image: null },
    { question: 'Pilih semua angka genap', form_id: 1, type: 'checkbox', image: null },
    { question: 'Tuliskan rumus luas persegi panjang', form_id: 1, type: 'text', image: '/uploads/soal/persegi-panjang.png' },
    { question: 'Upload foto lembar jawaban orat-oret', form_id: 1, type: 'file', image: null },
    { question: 'Berapakah hasil dari 5 x 6?', form_id: 1, type: 'radio', image: null },

    // Form 2: Soal Pendidikan Pancasila 2026
    { question: 'Pancasila terdiri dari berapa sila?', form_id: 2, type: 'radio', image: null },
    { question: 'Pilih semua simbol yang ada pada Garuda Pancasila', form_id: 2, type: 'checkbox', image: '/uploads/soal/garuda-pancasila.png' },
    { question: 'Tuliskan bunyi sila pertama Pancasila', form_id: 2, type: 'text', image: null },
    { question: 'Upload tugas rangkuman bab 1', form_id: 2, type: 'file', image: null },
    { question: 'Lambang sila ke-3 adalah?', form_id: 2, type: 'radio', image: '/uploads/soal/pohon-beringin.png' },

    // Form 3: Soal Bahasa Asing 2026
    { question: 'Apa terjemahan dari "Thank you"?', form_id: 3, type: 'radio', image: null },
    { question: 'Pilih semua kata dalam Bahasa Inggris yang merupakan kata benda (noun)', form_id: 3, type: 'checkbox', image: null },
    { question: 'Tuliskan arti kata "Konnichiwa"', form_id: 3, type: 'text', image: null },
    { question: 'Upload rekaman audio perkenalan diri', form_id: 3, type: 'file', image: null },
    { question: 'Manakah penulisan kata yang benar?', form_id: 3, type: 'radio', image: null },

    // Form 4: Soal Fisika Dasar 2026
    { question: 'Satuan Internasional (SI) untuk gaya adalah?', form_id: 4, type: 'radio', image: null },
    { question: 'Pilih semua yang termasuk hukum Newton', form_id: 4, type: 'checkbox', image: null },
    { question: 'Tuliskan rumus kecepatan rata-rata', form_id: 4, type: 'text', image: '/uploads/soal/grafik-kecepatan.png' },
    { question: 'Upload grafik hasil praktikum', form_id: 4, type: 'file', image: null },
    { question: 'Alat untuk mengukur arus listrik adalah?', form_id: 4, type: 'radio', image: '/uploads/soal/amperemeter.png' },

    // Form 5: Survei Kepuasan Siswa 2026
    { question: 'Seberapa puas Anda dengan fasilitas sekolah saat ini?', form_id: 5, type: 'radio', image: null },
    { question: 'Fasilitas mana saja yang paling sering Anda gunakan?', form_id: 5, type: 'checkbox', image: null },
    { question: 'Tuliskan saran perbaikan untuk kantin sekolah', form_id: 5, type: 'text', image: null },
    { question: 'Upload bukti dokumentasi berupa foto fasilitas yang rusak', form_id: 5, type: 'file', image: null },
    { question: 'Apakah jam pelajaran saat ini sudah efektif?', form_id: 5, type: 'radio', image: null },

    // Form 6: Soal Kimia Organik 2026
    { question: 'Unsur utama dalam senyawa organik adalah?', form_id: 6, type: 'radio', image: null },
    { question: 'Pilih semua kelompok turunan alkana', form_id: 6, type: 'checkbox', image: null },
    { question: 'Tuliskan rumus kimia dari Methane', form_id: 6, type: 'text', image: '/uploads/soal/struktur-metana.png' },
    { question: 'Upload hasil foto struktur molekul', form_id: 6, type: 'file', image: null },
    { question: 'Jumlah ikatan kovalen yang bisa dibentuk atom Karbon adalah?', form_id: 6, type: 'radio', image: null },

    // Form 7: Pendaftaran Ekstrakurikuler 2026
    { question: 'Pilih hari latihan yang Anda sanggupi', form_id: 7, type: 'radio', image: null },
    { question: 'Pilih ekstrakurikuler yang ingin Anda ikuti', form_id: 7, type: 'checkbox', image: null },
    { question: 'Tuliskan alasan Anda tertarik bergabung', form_id: 7, type: 'text', image: null },
    { question: 'Upload pas foto terbaru 3x4', form_id: 7, type: 'file', image: null },
    { question: 'Apakah Anda pernah memiliki pengalaman di bidang ini sebelumnya?', form_id: 7, type: 'radio', image: null },

    // Form 8: Soal Biologi Umum 2026
    { question: 'Organel sel yang berfungsi sebagai pusat respirasi sel adalah?', form_id: 8, type: 'radio', image: '/uploads/soal/struktur-sel.png' },
    { question: 'Pilih semua mahluk hidup yang tergolong vertebrata', form_id: 8, type: 'checkbox', image: null },
    { question: 'Tuliskan pengertian dari fotosintesis', form_id: 8, type: 'text', image: '/uploads/soal/skema-fotosintesis.png' },
    { question: 'Upload foto pengamatan mikroskop', form_id: 8, type: 'file', image: null },
    { question: 'Proses pembelahan sel tubuh disebut?', form_id: 8, type: 'radio', image: null },

    // Form 9: Kuesioner Fasilitas Sekolah 2026
    { question: 'Bagaimana kondisi kebersihan laboratorium komputer?', form_id: 9, type: 'radio', image: null },
    { question: 'Pilih area sekolah yang membutuhkan pencahayaan tambahan', form_id: 9, type: 'checkbox', image: null },
    { question: 'Berikan kritik konstruktif untuk layanan perpustakaan', form_id: 9, type: 'text', image: null },
    { question: 'Upload foto bukti kendala fasilitas jika ada', form_id: 9, type: 'file', image: null },
    { question: 'Apakah koneksi Wi-Fi sekolah cukup stabil?', form_id: 9, type: 'radio', image: null },

    // Form 10: Soal Sejarah Indonesia 2026
    { question: 'Kapan Proklamasi Kemerdekaan Indonesia dibacakan?', form_id: 10, type: 'radio', image: '/uploads/soal/teks-proklamasi.png' },
    { question: 'Pilih semua nama pahlawan nasional yang berasal dari Jawa', form_id: 10, type: 'checkbox', image: null },
    { question: 'Tuliskan nama tokoh pembaca teks Proklamasi', form_id: 10, type: 'text', image: null },
    { question: 'Upload rangkuman sejarah peristiwa Rengasdengklok', form_id: 10, type: 'file', image: null },
    { question: 'Kota tempat dibacakannya Proklamasi Kemerdekaan adalah?', form_id: 10, type: 'radio', image: null }
  ]

  await knex('soal').insert(soal)
}