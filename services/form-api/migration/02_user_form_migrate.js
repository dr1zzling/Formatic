/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_form', function(table){
    table.increments()
    table.integer('user_id').notNullable()
    table.integer('form_id').unsigned().notNullable()
    table.enum('access_type', ['Creator', 'Collaborator'])

    table.foreign('form_id').references('forms.id')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_form')
};
