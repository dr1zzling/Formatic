/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('soal_option').del()
  await knex('soal_option').insert([

    // ==========================================
    // MATEMATIKA (Soal 1 - 50)
    // ==========================================

    // 1
    { soal_id: 1, option_value_id: 1, is_correct: true },
    { soal_id: 1, option_value_id: 2, is_correct: false },
    { soal_id: 1, option_value_id: 3, is_correct: false },
    { soal_id: 1, option_value_id: 4, is_correct: false },

    // 2
    { soal_id: 2, option_value_id: 1, is_correct: true },
    { soal_id: 2, option_value_id: 2, is_correct: false },
    { soal_id: 2, option_value_id: 3, is_correct: false },
    { soal_id: 2, option_value_id: 4, is_correct: false },

    // 3
    { soal_id: 3, option_value_id: 1, is_correct: true },
    { soal_id: 3, option_value_id: 2, is_correct: false },
    { soal_id: 3, option_value_id: 3, is_correct: false },
    { soal_id: 3, option_value_id: 4, is_correct: false },

    // 4
    { soal_id: 4, option_value_id: 1, is_correct: true },
    { soal_id: 4, option_value_id: 2, is_correct: false },
    { soal_id: 4, option_value_id: 3, is_correct: false },
    { soal_id: 4, option_value_id: 4, is_correct: false },

    // 5
    { soal_id: 5, option_value_id: 1, is_correct: true },
    { soal_id: 5, option_value_id: 2, is_correct: false },
    { soal_id: 5, option_value_id: 3, is_correct: false },
    { soal_id: 5, option_value_id: 4, is_correct: false },

    // 6
    { soal_id: 6, option_value_id: 1, is_correct: true },
    { soal_id: 6, option_value_id: 2, is_correct: false },
    { soal_id: 6, option_value_id: 3, is_correct: false },
    { soal_id: 6, option_value_id: 4, is_correct: false },

    // 7
    { soal_id: 7, option_value_id: 1, is_correct: true },
    { soal_id: 7, option_value_id: 2, is_correct: false },
    { soal_id: 7, option_value_id: 3, is_correct: false },
    { soal_id: 7, option_value_id: 4, is_correct: false },

    // 8
    { soal_id: 8, option_value_id: 1, is_correct: true },
    { soal_id: 8, option_value_id: 2, is_correct: false },
    { soal_id: 8, option_value_id: 3, is_correct: false },
    { soal_id: 8, option_value_id: 4, is_correct: false },

    // 9
    { soal_id: 9, option_value_id: 1, is_correct: true },
    { soal_id: 9, option_value_id: 2, is_correct: false },
    { soal_id: 9, option_value_id: 3, is_correct: false },
    { soal_id: 9, option_value_id: 4, is_correct: false },

    // 10
    { soal_id: 10, option_value_id: 1, is_correct: true },
    { soal_id: 10, option_value_id: 2, is_correct: false },
    { soal_id: 10, option_value_id: 3, is_correct: false },
    { soal_id: 10, option_value_id: 4, is_correct: false },

    // 11
    { soal_id: 11, option_value_id: 1, is_correct: true },
    { soal_id: 11, option_value_id: 2, is_correct: false },
    { soal_id: 11, option_value_id: 3, is_correct: false },
    { soal_id: 11, option_value_id: 4, is_correct: false },

    // 12
    { soal_id: 12, option_value_id: 1, is_correct: true },
    { soal_id: 12, option_value_id: 2, is_correct: false },
    { soal_id: 12, option_value_id: 3, is_correct: false },
    { soal_id: 12, option_value_id: 4, is_correct: false },

    // 13
    { soal_id: 13, option_value_id: 1, is_correct: true },
    { soal_id: 13, option_value_id: 2, is_correct: false },
    { soal_id: 13, option_value_id: 3, is_correct: false },
    { soal_id: 13, option_value_id: 4, is_correct: false },

    // 14
    { soal_id: 14, option_value_id: 1, is_correct: true },
    { soal_id: 14, option_value_id: 2, is_correct: false },
    { soal_id: 14, option_value_id: 3, is_correct: false },
    { soal_id: 14, option_value_id: 4, is_correct: false },

    // 15
    { soal_id: 15, option_value_id: 1, is_correct: true },
    { soal_id: 15, option_value_id: 2, is_correct: false },
    { soal_id: 15, option_value_id: 3, is_correct: false },
    { soal_id: 15, option_value_id: 4, is_correct: false },

    // 16
    { soal_id: 16, option_value_id: 1, is_correct: true },
    { soal_id: 16, option_value_id: 2, is_correct: false },
    { soal_id: 16, option_value_id: 3, is_correct: false },
    { soal_id: 16, option_value_id: 4, is_correct: false },

    // 17
    { soal_id: 17, option_value_id: 1, is_correct: true },
    { soal_id: 17, option_value_id: 2, is_correct: false },
    { soal_id: 17, option_value_id: 3, is_correct: false },
    { soal_id: 17, option_value_id: 4, is_correct: false },

    // 18
    { soal_id: 18, option_value_id: 1, is_correct: true },
    { soal_id: 18, option_value_id: 2, is_correct: false },
    { soal_id: 18, option_value_id: 3, is_correct: false },
    { soal_id: 18, option_value_id: 4, is_correct: false },

    // 19
    { soal_id: 19, option_value_id: 1, is_correct: true },
    { soal_id: 19, option_value_id: 2, is_correct: false },
    { soal_id: 19, option_value_id: 3, is_correct: false },
    { soal_id: 19, option_value_id: 4, is_correct: false },

    // 20
    { soal_id: 20, option_value_id: 1, is_correct: true },
    { soal_id: 20, option_value_id: 2, is_correct: false },
    { soal_id: 20, option_value_id: 3, is_correct: false },
    { soal_id: 20, option_value_id: 4, is_correct: false },

    // 21
    { soal_id: 21, option_value_id: 1, is_correct: true },
    { soal_id: 21, option_value_id: 2, is_correct: false },
    { soal_id: 21, option_value_id: 3, is_correct: false },
    { soal_id: 21, option_value_id: 4, is_correct: false },

    // 22
    { soal_id: 22, option_value_id: 1, is_correct: true },
    { soal_id: 22, option_value_id: 2, is_correct: false },
    { soal_id: 22, option_value_id: 3, is_correct: false },
    { soal_id: 22, option_value_id: 4, is_correct: false },

    // 23
    { soal_id: 23, option_value_id: 1, is_correct: true },
    { soal_id: 23, option_value_id: 2, is_correct: false },
    { soal_id: 23, option_value_id: 3, is_correct: false },
    { soal_id: 23, option_value_id: 4, is_correct: false },

    // 24
    { soal_id: 24, option_value_id: 1, is_correct: true },
    { soal_id: 24, option_value_id: 2, is_correct: false },
    { soal_id: 24, option_value_id: 3, is_correct: false },
    { soal_id: 24, option_value_id: 4, is_correct: false },

    // 25
    { soal_id: 25, option_value_id: 1, is_correct: true },
    { soal_id: 25, option_value_id: 2, is_correct: false },
    { soal_id: 25, option_value_id: 3, is_correct: false },
    { soal_id: 25, option_value_id: 4, is_correct: false },

    // 26
    { soal_id: 26, option_value_id: 1, is_correct: true },
    { soal_id: 26, option_value_id: 2, is_correct: false },
    { soal_id: 26, option_value_id: 3, is_correct: false },
    { soal_id: 26, option_value_id: 4, is_correct: false },

    // 27
    { soal_id: 27, option_value_id: 1, is_correct: true },
    { soal_id: 27, option_value_id: 2, is_correct: false },
    { soal_id: 27, option_value_id: 3, is_correct: false },
    { soal_id: 27, option_value_id: 4, is_correct: false },

    // 28
    { soal_id: 28, option_value_id: 1, is_correct: true },
    { soal_id: 28, option_value_id: 2, is_correct: false },
    { soal_id: 28, option_value_id: 3, is_correct: false },
    { soal_id: 28, option_value_id: 4, is_correct: false },

    // 29
    { soal_id: 29, option_value_id: 1, is_correct: true },
    { soal_id: 29, option_value_id: 2, is_correct: false },
    { soal_id: 29, option_value_id: 3, is_correct: false },
    { soal_id: 29, option_value_id: 4, is_correct: false },

    // 30
    { soal_id: 30, option_value_id: 1, is_correct: true },
    { soal_id: 30, option_value_id: 2, is_correct: false },
    { soal_id: 30, option_value_id: 3, is_correct: false },
    { soal_id: 30, option_value_id: 4, is_correct: false },

    // 31
    { soal_id: 31, option_value_id: 1, is_correct: true },
    { soal_id: 31, option_value_id: 2, is_correct: false },
    { soal_id: 31, option_value_id: 3, is_correct: false },
    { soal_id: 31, option_value_id: 4, is_correct: false },

    // 32
    { soal_id: 32, option_value_id: 1, is_correct: true },
    { soal_id: 32, option_value_id: 2, is_correct: false },
    { soal_id: 32, option_value_id: 3, is_correct: false },
    { soal_id: 32, option_value_id: 4, is_correct: false },

    // 33
    { soal_id: 33, option_value_id: 1, is_correct: true },
    { soal_id: 33, option_value_id: 2, is_correct: false },
    { soal_id: 33, option_value_id: 3, is_correct: false },
    { soal_id: 33, option_value_id: 4, is_correct: false },

    // 34
    { soal_id: 34, option_value_id: 1, is_correct: true },
    { soal_id: 34, option_value_id: 2, is_correct: false },
    { soal_id: 34, option_value_id: 3, is_correct: false },
    { soal_id: 34, option_value_id: 4, is_correct: false },

    // 35
    { soal_id: 35, option_value_id: 1, is_correct: true },
    { soal_id: 35, option_value_id: 2, is_correct: false },
    { soal_id: 35, option_value_id: 3, is_correct: false },
    { soal_id: 35, option_value_id: 4, is_correct: false },

    // 36
    { soal_id: 36, option_value_id: 1, is_correct: true },
    { soal_id: 36, option_value_id: 2, is_correct: false },
    { soal_id: 36, option_value_id: 3, is_correct: false },
    { soal_id: 36, option_value_id: 4, is_correct: false },

    // 37
    { soal_id: 37, option_value_id: 1, is_correct: true },
    { soal_id: 37, option_value_id: 2, is_correct: false },
    { soal_id: 37, option_value_id: 3, is_correct: false },
    { soal_id: 37, option_value_id: 4, is_correct: false },

    // 38
    { soal_id: 38, option_value_id: 1, is_correct: true },
    { soal_id: 38, option_value_id: 2, is_correct: false },
    { soal_id: 38, option_value_id: 3, is_correct: false },
    { soal_id: 38, option_value_id: 4, is_correct: false },

    // 39
    { soal_id: 39, option_value_id: 1, is_correct: true },
    { soal_id: 39, option_value_id: 2, is_correct: false },
    { soal_id: 39, option_value_id: 3, is_correct: false },
    { soal_id: 39, option_value_id: 4, is_correct: false },

    // 40
    { soal_id: 40, option_value_id: 1, is_correct: true },
    { soal_id: 40, option_value_id: 2, is_correct: false },
    { soal_id: 40, option_value_id: 3, is_correct: false },
    { soal_id: 40, option_value_id: 4, is_correct: false },

    // 41
    { soal_id: 41, option_value_id: 1, is_correct: true },
    { soal_id: 41, option_value_id: 2, is_correct: false },
    { soal_id: 41, option_value_id: 3, is_correct: false },
    { soal_id: 41, option_value_id: 4, is_correct: false },

    // 42
    { soal_id: 42, option_value_id: 1, is_correct: true },
    { soal_id: 42, option_value_id: 2, is_correct: false },
    { soal_id: 42, option_value_id: 3, is_correct: false },
    { soal_id: 42, option_value_id: 4, is_correct: false },

    // 43
    { soal_id: 43, option_value_id: 1, is_correct: true },
    { soal_id: 43, option_value_id: 2, is_correct: false },
    { soal_id: 43, option_value_id: 3, is_correct: false },
    { soal_id: 43, option_value_id: 4, is_correct: false },

    // 44
    { soal_id: 44, option_value_id: 1, is_correct: true },
    { soal_id: 44, option_value_id: 2, is_correct: false },
    { soal_id: 44, option_value_id: 3, is_correct: false },
    { soal_id: 44, option_value_id: 4, is_correct: false },

    // 45
    { soal_id: 45, option_value_id: 1, is_correct: true },
    { soal_id: 45, option_value_id: 2, is_correct: false },
    { soal_id: 45, option_value_id: 3, is_correct: false },
    { soal_id: 45, option_value_id: 4, is_correct: false },

    // 46
    { soal_id: 46, option_value_id: 1, is_correct: true },
    { soal_id: 46, option_value_id: 2, is_correct: false },
    { soal_id: 46, option_value_id: 3, is_correct: false },
    { soal_id: 46, option_value_id: 4, is_correct: false },

    // 47
    { soal_id: 47, option_value_id: 1, is_correct: true },
    { soal_id: 47, option_value_id: 2, is_correct: false },
    { soal_id: 47, option_value_id: 3, is_correct: false },
    { soal_id: 47, option_value_id: 4, is_correct: false },

    // 48
    { soal_id: 48, option_value_id: 1, is_correct: true },
    { soal_id: 48, option_value_id: 2, is_correct: false },
    { soal_id: 48, option_value_id: 3, is_correct: false },
    { soal_id: 48, option_value_id: 4, is_correct: false },

    // 49
    { soal_id: 49, option_value_id: 1, is_correct: true },
    { soal_id: 49, option_value_id: 2, is_correct: false },
    { soal_id: 49, option_value_id: 3, is_correct: false },
    { soal_id: 49, option_value_id: 4, is_correct: false },

    // 50
    { soal_id: 50, option_value_id: 1, is_correct: true },
    { soal_id: 50, option_value_id: 2, is_correct: false },
    { soal_id: 50, option_value_id: 3, is_correct: false },
    { soal_id: 50, option_value_id: 4, is_correct: false },


    // ==========================================
    // PENDIDIKAN PANCASILA (Soal 51 - 100)
    // ==========================================

    // 51
    { soal_id: 51, option_value_id: 1, is_correct: true },
    { soal_id: 51, option_value_id: 2, is_correct: false },
    { soal_id: 51, option_value_id: 3, is_correct: false },
    { soal_id: 51, option_value_id: 4, is_correct: false },

    // 52
    { soal_id: 52, option_value_id: 1, is_correct: true },
    { soal_id: 52, option_value_id: 2, is_correct: false },
    { soal_id: 52, option_value_id: 3, is_correct: false },
    { soal_id: 52, option_value_id: 4, is_correct: false },

    // 53
    { soal_id: 53, option_value_id: 1, is_correct: true },
    { soal_id: 53, option_value_id: 2, is_correct: false },
    { soal_id: 53, option_value_id: 3, is_correct: false },
    { soal_id: 53, option_value_id: 4, is_correct: false },

    // 54
    { soal_id: 54, option_value_id: 1, is_correct: true },
    { soal_id: 54, option_value_id: 2, is_correct: false },
    { soal_id: 54, option_value_id: 3, is_correct: false },
    { soal_id: 54, option_value_id: 4, is_correct: false },

    // 55
    { soal_id: 55, option_value_id: 1, is_correct: true },
    { soal_id: 55, option_value_id: 2, is_correct: false },
    { soal_id: 55, option_value_id: 3, is_correct: false },
    { soal_id: 55, option_value_id: 4, is_correct: false },

    // 56
    { soal_id: 56, option_value_id: 1, is_correct: true },
    { soal_id: 56, option_value_id: 2, is_correct: false },
    { soal_id: 56, option_value_id: 3, is_correct: false },
    { soal_id: 56, option_value_id: 4, is_correct: false },

    // 57
    { soal_id: 57, option_value_id: 1, is_correct: true },
    { soal_id: 57, option_value_id: 2, is_correct: false },
    { soal_id: 57, option_value_id: 3, is_correct: false },
    { soal_id: 57, option_value_id: 4, is_correct: false },

    // 58
    { soal_id: 58, option_value_id: 1, is_correct: true },
    { soal_id: 58, option_value_id: 2, is_correct: false },
    { soal_id: 58, option_value_id: 3, is_correct: false },
    { soal_id: 58, option_value_id: 4, is_correct: false },

    // 59
    { soal_id: 59, option_value_id: 1, is_correct: true },
    { soal_id: 59, option_value_id: 2, is_correct: false },
    { soal_id: 59, option_value_id: 3, is_correct: false },
    { soal_id: 59, option_value_id: 4, is_correct: false },

    // 60
    { soal_id: 60, option_value_id: 1, is_correct: true },
    { soal_id: 60, option_value_id: 2, is_correct: false },
    { soal_id: 60, option_value_id: 3, is_correct: false },
    { soal_id: 60, option_value_id: 4, is_correct: false },

    // 61
    { soal_id: 61, option_value_id: 1, is_correct: true },
    { soal_id: 61, option_value_id: 2, is_correct: false },
    { soal_id: 61, option_value_id: 3, is_correct: false },
    { soal_id: 61, option_value_id: 4, is_correct: false },

    // 62
    { soal_id: 62, option_value_id: 1, is_correct: true },
    { soal_id: 62, option_value_id: 2, is_correct: false },
    { soal_id: 62, option_value_id: 3, is_correct: false },
    { soal_id: 62, option_value_id: 4, is_correct: false },

    // 63
    { soal_id: 63, option_value_id: 1, is_correct: true },
    { soal_id: 63, option_value_id: 2, is_correct: false },
    { soal_id: 63, option_value_id: 3, is_correct: false },
    { soal_id: 63, option_value_id: 4, is_correct: false },

    // 64
    { soal_id: 64, option_value_id: 1, is_correct: true },
    { soal_id: 64, option_value_id: 2, is_correct: false },
    { soal_id: 64, option_value_id: 3, is_correct: false },
    { soal_id: 64, option_value_id: 4, is_correct: false },

    // 65
    { soal_id: 65, option_value_id: 1, is_correct: true },
    { soal_id: 65, option_value_id: 2, is_correct: false },
    { soal_id: 65, option_value_id: 3, is_correct: false },
    { soal_id: 65, option_value_id: 4, is_correct: false },

    // 66
    { soal_id: 66, option_value_id: 1, is_correct: true },
    { soal_id: 66, option_value_id: 2, is_correct: false },
    { soal_id: 66, option_value_id: 3, is_correct: false },
    { soal_id: 66, option_value_id: 4, is_correct: false },

    // 67
    { soal_id: 67, option_value_id: 1, is_correct: true },
    { soal_id: 67, option_value_id: 2, is_correct: false },
    { soal_id: 67, option_value_id: 3, is_correct: false },
    { soal_id: 67, option_value_id: 4, is_correct: false },

    // 68
    { soal_id: 68, option_value_id: 1, is_correct: true },
    { soal_id: 68, option_value_id: 2, is_correct: false },
    { soal_id: 68, option_value_id: 3, is_correct: false },
    { soal_id: 68, option_value_id: 4, is_correct: false },

    // 69
    { soal_id: 69, option_value_id: 1, is_correct: true },
    { soal_id: 69, option_value_id: 2, is_correct: false },
    { soal_id: 69, option_value_id: 3, is_correct: false },
    { soal_id: 69, option_value_id: 4, is_correct: false },

    // 70
    { soal_id: 70, option_value_id: 1, is_correct: true },
    { soal_id: 70, option_value_id: 2, is_correct: false },
    { soal_id: 70, option_value_id: 3, is_correct: false },
    { soal_id: 70, option_value_id: 4, is_correct: false },

    // 71
    { soal_id: 71, option_value_id: 1, is_correct: true },
    { soal_id: 71, option_value_id: 2, is_correct: false },
    { soal_id: 71, option_value_id: 3, is_correct: false },
    { soal_id: 71, option_value_id: 4, is_correct: false },

    // 72
    { soal_id: 72, option_value_id: 1, is_correct: true },
    { soal_id: 72, option_value_id: 2, is_correct: false },
    { soal_id: 72, option_value_id: 3, is_correct: false },
    { soal_id: 72, option_value_id: 4, is_correct: false },

    // 73
    { soal_id: 73, option_value_id: 1, is_correct: true },
    { soal_id: 73, option_value_id: 2, is_correct: false },
    { soal_id: 73, option_value_id: 3, is_correct: false },
    { soal_id: 73, option_value_id: 4, is_correct: false },

    // 74
    { soal_id: 74, option_value_id: 1, is_correct: true },
    { soal_id: 74, option_value_id: 2, is_correct: false },
    { soal_id: 74, option_value_id: 3, is_correct: false },
    { soal_id: 74, option_value_id: 4, is_correct: false },

    // 75
    { soal_id: 75, option_value_id: 1, is_correct: true },
    { soal_id: 75, option_value_id: 2, is_correct: false },
    { soal_id: 75, option_value_id: 3, is_correct: false },
    { soal_id: 75, option_value_id: 4, is_correct: false },

    // 76
    { soal_id: 76, option_value_id: 1, is_correct: true },
    { soal_id: 76, option_value_id: 2, is_correct: false },
    { soal_id: 76, option_value_id: 3, is_correct: false },
    { soal_id: 76, option_value_id: 4, is_correct: false },

    // 77
    { soal_id: 77, option_value_id: 1, is_correct: true },
    { soal_id: 77, option_value_id: 2, is_correct: false },
    { soal_id: 77, option_value_id: 3, is_correct: false },
    { soal_id: 77, option_value_id: 4, is_correct: false },

    // 78
    { soal_id: 78, option_value_id: 1, is_correct: true },
    { soal_id: 78, option_value_id: 2, is_correct: false },
    { soal_id: 78, option_value_id: 3, is_correct: false },
    { soal_id: 78, option_value_id: 4, is_correct: false },

    // 79
    { soal_id: 79, option_value_id: 1, is_correct: true },
    { soal_id: 79, option_value_id: 2, is_correct: false },
    { soal_id: 79, option_value_id: 3, is_correct: false },
    { soal_id: 79, option_value_id: 4, is_correct: false },

    // 80
    { soal_id: 80, option_value_id: 1, is_correct: true },
    { soal_id: 80, option_value_id: 2, is_correct: false },
    { soal_id: 80, option_value_id: 3, is_correct: false },
    { soal_id: 80, option_value_id: 4, is_correct: false },

    // 81
    { soal_id: 81, option_value_id: 1, is_correct: true },
    { soal_id: 81, option_value_id: 2, is_correct: false },
    { soal_id: 81, option_value_id: 3, is_correct: false },
    { soal_id: 81, option_value_id: 4, is_correct: false },

    // 82
    { soal_id: 82, option_value_id: 1, is_correct: true },
    { soal_id: 82, option_value_id: 2, is_correct: false },
    { soal_id: 82, option_value_id: 3, is_correct: false },
    { soal_id: 82, option_value_id: 4, is_correct: false },

    // 83
    { soal_id: 83, option_value_id: 1, is_correct: true },
    { soal_id: 83, option_value_id: 2, is_correct: false },
    { soal_id: 83, option_value_id: 3, is_correct: false },
    { soal_id: 83, option_value_id: 4, is_correct: false },

    // 84
    { soal_id: 84, option_value_id: 1, is_correct: true },
    { soal_id: 84, option_value_id: 2, is_correct: false },
    { soal_id: 84, option_value_id: 3, is_correct: false },
    { soal_id: 84, option_value_id: 4, is_correct: false },

    // 85
    { soal_id: 85, option_value_id: 1, is_correct: true },
    { soal_id: 85, option_value_id: 2, is_correct: false },
    { soal_id: 85, option_value_id: 3, is_correct: false },
    { soal_id: 85, option_value_id: 4, is_correct: false },

    // 86
    { soal_id: 86, option_value_id: 1, is_correct: true },
    { soal_id: 86, option_value_id: 2, is_correct: false },
    { soal_id: 86, option_value_id: 3, is_correct: false },
    { soal_id: 86, option_value_id: 4, is_correct: false },

    // 87
    { soal_id: 87, option_value_id: 1, is_correct: true },
    { soal_id: 87, option_value_id: 2, is_correct: false },
    { soal_id: 87, option_value_id: 3, is_correct: false },
    { soal_id: 87, option_value_id: 4, is_correct: false },

    // 88
    { soal_id: 88, option_value_id: 1, is_correct: true },
    { soal_id: 88, option_value_id: 2, is_correct: false },
    { soal_id: 88, option_value_id: 3, is_correct: false },
    { soal_id: 88, option_value_id: 4, is_correct: false },

    // 89
    { soal_id: 89, option_value_id: 1, is_correct: true },
    { soal_id: 89, option_value_id: 2, is_correct: false },
    { soal_id: 89, option_value_id: 3, is_correct: false },
    { soal_id: 89, option_value_id: 4, is_correct: false },

    // 90
    { soal_id: 90, option_value_id: 1, is_correct: true },
    { soal_id: 90, option_value_id: 2, is_correct: false },
    { soal_id: 90, option_value_id: 3, is_correct: false },
    { soal_id: 90, option_value_id: 4, is_correct: false },

    // 91
    { soal_id: 91, option_value_id: 1, is_correct: true },
    { soal_id: 91, option_value_id: 2, is_correct: false },
    { soal_id: 91, option_value_id: 3, is_correct: false },
    { soal_id: 91, option_value_id: 4, is_correct: false },

    // 92
    { soal_id: 92, option_value_id: 1, is_correct: true },
    { soal_id: 92, option_value_id: 2, is_correct: false },
    { soal_id: 92, option_value_id: 3, is_correct: false },
    { soal_id: 92, option_value_id: 4, is_correct: false },

    // 93
    { soal_id: 93, option_value_id: 1, is_correct: true },
    { soal_id: 93, option_value_id: 2, is_correct: false },
    { soal_id: 93, option_value_id: 3, is_correct: false },
    { soal_id: 93, option_value_id: 4, is_correct: false },

    // 94
    { soal_id: 94, option_value_id: 1, is_correct: true },
    { soal_id: 94, option_value_id: 2, is_correct: false },
    { soal_id: 94, option_value_id: 3, is_correct: false },
    { soal_id: 94, option_value_id: 4, is_correct: false },

    // 95
    { soal_id: 95, option_value_id: 1, is_correct: true },
    { soal_id: 95, option_value_id: 2, is_correct: false },
    { soal_id: 95, option_value_id: 3, is_correct: false },
    { soal_id: 95, option_value_id: 4, is_correct: false },

    // 96
    { soal_id: 96, option_value_id: 1, is_correct: true },
    { soal_id: 96, option_value_id: 2, is_correct: false },
    { soal_id: 96, option_value_id: 3, is_correct: false },
    { soal_id: 96, option_value_id: 4, is_correct: false },

    // 97
    { soal_id: 97, option_value_id: 1, is_correct: true },
    { soal_id: 97, option_value_id: 2, is_correct: false },
    { soal_id: 97, option_value_id: 3, is_correct: false },
    { soal_id: 97, option_value_id: 4, is_correct: false },

    // 98
    { soal_id: 98, option_value_id: 1, is_correct: true },
    { soal_id: 98, option_value_id: 2, is_correct: false },
    { soal_id: 98, option_value_id: 3, is_correct: false },
    { soal_id: 98, option_value_id: 4, is_correct: false },

    // 99
    { soal_id: 99, option_value_id: 1, is_correct: true },
    { soal_id: 99, option_value_id: 2, is_correct: false },
    { soal_id: 99, option_value_id: 3, is_correct: false },
    { soal_id: 99, option_value_id: 4, is_correct: false },

    // 100
    { soal_id: 100, option_value_id: 1, is_correct: true },
    { soal_id: 100, option_value_id: 2, is_correct: false },
    { soal_id: 100, option_value_id: 3, is_correct: false },
    { soal_id: 100, option_value_id: 4, is_correct: false },
  ]);
};