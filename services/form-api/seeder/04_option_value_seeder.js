/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('soal_option').del()
  await knex('option_value').del()

  await knex('option_value').insert([
    { value: '4' },
    { value: '5' },
    { value: '6' },
    { value: '7' },
  ])
}