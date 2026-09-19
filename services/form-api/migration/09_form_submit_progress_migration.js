/**
 * Migration 09 — tambah kolom current_page dan current_soal ke form_submit
 * untuk fitur monitoring real-time progress responden
 */
exports.up = function (knex) {
  return knex.schema.alterTable('form_submit', function (table) {
    table.integer('current_page').defaultTo(1)
    table.integer('current_soal').defaultTo(0)
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('form_submit', function (table) {
    table.dropColumn('current_page')
    table.dropColumn('current_soal')
  })
}
