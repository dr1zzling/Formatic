/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('forms', function (table) {
    table.increments()
    table.string('slug').unique().index()
    table.string('title').notNullable()
    table.text('token_respon').nullable()
    table.text('token_collab').notNullable()
    table.enum('status', ['public', 'private']).defaultTo('private')
    table.boolean('is_random')
    table.integer('duration').nullable()
    table.timestamp('start_at', { useTz: true }).nullable()
    table.text('banner').notNullable()
    table.string('theme_color')


    table.integer('group_id').defaultTo(null)
    table.text('group_text').defaultTo(null)

    table.integer('kategori_id').unsigned()
    table.foreign('kategori_id').references('sub_kategori.id').onDelete('CASCADE')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('forms')
};
