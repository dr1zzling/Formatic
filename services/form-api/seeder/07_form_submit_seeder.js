/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('form_submit').del()
  await knex('form_submit').insert([
    {
      user_id : 1,
      form_id : 2,
      submitted_at: knex.fn.now()
    },
    {
      user_id : 2,
      form_id : 3,
      submitted_at: knex.fn.now()
    },
    {
      user_id : 3,
      form_id : 1,
      submitted_at: knex.fn.now()
    }
  ]);
};
