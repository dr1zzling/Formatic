/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('primary_kategori').del();

  await knex('primary_kategori').insert([
    { id: 1, name: 'Ujian' },
    { id: 2, name: 'Survei' }
  ]);
};