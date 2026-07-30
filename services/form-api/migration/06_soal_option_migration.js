/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('soal_option', function(table){
    table.increments()
    table.integer('soal_id').unsigned()
    table.integer('option_value_id').unsigned()
    table.boolean('is_correct')

    table.foreign('soal_id').references("soal.id")
    table.foreign('option_value_id').references("option_value.id")
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('soal_option')
};
