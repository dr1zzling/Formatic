/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('file_upload').del()

  const fileUploads = Array.from({ length: 50 }, (_, index) => ({
    file_path: `/uploads/form_3_answer_${index + 1}.jpg`,
  }))

  await knex('file_upload').insert(fileUploads)
};
