/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('forms', function(table){
    table.increments()
    table.string('slug').unique().index()
    table.string('title').notNullable()
    table.text('token_respon').nullable()
    table.text('token_collab').notNullable()
    table.enum('category', ['ujian', 'survei']).notNullable()
    table.enum('status', ['public', 'private']).defaultTo('private')
    table.boolean('is_random')
    table.integer('duration').nullable()
    table.timestamp('start_at', { useTz: true }).nullable()
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
