/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('user_form').del()
  await knex('user_form').insert([
    {
      user_id: 1,
      form_id: 1,
      access_type: 'Creator'
    },
    {
      user_id: 2,
      form_id: 1,
      access_type: 'Collaborator'
    },
    {
      user_id: 2,
      form_id: 2,
      access_type: 'Creator'
    }
  ]);
};
