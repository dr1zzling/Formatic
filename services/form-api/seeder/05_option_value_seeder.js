/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('option_value').del()
  await knex('option_value').insert([

    // ==========================================
    // MATEMATIKA (Soal 1 - 50)
    // ==========================================

    // 1
    { value: 'f’(x) = 6x + 5' },
    { value: 'f’(x) = 6x - 5' },
    { value: 'f’(x) = 3x + 5' },
    { value: 'f’(x) = 6x² + 5' },

    // 2
    { value: 'x² + 3x + C' },
    { value: '2x² + 3x + C' },
    { value: 'x² + C' },
    { value: '2x + 3 + C' },

    // 3
    { value: '4' },
    { value: '0' },
    { value: '2' },
    { value: '8' },

    // 4
    { value: '5' },
    { value: '11' },
    { value: '8' },
    { value: '3' },

    // 5
    { value: '32' },
    { value: '35' },
    { value: '30' },
    { value: '27' },

    // 6
    { value: '486' },
    { value: '162' },
    { value: '243' },
    { value: '1458' },

    // 7
    { value: '9' },
    { value: '7' },
    { value: '8' },
    { value: '10' },

    // 8
    { value: '1' },
    { value: '0' },
    { value: '1/2' },
    { value: '2' },

    // 9
    { value: '2x² – 5' },
    { value: '2x² – 6' },
    { value: '4x² – 2' },
    { value: '2x² + 1' },

    // 10
    { value: '8/3' },
    { value: '4/3' },
    { value: '2' },
    { value: '8' },

    // 11
    { value: 'f’(x) = 15x² – 8x' },
    { value: 'f’(x) = 15x² – 8' },
    { value: 'f’(x) = 5x² – 4x' },
    { value: 'f’(x) = 15x³ – 8x' },

    // 12
    { value: '(4/3)x³ – 3x² + C' },
    { value: '4x³ – 6x² + C' },
    { value: '(4/3)x³ – 6x² + C' },
    { value: '2x³ – 3x² + C' },

    // 13
    { value: '3' },
    { value: '1' },
    { value: '2' },
    { value: 'Tak hingga' },

    // 14
    { value: '22' },
    { value: '10' },
    { value: '14' },
    { value: '18' },

    // 15
    { value: '77' },
    { value: '72' },
    { value: '82' },
    { value: '67' },

    // 16
    { value: '136' },
    { value: '120' },
    { value: '144' },
    { value: '112' },

    // 17
    { value: '64' },
    { value: '32' },
    { value: '128' },
    { value: '16' },

    // 18
    { value: 'x = ±√13' },
    { value: 'x = ±3' },
    { value: 'x = ±√5' },
    { value: 'x = ±13' },

    // 19
    { value: '1' },
    { value: '1/2' },
    { value: '3/4' },
    { value: '1/4' },

    // 20
    { value: '2x² + 1' },
    { value: '2x² - 1' },
    { value: '4x² + 8' },
    { value: '2x² + 3' },

    // 21
    { value: '24' },
    { value: '12' },
    { value: '36' },
    { value: '48' },

    // 22
    { value: 'f’(x) = 1/(2√x)' },
    { value: 'f’(x) = 1/√x' },
    { value: 'f’(x) = 2√x' },
    { value: 'f’(x) = 1/(x√x)' },

    // 23
    { value: 'ln|x| + C' },
    { value: '1/x² + C' },
    { value: '-1/x² + C' },
    { value: 'e^x + C' },

    // 24
    { value: '1' },
    { value: '0' },
    { value: 'Tak hingga' },
    { value: '1/2' },

    // 25
    { value: '–1' },
    { value: '1' },
    { value: '13' },
    { value: '–13' },

    // 26
    { value: '155' },
    { value: '145' },
    { value: '165' },
    { value: '135' },

    // 27
    { value: '315/16' },
    { value: '315/32' },
    { value: '155/32' },
    { value: '63/8' },

    // 28
    { value: '10000' },
    { value: '1000' },
    { value: '40' },
    { value: '100000' },

    // 29
    { value: '1/2' },
    { value: '1/4' },
    { value: '1' },
    { value: '1/√2' },

    // 30
    { value: '58' },
    { value: '40' },
    { value: '20' },
    { value: '118' },

    // 31
    { value: '4' },
    { value: '2' },
    { value: '8' },
    { value: '16' },

    // 32
    { value: '3x² – 6x + 1' },
    { value: '3x² + 6x + 1' },
    { value: '2x² – 6x' },
    { value: '3x² – 3' },

    // 33
    { value: '2e^x + C' },
    { value: 'e^(2x) + C' },
    { value: 'e^x + C' },
    { value: '2e^(2x) + C' },

    // 34
    { value: '5/2' },
    { value: '3/7' },
    { value: '1' },
    { value: 'Tak hingga' },

    // 35
    { value: '22' },
    { value: '12' },
    { value: '2' },
    { value: '32' },

    // 36
    { value: '204' },
    { value: '180' },
    { value: '216' },
    { value: '192' },

    // 37
    { value: '12288' },
    { value: '3072' },
    { value: '4096' },
    { value: '8192' },

    // 38
    { value: '4' },
    { value: '-2' },
    { value: '4 dan -2' },
    { value: '8' },

    // 39
    { value: '1' },
    { value: '0' },
    { value: '1/2' },
    { value: '√3' },

    // 40
    { value: '32' },
    { value: '19' },
    { value: '16' },
    { value: '25' },

    // 41
    { value: '52/3' },
    { value: '26/3' },
    { value: '18' },
    { value: '54/3' },

    // 42
    { value: '6x – 12' },
    { value: '3x² – 12x' },
    { value: '6x' },
    { value: '6' },

    // 43
    { value: 'sin x + C' },
    { value: '-sin x + C' },
    { value: 'cos x + C' },
    { value: '-cos x + C' },

    // 44
    { value: '1/2' },
    { value: '0' },
    { value: '1' },
    { value: '2' },

    // 45
    { value: '10' },
    { value: '14' },
    { value: '12' },
    { value: '8' },

    // 46
    { value: '242' },
    { value: '162' },
    { value: '80' },
    { value: '243' },

    // 47
    { value: '1/2' },
    { value: '1/3' },
    { value: '1/6' },
    { value: '2/3' },

    // 48
    { value: '5/8' },
    { value: '3/8' },
    { value: '5/3' },
    { value: '1/8' },

    // 49
    { value: '1/2' },
    { value: '1' },
    { value: '1/4' },
    { value: '0' },

    // 50
    { value: '5' },
    { value: '4' },
    { value: '2' },
    { value: '3' },


    // ==========================================
    // PENDIDIKAN PANCASILA (Soal 51 - 100)
    // ==========================================

    // 51
    { value: 'Bintang' },
    { value: 'Rantai' },
    { value: 'Pohon Beringin' },
    { value: 'Kepala Banteng' },

    // 52
    { value: 'Persatuan dan kesatuan bangsa' },
    { value: 'Keadilan sosial' },
    { value: 'Demokrasi musyawarah' },
    { value: 'Penghormatan HAM' },

    // 53
    { value: 'Alinea ke-4' },
    { value: 'Alinea ke-1' },
    { value: 'Alinea ke-2' },
    { value: 'Alinea ke-3' },

    // 54
    { value: 'Menghargai hak orang lain dan tidak semena-mena' },
    { value: 'Mengutamakan kepentingan pribadi' },
    { value: 'Memaksa orang lain mengikuti kehendak kita' },
    { value: 'Melakukan perundungan di sekolah' },

    // 55
    { value: 'Sila ke-4' },
    { value: 'Sila ke-2' },
    { value: 'Sila ke-3' },
    { value: 'Sila ke-5' },

    // 56
    { value: 'Pembukaan UUD 1945' },
    { value: 'Piagam Jakarta' },
    { value: 'Batang Tubuh UUD 1945' },
    { value: 'Ketetapan MPR' },

    // 57
    { value: 'Ir. Soekarno' },
    { value: 'Mr. Soepomo' },
    { value: 'Moh. Yamin' },
    { value: 'Drs. Moh. Hatta' },

    // 58
    { value: 'Padi dan Kapas' },
    { value: 'Rantai Emas' },
    { value: 'Pohon Beringin' },
    { value: 'Bintang' },

    // 59
    { value: 'Pancasila menjadi pedoman bertingkah laku bagi bangsa Indonesia' },
    { value: 'Pancasila hanya sebagai lambang negara saja' },
    { value: 'Pancasila menjadi landasan hukum luar negeri' },
    { value: 'Pancasila bersifat sementara mengikuti perkembangan zaman' },

    // 60
    { value: 'Kemanusiaan yang adil dan beradab' },
    { value: 'Kebebasan mutlak tanpa batas' },
    { value: 'Kekuasaan tertinggi di tangan pemerintah' },
    { value: 'Persamaan kedudukan berdasarkan kekayaan' },

    // 61
    { value: 'Sila ke-1' },
    { value: 'Sila ke-2' },
    { value: 'Sila ke-3' },
    { value: 'Sila ke-5' },

    // 62
    { value: 'Sila ke-3' },
    { value: 'Sila ke-1' },
    { value: 'Sila ke-4' },
    { value: 'Sila ke-2' },

    // 63
    { value: 'Majelis Permusyawaratan Rakyat (MPR)' },
    { value: 'Dewan Perwakilan Rakyat (DPR)' },
    { value: 'Presiden' },
    { value: 'Mahkamah Konstitusi (MK)' },

    // 64
    { value: 'Berbeda-beda tetapi tetap satu jua' },
    { value: 'Bersatu kita teguh bercerai kita runtuh' },
    { value: 'Kebebasan untuk seluruh rakyat' },
    { value: 'Persatuan dalam keterikatan' },

    // 65
    { value: 'Sila ke-2' },
    { value: 'Sila ke-1' },
    { value: 'Sila ke-4' },
    { value: 'Sila ke-5' },

    // 66
    { value: 'Mampu menyesuaikan diri dengan perkembangan zaman tanpa mengubah nilai dasarnya' },
    { value: 'Bebas diubah kapan saja oleh siapapun' },
    { value: 'Menerima seluruh ideologi asing secara mentah-mentah' },
    { value: 'Tidak memiliki pedoman dasar yang pasti' },

    // 67
    { value: 'Hari Lahir Pancasila' },
    { value: 'Hari Kemerdekaan Indonesia' },
    { value: 'Hari Kesaktian Pancasila' },
    { value: 'Hari Sumpah Pemuda' },

    // 68
    { value: '1 Maret 1945' },
    { value: '29 Mei 1945' },
    { value: '17 Agustus 1945' },
    { value: '18 Agustus 1945' },

    // 69
    { value: 'Dr. K.R.T. Radjiman Wedyodiningrat' },
    { value: 'Ir. Soekarno' },
    { value: 'Drs. Moh. Hatta' },
    { value: 'Ichibangase Yosio' },

    // 70
    { value: 'Piagam Jakarta (Jakarta Charter)' },
    { value: 'Teks Proklamasi' },
    { value: 'Sumpah Pemuda' },
    { value: 'Naskah Deklarasi' },

    // 71
    { value: 'Musyawarah mufakat' },
    { value: 'Pengambilan suara terbanyak saja' },
    { value: 'Kehendak pemimpin tertinggi' },
    { value: 'Keinginan kelompok mayoritas' },

    // 72
    { value: 'Sila ke-5' },
    { value: 'Sila ke-1' },
    { value: 'Sila ke-3' },
    { value: 'Sila ke-4' },

    // 73
    { value: 'Sila ke-3' },
    { value: 'Sila ke-2' },
    { value: 'Sila ke-4' },
    { value: 'Sila ke-5' },

    // 74
    { value: 'Semua peraturan hukum tidak boleh bertentangan dengan Pancasila' },
    { value: 'Pancasila diletakkan di bawah UUD 1945' },
    { value: 'Hukum internasional lebih tinggi dari Pancasila' },
    { value: 'Pancasila hanya berlaku untuk hukum pidana' },

    // 75
    { value: 'Norma Adat' },
    { value: 'Norma Agama' },
    { value: 'Norma Hukum' },
    { value: 'Norma Kesusilaan' },

    // 76
    { value: 'Mendapatkan pendidikan yang layak' },
    { value: 'Membayar pajak tepat waktu' },
    { value: 'Mentaati lalu lintas' },
    { value: 'Menjaga ketertiban umum' },

    // 77
    { value: 'Pasal 27 Ayat 3' },
    { value: 'Pasal 28' },
    { value: 'Pasal 29 Ayat 2' },
    { value: 'Pasal 31 Ayat 1' },

    // 78
    { value: 'Bhinneka Tunggal Ika' },
    { value: 'Tut Wuri Handayani' },
    { value: 'Ing Ngarsa Sung Tuladha' },
    { value: 'Pancasila Sakti' },

    // 79
    { value: '45 helai' },
    { value: '17 helai' },
    { value: '8 helai' },
    { value: '19 helai' },

    // 80
    { value: '17 Agustus' },
    { value: '18 Agustus' },
    { value: '1 Juni' },
    { value: '28 Oktober' },

    // 81
    { value: 'Mengenakan seragam sesuai aturan' },
    { value: 'Meninggalkan kelas saat pelajaran berlangsung' },
    { value: 'Mencontek saat ujian' },
    { value: 'Datang terlambat ke sekolah' },

    // 82
    { value: 'Sila ke-3' },
    { value: 'Sila ke-1' },
    { value: 'Sila ke-4' },
    { value: 'Sila ke-5' },

    // 83
    { value: 'PPKI (Panitia Persiapan Kemerdekaan Indonesia)' },
    { value: 'KNPI' },
    { value: 'Panitia Sembilan' },
    { value: 'BPUPKI' },

    // 84
    { value: '22 Juni 1945' },
    { value: '1 Juni 1945' },
    { value: '17 Agustus 1945' },
    { value: '18 Agustus 1945' },

    // 85
    { value: 'Persatuan dan kesatuan bangsa Indonesia' },
    { value: 'Keinginan salah satu kelompok saja' },
    { value: 'Tekanan dari pihak asing' },
    { value: 'Kepentingan ekonomi' },

    // 86
    { value: 'UUD NRI Tahun 1945' },
    { value: 'Peraturan Presiden' },
    { value: 'Peraturan Daerah' },
    { value: 'Hukum Adat' },

    // 87
    { value: 'Rakyat' },
    { value: 'Presiden' },
    { value: 'DPR' },
    { value: 'TNI/Polri' },

    // 88
    { value: 'Kehidupan nyata sehari-hari' },
    { value: 'Naskah tertulis undang-undang saja' },
    { value: 'Cita-cita yang belum terwujud' },
    { value: 'Buku teks pelajaran sekolah' },

    // 89
    { value: 'Meningkatkan kesadaran hukum dan toleransi' },
    { value: 'Menghakimi sendiri pelaku kejahatan' },
    { value: 'Apatis terhadap lingkungan sekitar' },
    { value: 'Membatasi hak orang lain' },

    // 90
    { value: 'Negara Kesatuan' },
    { value: 'Negara Serikat (Federasi)' },
    { value: 'Negara Monarki' },
    { value: 'Negara Konfederasi' },

    // 91
    { value: 'DPR (Dewan Perwakilan Rakyat)' },
    { value: 'Mahkamah Agung' },
    { value: 'Presiden' },
    { value: 'Badan Pemeriksa Keuangan' },

    // 92
    { value: 'Sila ke-5' },
    { value: 'Sila ke-1' },
    { value: 'Sila ke-3' },
    { value: 'Sila ke-4' },

    // 93
    { value: 'Presidensial' },
    { value: 'Parlementer' },
    { value: 'Semi-Presidensial' },
    { value: 'Monarki Absolut' },

    // 94
    { value: 'Mengembangkan usaha koperasi' },
    { value: 'Menerapkan sistem monopoli pasar' },
    { value: 'Mengutamakan impor barang asing' },
    { value: 'Menimbun bahan pokok demi keuntungan' },

    // 95
    { value: 'Sila ke-3' },
    { value: 'Sila ke-1' },
    { value: 'Sila ke-2' },
    { value: 'Sila ke-4' },

    // 96
    { value: 'Diri sendiri dan lingkungannya dalam kehidupan berbangsa' },
    { value: 'Penguasaan wilayah negara lain' },
    { value: 'Persaingan dengan bangsa-bangsa Barat' },
    { value: 'Pemisahan kekuasaan wilayah' },

    // 97
    { value: 'Kesejahteraan bagi seluruh rakyat Indonesia' },
    { value: 'Keuntungan bagi para pengusaha' },
    { value: 'Pemusatan kekayaan pada pejabat negara' },
    { value: 'Pembangunan yang terpusat di pulau tertentu' },

    // 98
    { value: 'Sila ke-4' },
    { value: 'Sila ke-1' },
    { value: 'Sila ke-2' },
    { value: 'Sila ke-3' },

    // 99
    { value: 'Pasal 27 Ayat 2' },
    { value: 'Pasal 29' },
    { value: 'Pasal 30' },
    { value: 'Pasal 34' },

    // 100
    { value: 'Seluruh warga negara Indonesia' },
    { value: 'TNI dan Polri saja' },
    { value: 'Pemerintah pusat saja' },
    { value: 'Tokoh-tokoh adat saja' },
  ]);
};