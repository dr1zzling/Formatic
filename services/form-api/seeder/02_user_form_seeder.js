/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('user_form').del()
  await knex('user_form').insert([
    // Form 1: Survei Kepuasan Pelanggan 2026
  { user_id: 1, form_id: 1, access_type: "Creator" },
  { user_id: 2, form_id: 1, access_type: "Collaborator" },

  // Form 2: Formulir Pendaftaran Event Internal (Private)
  { user_id: 2, form_id: 2, access_type: "Creator" },
  { user_id: 1, form_id: 2, access_type: "Collaborator" },

  // Form 3: Feedback Aplikasi Mobile V2
  { user_id: 1, form_id: 3, access_type: "Creator" },
  { user_id: 4, form_id: 3, access_type: "Collaborator" },

  // Form 4: Evaluasi Kinerja Karyawan Q3 (Private)
  { user_id: 3, form_id: 4, access_type: "Creator" }
  ]);
};
