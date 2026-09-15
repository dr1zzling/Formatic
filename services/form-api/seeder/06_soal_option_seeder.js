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
    },

    //form 11
    // --- PG 1 - 30 ---
    { question: 'Danau terbesar di Indonesia adalah?', options: [{ value: 'Danau Toba', image: null, is_correct: true }, { value: 'Danau Singkarak', image: null, is_correct: false }, { value: 'Danau Maninjau', image: null, is_correct: false }, { value: 'Danau Towuti', image: null, is_correct: false }] },
    { question: 'Ibu kota provinsi Jawa Barat adalah?', options: [{ value: 'Bandung', image: null, is_correct: true }, { value: 'Bogor', image: null, is_correct: false }, { value: 'Bekasi', image: null, is_correct: false }, { value: 'Cirebon', image: null, is_correct: false }] },
    { question: 'Gunung tertinggi di pulau Jawa adalah?', options: [{ value: 'Gunung Semeru', image: null, is_correct: true }, { value: 'Gunung Slamet', image: null, is_correct: false }, { value: 'Gunung Merbabu', image: null, is_correct: false }, { value: 'Gunung Bromo', image: null, is_correct: false }] },
    { question: 'Manakah samudra yang mengapit wilayah Indonesia di sebelah barat?', options: [{ value: 'Samudra Hindia', image: null, is_correct: true }, { value: 'Samudra Pasifik', image: null, is_correct: false }, { value: 'Samudra Atlantik', image: null, is_correct: false }, { value: 'Samudra Arktik', image: null, is_correct: false }] },
    { question: 'Batas wilayah Indonesia bagian utara berbatasan darat langsung dengan?', options: [{ value: 'Malaysia', image: null, is_correct: true }, { value: 'Filipina', image: null, is_correct: false }, { value: 'Singapura', image: null, is_correct: false }, { value: 'Vietnam', image: null, is_correct: false }] },
    { question: 'Selat yang memisahkan Pulau Jawa dan Pulau Sumatra adalah?', options: [{ value: 'Selat Sunda', image: null, is_correct: true }, { value: 'Selat Malaka', image: null, is_correct: false }, { value: 'Selat Bali', image: null, is_correct: false }, { value: 'Selat Lombok', image: null, is_correct: false }] },
    { question: 'Suku asli yang mendiami wilayah Papua adalah?', options: [{ value: 'Suku Asmat', image: null, is_correct: true }, { value: 'Suku Dayak', image: null, is_correct: false }, { value: 'Suku Bugis', image: null, is_correct: false }, { value: 'Suku Baduy', image: null, is_correct: false }] },
    { question: 'Provinsi paling barat di wilayah Indonesia adalah?', options: [{ value: 'Aceh', image: null, is_correct: true }, { value: 'Sumatra Utara', image: null, is_correct: false }, { value: 'Riau', image: null, is_correct: false }, { value: 'Lampung', image: null, is_correct: false }] },
    { question: 'Iklim utama yang dimiliki oleh negara Indonesia adalah?', options: [{ value: 'Tropis', image: null, is_correct: true }, { value: 'Subtropis', image: null, is_correct: false }, { value: 'Sedang', image: null, is_correct: false }, { value: 'Kutub', image: null, is_correct: false }] },
    { question: 'Angin monsun barat yang bertiup di Indonesia menyebabkan musim?', options: [{ value: 'Hujan', image: null, is_correct: true }, { value: 'Kemarau', image: null, is_correct: false }, { value: 'Pancaroba', image: null, is_correct: false }, { value: 'Salju', image: null, is_correct: false }] },

    { question: 'Sungai terpanjang di Indonesia terletak di pulau?', options: [{ value: 'Kalimantan', image: null, is_correct: true }, { value: 'Sumatra', image: null, is_correct: false }, { value: 'Jawa', image: null, is_correct: false }, { value: 'Papua', image: null, is_correct: false }] },
    { question: 'Cagar alam Ujung Kulon terkenal sebagai tempat perlindungan?', options: [{ value: 'Badak Bercula Satu', image: null, is_correct: true }, { value: 'Gajah Sumatra', image: null, is_correct: false }, { value: 'Harimau Jawa', image: null, is_correct: false }, { value: 'Orangutan', image: null, is_correct: false }] },
    { question: 'Zona waktu Indonesia Barat (WIB) mencakup wilayah?', options: [{ value: 'Jawa dan Sumatra', image: null, is_correct: true }, { value: 'Bali dan Nusa Tenggara', image: null, is_correct: false }, { value: 'Sulawesi dan Maluku', image: null, is_correct: false }, { value: 'Papua', image: null, is_correct: false }] },
    { question: 'Garis khatulistiwa melewati salah satu kota besar di Indonesia, yaitu?', options: [{ value: 'Pontianak', image: null, is_correct: true }, { value: 'Padang', image: null, is_correct: false }, { value: 'Balikpapan', image: null, is_correct: false }, { value: 'Manado', image: null, is_correct: false }] },
    { question: 'Laut dangkal yang menghubungkan Pulau Jawa, Sumatra, dan Kalimantan adalah?', options: [{ value: 'Paparan Sunda', image: null, is_correct: true }, { value: 'Paparan Sahul', image: null, is_correct: false }, { value: 'Laut Banda', image: null, is_correct: false }, { value: 'Palung Sulawesi', image: null, is_correct: false }] },
    { question: 'Taman Nasional Bunaken terkenal dengan keindahan alam?', options: [{ value: 'Taman Bawah Laut', image: null, is_correct: true }, { value: 'Hutan Hujan Tropis', image: null, is_correct: false }, { value: 'Kawah Vulkanik', image: null, is_correct: false }, { value: 'Padang Savana', image: null, is_correct: false }] },
    { question: 'Pulau di Indonesia yang dikenal dengan julukan Pulau Dewata adalah?', options: [{ value: 'Bali', image: null, is_correct: true }, { value: 'Lombok', image: null, is_correct: false }, { value: 'Nias', image: null, is_correct: false }, { value: 'Madura', image: null, is_correct: false }] },
    { question: 'Puncak gunung di Indonesia yang memiliki salju abadi adalah?', options: [{ value: 'Puncak Jaya', image: null, is_correct: true }, { value: 'Gunung Kerinci', image: null, is_correct: false }, { value: 'Gunung Rinjani', image: null, is_correct: false }, { value: 'Gunung Agung', image: null, is_correct: false }] },
    { question: 'Pola pemukiman penduduk di daerah pesisir pantai biasanya memanjang mengikuti?', options: [{ value: 'Garis Pantai', image: null, is_correct: true }, { value: 'Garis Jalan Raya', image: null, is_correct: false }, { value: 'Aliran Sungai', image: null, is_correct: false }, { value: 'Kontur Pegunungan', image: null, is_correct: false }] },
    { question: 'Hasil tambang utama yang dihasilkan di pulau Bangka Belitung adalah?', options: [{ value: 'Timah', image: null, is_correct: true }, { value: 'Emas', image: null, is_correct: false }, { value: 'Batu Bara', image: null, is_correct: false }, { value: 'Minyak Bumi', image: null, is_correct: false }] },

    { question: 'Fenomena gempa bumi di Indonesia sering terjadi karena posisi geologisnya berada pada garis?', options: [{ value: 'Ring of Fire', image: null, is_correct: true }, { value: 'Sirkum Atlantik', image: null, is_correct: false }, { value: 'Garis Ekuator', image: null, is_correct: false }, { value: 'Palung Mariana', image: null, is_correct: false }] },
    { question: 'Spesies komodo hanya dapat ditemukan secara alami di provinsi?', options: [{ value: 'Nusa Tenggara Timur', image: null, is_correct: true }, { value: 'Nusa Tenggara Barat', image: null, is_correct: false }, { value: 'Bali', image: null, is_correct: false }, { value: 'Maluku', image: null, is_correct: false }] },
    { question: 'Perbatasan darat sebelah timur Indonesia berbatasan langsung dengan negara?', options: [{ value: 'Papua Nugini', image: null, is_correct: true }, { value: 'Timor Leste', image: null, is_correct: false }, { value: 'Australia', image: null, is_correct: false }, { value: 'Palau', image: null, is_correct: false }] },
    { question: 'Garis yang memisahkan tipe fauna Asiatis dan Peralihan di Indonesia adalah?', options: [{ value: 'Garis Wallace', image: null, is_correct: true }, { value: 'Garis Weber', image: null, is_correct: false }, { value: 'Garis Lydekker', image: null, is_correct: false }, { value: 'Garis Ekuator', image: null, is_correct: false }] },
    { question: 'Tanah yang terbentuk dari endapan lumpur sungai disebut tanah?', options: [{ value: 'Aluvial', image: null, is_correct: true }, { value: 'Vulkanik', image: null, is_correct: false }, { value: 'Gambut', image: null, is_correct: false }, { value: 'Kapur', image: null, is_correct: false }] },
    { question: 'Gunung Krakatau terletak di perairan selat?', options: [{ value: 'Selat Sunda', image: null, is_correct: true }, { value: 'Selat Bali', image: null, is_correct: false }, { value: 'Selat Lombok', image: null, is_correct: false }, { value: 'Selat Makassar', image: null, is_correct: false }] },
    { question: 'Pusat pemerintahan baru Indonesia (IKN Nusantara) dibangun di provinsi?', options: [{ value: 'Kalimantan Timur', image: null, is_correct: true }, { value: 'Kalimantan Selatan', image: null, is_correct: false }, { value: 'Kalimantan Barat', image: null, is_correct: false }, { value: 'Kalimantan Tengah', image: null, is_correct: false }] },
    { question: 'Jenis hutan yang berfungsi menahan erosi air laut di kawasan pesisir adalah?', options: [{ value: 'Hutan Mangrove', image: null, is_correct: true }, { value: 'Hutan Hujan', image: null, is_correct: false }, { value: 'Hutan Sabana', image: null, is_correct: false }, { value: 'Hutan Musim', image: null, is_correct: false }] },
    { question: 'Komoditas rempah unggulan yang berasal dari Kepulauan Maluku adalah?', options: [{ value: 'Pala dan Cengkih', image: null, is_correct: true }, { value: 'Lada dan Kopi', image: null, is_correct: false }, { value: 'Padi dan Jagung', image: null, is_correct: false }, { value: 'Teh dan Tembakau', image: null, is_correct: false }] },
    { question: 'Sebutan untuk deretan gunung api aktif yang melintasi wilayah Indonesia adalah?', options: [{ value: 'Sirkum Pasifik', image: null, is_correct: true }, { value: 'Sirkum Alpina', image: null, is_correct: false }, { value: 'Pegunungan Himalaya', image: null, is_correct: false }, { value: 'Pegunungan Andes', image: null, is_correct: false }] },

    // --- BENAR / SALAH 31 - 40 ---
    { question: 'Pernyataan: Indonesia memiliki 3 zona pembagian waktu.', options: [{ value: 'Benar', image: null, is_correct: true }, { value: 'Salah', image: null, is_correct: false }] },
    { question: 'Pernyataan: Pulau Kalimantan berbatasan darat dengan negara Malaysia dan Brunei.', options: [{ value: 'Benar', image: null, is_correct: true }, { value: 'Salah', image: null, is_correct: false }] },
    { question: 'Pernyataan: Burung Cendrawasih merupakan contoh fauna tipe Asiatis.', options: [{ value: 'Benar', image: null, is_correct: false }, { value: 'Salah', image: null, is_correct: true }] },
    { question: 'Pernyataan: Danau Toba terbentuk akibat erupsi gunung berapi purba (supervolcano).', options: [{ value: 'Benar', image: null, is_correct: true }, { value: 'Salah', image: null, is_correct: false }] },
    { question: 'Pernyataan: Indonesia berada pada pertemuan tiga lempeng tektonik utama dunia.', options: [{ value: 'Benar', image: null, is_correct: true }, { value: 'Salah', image: null, is_correct: false }] },
    { question: 'Pernyataan: Selat Makassar memisahkan Pulau Sumatra dan Kalimantan.', options: [{ value: 'Benar', image: null, is_correct: false }, { value: 'Salah', image: null, is_correct: true }] },
    { question: 'Pernyataan: Garis Weber memisahkan jenis fauna Peralihan dan Australis.', options: [{ value: 'Benar', image: null, is_correct: true }, { value: 'Salah', image: null, is_correct: false }] },
    { question: 'Pernyataan: Provinsi Sulawesi Selatan beribu kota di Makassar.', options: [{ value: 'Benar', image: null, is_correct: true }, { value: 'Salah', image: null, is_correct: false }] },
    { question: 'Pernyataan: Wilayah iklim di Indonesia tergolong iklim subtropis.', options: [{ value: 'Benar', image: null, is_correct: false }, { value: 'Salah', image: null, is_correct: true }] },
    { question: 'Pernyataan: Gunung Merapi tergolong gunung api tipe aktif yang ada di Jawa Tengah/Yogyakarta.', options: [{ value: 'Benar', image: null, is_correct: true }, { value: 'Salah', image: null, is_correct: false }] },

    // --- Form 12: Bahasa Indonesia (Lanjutan Option 13-30 & Benar/Salah) ---
    {
      question: 'Teks yang berisi petunjuk pembuatan sesuatu secara berurutan disebut?',
      options: [
        { value: 'Teks Prosedur', image: null, is_correct: true },
        { value: 'Teks Eksplanasi', image: null, is_correct: false },
        { value: 'Teks Laporan', image: null, is_correct: false },
        { value: 'Teks Narasi', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kalimat efektif harus memiliki kelengkapan unsur minimal berupa?',
      options: [
        { value: 'Subjek dan Predikat', image: null, is_correct: true },
        { value: 'Subjek dan Objek', image: null, is_correct: false },
        { value: 'Predikat dan Keterangan', image: null, is_correct: false },
        { value: 'Objek dan Pelengkap', image: null, is_correct: false }
      ]
    },
    {
      question: 'Tujuan utama penulisan teks eksposisi adalah?',
      options: [
        { value: 'Menjelaskan informasi atau pengetahuan kepada pembaca', image: null, is_correct: true },
        { value: 'Menceritakan kisah hiburan', image: null, is_correct: false },
        { value: 'Mempengaruhi opini publik secara paksa', image: null, is_correct: false },
        { value: 'Menggambarkan objek secara mendetail', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagian akhir teks prosedur yang berisi penyimpulan atau saran dinamakan?',
      options: [
        { value: 'Penutup / Penegasan Ulang', image: null, is_correct: true },
        { value: 'Langkah-langkah', image: null, is_correct: false },
        { value: 'Tujuan', image: null, is_correct: false },
        { value: 'Material', image: null, is_correct: false }
      ]
    },
    {
      question: 'Ide Pokok sebuah teks dapat ditemukan melalui langkah?',
      options: [
        { value: 'Membaca keseluruhan paragraf dan menemukan kalimat utama', image: null, is_correct: true },
        { value: 'Membaca kata pertama di setiap baris', image: null, is_correct: false },
        { value: 'Menghitung jumlah kalimat dalam paragraf', image: null, is_correct: false },
        { value: 'Mencari kata serapan asing', image: null, is_correct: false }
      ]
    },
    {
      question: 'Sifat dari teks berita yang menyajikan informasi terkini dan aktual adalah?',
      options: [
        { value: 'Faktual dan Aktual', image: null, is_correct: true },
        { value: 'Fiktif dan Imajinatif', image: null, is_correct: false },
        { value: 'Opini Pribadi', image: null, is_correct: false },
        { value: 'Subjektif', image: null, is_correct: false }
      ]
    },
    {
      question: 'Majas personifikasi ditunjukkan oleh kalimat?',
      options: [
        { value: 'Angin menyapa dedaunan di pagi hari', image: null, is_correct: true },
        { value: 'Wajahnya bagaikan rembulan', image: null, is_correct: false },
        { value: 'Suaranya menggelegar membelah angkasa', image: null, is_correct: false },
        { value: 'Singgahlah ke gubuk kami yang sederhana', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kata berimbuhan me-kan yang tepat pada kalimat adalah?',
      options: [
        { value: 'Ibu membalikkan halaman buku', image: null, is_correct: true },
        { value: 'Dia membalikan barang itu', image: null, is_correct: false },
        { value: 'Adik mentuliskan surat', image: null, is_correct: false },
        { value: 'Mereka memlakukan latihan', image: null, is_correct: false }
      ]
    },
    {
      question: 'Ringkasan singkat dari seluruh isi karya ilmiah dinamakan?',
      options: [
        { value: 'Abstrak', image: null, is_correct: true },
        { value: 'Kutipan', image: null, is_correct: false },
        { value: 'Daftar Pustaka', image: null, is_correct: false },
        { value: 'Lampiran', image: null, is_correct: false }
      ]
    },
    {
      question: 'Salah satu contoh imbuhan asing yang diserap ke dalam bahasa Indonesia adalah?',
      options: [
        { value: '-isasi', image: null, is_correct: true },
        { value: 'ter-', image: null, is_correct: false },
        { value: 'ber-', image: null, is_correct: false },
        { value: 'ke-an', image: null, is_correct: false }
      ]
    },
    {
      question: 'Teks ulasan bertujuan untuk memberikan nilai kritis terhadap?',
      options: [
        { value: 'Sebuah karya (buku, film, drama)', image: null, is_correct: true },
        { value: 'Bencana alam', image: null, is_correct: false },
        { value: 'Laporan keuangan', image: null, is_correct: false },
        { value: 'Tata tertib sekolah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kata denotatif adalah kata yang memiliki makna?',
      options: [
        { value: 'Sebenarnya / Harfiah', image: null, is_correct: true },
        { value: 'Kiasan', image: null, is_correct: false },
        { value: 'Ganda', image: null, is_correct: false },
        { value: 'Tersirat', image: null, is_correct: false }
      ]
    },
    {
      question: 'Gaya bahasa yang melebih-lebihkan kenyataan dinamakan?',
      options: [
        { value: 'Hiperbola', image: null, is_correct: true },
        { value: 'Litotes', image: null, is_correct: false },
        { value: 'Ironi', image: null, is_correct: false },
        { value: 'Metonimia', image: null, is_correct: false }
      ]
    },
    {
      question: 'Konjungsi yang menyatakan hubungan sebab-akibat adalah?',
      options: [
        { value: 'Oleh karena itu', image: null, is_correct: true },
        { value: 'Tetapi', image: null, is_correct: false },
        { value: 'Atau', image: null, is_correct: false },
        { value: 'Melainkan', image: null, is_correct: false }
      ]
    },
    {
      question: 'Informasi tambahan yang berfungsi menjelaskan gagasan utama disebut?',
      options: [
        { value: 'Gagasan penjelas / Kalimat penjelas', image: null, is_correct: true },
        { value: 'Ide pokok', image: null, is_correct: false },
        { value: 'Topik utama', image: null, is_correct: false },
        { value: 'Kesimpulan', image: null, is_correct: false }
      ]
    },
    {
      question: 'Teks eksplanasi disusun berdasarkan fakta mengenai fenomena?',
      options: [
        { value: 'Alam atau Sosial', image: null, is_correct: true },
        { value: 'Fiksi ilmiah', image: null, is_correct: false },
        { value: 'Dongeng rakyat', image: null, is_correct: false },
        { value: 'Mitos lokal', image: null, is_correct: false }
      ]
    },
    {
      question: 'Rangkaian peristiwa dalam sebuah cerita/cerpen disebut?',
      options: [
        { value: 'Alur / Plot', image: null, is_correct: true },
        { value: 'Latar', image: null, is_correct: false },
        { value: 'Tema', image: null, is_correct: false },
        { value: 'Amanat', image: null, is_correct: false }
      ]
    },
    {
      question: 'Karakter atau watak tokoh dalam cerita dapat disimpulkan melalui?',
      options: [
        { value: 'Tindakan, dialog, dan pikiran tokoh', image: null, is_correct: true },
        { value: 'Judul buku', image: null, is_correct: false },
        { value: 'Jumlah halaman cerita', image: null, is_correct: false },
        { value: 'Desain sampul', image: null, is_correct: false }
      ]
    },
    {
      question: 'Penggunaan tanda baca titik dua (:) yang tepat adalah?',
      options: [
        { value: 'Ibu membeli bahan masakan: bayam, tempe, dan tahu.', image: null, is_correct: true },
        { value: 'Ibu membeli: bayam tempe dan tahu.', image: null, is_correct: false },
        { value: 'Ibu: membeli bayam, tempe, dan tahu.', image: null, is_correct: false },
        { value: 'Ibu membeli bayam: tempe dan tahu.', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pesan moral yang ingin disampaikan pengarang kepada pembaca disebut?',
      options: [
        { value: 'Amanat', image: null, is_correct: true },
        { value: 'Tema', image: null, is_correct: false },
        { value: 'Latar', image: null, is_correct: false },
        { value: 'Sudut pandang', image: null, is_correct: false }
      ]
    },

    // --- BENAR / SALAH (PAGE 4) ---
    {
      question: 'Teks tanggapan kritis bertujuan untuk memuji atau mengkritik suatu karya secara obyektif.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Majas hiperbola menggunakan kata-kata pembanding seperti "bagaikan" atau "seperti".',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Unsur ekstrinsik cerpen mencakup latar belakang kehidupan pengarang.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kata konotatif adalah kata yang bermakna sebenarnya atau harfiah.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Teks anekdot berisi cerita lucu yang mengandung sindiran moral atau sosial.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kalimat pasif selalu ditandai dengan predikat berimbuhan me- atau ber-.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Abstrak dalam karya tulis ilmiah biasanya memuat ringkasan metodologi dan hasil.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Latar waktu dan tempat termasuk dalam bagian struktur alur.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },

    //form 13
    {
      question: 'Bagaimana kualitas penyampaian materi oleh pengajar secara umum selama proses KBM?',
      options: [
        { value: 'Sangat Baik', image: null, is_correct: false },
        { value: 'Baik', image: null, is_correct: false },
        { value: 'Cukup', image: null, is_correct: false },
        { value: 'Kurang Baik', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa jelas instruksi dan penjelasan yang diberikan saat penyampaian tugas kelas?',
      options: [
        { value: 'Sangat Jelas', image: null, is_correct: false },
        { value: 'Jelas', image: null, is_correct: false },
        { value: 'Cukup Jelas', image: null, is_correct: false },
        { value: 'Kurang Jelas', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana tingkat kelengkapan dan keterbacaan modul/materi ajar yang disediakan?',
      options: [
        { value: 'Sangat Lengkap & Jelas', image: null, is_correct: false },
        { value: 'Lengkap', image: null, is_correct: false },
        { value: 'Cukup', image: null, is_correct: false },
        { value: 'Kurang Lengkap', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa responsif pengajar dalam menjawab pertanyaan atau kendala siswa di luar jam kelas?',
      options: [
        { value: 'Sangat Responsif', image: null, is_correct: false },
        { value: 'Responsif', image: null, is_correct: false },
        { value: 'Cukup Responsif', image: null, is_correct: false },
        { value: 'Lambat Respons', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana kesesuaian antara alokasi waktu pelajaran dengan beban materi yang disampaikan?',
      options: [
        { value: 'Sangat Sesuai', image: null, is_correct: false },
        { value: 'Sesuai', image: null, is_correct: false },
        { value: 'Cukup Sesuai', image: null, is_correct: false },
        { value: 'Kurang Sesuai', image: null, is_correct: false }
      ]
    },

    // --- PAGE 2 ---
    {
      question: 'Seberapa seimbang jumlah tugas mandiri yang diberikan dibanding waktu istirahat siswa?',
      options: [
        { value: 'Sangat Seimbang', image: null, is_correct: false },
        { value: 'Seimbang', image: null, is_correct: false },
        { value: 'Cukup Seimbang', image: null, is_correct: false },
        { value: 'Terlalu Memberatkan', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana keterandalan platform atau media pembelajaran online yang digunakan?',
      options: [
        { value: 'Sangat Stabil & Mudah Digunakan', image: null, is_correct: false },
        { value: 'Stabil', image: null, is_correct: false },
        { value: 'Cukup / Kadang Sering Kendala', image: null, is_correct: false },
        { value: 'Sering Bermasalah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa aktif pengajar membangun diskusi dan interaksi dua arah di dalam kelas?',
      options: [
        { value: 'Sangat Aktif', image: null, is_correct: false },
        { value: 'Aktif', image: null, is_correct: false },
        { value: 'Cukup Aktif', image: null, is_correct: false },
        { value: 'Kurang Aktif (Monoton)', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana ketepatan waktu pengajar dalam memulai dan mengakhiri sesi pembelajaran?',
      options: [
        { value: 'Sangat Tepat Waktu', image: null, is_correct: false },
        { value: 'Tepat Waktu', image: null, is_correct: false },
        { value: 'Cukup Tepat Waktu', image: null, is_correct: false },
        { value: 'Sering Terlambat/Molor', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa objektif dan transparan sistem penilaian yang diterapkan oleh pengajar?',
      options: [
        { value: 'Sangat Transparan & Objektif', image: null, is_correct: false },
        { value: 'Transparan', image: null, is_correct: false },
        { value: 'Cukup Transparan', image: null, is_correct: false },
        { value: 'Kurang Transparan', image: null, is_correct: false }
      ]
    },

    // --- PAGE 3 ---
    {
      question: 'Bagaimana kecukupan fasilitas fisik/sarana penunjang kelas yang tersedia?',
      options: [
        { value: 'Sangat Memadai', image: null, is_correct: false },
        { value: 'Memadai', image: null, is_correct: false },
        { value: 'Cukup Memadai', image: null, is_correct: false },
        { value: 'Kurang Memadai', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa menarik penggunaan variasi media pembelajaran (video, kuis interaktif, dll)?',
      options: [
        { value: 'Sangat Menarik', image: null, is_correct: false },
        { value: 'Menarik', image: null, is_correct: false },
        { value: 'Cukup Menarik', image: null, is_correct: false },
        { value: 'Membosankan', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana pemahaman kamu terhadap capaian pembelajaran setelah mengikuti semester ini?',
      options: [
        { value: 'Sangat Paham', image: null, is_correct: false },
        { value: 'Paham', image: null, is_correct: false },
        { value: 'Cukup Paham', image: null, is_correct: false },
        { value: 'Kurang Paham', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa baik ruang dan fleksibilitas yang diberikan untuk berkonsultasi mengenai hambatan belajar?',
      options: [
        { value: 'Sangat Terbuka', image: null, is_correct: false },
        { value: 'Terbuka', image: null, is_correct: false },
        { value: 'Cukup Terbuka', image: null, is_correct: false },
        { value: 'Terbatas', image: null, is_correct: false }
      ]
    },
    {
      question: 'Secara keseluruhan, seberapa puas kamu terhadap pelaksanaan KBM tahun 2026 ini?',
      options: [
        { value: 'Sangat Puas', image: null, is_correct: false },
        { value: 'Puas', image: null, is_correct: false },
        { value: 'Cukup Puas', image: null, is_correct: false },
        { value: 'Kurang Puas', image: null, is_correct: false }
      ]
    },

    // --- Form 14: Ekonomi Dasar (Lanjutan Options 1-30 & Benar/Salah) ---

    // --- PILIHAN GANDA (PAGE 1) ---
    {
      question: 'Masalah pokok ekonomi modern yang dihadapi oleh masyarakat adalah?',
      options: [
        { value: 'What, How, dan For Whom', image: null, is_correct: true },
        { value: 'Produksi, Konsumsi, dan Distribusi', image: null, is_correct: false },
        { value: 'Pinjaman, Modal, dan Profit', image: null, is_correct: false },
        { value: 'Ekspor, Impor, dan Kurs', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kondisi di mana sumber daya terbatas sedangkan kebutuhan manusia tidak terbatas disebut?',
      options: [
        { value: 'Kelangkaan (Scarcity)', image: null, is_correct: true },
        { value: 'Kemiskinan', image: null, is_correct: false },
        { value: 'Inflasi', image: null, is_correct: false },
        { value: 'Keseimbangan Pasar', image: null, is_correct: false }
      ]
    },
    {
      question: 'Nilai dari alternatif terbaik yang dikorbankan ketika memilih suatu pilihan dinamakan?',
      options: [
        { value: 'Biaya Peluang (Opportunity Cost)', image: null, is_correct: true },
        { value: 'Biaya Produksi', image: null, is_correct: false },
        { value: 'Biaya Tetap', image: null, is_correct: false },
        { value: 'Biaya Variabel', image: null, is_correct: false }
      ]
    },
    {
      question: 'Hukum permintaan menyatakan bahwa jika harga suatu barang naik, maka jumlah permintaan akan?',
      options: [
        { value: 'Turun', image: null, is_correct: true },
        { value: 'Naik', image: null, is_correct: false },
        { value: 'Tetap', image: null, is_correct: false },
        { value: 'Tidak menentu', image: null, is_correct: false }
      ]
    },
    {
      question: 'Hukum penawaran menunjukkan hubungan yang searah antara harga barang dengan?',
      options: [
        { value: 'Jumlah barang yang ditawarkan', image: null, is_correct: true },
        { value: 'Jumlah barang yang diminta', image: null, is_correct: false },
        { value: 'Pendapatan konsumen', image: null, is_correct: false },
        { value: 'Biaya simpan produsen', image: null, is_correct: false }
      ]
    },
    {
      question: 'Titik potong antara kurva permintaan dan kurva penawaran dinamakan titik?',
      options: [
        { value: 'Keseimbangan Pasar (Equilibrium)', image: null, is_correct: true },
        { value: 'Puncak Profit', image: null, is_correct: false },
        { value: 'Break Even Point', image: null, is_correct: false },
        { value: 'Batas Maksimum Harga', image: null, is_correct: false }
      ]
    },
    {
      question: 'Sistem ekonomi di mana pemerintah memegang kendali penuh atas kegiatan ekonomi adalah?',
      options: [
        { value: 'Sistem Ekonomi Komando / Terpusat', image: null, is_correct: true },
        { value: 'Sistem Ekonomi Pasar', image: null, is_correct: false },
        { value: 'Sistem Ekonomi Tradisional', image: null, is_correct: false },
        { value: 'Sistem Ekonomi Campuran', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pasar yang hanya terdiri dari satu penjual dan banyak pembeli disebut pasar?',
      options: [
        { value: 'Monopoli', image: null, is_correct: true },
        { value: 'Oligopoli', image: null, is_correct: false },
        { value: 'Monopsoni', image: null, is_correct: false },
        { value: 'Persaingan Sempurna', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kenaikan harga barang dan jasa secara umum serta terus-menerus disebut?',
      options: [
        { value: 'Inflasi', image: null, is_correct: true },
        { value: 'Deflasi', image: null, is_correct: false },
        { value: 'Devaluasi', image: null, is_correct: false },
        { value: 'Resesi', image: null, is_correct: false }
      ]
    },
    {
      question: 'Lembaga keuangan yang berwenang mencetak uang kartal di Indonesia adalah?',
      options: [
        { value: 'Bank Indonesia', image: null, is_correct: true },
        { value: 'Otoritas Jasa Keuangan', image: null, is_correct: false },
        { value: 'Kementerian Keuangan', image: null, is_correct: false },
        { value: 'Bank Mandiri', image: null, is_correct: false }
      ]
    },

    // --- PILIHAN GANDA (PAGE 2) ---
    {
      question: 'Kebijakan pemerintah untuk mengatur jumlah uang yang beredar melalui suku bunga dinamakan kebijakan?',
      options: [
        { value: 'Moneter', image: null, is_correct: true },
        { value: 'Fiskal', image: null, is_correct: false },
        { value: 'Perdagangan', image: null, is_correct: false },
        { value: 'Perpajakan', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kebijakan yang berhubungan dengan pengeluaran dan penerimaan pajak negara disebut kebijakan?',
      options: [
        { value: 'Fiskal', image: null, is_correct: true },
        { value: 'Moneter', image: null, is_correct: false },
        { value: 'Kredit', image: null, is_correct: false },
        { value: 'Rill', image: null, is_correct: false }
      ]
    },
    {
      question: 'Faktor produksi yang termasuk dalam faktor produksi asli adalah?',
      options: [
        { value: 'Alam dan Tenaga Kerja', image: null, is_correct: true },
        { value: 'Modal dan Kewirausahaan', image: null, is_correct: false },
        { value: 'Teknologi dan Modal', image: null, is_correct: false },
        { value: 'Manajemen dan Mesin', image: null, is_correct: false }
      ]
    },
    {
      question: 'Biaya yang jumlahnya tetap dan tidak dipengaruhi oleh banyaknya jumlah produksi disebut biaya?',
      options: [
        { value: 'Fixed Cost (Biaya Tetap)', image: null, is_correct: true },
        { value: 'Variable Cost (Biaya Variabel)', image: null, is_correct: false },
        { value: 'Marginal Cost', image: null, is_correct: false },
        { value: 'Total Cost', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pendapatan nasional yang dihitung berdasarkan jumlah barang dan jasa yang dihasilkan suatu negara dalam setahun dinamakan?',
      options: [
        { value: 'Gross Domestic Product (GDP)', image: null, is_correct: true },
        { value: 'Personal Income', image: null, is_correct: false },
        { value: 'Disposable Income', image: null, is_correct: false },
        { value: 'Net National Income', image: null, is_correct: false }
      ]
    },
    {
      question: 'Keadaan di mana ekspor suatu negara lebih besar daripada impornya disebut?',
      options: [
        { value: 'Surplus Perdagangan', image: null, is_correct: true },
        { value: 'Defisit Perdagangan', image: null, is_correct: false },
        { value: 'Keseimbangan Internasional', image: null, is_correct: false },
        { value: 'Krisis Moneter', image: null, is_correct: false }
      ]
    },
    {
      question: 'Manfaat utama dari perdagangan internasional adalah?',
      options: [
        { value: 'Memperoleh barang yang tidak dapat diproduksi di dalam negeri', image: null, is_correct: true },
        { value: 'Menghabiskan cadangan devisa negara', image: null, is_correct: false },
        { value: 'Membatasi persaingan produsen lokal', image: null, is_correct: false },
        { value: 'Menurunkan jumlah kesempatan kerja', image: null, is_correct: false }
      ]
    },
    {
      question: 'Uang tunai yang terdiri dari uang kertas dan uang logam dinamakan uang?',
      options: [
        { value: 'Kartal', image: null, is_correct: true },
        { value: 'Giral', image: null, is_correct: false },
        { value: 'Elektronik', image: null, is_correct: false },
        { value: 'Kuasi', image: null, is_correct: false }
      ]
    },
    {
      question: 'Badan usaha yang beranggotakan orang-seorang berdasarkan prinsip kekeluargaan adalah?',
      options: [
        { value: 'Koperasi', image: null, is_correct: true },
        { value: 'Perseroan Terbatas (PT)', image: null, is_correct: false },
        { value: 'CV', image: null, is_correct: false },
        { value: 'Firma', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pajak Pertambahan Nilai (PPN) termasuk dalam kategori jenis pajak?',
      options: [
        { value: 'Tidak Langsung', image: null, is_correct: true },
        { value: 'Langsung', image: null, is_correct: false },
        { value: 'Pribadi', image: null, is_correct: false },
        { value: 'Daerah Khusus', image: null, is_correct: false }
      ]
    },

    // --- PILIHAN GANDA (PAGE 3) ---
    {
      question: 'Faktor utama yang menyebabkan bergesernya kurva permintaan ke kanan adalah?',
      options: [
        { value: 'Peningkatan pendapatan masyarakat', image: null, is_correct: true },
        { value: 'Penurunan biaya produksi', image: null, is_correct: false },
        { value: 'Penurunan selera konsumen', image: null, is_correct: false },
        { value: 'Kenaikan tarif pajak komoditas', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pasar persaingan sempurna ditandai oleh salah satu ciri utama yaitu?',
      options: [
        { value: 'Barang yang diperjualbelikan bersifat homogen', image: null, is_correct: true },
        { value: 'Terdapat satu produsen penentu harga', image: null, is_correct: false },
        { value: 'Hambatan masuk pasar sangat tinggi', image: null, is_correct: false },
        { value: 'Tidak ada informasi pasar yang simetris', image: null, is_correct: false }
      ]
    },
    {
      question: 'Pasar yang didominasi oleh beberapa produsen saja dinamakan pasar?',
      options: [
        { value: 'Oligopoli', image: null, is_correct: true },
        { value: 'Monopoli', image: null, is_correct: false },
        { value: 'Monopsoni', image: null, is_correct: false },
        { value: 'Persaingan Monopolistik', image: null, is_correct: false }
      ]
    },
    {
      question: 'Penurunan nilai mata uang dalam negeri terhadap mata uang asing secara sengaja oleh pemerintah disebut?',
      options: [
        { value: 'Devaluasi', image: null, is_correct: true },
        { value: 'Revaluasi', image: null, is_correct: false },
        { value: 'Depresiasi', image: null, is_correct: false },
        { value: 'Apresiasi', image: null, is_correct: false }
      ]
    },
    {
      question: 'Simpanan masyarakat di bank yang penarikannya dapat dilakukan menggunakan cek atau bilyet giro adalah?',
      options: [
        { value: 'Giro', image: null, is_correct: true },
        { value: 'Deposito Berjangka', image: null, is_correct: false },
        { value: 'Tabungan Biasa', image: null, is_correct: false },
        { value: 'Obligasi', image: null, is_correct: false }
      ]
    },
    {
      question: 'Lembaga yang bertugas mengawasi dan mengatur seluruh kegiatan di dalam sektor jasa keuangan di Indonesia adalah?',
      options: [
        { value: 'Otoritas Jasa Keuangan (OJK)', image: null, is_correct: true },
        { value: 'LPS', image: null, is_correct: false },
        { value: 'Bappenas', image: null, is_correct: false },
        { value: 'Bursa Efek Indonesia', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kemampuan suatu barang untuk memenuhi kebutuhan manusia dinamakan?',
      options: [
        { value: 'Nilai Guna (Utility)', image: null, is_correct: true },
        { value: 'Nilai Tukar', image: null, is_correct: false },
        { value: 'Elastisitas', image: null, is_correct: false },
        { value: 'Marginal Revenue', image: null, is_correct: false }
      ]
    },
    {
      question: 'Tambahan kepuasan yang diperoleh seseorang akibat menambah satu unit konsumsi barang dinamakan?',
      options: [
        { value: 'Marginal Utility', image: null, is_correct: true },
        { value: 'Total Utility', image: null, is_correct: false },
        { value: 'Opportunity Cost', image: null, is_correct: false },
        { value: 'Average Cost', image: null, is_correct: false }
      ]
    },
    {
      question: 'Badan usaha milik negara yang modalnya terbagi atas saham dan berorientasi mencari keuntungan adalah?',
      options: [
        { value: 'Persero', image: null, is_correct: true },
        { value: 'Perum', image: null, is_correct: false },
        { value: 'Perjan', image: null, is_correct: false },
        { value: 'Firma', image: null, is_correct: false }
      ]
    },
    {
      question: 'Batas maksimum harga yang ditetapkan oleh pemerintah untuk melindungi konsumen disebut?',
      options: [
        { value: 'Ceiling Price', image: null, is_correct: true },
        { value: 'Floor Price', image: null, is_correct: false },
        { value: 'Equilibrium Price', image: null, is_correct: false },
        { value: 'Market Price', image: null, is_correct: false }
      ]
    },

    // --- BENAR / SALAH (PAGE 4) ---
    {
      question: 'Hukum Gossen I membahas tentang kepuasan konsumen yang terus menurun seiring penambahan konsumsi barang.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kurva permintaan bergerak dan miring dari kiri bawah ke kanan atas.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Inflasi yang disebabkan oleh kenaikan biaya produksi disebut demand-pull inflation.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Bank Indonesia bertanggung jawab atas pengawasan langsung seluruh perbankan di bawah OJK.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Pasar persaingan sempurna memiliki barang yang bersifat homogen.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Modal dan kewirausahaan termasuk dalam faktor produksi turunan.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Deflasi menyebabkan daya beli uang masyarakat mengalami peningkatan.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Tarif pajak progresif berarti persentase pajak meningkat seiring besarnya dasar pengenaan pajak.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Perusahaan oligopoli biasanya memproduksi barang tanpa adanya persaingan non-harga.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'BUMN berbentuk Persero memiliki tujuan utama mencari keuntungan (profit oriented).',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },

    // --- Form 15: Kuesioner Minat Baca Siswa 2026 (Options 1-40) ---

    // --- PILIHAN GANDA (PAGE 1: Soal 251 - 260) ---
    {
      question: 'Berapa rata-rata durasi waktu yang Anda habiskan untuk membaca buku dalam sehari?',
      options: [
        { value: 'Kurang dari 30 menit', image: null, is_correct: false },
        { value: '30 - 60 menit', image: null, is_correct: true },
        { value: '1 - 2 jam', image: null, is_correct: false },
        { value: 'Lebih dari 2 jam', image: null, is_correct: false }
      ]
    },
    {
      question: 'Berapa jumlah buku (non-pelajaran) yang selesai Anda baca dalam satu bulan terakhir?',
      options: [
        { value: '0 buku', image: null, is_correct: false },
        { value: '1 - 2 buku', image: null, is_correct: true },
        { value: '3 - 5 buku', image: null, is_correct: false },
        { value: 'Lebih dari 5 buku', image: null, is_correct: false }
      ]
    },
    {
      question: 'Media membaca mana yang paling sering Anda gunakan saat ini?',
      options: [
        { value: 'Buku Cetak / Fisik', image: null, is_correct: true },
        { value: 'E-Book / Aplikasi Smartphone', image: null, is_correct: false },
        { value: 'Tablet / E-Reader (Kindle)', image: null, is_correct: false },
        { value: 'Audiobook / Dokumen Web', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kapan waktu favorit Anda untuk membaca bacaan pilihan Anda?',
      options: [
        { value: 'Sebelum tidur malam', image: null, is_correct: true },
        { value: 'Sela-sela istirahat sekolah', image: null, is_correct: false },
        { value: 'Saat akhir pekan / hari libur', image: null, is_correct: false },
        { value: 'Saat waktu luang tidak menentu', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apa alasan utama Anda membaca buku di luar jam pelajaran sekolah?',
      options: [
        { value: 'Mengisi waktu luang dan hiburan', image: null, is_correct: true },
        { value: 'Menambah wawasan dan ilmu baru', image: null, is_correct: false },
        { value: 'Tuntutan tugas dari guru', image: null, is_correct: false },
        { value: 'Mengikuti tren atau rekomendasi teman', image: null, is_correct: false }
      ]
    },
    {
      question: 'Darimana biasanya Anda mendapatkan akses atau memperoleh buku yang dibaca?',
      options: [
        { value: 'Meminjam dari Perpustakaan Sekolah', image: null, is_correct: true },
        { value: 'Membeli di Toko Buku (Offline/Online)', image: null, is_correct: false },
        { value: 'Meminjam milik teman / keluarga', image: null, is_correct: false },
        { value: 'Mengunduh secara gratis di Internet', image: null, is_correct: false }
      ]
    },
    {
      question: 'Genre buku fiksi apa yang paling Anda sukai?',
      options: [
        { value: 'Novel Novel Fiksi Remaja / Romance', image: null, is_correct: true },
        { value: 'Misteri / Detektif / Thriller', image: null, is_correct: false },
        { value: 'Fantasi / Sci-Fi', image: null, is_correct: false },
        { value: 'Komik / Manga / Graphic Novel', image: null, is_correct: false }
      ]
    },
    {
      question: 'Jenis buku non-fiksi apa yang paling sering Anda baca?',
      options: [
        { value: 'Pengembangan Diri (Self-Improvement)', image: null, is_correct: true },
        { value: 'Biografi / Sejarah', image: null, is_correct: false },
        { value: 'Sains Populer & Teknologi', image: null, is_correct: false },
        { value: 'Buku Agama & Spiritualitas', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa sering Anda mengunjungi perpustakaan sekolah dalam satu bulan?',
      options: [
        { value: '1 - 3 kali seminggu', image: null, is_correct: true },
        { value: 'Hanya saat ada tugas kelompok', image: null, is_correct: false },
        { value: 'Jarang (1 kali sebulan)', image: null, is_correct: false },
        { value: 'Tidak pernah sama sekali', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apakah Anda aktif memanfaatkan platform baca digital (seperti Wattpad, iPusnas, E-book)?',
      options: [
        { value: 'Ya, Sangat Aktif', image: null, is_correct: true },
        { value: 'Hanya sesekali', image: null, is_correct: false },
        { value: 'Pernah tetapi jarang', image: null, is_correct: false },
        { value: 'Tidak pernah', image: null, is_correct: false }
      ]
    },

    // --- PILIHAN GANDA (PAGE 2: Soal 261 - 270) ---
    {
      question: 'Siapa sosok yang paling mempengaruhi minat membaca Anda sejak kecil?',
      options: [
        { value: 'Orang tua / Keluarga di rumah', image: null, is_correct: true },
        { value: 'Guru di sekolah', image: null, is_correct: false },
        { value: 'Teman sebaya / Sahabat', image: null, is_correct: false },
        { value: 'Keinginan pribadi tanpa pengaruh luar', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apa hambatan terbesar yang menghalangi Anda untuk membaca buku lebih sering?',
      options: [
        { value: 'Terdistraksi Gadget / Media Sosial', image: null, is_correct: true },
        { value: 'Banyak tugas sekolah / kegiatan ekskul', image: null, is_correct: false },
        { value: 'Harga buku yang relatif mahal', image: null, is_correct: false },
        { value: 'Koleksi buku yang kurang menarik', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana kelengkapan koleksi buku di perpustakaan sekolah Anda saat ini?',
      options: [
        { value: 'Sangat Lengkap & Bervariasi', image: null, is_correct: true },
        { value: 'Cukup Lengkap', image: null, is_correct: false },
        { value: 'Kurang Lengkap (Buku Lama)', image: null, is_correct: false },
        { value: 'Sangat Terbatas', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apakah ketersediaan jaringan internet meningkatkan frekuensi membaca artikel/e-book Anda?',
      options: [
        { value: 'Ya, Sangat Berpengaruh', image: null, is_correct: true },
        { value: 'Cukup Berpengaruh', image: null, is_correct: false },
        { value: 'Sedikit Berpengaruh', image: null, is_correct: false },
        { value: 'Tidak Berpengaruh', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana pengaruh media sosial terhadap minat membaca buku fisik Anda?',
      options: [
        { value: 'Meningkatkan (banyak rekomendasi buku)', image: null, is_correct: true },
        { value: 'Menurunkan (menyita waktu)', image: null, is_correct: false },
        { value: 'Biasa saja / Netral', image: null, is_correct: false },
        { value: 'Tidak tahu', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apakah Anda sering membagikan atau mendiskusikan ulasan buku bersama teman?',
      options: [
        { value: 'Sering', image: null, is_correct: true },
        { value: 'Kadang-kadang', image: null, is_correct: false },
        { value: 'Jarang', image: null, is_correct: false },
        { value: 'Tidak Pernah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Fitur aplikasi baca digital apa yang paling membantu kenyamanan membaca Anda?',
      options: [
        { value: 'Mode Gelap (Dark Mode) & Pengaturan Font', image: null, is_correct: true },
        { value: 'Fitur Penanda Halaman (Bookmark)', image: null, is_correct: false },
        { value: 'Kolom Komentar antar Pembaca', image: null, is_correct: false },
        { value: 'Fitur Rekomendasi AI', image: null, is_correct: false }
      ]
    },
    {
      question: 'Berapa anggaran bulanan yang biasa Anda alokasikan untuk membeli buku/langganan e-book?',
      options: [
        { value: 'Rp 0 (Memanfaatkan gratisan/perpus)', image: null, is_correct: true },
        { value: 'Di bawah Rp 50.000', image: null, is_correct: false },
        { value: 'Rp 50.000 - Rp 150.000', image: null, is_correct: false },
        { value: 'Diatas Rp 150.000', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kegiatan literasi sekolah (seperti 15 menit membaca sebelum KBM) menurut Anda tergolong?',
      options: [
        { value: 'Sangat Bermanfaat', image: null, is_correct: true },
        { value: 'Cukup Menyenangkan', image: null, is_correct: false },
        { value: 'Biasa Saja', image: null, is_correct: false },
        { value: 'Membosankan', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa sering Anda membeli buku fisik di toko buku dalam kurun 6 bulan terakhir?',
      options: [
        { value: 'Lebih dari 3 kali', image: null, is_correct: true },
        { value: '1 - 2 kali', image: null, is_correct: false },
        { value: 'Hanya melihat-lihat tanpa membeli', image: null, is_correct: false },
        { value: 'Tidak pernah', image: null, is_correct: false }
      ]
    },

    // --- PILIHAN GANDA (PAGE 3: Soal 271 - 280) ---
    {
      question: 'Bagaimana tingkat daya tarik tata lay-out dan desain cover terhadap keputusan membaca Anda?',
      options: [
        { value: 'Sangat Menentukan', image: null, is_correct: true },
        { value: 'Cukup Mempengaruhi', image: null, is_correct: false },
        { value: 'Sedikit Mempengaruhi', image: null, is_correct: false },
        { value: 'Tidak Penting (Fokus Sinopsis)', image: null, is_correct: false }
      ]
    },
    {
      question: 'Format buku digital seperti apa yang paling Anda sukai untuk dibaca di smartphone?',
      options: [
        { value: 'EPUB / Reflowable Text', image: null, is_correct: true },
        { value: 'PDF Halaman Cetak', image: null, is_correct: false },
        { value: 'Format Komik / Gambar (CBZ)', image: null, is_correct: false },
        { value: 'Artikel Teks Panjang Web', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apakah rekomendasi dari influencer/BookTok mempengaruhi pilihan buku Anda?',
      options: [
        { value: 'Sangat Mempengaruhi', image: null, is_correct: true },
        { value: 'Cukup Mempengaruhi', image: null, is_correct: false },
        { value: 'Jarang Mempengaruhi', image: null, is_correct: false },
        { value: 'Tidak Pernah Mempengaruhi', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apa manfaat terbesar yang paling Anda rasakan setelah rutin membaca?',
      options: [
        { value: 'Wawasan umum bertambah pesat', image: null, is_correct: true },
        { value: 'Kosakata & pemahaman bahasa meningkat', image: null, is_correct: false },
        { value: 'Dapat meredakan stres / hiburan', image: null, is_correct: false },
        { value: 'Kemampuan fokus menjadi lebih baik', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana suasana ruang perpustakaan ideal yang membuat Anda betah membaca?',
      options: [
        { value: 'Tenang, Ber-AC, dan Kursi Empuk', image: null, is_correct: true },
        { value: 'Konsep Kafe Santai (Boleh Bawa Minum)', image: null, is_correct: false },
        { value: 'Banyak Fasilitas Komputer Digital', image: null, is_correct: false },
        { value: 'Area Lesah / Karpet Santai', image: null, is_correct: false }
      ]
    },
    {
      question: 'Seberapa sering Anda mencatat poin penting atau quotes saat membaca buku?',
      options: [
        { value: 'Sering (Membuat Sticky Notes/Journal)', image: null, is_correct: true },
        { value: 'Kadang-kadang', image: null, is_correct: false },
        { value: 'Jarang', image: null, is_correct: false },
        { value: 'Tidak Pernah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bahasa apa yang lebih Anda prioritaskan saat membaca buku literatur?',
      options: [
        { value: 'Bahasa Indonesia', image: null, is_correct: true },
        { value: 'Bahasa Inggris', image: null, is_correct: false },
        { value: 'Bilingual (Campuran)', image: null, is_correct: false },
        { value: 'Bahasa Daerah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apakah kegiatan bedah buku/klub buku menarik untuk diadakan di sekolah?',
      options: [
        { value: 'Sangat Menarik', image: null, is_correct: true },
        { value: 'Cukup Menarik', image: null, is_correct: false },
        { value: 'Kurang Menarik', image: null, is_correct: false },
        { value: 'Tidak Menarik', image: null, is_correct: false }
      ]
    },
    {
      question: 'Bagaimana Anda menilai kemampuan fokus membaca Anda tanpa terdistraksi HP?',
      options: [
        { value: 'Bisa fokus lebih dari 1 jam', image: null, is_correct: true },
        { value: 'Fokus 30 menit', image: null, is_correct: false },
        { value: 'Sering terdistraksi tiap 10 menit', image: null, is_correct: false },
        { value: 'Sangat sulit fokus', image: null, is_correct: false }
      ]
    },
    {
      question: 'Apakah Anda tertarik untuk menulis atau menerbitkan buku karya sendiri di masa depan?',
      options: [
        { value: 'Sangat Tertarik', image: null, is_correct: true },
        { value: 'Tertarik tapi Ragu', image: null, is_correct: false },
        { value: 'Mungkin saja', image: null, is_correct: false },
        { value: 'Tidak Tertarik', image: null, is_correct: false }
      ]
    },

    // --- BENAR / SALAH (PAGE 4: Soal 281 - 290) ---
    {
      question: 'Membaca buku non-pelajaran secara rutin dapat meningkatkan kosa kata dan kemampuan komunikasi.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Buku digital (e-book) sudah sepenuhnya menggantikan peran dan kenyamanan buku cetak.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Harga buku cetak original saat ini dinilai terlalu mahal bagi kantong pelajar.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Perpustakaan sekolah sudah menyediakan fasilitas digital dan ruang baca yang nyaman.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Media sosial seperti TikTok/Instagram lebih sering mengurangi ketertarikan membaca buku.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Membaca karya fiksi tidak memberikan manfaat praktis untuk peningkatan akademik.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Program pembiasaan membaca 15 menit di sekolah sangat efektif membangun budaya literasi.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Akses buku gratis di perpustakaan digital daerah/nasional sangat mudah dijangkau.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
      ]
    },
    {
      question: 'Kehadiran Audio book lebih efektif dibanding membaca teks narasi bagi siswa masa kini.',
      options: [
        { value: 'Benar', image: null, is_correct: false },
        { value: 'Salah', image: null, is_correct: true }
      ]
    },
    {
      question: 'Dukungan orang tua di rumah sangat berperan penting dalam membentuk kebiasaan membaca.',
      options: [
        { value: 'Benar', image: null, is_correct: true },
        { value: 'Salah', image: null, is_correct: false }
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