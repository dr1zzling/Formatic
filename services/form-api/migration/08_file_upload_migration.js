/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('file_upload', function(table) {
    table.increments()
    table.text('file_path').notNullable()
    table.timestamp('uploaded_at', { useTz: true }).defaultTo(knex.fn.now())
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('file_upload')
};
