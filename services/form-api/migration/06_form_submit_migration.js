/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('form_submit', function(table) {
    table.increments()
    table.integer('user_id').unsigned().notNullable()
    table.integer('form_id').unsigned().notNullable()
    table.timestamp('submitted_at', { useTz: true }).defaultTo(knex.fn.now())
    table.enum('status', ['submitted', 'draft', 'reviewed']).notNullable().defaultTo('submitted')

    table.foreign('form_id').references('forms.id').onDelete('CASCADE')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('form_submit')
};
