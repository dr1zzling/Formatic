/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Hapus data lama di tabel soal_option
  await knex('soal_option').del()

  // Ambil data soal yang sudah dimasukkan untuk memetakan ID secara akurat
  const allSoal = await knex('soal').select('id', 'question')
  const getSoalId = (questionText) => {
    const found = allSoal.find(s => s.question.trim().toLowerCase() === questionText.trim().toLowerCase())
    return found ? found.id : null
  }

  const rawOptionsData = [
    // --- Form 1: Matematika ---
    {
      question: '2 + 2 = ?',
      options: [
        { value: '4', image: null, is_correct: true },
        { value: '5', image: null, is_correct: false },
        { value: '6', image: null, is_correct: false },
        { value: '7', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pilih semua angka genap',
      options: [
        { value: '4', image: null, is_correct: true },
        { value: '5', image: null, is_correct: false },
        { value: '6', image: null, is_correct: true },
        { value: '2', image: null, is_correct: true }
      ]
    },
    {
      question: 'Berapakah hasil dari 5 x 6?',
      options: [
        { value: '30', image: null, is_correct: true },
        { value: '25', image: null, is_correct: false }
      ]
    },

    // --- Form 2: Pendidikan Pancasila ---
    {
      question: 'Pancasila terdiri dari berapa sila?',
      options: [
        { value: '3 Sila', image: null, is_correct: false },
        { value: '5 Sila', image: null, is_correct: true },
        { value: '7 Sila', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pilih semua simbol yang ada pada Garuda Pancasila',
      options: [
        { value: 'Bintang', image: '/uploads/options/bintang.png', is_correct: true },
        { value: 'Rantai', image: '/uploads/options/rantai.png', is_correct: true },
        { value: 'Pohon Beringin', image: '/uploads/options/pohon-beringin.png', is_correct: true }
      ]
    },
    {
      question: 'Lambang sila ke-3 adalah?',
      options: [
        { value: 'Pohon Beringin', image: '/uploads/options/pohon-beringin.png', is_correct: true },
        { value: 'Kepala Banteng', image: '/uploads/options/kepala-banteng.png', is_correct: false }
      ]
    },

    // --- Form 3: Bahasa Asing ---
    {
      question: 'Apa terjemahan dari "Thank you"?',
      options: [
        { value: 'Terima kasih', image: null, is_correct: true },
        { value: 'Sama-sama', image: null, is_correct: false },
        { value: 'Halo', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pilih semua kata dalam Bahasa Inggris yang merupakan kata benda (noun)',
      options: [
        { value: 'Book', image: '/uploads/options/book.png', is_correct: true },
        { value: 'Run', image: null, is_correct: false },
        { value: 'Beautiful', image: null, is_correct: false },
        { value: 'Pen', image: '/uploads/options/pen.png', is_correct: true }
      ]
    },
    {
      question: 'Manakah penulisan kata yang benar?',
      options: [
        { value: 'Receive', image: null, is_correct: true },
        { value: 'Recieve', image: null, is_correct: false }
      ]
    },

    // --- Form 4: Fisika Dasar ---
    {
      question: 'Satuan Internasional (SI) untuk gaya adalah?',
      options: [
        { value: 'Joule', image: null, is_correct: false },
        { value: 'Newton', image: null, is_correct: true },
        { value: 'Pascal', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pilih semua yang termasuk hukum Newton',
      options: [
        { value: 'Hukum I Newton', image: null, is_correct: true },
        { value: 'Hukum II Newton', image: null, is_correct: true },
        { value: 'Hukum Ohm', image: null, is_correct: false }
      ]
    },
    {
      question: 'Alat untuk mengukur arus listrik adalah?',
      options: [
        { value: 'Voltmeter', image: '/uploads/options/voltmeter.png', is_correct: false },
        { value: 'Ampermeter', image: '/uploads/options/ampermeter.png', is_correct: true }
      ]
    },

    // --- Form 5: Survei Kepuasan Siswa ---
    {
      question: 'Seberapa puas Anda dengan fasilitas sekolah saat ini?',
      options: [
        { value: 'Sangat Puas', image: null, is_correct: false },
        { value: 'Puas', image: null, is_correct: false },
        { value: 'Kurang Puas', image: null, is_correct: false }
      ]
    },
    {
      question: 'Fasilitas mana saja yang paling sering Anda gunakan?',
      options: [
        { value: 'Perpustakaan', image: null, is_correct: false },
        { value: 'Kantin', image: null, is_correct: false },
        { value: 'Laboratorium', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apakah jam pelajaran saat ini sudah efektif?',
      options: [
        { value: 'Ya', image: null, is_correct: false },
        { value: 'Tidak', image: null, is_correct: false }
      ]
    },

    // --- Form 6: Kimia Organik ---
    {
      question: 'Unsur utama dalam senyawa organik adalah?',
      options: [
        { value: 'Oksigen', image: null, is_correct: false },
        { value: 'Karbon', image: null, is_correct: true },
        { value: 'Nitrogen', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pilih semua kelompok turunan alkana',
      options: [
        { value: 'Alkanol', image: null, is_correct: true },
        { value: 'Alkanal', image: null, is_correct: true },
        { value: 'Benzena', image: '/uploads/options/benzena-structure.png', is_correct: false }
      ]
    },
    {
      question: 'Jumlah ikatan kovalen yang bisa dibentuk atom Karbon adalah?',
      options: [
        { value: '2', image: null, is_correct: false },
        { value: '4', image: null, is_correct: true }
      ]
    },

    // --- Form 7: Pendaftaran Ekstrakurikuler ---
    {
      question: 'Pilih hari latihan yang Anda sanggupi',
      options: [
        { value: 'Senin & Rabu', image: null, is_correct: false },
        { value: 'Selasa & Kamis', image: null, is_correct: false },
        { value: 'Sabtu', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pilih ekstrakurikuler yang ingin Anda ikuti',
      options: [
        { value: 'Pramuka', image: '/uploads/options/pramuka-logo.png', is_correct: false },
        { value: 'Paskibra', image: '/uploads/options/paskibra-logo.png', is_correct: false },
        { value: 'Futsal', image: '/uploads/options/futsal-logo.png', is_correct: false }
      ]
    },
    {
      question: 'Apakah Anda pernah memiliki pengalaman di bidang ini sebelumnya?',
      options: [
        { value: 'Pernah', image: null, is_correct: false },
        { value: 'Belum Pernah', image: null, is_correct: false }
      ]
    },

    // --- Form 8: Biologi Umum ---
    {
      question: 'Organel sel yang berfungsi sebagai pusat respirasi sel adalah?',
      options: [
        { value: 'Mitokondria', image: '/uploads/options/mitokondria.png', is_correct: true },
        { value: 'Ribosom', image: '/uploads/options/ribosom.png', is_correct: false }
      ]
    },
    {
      question: 'Pilih semua mahluk hidup yang tergolong vertebrata',
      options: [
        { value: 'Kucing', image: null, is_correct: true },
        { value: 'Burung', image: null, is_correct: true },
        { value: 'Cacing', image: null, is_correct: false }
      ]
    },
    {
      question: 'Proses pembelahan sel tubuh disebut?',
      options: [
        { value: 'Mitosis', image: null, is_correct: true },
        { value: 'Meiosis', image: null, is_correct: false }
      ]
    },

    // --- Form 9: Kuesioner Fasilitas Sekolah ---
    {
      question: 'Bagaimana kondisi kebersihan laboratorium komputer?',
      options: [
        { value: 'Sangat Bersih', image: null, is_correct: false },
        { value: 'Cukup Bersih', image: null, is_correct: false },
        { value: 'Kotor', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pilih area sekolah yang membutuhkan pencahayaan tambahan',
      options: [
        { value: 'Kantin Belakang', image: null, is_correct: false },
        { value: 'Samping Lab', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apakah koneksi Wi-Fi sekolah cukup stabil?',
      options: [
        { value: 'Sangat Stabil', image: null, is_correct: false },
        { value: 'Sering Putus', image: null, is_correct: false }
      ]
    },

    // --- Form 10: Sejarah Indonesia ---
    {
      question: 'Kapan Proklamasi Kemerdekaan Indonesia dibacakan?',
      options: [
        { value: '17 Agustus 1945', image: null, is_correct: true },
        { value: '18 Agustus 1945', image: null, is_correct: false },
        { value: '20 Mei 1908', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pilih semua nama pahlawan nasional yang berasal dari Jawa',
      options: [
        { value: 'Pangeran Diponegoro', image: '/uploads/options/diponegoro.png', is_correct: true },
        { value: 'Jenderal Soedirman', image: '/uploads/options/soedirman.png', is_correct: true },
        { value: 'Sisingamangaraja', image: '/uploads/options/sisingamangaraja.png', is_correct: false }
      ]
    },
    {
      question: 'Kota tempat dibacakannya Proklamasi Kemerdekaan adalah?',
      options: [
        { value: 'Jakarta', image: null, is_correct: true },
        { value: 'Bandung', image: null, is_correct: false }
      ]
    }
  ]

  const rowsToInsert = []

  rawOptionsData.forEach(item => {
    const sId = getSoalId(item.question)
    if (sId) {
      item.options.forEach(opt => {
        rowsToInsert.push({
          soal_id: sId,
          value: opt.value,
          image: opt.image,
          is_correct: opt.is_correct
        })
      })
    }
  })

  if (rowsToInsert.length > 0) {
    await knex('soal_option').insert(rowsToInsert)
  }
}