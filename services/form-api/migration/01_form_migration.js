/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('forms', function(table){
    table.increments()
    table.string('slug').unique().index()
    table.string('title').notNullable()
    table.enum('category', ['ujian', 'survey']).notNullable()
    table.enum('status', ['public', 'private']).defaultTo('public')
    table.text('banner').notNullable()
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('forms')
};
