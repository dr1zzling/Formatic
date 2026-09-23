exports.up = function (knex) {
  return knex.schema.alterTable('forms', function (table) {
    table.text('description').nullable()
  })
}

exports.down = function (knex) {
  return knex.schema.alterTable('forms', function (table) {
    table.dropColumn('description')
  })
}
