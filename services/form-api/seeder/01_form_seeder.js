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
      title: 'Survei Kepuasan Pelanggan 2026',
      status: 'public',
    },
    {
      title: 'Formulir Pendaftaran Event Internal',
      status: 'private',
    },
    {
      title: 'Feedback Aplikasi Mobile V2',
      status: 'public',
    },
    {
      title: 'Evaluasi Kinerja Karyawan Q3',
      status: 'private',
    },
  ];

  const inserForm = dummyData.map((item) => ({
    title: item.title,
    slug: slugify(item.title, { lower: true, strict: true}),
    status: item.status
  }))

  await knex('forms').insert(inserForm)
};
