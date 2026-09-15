/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('sub_kategori').del();

  await knex('sub_kategori').insert([
    { id: 1, name: 'sains', primary_kategori_id: 1 },
    { id: 2, name: 'soshum', primary_kategori_id: 1 },
    { id: 3, name: 'bahasa & umum', primary_kategori_id: 1 },
    { id: 4, name: 'evaluasi sekolah', primary_kategori_id: 2 },
    { id: 5, name: 'minat & bakat', primary_kategori_id: 2 }
  ]);
};