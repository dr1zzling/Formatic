/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Hapus data lama (opsional: tambahkan reset auto-increment jika menggunakan PostgreSQL/MySQL)
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
    { question: 'Upload rangkuman sejarah peristiwa Rengasdengklok', form_id: 10, type: 'file', image: null, page: 3 },

    // ==========================================
    // FORM 11: Soal Geografi Indonesia 2026 (soal_id: 51 - 100)
    // ==========================================

    // --- PILIHAN GANDA (1 - 30) ---
    { question: 'Danau terbesar di Indonesia adalah?', form_id: 11, type: 'radio', image: '/uploads/soal/danau-toba.png', page: 1 },
    { question: 'Ibu kota provinsi Jawa Barat adalah?', form_id: 11, type: 'radio', image: null, page: 1 },
    { question: 'Gunung tertinggi di pulau Jawa adalah?', form_id: 11, type: 'radio', image: null, page: 1 },
    { question: 'Manakah samudra yang mengapit wilayah Indonesia di sebelah barat?', form_id: 11, type: 'radio', image: null, page: 1 },
    { question: 'Batas wilayah Indonesia bagian utara berbatasan darat langsung dengan?', form_id: 11, type: 'radio', image: null, page: 1 },
    { question: 'Selat yang memisahkan Pulau Jawa dan Pulau Sumatra adalah?', form_id: 11, type: 'radio', image: null, page: 1 },
    { question: 'Suku asli yang mendiami wilayah Papua adalah?', form_id: 11, type: 'radio', image: null, page: 1 },
    { question: 'Provinsi paling barat di wilayah Indonesia adalah?', form_id: 11, type: 'radio', image: null, page: 1 },
    { question: 'Iklim utama yang dimiliki oleh negara Indonesia adalah?', form_id: 11, type: 'radio', image: null, page: 1 },
    { question: 'Angin monsun barat yang bertiup di Indonesia menyebabkan musim?', form_id: 11, type: 'radio', image: null, page: 1 },

    { question: 'Sungai terpanjang di Indonesia terletak di pulau?', form_id: 11, type: 'radio', image: '/uploads/soal/sungai-kapuas.png', page: 2 },
    { question: 'Cagar alam Ujung Kulon terkenal sebagai tempat perlindungan?', form_id: 11, type: 'radio', image: null, page: 2 },
    { question: 'Zona waktu Indonesia Barat (WIB) mencakup wilayah?', form_id: 11, type: 'radio', image: null, page: 2 },
    { question: 'Garis khatulistiwa melewati salah satu kota besar di Indonesia, yaitu?', form_id: 11, type: 'radio', image: null, page: 2 },
    { question: 'Laut dangkal yang menghubungkan Pulau Jawa, Sumatra, dan Kalimantan adalah?', form_id: 11, type: 'radio', image: null, page: 2 },
    { question: 'Taman Nasional Bunaken terkenal dengan keindahan alam?', form_id: 11, type: 'radio', image: null, page: 2 },
    { question: 'Pulau di Indonesia yang dikenal dengan julukan Pulau Dewata adalah?', form_id: 11, type: 'radio', image: null, page: 2 },
    { question: 'Puncak gunung di Indonesia yang memiliki salju abadi adalah?', form_id: 11, type: 'radio', image: null, page: 2 },
    { question: 'Pola pemukiman penduduk di daerah pesisir pantai biasanya memanjang mengikuti?', form_id: 11, type: 'radio', image: null, page: 2 },
    { question: 'Hasil tambang utama yang dihasilkan di pulau Bangka Belitung adalah?', form_id: 11, type: 'radio', image: null, page: 2 },

    { question: 'Fenomena gempa bumi di Indonesia sering terjadi karena posisi geologisnya berada pada garis?', form_id: 11, type: 'radio', image: '/uploads/soal/ring-of-fire.png', page: 3 },
    { question: 'Spesies komodo hanya dapat ditemukan secara alami di provinsi?', form_id: 11, type: 'radio', image: null, page: 3 },
    { question: 'Perbatasan darat sebelah timur Indonesia berbatasan langsung dengan negara?', form_id: 11, type: 'radio', image: null, page: 3 },
    { question: 'Garis yang memisahkan tipe fauna Asiatis dan Peralihan di Indonesia adalah?', form_id: 11, type: 'radio', image: null, page: 3 },
    { question: 'Tanah yang terbentuk dari endapan lumpur sungai disebut tanah?', form_id: 11, type: 'radio', image: null, page: 3 },
    { question: 'Gunung Krakatau terletak di perairan selat?', form_id: 11, type: 'radio', image: null, page: 3 },
    { question: 'Pusat pemerintahan baru Indonesia (IKN Nusantara) dibangun di provinsi?', form_id: 11, type: 'radio', image: null, page: 3 },
    { question: 'Jenis hutan yang berfungsi menahan erosi air laut di kawasan pesisir adalah?', form_id: 11, type: 'radio', image: null, page: 3 },
    { question: 'Komoditas rempah unggulan yang berasal dari Kepulauan Maluku adalah?', form_id: 11, type: 'radio', image: null, page: 3 },
    { question: 'Sebutan untuk deretan gunung api aktif yang melintasi wilayah Indonesia adalah?', form_id: 11, type: 'radio', image: null, page: 3 },

    // --- BENAR / SALAH (31 - 40) ---
    { question: 'Pernyataan: Indonesia memiliki 3 zona pembagian waktu.', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Pulau Kalimantan berbatasan darat dengan negara Malaysia dan Brunei.', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Burung Cendrawasih merupakan contoh fauna tipe Asiatis.', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Danau Toba terbentuk akibat erupsi gunung berapi purba (supervolcano).', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Indonesia berada pada pertemuan tiga lempeng tektonik utama dunia.', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Selat Makassar memisahkan Pulau Sumatra dan Kalimantan.', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Garis Weber memisahkan jenis fauna Peralihan dan Australis.', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Provinsi Sulawesi Selatan beribu kota di Makassar.', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Wilayah iklim di Indonesia tergolong iklim subtropis.', form_id: 11, type: 'radio', image: null, page: 4 },
    { question: 'Pernyataan: Gunung Merapi tergolong gunung api tipe aktif yang ada di Jawa Tengah/Yogyakarta.', form_id: 11, type: 'radio', image: null, page: 4 },

    // --- ESSAY / ISIAN (41 - 50) ---
    { question: 'Tuliskan nama ibu kota baru Negara Republik Indonesia.', form_id: 11, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan perbedaan mendasar antara iklim Tropis dan Subtropis.', form_id: 11, type: 'text', image: null, page: 5 },
    { question: 'Sebutkan 3 fauna khas Indonesia yang tergolong tipe Peralihan.', form_id: 11, type: 'text', image: null, page: 5 },
    { question: 'Tuliskan pengertian dari bentang alam delta sungai.', form_id: 11, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan mengapa wilayah Indonesia sering mengalami bencana gempa bumi.', form_id: 11, type: 'text', image: '/uploads/soal/lempeng-tektonik.png', page: 5 },
    { question: 'Sebutkan 5 nama pulau besar di wilayah NKRI.', form_id: 11, type: 'text', image: null, page: 5 },
    { question: 'Tuliskan manfaat hutan mangrove bagi kawasan pesisir pantai.', form_id: 11, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan faktor yang memengaruhi tingginya curah hujan di daerah pegunungan.', form_id: 11, type: 'text', image: null, page: 5 },
    { question: 'Sebutkan batas-batas geografis wilayah Indonesia di sebelah selatan.', form_id: 11, type: 'text', image: null, page: 5 },
    { question: 'Tuliskan pendapat singkat mengenai langkah mitigasi bencana erupsi gunung api.', form_id: 11, type: 'text', image: null, page: 5 },

    //form 12
    { question: 'Gagasan utama yang menjadi inti pembahasan dalam sebuah paragraf disebut?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Paragraf yang kalimat utamanya terletak di awal paragraf dinamakan paragraf?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Berikut yang merupakan ciri utama teks deskripsi adalah?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Kata yang memiliki makna sama atau hampir sama disebut?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Lawan kata dari kata "optimis" adalah?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Kalimat yang mengandung pembandingan langsung tanpa kata pembanding dinamakan majas?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Struktur teks narasi secara berurutan adalah?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Unsur intrinsik puisi yang berkaitan dengan tinggi rendahnya nada membaca dinamakan?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Karya sastra berupa drama memiliki ciri khas utama yaitu berbentuk?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Penulisan kata baku yang tepat menurut PUEBI/EYD adalah?', form_id: 12, type: 'radio', image: null, page: 1 },
    { question: 'Teks yang berisi petunjuk pembuatan sesuatu secara berurutan disebut?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Kalimat efektif harus memiliki kelengkapan unsur minimal berupa?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Tujuan utama penulisan teks eksposisi adalah?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Bagian akhir teks prosedur yang berisi penyimpulan atau saran dinamakan?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Ide Pokok sebuah teks dapat ditemukan melalui langkah?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Sifat dari teks berita yang menyajikan informasi terkini dan aktual adalah?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Majas personifikasi ditunjukkan oleh kalimat?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Kata berimbuhan me-kan yang tepat pada kalimat adalah?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Ringkasan singkat dari seluruh isi karya ilmiah dinamakan?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Salah satu contoh imbuhan asing yang diserap ke dalam bahasa Indonesia adalah?', form_id: 12, type: 'radio', image: null, page: 2 },
    { question: 'Teks ulasan bertujuan untuk memberikan nilai kritis terhadap?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Kata denotatif adalah kata yang memiliki makna?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Gaya bahasa yang melebih-lebihkan kenyataan dinamakan?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Konjungsi yang menyatakan hubungan sebab-akibat adalah?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Informasi tambahan yang berfungsi menjelaskan gagasan utama disebut?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Teks eksplanasi disusun berdasarkan fakta mengenai fenomena?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Rangkaian peristiwa dalam sebuah cerita/cerpen disebut?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Karakter atau watak tokoh dalam cerita dapat disimpulkan melalui?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Penggunaan tanda baca titik dua (:) yang tepat adalah?', form_id: 12, type: 'radio', image: null, page: 3 },
    { question: 'Pesan moral yang ingin disampaikan pengarang kepada pembaca disebut?', form_id: 12, type: 'radio', image: null, page: 3 },

    // BENAR / SALAH (PAGE 4)
    { question: 'Paragraf induktif adalah paragraf yang ide pokoknya terletak di bagian awal.', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Kata "Apotek" merupakan bentuk kata baku dari "Apotik".', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Teks tanggapan kritis bertujuan untuk memuji atau mengkritik suatu karya secara obyektif.', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Majas hiperbola menggunakan kata-kata pembanding seperti "bagaikan" atau "seperti".', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Unsur ekstrinsik cerpen mencakup latar belakang kehidupan pengarang.', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Kata konotatif adalah kata yang bermakna sebenarnya atau harfiah.', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Teks anekdot berisi cerita lucu yang mengandung sindiran moral atau sosial.', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Kalimat pasif selalu ditandai dengan predikat berimbuhan me- atau ber-.', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Abstrak dalam karya tulis ilmiah biasanya memuat ringkasan metodologi dan hasil.', form_id: 12, type: 'radio', image: null, page: 4 },
    { question: 'Latar waktu dan tempat termasuk dalam bagian struktur alur.', form_id: 12, type: 'radio', image: null, page: 4 },

    // ESSAY / TEXT (PAGE 5)
    { question: 'Tuliskan perbedaan mendasar antara gagasan utama dan gagasan penjelas.', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan yang dimaksud dengan kalimat efektif dan berikan 1 contohnya.', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Sebutkan 4 unsur intrinsik yang terdapat dalam cerita pendek (cerpen).', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Tuliskan pengertian dari majas personifikasi beserta 1 contoh kalimatnya.', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan perbedaan antara makna denotasi dan makna konotasi.', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Sebutkan struktur umum dari teks prosedur kompleks.', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Tuliskan 3 kata tidak baku beserta bentuk bakunya sesuai PUEBI/EYD.', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan fungsi dari teks eksplanasi bagi pembaca.', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Sebutkan dan jelaskan 2 jenis sudut pandang (point of view) pengarang.', form_id: 12, type: 'text', image: null, page: 5 },
    { question: 'Tuliskan sebuah paragraf singkat bertema pendidikan yang memuat kalimat utama di awal.', form_id: 12, type: 'text', image: null, page: 5 },

    // ==========================================
    // FORM 13 (Survei Kegiatan Belajar Mengajar 2026) - 20 Soal
    // ==========================================

    // --- PILIHAN GANDA / SKALA (PAGE 1) ---
    { question: 'Bagaimana kualitas penyampaian materi oleh pengajar secara umum selama proses KBM?', form_id: 13, type: 'radio', image: null, page: 1 },
    { question: 'Seberapa jelas instruksi dan penjelasan yang diberikan saat penyampaian tugas kelas?', form_id: 13, type: 'radio', image: null, page: 1 },
    { question: 'Bagaimana tingkat kelengkapan dan keterbacaan modul/materi ajar yang disediakan?', form_id: 13, type: 'radio', image: null, page: 1 },
    { question: 'Seberapa responsif pengajar dalam menjawab pertanyaan atau kendala siswa di luar jam kelas?', form_id: 13, type: 'radio', image: null, page: 1 },
    { question: 'Bagaimana kesesuaian antara alokasi waktu pelajaran dengan beban materi yang disampaikan?', form_id: 13, type: 'radio', image: null, page: 1 },

    // --- PILIHAN GANDA / SKALA (PAGE 2) ---
    { question: 'Seberapa seimbang jumlah tugas mandiri yang diberikan dibanding waktu istirahat siswa?', form_id: 13, type: 'radio', image: null, page: 2 },
    { question: 'Bagaimana keterandalan platform atau media pembelajaran online yang digunakan?', form_id: 13, type: 'radio', image: null, page: 2 },
    { question: 'Seberapa aktif pengajar membangun diskusi dan interaksi dua arah di dalam kelas?', form_id: 13, type: 'radio', image: null, page: 2 },
    { question: 'Bagaimana ketepatan waktu pengajar dalam memulai dan mengakhiri sesi pembelajaran?', form_id: 13, type: 'radio', image: null, page: 2 },
    { question: 'Seberapa objektif dan transparan sistem penilaian yang diterapkan oleh pengajar?', form_id: 13, type: 'radio', image: null, page: 2 },

    // --- PILIHAN GANDA / SKALA (PAGE 3) ---
    { question: 'Bagaimana kecukupan fasilitas fisik/sarana penunjang kelas yang tersedia?', form_id: 13, type: 'radio', image: null, page: 3 },
    { question: 'Seberapa menarik penggunaan variasi media pembelajaran (video, kuis interaktif, dll)?', form_id: 13, type: 'radio', image: null, page: 3 },
    { question: 'Bagaimana pemahaman kamu terhadap capaian pembelajaran setelah mengikuti semester ini?', form_id: 13, type: 'radio', image: null, page: 3 },
    { question: 'Seberapa baik ruang dan fleksibilitas yang diberikan untuk berkonsultasi mengenai hambatan belajar?', form_id: 13, type: 'radio', image: null, page: 3 },
    { question: 'Secara keseluruhan, seberapa puas kamu terhadap pelaksanaan KBM tahun 2026 ini?', form_id: 13, type: 'radio', image: null, page: 3 },

    // --- ESSAY / MASUKAN KUALITATIF (PAGE 4) ---
    { question: 'Metode pembelajaran apa yang paling efektif dan paling kamu sukai selama KBM? Jelaskan alasannya.', form_id: 13, type: 'text', image: null, page: 4 },
    { question: 'Tuliskan kendala atau kendala terbesar yang paling sering kamu hadapi selama proses belajar mengajar.', form_id: 13, type: 'text', image: null, page: 4 },
    { question: 'Fasilitas, media, atau aplikasi digital apa yang perlu diperbaiki atau ditambahkan kinerjanya?', form_id: 13, type: 'text', image: null, page: 4 },
    { question: 'Berikan usulan kamu untuk meningkatkan keaktifan dan interaksi antarsiswa di dalam kelas.', form_id: 13, type: 'text', image: null, page: 4 },
    { question: 'Tuliskan saran, kritik, atau evaluasi umum lainnya untuk perbaikan Kegiatan Belajar Mengajar kedepannya.', form_id: 13, type: 'text', image: null, page: 4 },

    // ==========================================
    // FORM 14 (Soal Ekonomi Dasar 2026) - 50 Soal
    // ==========================================

    // --- PILIHAN GANDA (PAGE 1 - 3) ---
    // Page 1 (Soal 1 - 10)
    { question: 'Masalah pokok ekonomi modern yang dihadapi oleh masyarakat adalah?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Kondisi di mana sumber daya terbatas sedangkan kebutuhan manusia tidak terbatas disebut?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Nilai dari alternatif terbaik yang dikorbankan ketika memilih suatu pilihan dinamakan?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Hukum permintaan menyatakan bahwa jika harga suatu barang naik, maka jumlah permintaan akan?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Hukum penawaran menunjukkan hubungan yang searah antara harga barang dengan?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Titik potong antara kurva permintaan dan kurva penawaran dinamakan titik?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Sistem ekonomi di mana pemerintah memegang kendali penuh atas kegiatan ekonomi adalah?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Pasar yang hanya terdiri dari satu penjual dan banyak pembeli disebut pasar?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Kenaikan harga barang dan jasa secara umum serta terus-menerus disebut?', form_id: 14, type: 'radio', image: null, page: 1 },
    { question: 'Lembaga keuangan yang berwenang mencetak uang kartal di Indonesia adalah?', form_id: 14, type: 'radio', image: null, page: 1 },

    // Page 2 (Soal 11 - 20)
    { question: 'Kebijakan pemerintah untuk mengatur jumlah uang yang beredar melalui suku bunga dinamakan kebijakan?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Kebijakan yang berhubungan dengan pengeluaran dan penerimaan pajak negara disebut kebijakan?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Faktor produksi yang termasuk dalam faktor produksi asli adalah?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Biaya yang jumlahnya tetap dan tidak dipengaruhi oleh banyaknya jumlah produksi disebut biaya?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Pendapatan nasional yang dihitung berdasarkan jumlah barang dan jasa yang dihasilkan suatu negara dalam setahun dinamakan?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Keadaan di mana ekspor suatu negara lebih besar daripada impornya disebut?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Manfaat utama dari perdagangan internasional adalah?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Uang tunai yang terdiri dari uang kertas dan uang logam dinamakan uang?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Badan usaha yang beranggotakan orang-seorang berdasarkan prinsip kekeluargaan adalah?', form_id: 14, type: 'radio', image: null, page: 2 },
    { question: 'Pajak Pertambahan Nilai (PPN) termasuk dalam kategori jenis pajak?', form_id: 14, type: 'radio', image: null, page: 2 },

    // Page 3 (Soal 21 - 30)
    { question: 'Faktor utama yang menyebabkan bergesernya kurva permintaan ke kanan adalah?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Pasar persaingan sempurna ditandai oleh salah satu ciri utama yaitu?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Pasar yang didominasi oleh beberapa produsen saja dinamakan pasar?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Penurunan nilai mata uang dalam negeri terhadap mata uang asing secara sengaja oleh pemerintah disebut?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Simpanan masyarakat di bank yang penarikannya dapat dilakukan menggunakan cek atau bilyet giro adalah?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Lembaga yang bertugas mengawasi dan mengatur seluruh kegiatan di dalam sektor jasa keuangan di Indonesia adalah?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Kemampuan suatu barang untuk memenuhi kebutuhan manusia dinamakan?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Tambahan kepuasan yang diperoleh seseorang akibat menambah satu unit konsumsi barang dinamakan?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Badan usaha milik negara yang modalnya terbagi atas saham dan berorientasi mencari keuntungan adalah?', form_id: 14, type: 'radio', image: null, page: 3 },
    { question: 'Batas maksimum harga yang ditetapkan oleh pemerintah untuk melindungi konsumen disebut?', form_id: 14, type: 'radio', image: null, page: 3 },

    // --- BENAR / SALAH (PAGE 4) ---
    { question: 'Hukum Gossen I membahas tentang kepuasan konsumen yang terus menurun seiring penambahan konsumsi barang.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'Kurva permintaan bergerak dan miring dari kiri bawah ke kanan atas.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'Inflasi yang disebabkan oleh kenaikan biaya produksi disebut demand-pull inflation.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'Bank Indonesia bertanggung jawab atas pengawasan langsung seluruh perbankan di bawah OJK.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'Pasar persaingan sempurna memiliki barang yang bersifat homogen.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'Modal dan kewirausahaan termasuk dalam faktor produksi turunan.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'Deflasi menyebabkan daya beli uang masyarakat mengalami peningkatan.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'Tarif pajak progresif berarti persentase pajak meningkat seiring besarnya dasar pengenaan pajak.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'Perusahaan oligopoli biasanya memproduksi barang tanpa adanya persaingan non-harga.', form_id: 14, type: 'radio', image: null, page: 4 },
    { question: 'BUMN berbentuk Persero memiliki tujuan utama mencari keuntungan (profit oriented).', form_id: 14, type: 'radio', image: null, page: 4 },

    // --- ESSAY / TEXT (PAGE 5) ---
    { question: 'Jelaskan perbedaan mendasar antara sistem ekonomi pasar (kapitalis) dan sistem ekonomi komando (sosialis).', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Uraikan faktor-faktor yang dapat menyebabkan bergesernya kurva penawaran ke kanan.', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan pengertian Biaya Peluang (Opportunity Cost) dan berikan 1 contohnya dalam kehidupan sehari-hari.', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Bagaimana dampak inflasi yang tinggi terhadap masyarakat berpenghasilan tetap? Jelaskan.', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Sebutkan dan jelaskan instrumen-instrumen kebijakan fiskal yang dapat digunakan pemerintah untuk mengatasi resesi.', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan perbedaan antara Gross Domestic Product (GDP) dan Gross National Product (GNP).', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Apa saja keuntungan dan kerugian adanya pasar monopoli bagi konsumen?', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan fungsi Bank Indonesia selaku bank sentral di Indonesia.', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Uraikan teori keunggulan komparatif dalam perdagangan internasional menurut David Ricardo.', form_id: 14, type: 'text', image: null, page: 5 },
    { question: 'Jelaskan peran penting Badan Usaha Milik Negara (BUMN) dalam perekonomian Indonesia.', form_id: 14, type: 'text', image: null, page: 5 },

    // ==========================================
    // FORM 15 (Kuesioner Minat Baca Siswa 2026) - 50 Soal
    // ==========================================

    // --- PILIHAN GANDA: FREKUENSI & KEBIASAAN BACA (PAGE 1 - Soal 251 - 260) ---
    { question: 'Berapa rata-rata durasi waktu yang Anda habiskan untuk membaca buku dalam sehari?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Berapa jumlah buku (non-pelajaran) yang selesai Anda baca dalam satu bulan terakhir?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Media membaca mana yang paling sering Anda gunakan saat ini?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Kapan waktu favorit Anda untuk membaca bacaan pilihan Anda?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Apa alasan utama Anda membaca buku di luar jam pelajaran sekolah?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Darimana biasanya Anda mendapatkan akses atau memperoleh buku yang dibaca?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Genre buku fiksi apa yang paling Anda sukai?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Jenis buku non-fiksi apa yang paling sering Anda baca?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Seberapa sering Anda mengunjungi perpustakaan sekolah dalam satu bulan?', form_id: 15, type: 'radio', image: null, page: 1 },
    { question: 'Apakah Anda aktif memanfaatkan platform baca digital (seperti Wattpad, iPusnas, E-book)?', form_id: 15, type: 'radio', image: null, page: 1 },

    // --- PILIHAN GANDA: FAKTOR PENDORONG & HAMBATAN (PAGE 2 - Soal 261 - 270) ---
    { question: 'Siapa sosok yang paling mempengaruhi minat membaca Anda sejak kecil?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Apa hambatan terbesar yang menghalangi Anda untuk membaca buku lebih sering?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Bagaimana kelengkapan koleksi buku di perpustakaan sekolah Anda saat ini?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Apakah ketersediaan jaringan internet meningkatkan frekuensi membaca artikel/e-book Anda?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Bagaimana pengaruh media sosial terhadap minat membaca buku fisik Anda?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Apakah Anda sering membagikan atau mendiskusikan ulasan buku bersama teman?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Fitur aplikasi baca digital apa yang paling membantu kenyamanan membaca Anda?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Berapa anggaran bulanan yang biasa Anda alokasikan untuk membeli buku/langganan e-book?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Kegiatan literasi sekolah (seperti 15 menit membaca sebelum KBM) menurut Anda tergolong?', form_id: 15, type: 'radio', image: null, page: 2 },
    { question: 'Seberapa sering Anda membeli buku fisik di toko buku dalam kurun 6 bulan terakhir?', form_id: 15, type: 'radio', image: null, page: 2 },

    // --- PILIHAN GANDA: MINAT & PERSEPSI LITERASI (PAGE 3 - Soal 271 - 280) ---
    { question: 'Bagaimana tingkat daya tarik tata lay-out dan desain cover terhadap keputusan membaca Anda?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Format buku digital seperti apa yang paling Anda sukai untuk dibaca di smartphone?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Apakah rekomendasi dari influencer/BookTok mempengaruhi pilihan buku Anda?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Apa manfaat terbesar yang paling Anda rasakan setelah rutin membaca?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Bagaimana suasana ruang perpustakaan ideal yang membuat Anda betah membaca?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Seberapa sering Anda mencatat poin penting atau quotes saat membaca buku?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Bahasa apa yang lebih Anda prioritaskan saat membaca buku literatur?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Apakah kegiatan bedah buku/klub buku menarik untuk diadakan di sekolah?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Bagaimana Anda menilai kemampuan fokus membaca Anda tanpa terdistraksi HP?', form_id: 15, type: 'radio', image: null, page: 3 },
    { question: 'Apakah Anda tertarik untuk menulis atau menerbitkan buku karya sendiri di masa depan?', form_id: 15, type: 'radio', image: null, page: 3 },

    // --- SKALA PERSETUJUAN / BENAR-SALAH (PAGE 4 - Soal 281 - 290) ---
    { question: 'Membaca buku non-pelajaran secara rutin dapat meningkatkan kosa kata dan kemampuan komunikasi.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Buku digital (e-book) sudah sepenuhnya menggantikan peran dan kenyamanan buku cetak.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Harga buku cetak original saat ini dinilai terlalu mahal bagi kantong pelajar.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Perpustakaan sekolah sudah menyediakan fasilitas digital dan ruang baca yang nyaman.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Media sosial seperti TikTok/Instagram lebih sering mengurangi ketertarikan membaca buku.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Membaca karya fiksi tidak memberikan manfaat praktis untuk peningkatan akademik.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Program pembiasaan membaca 15 menit di sekolah sangat efektif membangun budaya literasi.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Akses buku gratis di perpustakaan digital daerah/nasional sangat mudah dijangkau.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Kehadiran Audio book lebih efektif dibanding membaca teks narasi bagi siswa masa kini.', form_id: 15, type: 'radio', image: null, page: 4 },
    { question: 'Dukungan orang tua di rumah sangat berperan penting dalam membentuk kebiasaan membaca.', form_id: 15, type: 'radio', image: null, page: 4 },

    // --- ESSAY / TEXT (PAGE 5 - Soal 291 - 300) ---
    { question: 'Apa saja faktor yang membuat Anda tertarik membaca suatu judul buku tertentu?', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Tuliskan judul buku terakhir yang paling berkesan bagi Anda dan jelaskan alasannya.', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Bagaimana saran Anda agar fasilitas perpustakaan di sekolah bisa menjadi tempat favorit siswa?', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Apa kendala utama yang sering Anda hadapi saat berusaha membangun konsistensi membaca?', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Bagaimana pendapat Anda mengenai maraknya pembajakan buku fisik maupun PDF ilegal saat ini?', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Inovasi atau kegiatan literasi seperti apa yang Anda harapkan diadakan oleh pihak sekolah?', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Menurut Anda, bagaimana peran aplikasi seperti Wattpad atau Webtoon dalam membentuk budaya baca anak muda?', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Bagaimana cara Anda membagi waktu antara membaca buku, belajar, dan bermain media sosial?', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Sebutkan topik atau tema buku apa yang saat ini sangat ingin Anda pelajari atau baca lebih dalam.', form_id: 15, type: 'text', image: null, page: 5 },
    { question: 'Harapan apa yang ingin Anda sampaikan untuk meningkatkan budaya literasi membaca di kalangan remaja Indonesia 2026?', form_id: 15, type: 'text', image: null, page: 5 },
  ]

  await knex('soal').insert(soal)
}