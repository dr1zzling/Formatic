/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('forms', function(table){
    table.increments()
    table.string('slug').unique().index()
    table.string('title')
    table.enum('status', ['public', 'private'])
    table.integer('category_id').unsigned()
    
    table.foreign('category_id').references('category.id')
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('forms')
};
