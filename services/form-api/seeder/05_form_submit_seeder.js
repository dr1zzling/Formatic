/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('form_submit').del();

  // Helper untuk membuat record dengan data yang konsisten
  const createRecord = (userId, formId) => {
    const status = Math.random() < 0.5 ? 'progress' : 'completed';
    return {
      user_id: userId,
      form_id: formId,
      status: status,
      start_at: knex.fn.now(),
      submitted_at: status === 'completed' ? knex.fn.now() : null
    };
  };

  await knex('form_submit').insert([
    // Form 1 (Creator: 1, Collab: 2) -> Submitter: User 3, 4, 5
    createRecord(3, 1),
    createRecord(4, 1),
    createRecord(5, 1),

    // Form 2 (Creator: 2) -> Submitter: User 1, 3, 4
    createRecord(1, 2),
    createRecord(3, 2),
    createRecord(4, 2),

    // Form 3 (Creator: 3, Collab: 1) -> Submitter: User 2, 4
    createRecord(2, 3),
    createRecord(4, 3),

    // Form 4 (Creator: 4) -> Submitter: User 1, 2, 5
    createRecord(1, 4),
    createRecord(2, 4),
    createRecord(5, 4),

    // Form 5 (Creator: 5, Collab: 3) -> Submitter: User 1, 2
    createRecord(1, 5),
    createRecord(2, 5),

    // Form 6 (Creator: 1) -> Submitter: User 2, 3
    createRecord(2, 6),
    createRecord(3, 6),

    // Form 7 (Creator: 2) -> Submitter: User 3, 4, 5
    createRecord(3, 7),
    createRecord(4, 7),
    createRecord(5, 7),

    // Form 8 (Creator: 4) -> Submitter: User 1, 3
    createRecord(1, 8),
    createRecord(3, 8),

    // Form 9 (Creator: 5) -> Submitter: User 1, 2
    createRecord(1, 9),
    createRecord(2, 9),

    // Form 10 (Creator: 1, Collab: 3) -> Submitter: User 2, 4, 5
    createRecord(2, 10),
    createRecord(4, 10),
    createRecord(5, 10),

    // Form 11 (Creator: 3, Collab: 5) -> Submitter: User 1, 2, 4
    createRecord(1, 11),
    createRecord(2, 11),
    createRecord(4, 11),

    // Form 12 (Creator: 4) -> Submitter: User 1, 3, 5
    createRecord(1, 12),
    createRecord(3, 12),
    createRecord(5, 12),

    // Form 13 (Creator: 1, Collab: 4) -> Submitter: User 2, 3, 5
    createRecord(2, 13),
    createRecord(3, 13),
    createRecord(5, 13),

    // Form 14 (Creator: 5) -> Submitter: User 2, 3, 4
    createRecord(2, 14),
    createRecord(3, 14),
    createRecord(4, 14),

    // Form 15 (Creator: 2, Collab: 1) -> Submitter: User 3, 4, 5
    createRecord(3, 15),
    createRecord(4, 15),
    createRecord(5, 15)
  ]);
};