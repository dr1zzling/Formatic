/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('soal_option').del()
  await knex('option_value').del()

  await knex('option_value').insert([
    // Form 1 - Matematika
    /* 1  */ { value: '4', image: null },
    /* 2  */ { value: '5', image: null },
    /* 3  */ { value: '6', image: null },
    /* 4  */ { value: '7', image: null },
    /* 5  */ { value: '2', image: null },
    /* 6  */ { value: '3', image: null },
    /* 7  */ { value: '30', image: null },
    /* 8  */ { value: '25', image: null },

    // Form 2 - Pancasila
    /* 9  */ { value: '3 Sila', image: null },
    /* 10 */ { value: '5 Sila', image: null },
    /* 11 */ { value: '7 Sila', image: null },
    /* 12 */ { value: 'Bintang', image: '/uploads/options/bintang.png' },
    /* 13 */ { value: 'Rantai', image: '/uploads/options/rantai.png' },
    /* 14 */ { value: 'Pohon Beringin', image: '/uploads/options/pohon-beringin.png' },
    /* 15 */ { value: 'Kepala Banteng', image: '/uploads/options/kepala-banteng.png' },

    // Form 3 - Bahasa Asing
    /* 16 */ { value: 'Terima kasih', image: null },
    /* 17 */ { value: 'Sama-sama', image: null },
    /* 18 */ { value: 'Halo', image: null },
    /* 19 */ { value: 'Book', image: '/uploads/options/book.png' },
    /* 20 */ { value: 'Run', image: null },
    /* 21 */ { value: 'Beautiful', image: null },
    /* 22 */ { value: 'Pen', image: '/uploads/options/pen.png' },
    /* 23 */ { value: 'Receive', image: null },
    /* 24 */ { value: 'Recieve', image: null },

    // Form 4 - Fisika Dasar
    /* 25 */ { value: 'Joule', image: null },
    /* 26 */ { value: 'Newton', image: null },
    /* 27 */ { value: 'Pascal', image: null },
    /* 28 */ { value: 'Hukum I Newton', image: null },
    /* 29 */ { value: 'Hukum II Newton', image: null },
    /* 30 */ { value: 'Hukum Ohm', image: null },
    /* 31 */ { value: 'Voltmeter', image: '/uploads/options/voltmeter.png' },
    /* 32 */ { value: 'Ampermeter', image: '/uploads/options/ampermeter.png' },

    // Form 5 - Survei Kepuasan Siswa
    /* 33 */ { value: 'Sangat Puas', image: null },
    /* 34 */ { value: 'Puas', image: null },
    /* 35 */ { value: 'Kurang Puas', image: null },
    /* 36 */ { value: 'Perpustakaan', image: null },
    /* 37 */ { value: 'Kantin', image: null },
    /* 38 */ { value: 'Laboratorium', image: null },
    /* 39 */ { value: 'Ya', image: null },
    /* 40 */ { value: 'Tidak', image: null },

    // Form 6 - Kimia Organik
    /* 41 */ { value: 'Oksigen', image: null },
    /* 42 */ { value: 'Karbon', image: null },
    /* 43 */ { value: 'Nitrogen', image: null },
    /* 44 */ { value: 'Alkanol', image: null },
    /* 45 */ { value: 'Alkanal', image: null },
    /* 46 */ { value: 'Benzena', image: '/uploads/options/benzena-structure.png' },
    /* 47 */ { value: '2', image: null },
    /* 48 */ { value: '4', image: null },

    // Form 7 - Pendaftaran Ekstrakurikuler
    /* 49 */ { value: 'Senin & Rabu', image: null },
    /* 50 */ { value: 'Selasa & Kamis', image: null },
    /* 51 */ { value: 'Sabtu', image: null },
    /* 52 */ { value: 'Pramuka', image: '/uploads/options/pramuka-logo.png' },
    /* 53 */ { value: 'Paskibra', image: '/uploads/options/paskibra-logo.png' },
    /* 54 */ { value: 'Futsal', image: '/uploads/options/futsal-logo.png' },
    /* 55 */ { value: 'Pernah', image: null },
    /* 56 */ { value: 'Belum Pernah', image: null },

    // Form 8 - Biologi Umum
    /* 57 */ { value: 'Mitokondria', image: '/uploads/options/mitokondria.png' },
    /* 58 */ { value: 'Ribosom', image: '/uploads/options/ribosom.png' },
    /* 59 */ { value: 'Kucing', image: null },
    /* 60 */ { value: 'Burung', image: null },
    /* 61 */ { value: 'Cacing', image: null },
    /* 62 */ { value: 'Mitosis', image: null },
    /* 63 */ { value: 'Meiosis', image: null },

    // Form 9 - Kuesioner Fasilitas Sekolah
    /* 64 */ { value: 'Sangat Bersih', image: null },
    /* 65 */ { value: 'Cukup Bersih', image: null },
    /* 66 */ { value: 'Kotor', image: null },
    /* 67 */ { value: 'Kantin Belakang', image: null },
    /* 68 */ { value: 'Samping Lab', image: null },
    /* 69 */ { value: 'Sangat Stabil', image: null },
    /* 70 */ { value: 'Sering Putus', image: null },

    // Form 10 - Sejarah Indonesia
    /* 71 */ { value: '17 Agustus 1945', image: null },
    /* 72 */ { value: '18 Agustus 1945', image: null },
    /* 73 */ { value: '20 Mei 1908', image: null },
    /* 74 */ { value: 'Pangeran Diponegoro', image: '/uploads/options/diponegoro.png' },
    /* 75 */ { value: 'Jenderal Soedirman', image: '/uploads/options/soedirman.png' },
    /* 76 */ { value: 'Sisingamangaraja', image: '/uploads/options/sisingamangaraja.png' },
    /* 77 */ { value: 'Jakarta', image: null },
    /* 78 */ { value: 'Bandung', image: null }
  ])
}