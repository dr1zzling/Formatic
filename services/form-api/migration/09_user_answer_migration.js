/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_answer', function(table) {
    table.increments()
    table.integer('submitted_id').unsigned().notNullable().index()
    table.integer('soal_option_id').unsigned().nullable()
    table.integer('file_id').unsigned().nullable()
    table.integer('soal_id').unsigned()
    table.text('answer_text').nullable()

    table.foreign('submitted_id').references('form_submit.id').onDelete('CASCADE')
    table.foreign('soal_option_id').references('soal_option.id').onDelete('SET NULL')
    table.foreign('file_id').references('file_upload.id').onDelete('SET NULL')
    table.foreign('soal_id').references('soal.id').onDelete('CASCADE')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_answer')
};
