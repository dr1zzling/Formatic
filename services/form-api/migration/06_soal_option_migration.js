/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('soal_option', function(table){
    table.increments()
    table.integer('soal_id').unsigned()
    table.text('image')
    table.text('value')
    table.boolean('is_correct')

    table.foreign('soal_id').references("soal.id").onDelete('CASCADE')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('soal_option')
};
