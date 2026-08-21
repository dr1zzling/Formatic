/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('form_submit').del()
  
  await knex('form_submit').insert([
    // Form 1 (Creator: 1, Collab: 2) -> Submitter: User 3, 4, 5
    { user_id: 3, form_id: 1, submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 1, submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 1, submitted_at: knex.fn.now() },

    // Form 2 (Creator: 2) -> Submitter: User 1, 3, 4
    { user_id: 1, form_id: 2, submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 2, submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 2, submitted_at: knex.fn.now() },

    // Form 3 (Creator: 3, Collab: 1) -> Submitter: User 2, 4, 5
    { user_id: 2, form_id: 3, submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 3, submitted_at: knex.fn.now() },

    // Form 4 (Creator: 4) -> Submitter: User 1, 2, 5
    { user_id: 1, form_id: 4, submitted_at: knex.fn.now() },
    { user_id: 2, form_id: 4, submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 4, submitted_at: knex.fn.now() },

    // Form 5 (Creator: 5, Collab: 3) -> Submitter: User 1, 2, 4
    { user_id: 1, form_id: 5, submitted_at: knex.fn.now() },
    { user_id: 2, form_id: 5, submitted_at: knex.fn.now() },

    // Form 6 (Creator: 1) -> Submitter: User 2, 3, 5
    { user_id: 2, form_id: 6, submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 6, submitted_at: knex.fn.now() },

    // Form 7 (Creator: 2) -> Submitter: User 3, 4, 5
    { user_id: 3, form_id: 7, submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 7, submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 7, submitted_at: knex.fn.now() },

    // Form 8 (Creator: 4) -> Submitter: User 1, 3
    { user_id: 1, form_id: 8, submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 8, submitted_at: knex.fn.now() },

    // Form 9 (Creator: 5) -> Submitter: User 1, 2, 4
    { user_id: 1, form_id: 9, submitted_at: knex.fn.now() },
    { user_id: 2, form_id: 9, submitted_at: knex.fn.now() },

    // Form 10 (Creator: 1, Collab: 3) -> Submitter: User 2, 4, 5
    { user_id: 2, form_id: 10, submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 10, submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 10, submitted_at: knex.fn.now() }
  ]);
};