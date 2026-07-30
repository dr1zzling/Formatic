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
      category_id: 1
    },
    {
      title: 'Soal Pendidikan Pancasila 2026',
      status: 'private',
      category_id: 1
    }
  ];

  const insertForm = dummyData.map((item) => ({
    title: item.title,
    slug: slugify(item.title, { lower: true, strict: true}),
    status: item.status,
    category_id: item.category_id
  }))

  await knex('forms').insert(insertForm)
};
