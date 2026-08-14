/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('user_answer').del()
  await knex('file_upload').del()

  await knex('file_upload').insert([
    // --- 10 Banner Files (ID 1 - 10) ---
    { file_path: '/uploads/soal-1', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-2', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-3', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-4', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-5', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-6', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-7', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-8', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-9', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/soal-10', uploaded_at: knex.fn.now() },

    // --- Files Submission User (ID 11+) ---
    { file_path: '/uploads/jawaban_orat_oret_user3.pdf', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/jawaban_orat_oret_user4.pdf', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/tugas_bab1_user1.docx', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/audio_perkenalan_user2.mp3', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/grafik_praktikum_user1.png', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/foto_fasilitas_rusak_user1.jpg', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/struktur_molekul_user2.png', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/pas_foto_user3.jpg', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/pengamatan_mikroskop_user1.jpg', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/foto_kendala_wifi_user1.jpg', uploaded_at: knex.fn.now() },
    { file_path: '/uploads/rangkuman_rengasdengklok_user2.pdf', uploaded_at: knex.fn.now() }
  ]);
};