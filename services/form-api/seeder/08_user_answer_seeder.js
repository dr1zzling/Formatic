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
    { submitted_id: 1, soal_id: 1, soal_option_id: 1, answer_text: null, file_id: null }, // 4
    { submitted_id: 1, soal_id: 2, soal_option_id: 1, answer_text: null, file_id: null }, // 4
    { submitted_id: 1, soal_id: 2, soal_option_id: 3, answer_text: null, file_id: null }, // 6
    { submitted_id: 1, soal_id: 3, soal_option_id: null, answer_text: 'L = p x l', file_id: null },
    { submitted_id: 1, soal_id: 4, soal_option_id: null, answer_text: null, file_id: 11 },
    { submitted_id: 1, soal_id: 5, soal_option_id: 7, answer_text: null, file_id: null }, // 30

    // Submitted ID 2 (User 4)
    { submitted_id: 2, soal_id: 1, soal_option_id: 1, answer_text: null, file_id: null },
    { submitted_id: 2, soal_id: 2, soal_option_id: 5, answer_text: null, file_id: null }, // 2
    { submitted_id: 2, soal_id: 3, soal_option_id: null, answer_text: 'panjang x lebar', file_id: null },
    { submitted_id: 2, soal_id: 4, soal_option_id: null, answer_text: null, file_id: 12 },
    { submitted_id: 2, soal_id: 5, soal_option_id: 7, answer_text: null, file_id: null },

    // ==========================================
    // FORM 2 (submitted_id: 4, 5, 6)
    // Soal 6: Radio (Sila), Soal 7: Checkbox (Simbol), Soal 8: Text (Sila 1), Soal 9: File, Soal 10: Radio (Sila 3)
    // ==========================================
    // Submitted ID 4 (User 1)
    { submitted_id: 4, soal_id: 6, soal_option_id: 10, answer_text: null, file_id: null }, // 5 Sila
    { submitted_id: 4, soal_id: 7, soal_option_id: 12, answer_text: null, file_id: null }, // Bintang
    { submitted_id: 4, soal_id: 7, soal_option_id: 13, answer_text: null, file_id: null }, // Rantai
    { submitted_id: 4, soal_id: 8, soal_option_id: null, answer_text: 'Ketuhanan Yang Maha Esa', file_id: null },
    { submitted_id: 4, soal_id: 9, soal_option_id: null, answer_text: null, file_id: 13 },
    { submitted_id: 4, soal_id: 10, soal_option_id: 14, answer_text: null, file_id: null }, // Pohon Beringin

    // ==========================================
    // FORM 3 (submitted_id: 7, 8)
    // Soal 11: Radio (Thank you), Soal 12: Checkbox (Noun), Soal 13: Text (Konnichiwa), Soal 14: File, Soal 15: Radio (Ejaan)
    // ==========================================
    // Submitted ID 7 (User 2)
    { submitted_id: 7, soal_id: 11, soal_option_id: 16, answer_text: null, file_id: null }, // Terima kasih
    { submitted_id: 7, soal_id: 12, soal_option_id: 19, answer_text: null, file_id: null }, // Book
    { submitted_id: 7, soal_id: 12, soal_option_id: 22, answer_text: null, file_id: null }, // Pen
    { submitted_id: 7, soal_id: 13, soal_option_id: null, answer_text: 'Selamat siang / Halo', file_id: null },
    { submitted_id: 7, soal_id: 14, soal_option_id: null, answer_text: null, file_id: 14 },
    { submitted_id: 7, soal_id: 15, soal_option_id: 23, answer_text: null, file_id: null }, // Receive

    // ==========================================
    // FORM 4 (submitted_id: 9, 10, 11)
    // Soal 16: Radio (SI Gaya), Soal 17: Checkbox (Newton), Soal 18: Text (Kecepatan), Soal 19: File, Soal 20: Radio (Arus)
    // ==========================================
    // Submitted ID 9 (User 1)
    { submitted_id: 9, soal_id: 16, soal_option_id: 26, answer_text: null, file_id: null }, // Newton
    { submitted_id: 9, soal_id: 17, soal_option_id: 28, answer_text: null, file_id: null }, // Hukum I
    { submitted_id: 9, soal_id: 17, soal_option_id: 29, answer_text: null, file_id: null }, // Hukum II
    { submitted_id: 9, soal_id: 18, soal_option_id: null, answer_text: 'v = s / t', file_id: null },
    { submitted_id: 9, soal_id: 19, soal_option_id: null, answer_text: null, file_id: 15 },
    { submitted_id: 9, soal_id: 20, soal_option_id: 32, answer_text: null, file_id: null }, // Ampermeter

    // ==========================================
    // FORM 5 (submitted_id: 12, 13)
    // Soal 21: Radio (Puas), Soal 22: Checkbox (Fasilitas), Soal 23: Text (Saran), Soal 24: File, Soal 25: Radio (Efektif)
    // ==========================================
    // Submitted ID 12 (User 1)
    { submitted_id: 12, soal_id: 21, soal_option_id: 34, answer_text: null, file_id: null }, // Puas
    { submitted_id: 12, soal_id: 22, soal_option_id: 36, answer_text: null, file_id: null }, // Perpustakaan
    { submitted_id: 12, soal_id: 22, soal_option_id: 37, answer_text: null, file_id: null }, // Kantin
    { submitted_id: 12, soal_id: 23, soal_option_id: null, answer_text: 'Perlu penambahan meja di kantin.', file_id: null },
    { submitted_id: 12, soal_id: 24, soal_option_id: null, answer_text: null, file_id: 16 },
    { submitted_id: 12, soal_id: 25, soal_option_id: 39, answer_text: null, file_id: null }, // Ya

    // ==========================================
    // FORM 6 (submitted_id: 14, 15)
    // Soal 26: Radio (Organik), Soal 27: Checkbox (Alkana), Soal 28: Text (Methane), Soal 29: File, Soal 30: Radio (Ikatan C)
    // ==========================================
    // Submitted ID 14 (User 2)
    { submitted_id: 14, soal_id: 26, soal_option_id: 42, answer_text: null, file_id: null }, // Karbon
    { submitted_id: 14, soal_id: 27, soal_option_id: 44, answer_text: null, file_id: null }, // Alkanol
    { submitted_id: 14, soal_id: 27, soal_option_id: 45, answer_text: null, file_id: null }, // Alkanal
    { submitted_id: 14, soal_id: 28, soal_option_id: null, answer_text: 'CH4', file_id: null },
    { submitted_id: 14, soal_id: 29, soal_option_id: null, answer_text: null, file_id: 17 },
    { submitted_id: 14, soal_id: 30, soal_option_id: 48, answer_text: null, file_id: null }, // 4

    // ==========================================
    // FORM 7 (submitted_id: 16, 17, 18)
    // Soal 31: Radio (Hari), Soal 32: Checkbox (Ekskul), Soal 33: Text (Alasan), Soal 34: File, Soal 35: Radio (Pengalaman)
    // ==========================================
    // Submitted ID 16 (User 3)
    { submitted_id: 16, soal_id: 31, soal_option_id: 49, answer_text: null, file_id: null }, // Senin & Rabu
    { submitted_id: 16, soal_id: 32, soal_option_id: 54, answer_text: null, file_id: null }, // Futsal
    { submitted_id: 16, soal_id: 33, soal_option_id: null, answer_text: 'Ingin mengasah bakat olahraga.', file_id: null },
    { submitted_id: 16, soal_id: 34, soal_option_id: null, answer_text: null, file_id: 18 },
    { submitted_id: 16, soal_id: 35, soal_option_id: 55, answer_text: null, file_id: null }, // Pernah

    // ==========================================
    // FORM 8 (submitted_id: 19, 20)
    // Soal 36: Radio (Respirasi), Soal 37: Checkbox (Vertebrata), Soal 38: Text (Fotosintesis), Soal 39: File, Soal 40: Radio (Pembelahan)
    // ==========================================
    // Submitted ID 19 (User 1)
    { submitted_id: 19, soal_id: 36, soal_option_id: 57, answer_text: null, file_id: null }, // Mitokondria
    { submitted_id: 19, soal_id: 37, soal_option_id: 59, answer_text: null, file_id: null }, // Kucing
    { submitted_id: 19, soal_id: 37, soal_option_id: 60, answer_text: null, file_id: null }, // Burung
    { submitted_id: 19, soal_id: 38, soal_option_id: null, answer_text: 'Proses pembuatan makanan oleh tumbuhan menggunakan cahaya matahari.', file_id: null },
    { submitted_id: 19, soal_id: 39, soal_option_id: null, answer_text: null, file_id: 19 },
    { submitted_id: 19, soal_id: 40, soal_option_id: 62, answer_text: null, file_id: null }, // Mitosis

    // ==========================================
    // FORM 9 (submitted_id: 21, 22)
    // Soal 41: Radio (Kebersihan), Soal 42: Checkbox (Pencahayaan), Soal 43: Text (Kritik), Soal 44: File, Soal 45: Radio (Wi-Fi)
    // ==========================================
    // Submitted ID 21 (User 1)
    { submitted_id: 21, soal_id: 41, soal_option_id: 65, answer_text: null, file_id: null }, // Cukup Bersih
    { submitted_id: 21, soal_id: 42, soal_option_id: 67, answer_text: null, file_id: null }, // Kantin Belakang
    { submitted_id: 21, soal_id: 43, soal_option_id: null, answer_text: 'Koleksi buku perlu diperbarui.', file_id: null },
    { submitted_id: 21, soal_id: 44, soal_option_id: null, answer_text: null, file_id: 20 },
    { submitted_id: 21, soal_id: 45, soal_option_id: 70, answer_text: null, file_id: null }, // Sering Putus

    // ==========================================
    // FORM 10 (submitted_id: 23, 24, 25)
    // Soal 46: Radio (Tgl Proklamasi), Soal 47: Checkbox (Pahlawan Jawa), Soal 48: Text (Pembaca), Soal 49: File, Soal 50: Radio (Kota)
    // ==========================================
    // Submitted ID 23 (User 2)
    { submitted_id: 23, soal_id: 46, soal_option_id: 71, answer_text: null, file_id: null }, // 17 Agustus 1945
    { submitted_id: 23, soal_id: 47, soal_option_id: 74, answer_text: null, file_id: null }, // Diponegoro
    { submitted_id: 23, soal_id: 47, soal_option_id: 75, answer_text: null, file_id: null }, // Soedirman
    { submitted_id: 23, soal_id: 48, soal_option_id: null, answer_text: 'Ir. Soekarno', file_id: null },
    { submitted_id: 23, soal_id: 49, soal_option_id: null, answer_text: null, file_id: 21 },
    { submitted_id: 23, soal_id: 50, soal_option_id: 77, answer_text: null, file_id: null }  // Jakarta
  ]

  await knex('user_answer').insert(answers)
}