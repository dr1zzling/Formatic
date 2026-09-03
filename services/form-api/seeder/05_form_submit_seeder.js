/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('form_submit').del();

  // Helper untuk mendapatkan status secara acak
  const getRandomStatus = () => (Math.random() < 0.5 ? 'progress' : 'completed');

  await knex('form_submit').insert([
    // Form 1 (Creator: 1, Collab: 2) -> Submitter: User 3, 4, 5
    { user_id: 3, form_id: 1, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 1, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 1, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 2 (Creator: 2) -> Submitter: User 1, 3, 4
    { user_id: 1, form_id: 2, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 2, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 2, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 3 (Creator: 3, Collab: 1) -> Submitter: User 2, 4, 5
    { user_id: 2, form_id: 3, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 3, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 4 (Creator: 4) -> Submitter: User 1, 2, 5
    { user_id: 1, form_id: 4, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 2, form_id: 4, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 4, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 5 (Creator: 5, Collab: 3) -> Submitter: User 1, 2, 4
    { user_id: 1, form_id: 5, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 2, form_id: 5, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 6 (Creator: 1) -> Submitter: User 2, 3, 5
    { user_id: 2, form_id: 6, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 6, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 7 (Creator: 2) -> Submitter: User 3, 4, 5
    { user_id: 3, form_id: 7, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 7, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 7, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 8 (Creator: 4) -> Submitter: User 1, 3
    { user_id: 1, form_id: 8, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 8, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 9 (Creator: 5) -> Submitter: User 1, 2, 4
    { user_id: 1, form_id: 9, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 2, form_id: 9, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 10 (Creator: 1, Collab: 3) -> Submitter: User 2, 4, 5
    { user_id: 2, form_id: 10, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 10, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 10, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 11 (Creator: 3, Collab: 5) -> Submitter: User 1, 2, 4
    { user_id: 1, form_id: 11, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 2, form_id: 11, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 11, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 12 (Creator: 4) -> Submitter: User 1, 3, 5
    { user_id: 1, form_id: 12, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 12, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 12, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 13 (Creator: 1, Collab: 4) -> Submitter: User 2, 3, 5
    { user_id: 2, form_id: 13, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 13, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 13, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 14 (Creator: 5) -> Submitter: User 2, 3, 4
    { user_id: 2, form_id: 14, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 3, form_id: 14, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 14, status: getRandomStatus(), submitted_at: knex.fn.now() },

    // Form 15 (Creator: 2, Collab: 1) -> Submitter: User 3, 4, 5
    { user_id: 3, form_id: 15, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 4, form_id: 15, status: getRandomStatus(), submitted_at: knex.fn.now() },
    { user_id: 5, form_id: 15, status: getRandomStatus(), submitted_at: knex.fn.now() }
  ]);
};