const slugify = require("slugify")
const crypto = require('crypto')
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
      category: 'ujian',
      banner: '/uploads/soal-1'
    },
    {
      title: 'Soal Pendidikan Pancasila 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/soal-2'
    },
    {
      title: 'Soal Bahasa Asing 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/soal-3'
    }
  ];

  const insertForm = dummyData.map((item) => ({
    title: item.title,
    slug: slugify(item.title, { lower: true, strict: true}),
    status: item.status,
    category: item.category,
    token_collab: crypto.randomBytes(64).toString('hex'),
    banner: item.banner
  }))

  await knex('forms').insert(insertForm)
};
