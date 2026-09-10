/**
 * Migration: tambah kolom group_id dan group_text ke tabel soal
 * untuk fitur group soal (wacana/teks bersama)
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('soal', function(table) {
        table.integer('group_id').nullable().defaultTo(null)
        table.text('group_text').nullable().defaultTo(null)
    })
};

exports.down = function(knex) {
    return knex.schema.table('soal', function(table) {
        table.dropColumn('group_id')
        table.dropColumn('group_text')
    })
};
