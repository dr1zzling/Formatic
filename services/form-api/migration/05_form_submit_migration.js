/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('form_submit', function(table) {
    table.increments()
    table.integer('user_id').notNullable()
    table.string('user_username')
    table.integer('form_id').unsigned().notNullable()
    table.timestamp('start_at', { useTz: true }).defaultTo(knex.fn.now())
    table.timestamp('submitted_at', { useTz: true })
    table.enum('status', ['reset', 'progress', 'completed']).notNullable().defaultTo('progress')
    table.integer("attemps").defaultTo(1)

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
