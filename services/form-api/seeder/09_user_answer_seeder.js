/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('user_answer').del()

  const submissions = await knex('form_submit')
    .select('id', 'form_id')
    .orderBy('id')

  const questions = await knex('soal')
    .select('id', 'form_id', 'type')
    .orderBy('form_id')
    .orderBy('id')

  const options = await knex('soal_option')
    .select('id', 'soal_id')
    .orderBy('soal_id')
    .orderBy('id')

  const files = await knex('file_upload')
    .select('id')
    .orderBy('id')

  const answers = []
  const optionsBySoalId = options.reduce((acc, option) => {
    if (!acc[option.soal_id]) {
      acc[option.soal_id] = []
    }

    acc[option.soal_id].push(option.id)
    return acc
  }, {})

  for (const submission of submissions) {
    const formQuestions = questions.filter((question) => question.form_id === submission.form_id)

    for (const [index, question] of formQuestions.entries()) {
      const answerRow = {
        submitted_id: submission.id,
        soal_option_id: null,
        file_id: null,
        answer_text: null,
      }

      if (question.type === 'text') {
        answerRow.answer_text = `Jawaban ${submission.form_id}-${index + 1}`
      } else if (question.type === 'file') {
        answerRow.file_id = files[(submission.id + index) % files.length]?.id ?? null
      } else {
        const optionIds = optionsBySoalId[question.id] || []
        answerRow.soal_option_id = optionIds[(submission.id + index) % optionIds.length] ?? null
      }

      answers.push(answerRow)
    }
  }

  await knex('user_answer').insert(answers)
};
