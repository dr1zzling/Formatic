/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('sub_kategori', function(table){
        table.increments()
        table.string('name').notNullable()
        table.integer('primary_kategori_id').unsigned().notNullable()

        table.foreign('primary_kategori_id').references('primary_kategori.id').onDelete('CASCADE')
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('sub_kategori')
};
