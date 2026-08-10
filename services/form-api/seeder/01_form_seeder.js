const slugify = require("slugify")
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('forms').del()
  const dummyData = [
    {
      title: 'Soal Matematika 2026',
      status: 'public',
      category: 'ujian'
    },
    {
      title: 'Soal Pendidikan Pancasila 2026',
      status: 'private',
      category: 'ujian'
    },
    {
      title: 'Soal Bahasa Asing 2026',
      status: 'public',
      category: 'ujian'
    }
  ];

  const insertForm = dummyData.map((item) => ({
    title: item.title,
    slug: slugify(item.title, { lower: true, strict: true}),
    status: item.status,
    category: item.category
  }))

  await knex('forms').insert(insertForm)
};
