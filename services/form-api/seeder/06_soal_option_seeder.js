/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('soal_option').del()

  const rows = [

    // Radio
    { soal_id: 1, option_value_id: 1, is_correct: true },
    { soal_id: 1, option_value_id: 2, is_correct: false },
    { soal_id: 1, option_value_id: 3, is_correct: false },
    { soal_id: 1, option_value_id: 4, is_correct: false },

    // Checkbox
    { soal_id: 2, option_value_id: 1, is_correct: true },
    { soal_id: 2, option_value_id: 2, is_correct: true },
    { soal_id: 2, option_value_id: 3, is_correct: false },
    { soal_id: 2, option_value_id: 4, is_correct: false },

    { soal_id: 5, option_value_id: 1, is_correct: false },
    { soal_id: 5, option_value_id: 2, is_correct: true },
    { soal_id: 5, option_value_id: 3, is_correct: false },
    { soal_id: 5, option_value_id: 4, is_correct: false },

    { soal_id: 6, option_value_id: 1, is_correct: false },
    { soal_id: 6, option_value_id: 2, is_correct: true },
    { soal_id: 6, option_value_id: 3, is_correct: false },
    { soal_id: 6, option_value_id: 4, is_correct: false },

    { soal_id: 7, option_value_id: 1, is_correct: false },
    { soal_id: 7, option_value_id: 2, is_correct: false },
    { soal_id: 7, option_value_id: 3, is_correct: true },
    { soal_id: 7, option_value_id: 4, is_correct: false },

    { soal_id: 8, option_value_id: 1, is_correct: true },
    { soal_id: 8, option_value_id: 2, is_correct: true },
    { soal_id: 8, option_value_id: 3, is_correct: false },
    { soal_id: 8, option_value_id: 4, is_correct: false },

    { soal_id: 10, option_value_id: 1, is_correct: false },
    { soal_id: 10, option_value_id: 2, is_correct: true },
    { soal_id: 10, option_value_id: 3, is_correct: false },
    { soal_id: 10, option_value_id: 4, is_correct: false },

    { soal_id: 11, option_value_id: 1, is_correct: false },
    { soal_id: 11, option_value_id: 2, is_correct: false },
    { soal_id: 11, option_value_id: 3, is_correct: true },
    { soal_id: 11, option_value_id: 4, is_correct: false },

    { soal_id: 12, option_value_id: 1, is_correct: true },
    { soal_id: 12, option_value_id: 2, is_correct: true },
    { soal_id: 12, option_value_id: 3, is_correct: false },
    { soal_id: 12, option_value_id: 4, is_correct: false },

    { soal_id: 15, option_value_id: 1, is_correct: false },
    { soal_id: 15, option_value_id: 2, is_correct: true },
    { soal_id: 15, option_value_id: 3, is_correct: false },
    { soal_id: 15, option_value_id: 4, is_correct: false },
  ]

  await knex('soal_option').insert(rows)
}