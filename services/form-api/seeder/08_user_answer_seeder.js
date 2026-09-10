/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('user_answer').del()

  const answers = [
    // ==========================================
    // FORM 1 (submitted_id: 1, 2, 3)
    // Soal 1: Radio (2+2=?), Soal 2: Checkbox (Genap), Soal 3: Text (Rumus), Soal 4: File, Soal 5: Radio (5x6)
    // ==========================================
    // Submitted ID 1 (User 3)
    { submitted_id: 1, soal_id: 1, soal_option_id: 1, answer_text: null, image: null }, // 4
    { submitted_id: 1, soal_id: 2, soal_option_id: 1, answer_text: null, image: null }, // 4
    { submitted_id: 1, soal_id: 2, soal_option_id: 3, answer_text: null, image: null }, // 6
    { submitted_id: 1, soal_id: 3, soal_option_id: null, answer_text: 'L = p x l', image: null },
    { submitted_id: 1, soal_id: 4, soal_option_id: null, answer_text: null, image: '/uploads/answers/jawaban-orat-oret-1.png' },
    { submitted_id: 1, soal_id: 5, soal_option_id: 7, answer_text: null, image: null }, // 30

    // Submitted ID 2 (User 4)
    { submitted_id: 2, soal_id: 1, soal_option_id: 1, answer_text: null, image: null },
    { submitted_id: 2, soal_id: 2, soal_option_id: 5, answer_text: null, image: null }, // 2
    { submitted_id: 2, soal_id: 3, soal_option_id: null, answer_text: 'panjang x lebar', image: null },
    { submitted_id: 2, soal_id: 4, soal_option_id: null, answer_text: null, image: '/uploads/answers/jawaban-orat-oret-2.png' },
    { submitted_id: 2, soal_id: 5, soal_option_id: 7, answer_text: null, image: null },

    // ==========================================
    // FORM 2 (submitted_id: 4, 5, 6)
    // Soal 6: Radio (Sila), Soal 7: Checkbox (Simbol), Soal 8: Text (Sila 1), Soal 9: File, Soal 10: Radio (Sila 3)
    // ==========================================
    // Submitted ID 4 (User 1)
    { submitted_id: 4, soal_id: 6, soal_option_id: 10, answer_text: null, image: null }, // 5 Sila
    { submitted_id: 4, soal_id: 7, soal_option_id: 12, answer_text: null, image: null }, // Bintang
    { submitted_id: 4, soal_id: 7, soal_option_id: 13, answer_text: null, image: null }, // Rantai
    { submitted_id: 4, soal_id: 8, soal_option_id: null, answer_text: 'Ketuhanan Yang Maha Esa', image: null },
    { submitted_id: 4, soal_id: 9, soal_option_id: null, answer_text: null, image: '/uploads/answers/tugas-rangkuman-bab1.png' },
    { submitted_id: 4, soal_id: 10, soal_option_id: 14, answer_text: null, image: null }, // Pohon Beringin

    // ==========================================
    // FORM 3 (submitted_id: 7, 8)
    // Soal 11: Radio (Thank you), Soal 12: Checkbox (Noun), Soal 13: Text (Konnichiwa), Soal 14: File, Soal 15: Radio (Ejaan)
    // ==========================================
    // Submitted ID 7 (User 2)
    { submitted_id: 7, soal_id: 11, soal_option_id: 16, answer_text: null, image: null }, // Terima kasih
    { submitted_id: 7, soal_id: 12, soal_option_id: 19, answer_text: null, image: null }, // Book
    { submitted_id: 7, soal_id: 12, soal_option_id: 22, answer_text: null, image: null }, // Pen
    { submitted_id: 7, soal_id: 13, soal_option_id: null, answer_text: 'Selamat siang / Halo', image: null },
    { submitted_id: 7, soal_id: 14, soal_option_id: null, answer_text: null, image: '/uploads/answers/audio-perkenalan.png' },
    { submitted_id: 7, soal_id: 15, soal_option_id: 23, answer_text: null, image: null }, // Receive

    // ==========================================
    // FORM 4 (submitted_id: 9, 10, 11)
    // Soal 16: Radio (SI Gaya), Soal 17: Checkbox (Newton), Soal 18: Text (Kecepatan), Soal 19: File, Soal 20: Radio (Arus)
    // ==========================================
    // Submitted ID 9 (User 1)
    { submitted_id: 9, soal_id: 16, soal_option_id: 26, answer_text: null, image: null }, // Newton
    { submitted_id: 9, soal_id: 17, soal_option_id: 28, answer_text: null, image: null }, // Hukum I
    { submitted_id: 9, soal_id: 17, soal_option_id: 29, answer_text: null, image: null }, // Hukum II
    { submitted_id: 9, soal_id: 18, soal_option_id: null, answer_text: 'v = s / t', image: null },
    { submitted_id: 9, soal_id: 19, soal_option_id: null, answer_text: null, image: '/uploads/answers/grafik-praktikum.png' },
    { submitted_id: 9, soal_id: 20, soal_option_id: 32, answer_text: null, image: null }, // Ampermeter

    // ==========================================
    // FORM 5 (submitted_id: 12, 13)
    // Soal 21: Radio (Puas), Soal 22: Checkbox (Fasilitas), Soal 23: Text (Saran), Soal 24: File, Soal 25: Radio (Efektif)
    // ==========================================
    // Submitted ID 12 (User 1)
    { submitted_id: 12, soal_id: 21, soal_option_id: 34, answer_text: null, image: null }, // Puas
    { submitted_id: 12, soal_id: 22, soal_option_id: 36, answer_text: null, image: null }, // Perpustakaan
    { submitted_id: 12, soal_id: 22, soal_option_id: 37, answer_text: null, image: null }, // Kantin
    { submitted_id: 12, soal_id: 23, soal_option_id: null, answer_text: 'Perlu penambahan meja di kantin.', image: null },
    { submitted_id: 12, soal_id: 24, soal_option_id: null, answer_text: null, image: '/uploads/answers/foto-fasilitas-rusak.png' },
    { submitted_id: 12, soal_id: 25, soal_option_id: 39, answer_text: null, image: null }, // Ya

    // ==========================================
    // FORM 6 (submitted_id: 14, 15)
    // Soal 26: Radio (Organik), Soal 27: Checkbox (Alkana), Soal 28: Text (Methane), Soal 29: File, Soal 30: Radio (Ikatan C)
    // ==========================================
    // Submitted ID 14 (User 2)
    { submitted_id: 14, soal_id: 26, soal_option_id: 42, answer_text: null, image: null }, // Karbon
    { submitted_id: 14, soal_id: 27, soal_option_id: 44, answer_text: null, image: null }, // Alkanol
    { submitted_id: 14, soal_id: 27, soal_option_id: 45, answer_text: null, image: null }, // Alkanal
    { submitted_id: 14, soal_id: 28, soal_option_id: null, answer_text: 'CH4', image: null },
    { submitted_id: 14, soal_id: 29, soal_option_id: null, answer_text: null, image: '/uploads/answers/struktur-molekul.png' },
    { submitted_id: 14, soal_id: 30, soal_option_id: 48, answer_text: null, image: null }, // 4

    // ==========================================
    // FORM 7 (submitted_id: 16, 17, 18)
    // Soal 31: Radio (Hari), Soal 32: Checkbox (Ekskul), Soal 33: Text (Alasan), Soal 34: File, Soal 35: Radio (Pengalaman)
    // ==========================================
    // Submitted ID 16 (User 3)
    { submitted_id: 16, soal_id: 31, soal_option_id: 49, answer_text: null, image: null }, // Senin & Rabu
    { submitted_id: 16, soal_id: 32, soal_option_id: 54, answer_text: null, image: null }, // Futsal
    { submitted_id: 16, soal_id: 33, soal_option_id: null, answer_text: 'Ingin mengasah bakat olahraga.', image: null },
    { submitted_id: 16, soal_id: 34, soal_option_id: null, answer_text: null, image: '/uploads/answers/pas-foto-3x4.png' },
    { submitted_id: 16, soal_id: 35, soal_option_id: 55, answer_text: null, image: null }, // Pernah

    // ==========================================
    // FORM 8 (submitted_id: 19, 20)
    // Soal 36: Radio (Respirasi), Soal 37: Checkbox (Vertebrata), Soal 38: Text (Fotosintesis), Soal 39: File, Soal 40: Radio (Pembelahan)
    // ==========================================
    // Submitted ID 19 (User 1)
    { submitted_id: 19, soal_id: 36, soal_option_id: 57, answer_text: null, image: null }, // Mitokondria
    { submitted_id: 19, soal_id: 37, soal_option_id: 59, answer_text: null, image: null }, // Kucing
    { submitted_id: 19, soal_id: 37, soal_option_id: 60, answer_text: null, image: null }, // Burung
    { submitted_id: 19, soal_id: 38, soal_option_id: null, answer_text: 'Proses pembuatan makanan oleh tumbuhan menggunakan cahaya matahari.', image: null },
    { submitted_id: 19, soal_id: 39, soal_option_id: null, answer_text: null, image: '/uploads/answers/pengamatan-mikroskop.png' },
    { submitted_id: 19, soal_id: 40, soal_option_id: 62, answer_text: null, image: null }, // Mitosis

    // ==========================================
    // FORM 9 (submitted_id: 21, 22)
    // Soal 41: Radio (Kebersihan), Soal 42: Checkbox (Pencahayaan), Soal 43: Text (Kritik), Soal 44: File, Soal 45: Radio (Wi-Fi)
    // ==========================================
    // Submitted ID 21 (User 1)
    { submitted_id: 21, soal_id: 41, soal_option_id: 65, answer_text: null, image: null }, // Cukup Bersih
    { submitted_id: 21, soal_id: 42, soal_option_id: 67, answer_text: null, image: null }, // Kantin Belakang
    { submitted_id: 21, soal_id: 43, soal_option_id: null, answer_text: 'Koleksi buku perlu diperbarui.', image: null },
    { submitted_id: 21, soal_id: 44, soal_option_id: null, answer_text: null, image: '/uploads/answers/bukti-kendala-fasilitas.png' },
    { submitted_id: 21, soal_id: 45, soal_option_id: 70, answer_text: null, image: null }, // Sering Putus

    // ==========================================
    // FORM 10 (submitted_id: 23, 24, 25)
    // Soal 46: Radio (Tgl Proklamasi), Soal 47: Checkbox (Pahlawan Jawa), Soal 48: Text (Pembaca), Soal 49: File, Soal 50: Radio (Kota)
    // ==========================================
    // Submitted ID 23 (User 2)
    { submitted_id: 23, soal_id: 46, soal_option_id: 71, answer_text: null, image: null }, // 17 Agustus 1945
    { submitted_id: 23, soal_id: 47, soal_option_id: 74, answer_text: null, image: null }, // Diponegoro
    { submitted_id: 23, soal_id: 47, soal_option_id: 75, answer_text: null, image: null }, // Soedirman
    { submitted_id: 23, soal_id: 48, soal_option_id: null, answer_text: 'Ir. Soekarno', image: null },
    { submitted_id: 23, soal_id: 49, soal_option_id: null, answer_text: null, image: '/uploads/answers/rangkuman-rengasdengklok.png' },
    { submitted_id: 23, soal_id: 50, soal_option_id: 77, answer_text: null, image: null },  // Jakarta

    // ==========================================
    // FORM 11 (submitted_id: 26) - 50 Jawaban
    // ==========================================

    // --- Jawaban PG (1 - 30) ---
    { submitted_id: 26, soal_id: 51, soal_option_id: 78, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 52, soal_option_id: 82, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 53, soal_option_id: 86, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 54, soal_option_id: 90, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 55, soal_option_id: 94, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 56, soal_option_id: 98, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 57, soal_option_id: 102, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 58, soal_option_id: 106, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 59, soal_option_id: 110, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 60, soal_option_id: 114, answer_text: null, image: null },

    { submitted_id: 26, soal_id: 61, soal_option_id: 118, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 62, soal_option_id: 122, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 63, soal_option_id: 126, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 64, soal_option_id: 130, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 65, soal_option_id: 134, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 66, soal_option_id: 138, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 67, soal_option_id: 142, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 68, soal_option_id: 146, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 69, soal_option_id: 150, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 70, soal_option_id: 154, answer_text: null, image: null },

    { submitted_id: 26, soal_id: 71, soal_option_id: 158, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 72, soal_option_id: 162, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 73, soal_option_id: 166, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 74, soal_option_id: 170, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 75, soal_option_id: 174, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 76, soal_option_id: 178, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 77, soal_option_id: 182, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 78, soal_option_id: 186, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 79, soal_option_id: 190, answer_text: null, image: null },
    { submitted_id: 26, soal_id: 80, soal_option_id: 194, answer_text: null, image: null },

    // --- Jawaban Benar / Salah (31 - 40) ---
    { submitted_id: 26, soal_id: 81, soal_option_id: 198, answer_text: null, image: null }, // Benar
    { submitted_id: 26, soal_id: 82, soal_option_id: 200, answer_text: null, image: null }, // Benar
    { submitted_id: 26, soal_id: 83, soal_option_id: 203, answer_text: null, image: null }, // Salah
    { submitted_id: 26, soal_id: 84, soal_option_id: 204, answer_text: null, image: null }, // Benar
    { submitted_id: 26, soal_id: 85, soal_option_id: 206, answer_text: null, image: null }, // Benar
    { submitted_id: 26, soal_id: 86, soal_option_id: 209, answer_text: null, image: null }, // Salah
    { submitted_id: 26, soal_id: 87, soal_option_id: 210, answer_text: null, image: null }, // Benar
    { submitted_id: 26, soal_id: 88, soal_option_id: 212, answer_text: null, image: null }, // Benar
    { submitted_id: 26, soal_id: 89, soal_option_id: 215, answer_text: null, image: null }, // Salah
    { submitted_id: 26, soal_id: 90, soal_option_id: 216, answer_text: null, image: null }, // Benar

    // --- Jawaban Essay (41 - 50) ---
    { submitted_id: 26, soal_id: 91, soal_option_id: null, answer_text: 'Nusantara (IKN)', image: null },
    { submitted_id: 26, soal_id: 92, soal_option_id: null, answer_text: 'Iklim tropis memiliki 2 musim (hujan dan kemarau), sedangkan subtropis memiliki 4 musim.', image: null },
    { submitted_id: 26, soal_id: 93, soal_option_id: null, answer_text: 'Komodo, Anoa, dan Babirusa.', image: null },
    { submitted_id: 26, soal_id: 94, soal_option_id: null, answer_text: 'Delta adalah daratan yang terbentuk dari endapan sedimen di muara sungai.', image: null },
    { submitted_id: 26, soal_id: 95, soal_option_id: null, answer_text: 'Karena dilalui jalur lempeng tektonik aktif (Indo-Australia, Eurasia, dan Pasifik).', image: '/uploads/answers/gambar-lempeng-user1.png' },
    { submitted_id: 26, soal_id: 96, soal_option_id: null, answer_text: 'Sumatra, Jawa, Kalimantan, Sulawesi, dan Papua.', image: null },
    { submitted_id: 26, soal_id: 97, soal_option_id: null, answer_text: 'Menahan abrasi air laut dan memecah gelombang ombak besar.', image: null },
    { submitted_id: 26, soal_id: 98, soal_option_id: null, answer_text: 'Pengaruh udara basah yang terangkat naik mengikuti relief lereng gunung (hujan orografis).', image: null },
    { submitted_id: 26, soal_id: 99, soal_option_id: null, answer_text: 'Samudra Hindia dan negara Australia.', image: null },
    { submitted_id: 26, soal_id: 100, soal_option_id: null, answer_text: 'Evakuasi ke tempat aman, menjauhi zona bahaya, dan menggunakan masker pelindung debu vulkanik.', image: null },

    // ==========================================
    // FORM 12 (submitted_id: 29) - 40 Jawaban
    // ==========================================

    // --- Jawaban PG Page 1 (Soal 1 - 10 / soal_id: 101 - 110) ---
    { submitted_id: 29, soal_id: 101, soal_option_id: 217, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 102, soal_option_id: 221, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 103, soal_option_id: 225, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 104, soal_option_id: 229, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 105, soal_option_id: 233, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 106, soal_option_id: 237, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 107, soal_option_id: 241, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 108, soal_option_id: 245, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 109, soal_option_id: 249, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 110, soal_option_id: 253, answer_text: null, image: null },

    // --- Jawaban PG Page 2 (Soal 11 - 20 / soal_id: 111 - 120) ---
    { submitted_id: 29, soal_id: 111, soal_option_id: 257, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 112, soal_option_id: 261, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 113, soal_option_id: 265, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 114, soal_option_id: 269, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 115, soal_option_id: 273, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 116, soal_option_id: 277, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 117, soal_option_id: 281, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 118, soal_option_id: 285, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 119, soal_option_id: 289, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 120, soal_option_id: 293, answer_text: null, image: null },

    // --- Jawaban PG Page 3 (Soal 21 - 30 / soal_id: 121 - 130) ---
    { submitted_id: 29, soal_id: 121, soal_option_id: 297, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 122, soal_option_id: 301, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 123, soal_option_id: 305, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 124, soal_option_id: 309, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 125, soal_option_id: 313, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 126, soal_option_id: 317, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 127, soal_option_id: 321, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 128, soal_option_id: 325, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 129, soal_option_id: 329, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 130, soal_option_id: 333, answer_text: null, image: null },

    // --- Jawaban Benar / Salah Page 4 (Soal 31 - 40 / soal_id: 131 - 140) ---
    { submitted_id: 29, soal_id: 131, soal_option_id: 337, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 132, soal_option_id: 339, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 133, soal_option_id: 341, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 134, soal_option_id: 344, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 135, soal_option_id: 345, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 136, soal_option_id: 348, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 137, soal_option_id: 349, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 138, soal_option_id: 352, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 139, soal_option_id: 353, answer_text: null, image: null },
    { submitted_id: 29, soal_id: 140, soal_option_id: 356, answer_text: null, image: null },

        // ==========================================
    // FORM 13 (submitted_id: 33) - 20 Jawaban Survei
    // ==========================================

    // --- Jawaban PG / Skala Page 1 (Soal 1 - 5 / soal_id: 151 - 155) ---
    { submitted_id: 33, soal_id: 151, soal_option_id: 318, answer_text: null, image: null }, // Sangat Baik
    { submitted_id: 33, soal_id: 152, soal_option_id: 322, answer_text: null, image: null }, // Sangat Jelas
    { submitted_id: 33, soal_id: 153, soal_option_id: 326, answer_text: null, image: null }, // Sangat Lengkap & Jelas
    { submitted_id: 33, soal_id: 154, soal_option_id: 331, answer_text: null, image: null }, // Responsif
    { submitted_id: 33, soal_id: 155, soal_option_id: 334, answer_text: null, image: null }, // Sangat Sesuai
    { submitted_id: 33, soal_id: 156, soal_option_id: 339, answer_text: null, image: null }, // Seimbang
    { submitted_id: 33, soal_id: 157, soal_option_id: 342, answer_text: null, image: null }, // Sangat Stabil & Mudah Digunakan
    { submitted_id: 33, soal_id: 158, soal_option_id: 346, answer_text: null, image: null }, // Sangat Aktif
    { submitted_id: 33, soal_id: 159, soal_option_id: 351, answer_text: null, image: null }, // Tepat Waktu
    { submitted_id: 33, soal_id: 160, soal_option_id: 354, answer_text: null, image: null }, // Sangat Transparan & Objektif
    { submitted_id: 33, soal_id: 161, soal_option_id: 359, answer_text: null, image: null }, // Memadai
    { submitted_id: 33, soal_id: 162, soal_option_id: 362, answer_text: null, image: null }, // Sangat Menarik
    { submitted_id: 33, soal_id: 163, soal_option_id: 366, answer_text: null, image: null }, // Sangat Paham
    { submitted_id: 33, soal_id: 164, soal_option_id: 371, answer_text: null, image: null }, // Terbuka
    { submitted_id: 33, soal_id: 165, soal_option_id: 374, answer_text: null, image: null }, // Sangat Puas

    // --- Jawaban Text / Essay Page 4 (Soal 16 - 20 / soal_id: 166 - 170) ---
    { 
      submitted_id: 33, 
      soal_id: 166, 
      soal_option_id: null, 
      answer_text: 'Diskusi kelompok berbasis studi kasus nyata, karena membuat siswa lebih aktif berargumen dan memahami penerapan praktisnya.', 
      image: null 
    },
    { 
      submitted_id: 33, 
      soal_id: 167, 
      soal_option_id: null, 
      answer_text: 'Koneksi internet yang terkadang kurang stabil saat sesi pemaparan live streaming atau ujian online.', 
      image: null 
    },
    { 
      submitted_id: 33, 
      soal_id: 168, 
      soal_option_id: null, 
      answer_text: 'Kapasitas server LMS perlu ditingkatkan agar tidak mengalami lag saat jam-jam kritis pengumpulan tugas.', 
      image: null 
    },
    { 
      submitted_id: 33, 
      soal_id: 169, 
      soal_option_id: null, 
      answer_text: 'Mengadakan kuis interaktif singkat seperti Quizizz di pertengahan sesi untuk mencairkan suasana kelas.', 
      image: null 
    },
    { 
      submitted_id: 33, 
      soal_id: 170, 
      soal_option_id: null, 
      answer_text: 'Secara keseluruhan KBM tahun 2026 sudah berjalan sangat baik, mohon jadwal materi dapat dipublikasikan lebih awal.', 
      image: null 
    },

    // ==========================================
    // FORM 14 (submitted_id: 36) - 50 Jawaban
    // ==========================================

    // --- Jawaban PG Page 1 (Soal 1 - 10 / soal_id: 171 - 180) ---
    { submitted_id: 36, soal_id: 171, soal_option_id: 378, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 172, soal_option_id: 382, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 173, soal_option_id: 386, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 174, soal_option_id: 390, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 175, soal_option_id: 394, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 176, soal_option_id: 398, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 177, soal_option_id: 402, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 178, soal_option_id: 406, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 179, soal_option_id: 410, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 180, soal_option_id: 414, answer_text: null, image: null },

    // --- Jawaban PG Page 2 (Soal 11 - 20 / soal_id: 181 - 190) ---
    { submitted_id: 36, soal_id: 181, soal_option_id: 418, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 182, soal_option_id: 422, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 183, soal_option_id: 426, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 184, soal_option_id: 430, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 185, soal_option_id: 434, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 186, soal_option_id: 438, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 187, soal_option_id: 442, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 188, soal_option_id: 446, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 189, soal_option_id: 450, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 190, soal_option_id: 454, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 191, soal_option_id: 458, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 192, soal_option_id: 462, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 193, soal_option_id: 466, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 194, soal_option_id: 470, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 195, soal_option_id: 474, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 196, soal_option_id: 478, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 197, soal_option_id: 482, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 198, soal_option_id: 486, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 199, soal_option_id: 490, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 200, soal_option_id: 494, answer_text: null, image: null },

    // --- Jawaban Benar / Salah Page 4 (Soal 31 - 40 / soal_id: 201 - 210) ---
    { submitted_id: 36, soal_id: 201, soal_option_id: 498, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 202, soal_option_id: 501, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 203, soal_option_id: 503, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 204, soal_option_id: 505, answer_text: null, image: null }, 
    { submitted_id: 36, soal_id: 205, soal_option_id: 506, answer_text: null, image: null }, 
    { submitted_id: 36, soal_id: 206, soal_option_id: 508, answer_text: null, image: null }, 
    { submitted_id: 36, soal_id: 207, soal_option_id: 510, answer_text: null, image: null }, 
    { submitted_id: 36, soal_id: 208, soal_option_id: 512, answer_text: null, image: null },
    { submitted_id: 36, soal_id: 209, soal_option_id: 515, answer_text: null, image: null }, 
    { submitted_id: 36, soal_id: 210, soal_option_id: 516, answer_text: null, image: null },

    // --- Jawaban Essay / Text Page 5 (Soal 41 - 50 / soal_id: 211 - 220) ---
    { submitted_id: 36, soal_id: 211, soal_option_id: null, answer_text: 'Sistem ekonomi pasar memberikan kebebasan penuh pada pihak swasta dan mekanisme pasar, sedangkan sistem ekonomi komando diatur dan dikendalikan sepenuhnya oleh pemerintah.', image: null },
    { submitted_id: 36, soal_id: 212, soal_option_id: null, answer_text: 'Faktor yang menggeser kurva penawaran ke kanan antara lain penurunan biaya produksi, kemajuan teknologi, penurunan pajak, dan bertambahnya jumlah produsen.', image: null },
    { submitted_id: 36, soal_id: 213, soal_option_id: null, answer_text: 'Biaya peluang adalah nilai alternatif terbaik yang dikorbankan saat memilih suatu opsi. Contoh: Memilih kuliah daripada langsung bekerja, maka biaya peluangnya adalah gaji yang seharusnya diperoleh dari bekerja.', image: null },
    { submitted_id: 36, soal_id: 214, soal_option_id: null, answer_text: 'Inflasi tinggi merugikan masyarakat berpenghasilan tetap karena daya beli mereka menurun akibat harga barang naik sedangkan pendapatan nominal tetap.', image: null },
    { submitted_id: 36, soal_id: 215, soal_option_id: null, answer_text: 'Pemerintah dapat menurunkan tarif pajak dan meningkatkan belanja publik/pengeluaran pemerintah untuk merangsang pertumbuhan ekonomi.', image: null },
    { submitted_id: 36, soal_id: 216, soal_option_id: null, answer_text: 'GDP menghitung total produksi di dalam wilayah suatu negara tanpa memandang kewarganegaraan, sedangkan GNP menghitung total produksi oleh warga negara tersebut baik di dalam maupun di luar negeri.', image: null },
    { submitted_id: 36, soal_id: 217, soal_option_id: null, answer_text: 'Keuntungan: efisiensi skala besar dan keberlanjutan pasokan produk. Kerugian: harga cenderung tinggi dan konsumen tidak memiliki pilihan barang pengganti.', image: null },
    { submitted_id: 36, soal_id: 218, soal_option_id: null, answer_text: 'Menjaga kestabilan nilai rupiah, menetapkan serta melaksanakan kebijakan moneter, dan mengatur serta menjaga kelancaran sistem pembayaran.', image: null },
    { submitted_id: 36, soal_id: 219, soal_option_id: null, answer_text: 'Negara sebaiknya mengkhususkan diri pada produksi dan ekspor barang yang memiliki biaya relatif paling murah dibanding negara lain.', image: null },
    { submitted_id: 36, soal_id: 220, soal_option_id: null, answer_text: 'BUMN berperan menyediakan barang/jasa bagi masyarakat, melepaskan ketergantungan sektor vital dari swasta, serta memberikan kontribusi pendapatan bagi kas negara.', image: null },

    // ==========================================
    // FORM 15 (submitted_id: 3) - 50 Jawaban
    // ==========================================

    // --- Jawaban PG Page 1 (Soal 1 - 10 / soal_id: 221 - 230) ---
    { submitted_id: 39, soal_id: 221, soal_option_id: 519, answer_text: null, image: null }, // 30 - 60 menit
    { submitted_id: 39, soal_id: 222, soal_option_id: 523, answer_text: null, image: null }, // 1 - 2 buku
    { submitted_id: 39, soal_id: 223, soal_option_id: 526, answer_text: null, image: null }, // Buku Cetak / Fisik
    { submitted_id: 39, soal_id: 224, soal_option_id: 530, answer_text: null, image: null }, // Sebelum tidur malam
    { submitted_id: 39, soal_id: 225, soal_option_id: 534, answer_text: null, image: null }, // Mengisi waktu luang dan hiburan
    { submitted_id: 39, soal_id: 226, soal_option_id: 538, answer_text: null, image: null }, // Meminjam dari Perpustakaan Sekolah
    { submitted_id: 39, soal_id: 227, soal_option_id: 542, answer_text: null, image: null }, // Novel Fiksi Remaja / Romance
    { submitted_id: 39, soal_id: 228, soal_option_id: 546, answer_text: null, image: null }, // Pengembangan Diri
    { submitted_id: 39, soal_id: 229, soal_option_id: 550, answer_text: null, image: null }, // 1 - 3 kali seminggu
    { submitted_id: 39, soal_id: 230, soal_option_id: 554, answer_text: null, image: null }, // Ya, Sangat Aktif

    { submitted_id: 39, soal_id: 231, soal_option_id: 558, answer_text: null, image: null }, // Orang tua / Keluarga
    { submitted_id: 39, soal_id: 232, soal_option_id: 562, answer_text: null, image: null }, // Terdistraksi Gadget
    { submitted_id: 39, soal_id: 233, soal_option_id: 566, answer_text: null, image: null }, // Sangat Lengkap & Bervariasi
    { submitted_id: 39, soal_id: 234, soal_option_id: 570, answer_text: null, image: null }, // Ya, Sangat Berpengaruh
    { submitted_id: 39, soal_id: 235, soal_option_id: 574, answer_text: null, image: null }, // Meningkatkan
    { submitted_id: 39, soal_id: 236, soal_option_id: 578, answer_text: null, image: null }, // Sering
    { submitted_id: 39, soal_id: 237, soal_option_id: 582, answer_text: null, image: null }, // Mode Gelap
    { submitted_id: 39, soal_id: 238, soal_option_id: 586, answer_text: null, image: null }, // Rp 0
    { submitted_id: 39, soal_id: 239, soal_option_id: 590, answer_text: null, image: null }, // Sangat Bermanfaat
    { submitted_id: 39, soal_id: 240, soal_option_id: 594, answer_text: null, image: null }, // Lebih dari 3 kali

    { submitted_id: 39, soal_id: 241, soal_option_id: 598, answer_text: null, image: null }, // Sangat Menentukan
    { submitted_id: 39, soal_id: 242, soal_option_id: 602, answer_text: null, image: null }, // EPUB / Reflowable Text
    { submitted_id: 39, soal_id: 243, soal_option_id: 606, answer_text: null, image: null }, // Sangat Mempengaruhi
    { submitted_id: 39, soal_id: 244, soal_option_id: 610, answer_text: null, image: null }, // Wawasan umum bertambah
    { submitted_id: 39, soal_id: 245, soal_option_id: 614, answer_text: null, image: null }, // Tenang, Ber-AC
    { submitted_id: 39, soal_id: 246, soal_option_id: 618, answer_text: null, image: null }, // Sering (Sticky Notes/Journal)
    { submitted_id: 39, soal_id: 247, soal_option_id: 622, answer_text: null, image: null }, // Bahasa Indonesia
    { submitted_id: 39, soal_id: 248, soal_option_id: 626, answer_text: null, image: null }, // Sangat Menarik
    { submitted_id: 39, soal_id: 249, soal_option_id: 630, answer_text: null, image: null }, // Bisa fokus lebih dari 1 jam
    { submitted_id: 39, soal_id: 250, soal_option_id: 634, answer_text: null, image: null }, // Sangat Tertarik

    { submitted_id: 39, soal_id: 251, soal_option_id: 638, answer_text: null, image: null }, // Benar
    { submitted_id: 39, soal_id: 252, soal_option_id: 641, answer_text: null, image: null }, // Salah
    { submitted_id: 39, soal_id: 253, soal_option_id: 642, answer_text: null, image: null }, // Benar
    { submitted_id: 39, soal_id: 254, soal_option_id: 644, answer_text: null, image: null }, // Benar
    { submitted_id: 39, soal_id: 255, soal_option_id: 647, answer_text: null, image: null }, // Salah
    { submitted_id: 39, soal_id: 256, soal_option_id: 649, answer_text: null, image: null }, // Salah
    { submitted_id: 39, soal_id: 257, soal_option_id: 650, answer_text: null, image: null }, // Benar
    { submitted_id: 39, soal_id: 258, soal_option_id: 652, answer_text: null, image: null }, // Benar
    { submitted_id: 39, soal_id: 259, soal_option_id: 655, answer_text: null, image: null }, // Salah
    { submitted_id: 39, soal_id: 260, soal_option_id: 656, answer_text: null, image: null }, // Benar

    // --- Jawaban Essay / Text Page 5 (Soal 41 - 50 / soal_id: 261 - 270) ---
    { submitted_id: 39, soal_id: 261, soal_option_id: null, answer_text: 'Desain sampul yang estetik, sinopsis cerita yang menarik di bagian belakang, serta rekomendasi positif dari teman.', image: null },
    { submitted_id: 39, soal_id: 262, soal_option_id: null, answer_text: 'Buku Laut Bercerita karya Leila S. Chudori karena alur ceritanya emosional dan memberikan wawasan sejarah yang mendalam.', image: null },
    { submitted_id: 39, soal_id: 263, soal_option_id: null, answer_text: 'Menyediakan sofa empuk, pendingin ruangan yang memadai, pencahayaan terang, serta mini bar tempat menjual kopi atau teh.', image: null },
    { submitted_id: 39, soal_id: 264, soal_option_id: null, answer_text: 'Notifikasi media sosial dan godaan bermain game di HP yang membuat fokus membaca sering terpecah.', image: null },
    { submitted_id: 39, soal_id: 265, soal_option_id: null, answer_text: 'Pembajakan sangat merugikan penulis dan penerbit, sehingga perlu adanya pengawasan tegas serta penyediaan e-book legal yang harganya ramah pelajar.', image: null },
    { submitted_id: 39, soal_id: 266, soal_option_id: null, answer_text: 'Mengadakan bazar buku murah bulanan, pameran karya cipta cerita siswa, dan tantangan membaca (reading challenge) berhadiah.', image: null },
    { submitted_id: 39, soal_id: 267, soal_option_id: null, answer_text: 'Aplikasi tersebut sangat bagus untuk menjadi pintu masuk awal bagi anak muda untuk menyukai kegiatan membaca dengan visual yang interaktif.', image: null },
    { submitted_id: 39, soal_id: 268, soal_option_id: null, answer_text: 'Menyisihkan waktu 30 menit sebelum tidur khusus untuk membaca tanpa memegang HP sama sekali.', image: null },
    { submitted_id: 39, soal_id: 269, soal_option_id: null, answer_text: 'Topik psikologi populer dan pengembangan diri (self-improvement) untuk melatih manajemen emosi remaja.', image: null },
    { submitted_id: 39, soal_id: 270, soal_option_id: null, answer_text: 'Semoga akses buku fisik maupun digital dapat menjangkau seluruh daerah di Indonesia dengan harga yang jauh lebih terjangkau.', image: null }
  ]

  await knex('user_answer').insert(answers)
}