/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('soal').del()
  await knex('soal').insert([
    // --- Form 1: Survei Kepuasan Pelanggan 2026 (form_id: 1) ---
    {
      question: "Seberapa puas Anda dengan pelayanan kami secara keseluruhan?",
      form_id: 1,
    },
    {
      question: "Fitur mana yang paling sering Anda gunakan?",
      form_id: 1,
    },
    {
      question: "Apa saran Anda untuk peningkatan kualitas layanan kami ke depannya?",
      form_id: 1,
    },

    // --- Form 2: Formulir Pendaftaran Event Internal (form_id: 2) ---
    {
      question: "Divisi / Departemen tempat Anda bekerja?",
      form_id: 2,
    },
    {
      question: "Apakah Anda membutuhkan transportasi jemputan dari kantor?",
      form_id: 2,
    },
    {
      question: "Apakah Anda memiliki riwayat alergi makanan atau preferensi diet tertentu?",
      form_id: 2,
    },

    // --- Form 3: Feedback Aplikasi Mobile V2 (form_id: 3) ---
    {
      question: "Bagaimana tanggapan Anda mengenai tampilan (UI) baru aplikasi V2?",
      form_id: 3,
    },
    {
      question: "Apakah Anda mengalami kendala teknis atau bug saat menggunakan aplikasi?",
      form_id: 3,
    },
    {
      question: "Seberapa responsif navigasi menu pada versi terbaru ini?",
      form_id: 3,
    },

    // --- Form 4: Evaluasi Kinerja Karyawan Q3 (form_id: 4) ---
    {
      question: "Pencapaian terbesar apa yang berhasil Anda raih pada Q3 ini?",
      form_id: 4,
    },
    {
      question: "Hambatan terbesar apa yang Anda hadapi dalam mencapai target tim?",
      form_id: 4,
    },
    {
      question: "Dukungan atau pelatihan apa yang Anda butuhkan untuk Q4 mendatang?",
      form_id: 4,
    },
  ]);
};
