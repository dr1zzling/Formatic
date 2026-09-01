/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.hasColumn('soal', 'page').then((exists) => {
    if (!exists) {
      return knex.schema.alterTable('soal', function(table) {
        table.integer('page').nullable().defaultTo(1);
      });
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.hasColumn('soal', 'page').then((exists) => {
    if (exists) {
      return knex.schema.alterTable('soal', function(table) {
        table.dropColumn('page');
      });
    }
  });
};
