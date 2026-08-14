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
    },
    {
      user_id: 3,
      form_id: 3,
      access_type: 'Creator'
    },
    {
      user_id: 1,
      form_id: 3,
      access_type: 'Collaborator'
    },
    {
      user_id: 4,
      form_id: 4,
      access_type: 'Creator'
    },
    {
      user_id: 5,
      form_id: 5,
      access_type: 'Creator'
    },
    {
      user_id: 3,
      form_id: 5,
      access_type: 'Collaborator'
    },
    {
      user_id: 1,
      form_id: 6,
      access_type: 'Creator'
    },
    {
      user_id: 2,
      form_id: 7,
      access_type: 'Creator'
    },
    {
      user_id: 4,
      form_id: 8,
      access_type: 'Creator'
    },
    {
      user_id: 5,
      form_id: 9,
      access_type: 'Creator'
    },
    {
      user_id: 1,
      form_id: 10,
      access_type: 'Creator'
    },
    {
      user_id: 3,
      form_id: 10,
      access_type: 'Collaborator'
    }
  ]);
};