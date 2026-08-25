/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('soal', function(table){
        table.increments()
        table.text('question').notNullable()
        table.text('image')
        table.integer('form_id').unsigned()
        table.enum('type', ['radio', 'text', 'file', 'checkbox'])
        table.decimal('score', 10, 2).nullable()
        table.foreign('form_id').references('forms.id').onDelete('CASCADE')
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('soal')
};
