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
      banner: '/uploads/banner/soal-1'
    },
    {
      title: 'Soal Pendidikan Pancasila 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/banner/soal-2'
    },
    {
      title: 'Soal Bahasa Asing 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-3'
    },
    {
      title: 'Soal Fisika Dasar 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-4'
    },
    {
      title: 'Survei Kepuasan Siswa 2026',
      status: 'public',
      category: 'survei',
      banner: '/uploads/banner/soal-5'
    },
    {
      title: 'Soal Kimia Organik 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/banner/soal-6'
    },
    {
      title: 'Survei Ekstrakurikuler yang diminati 2026',
      status: 'public',
      category: 'survei',
      banner: '/uploads/banner/soal-7'
    },
    {
      title: 'Soal Biologi Umum 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-8'
    },
    {
      title: 'Kuesioner Fasilitas Sekolah 2026',
      status: 'private',
      category: 'survei',
      banner: '/uploads/banner/soal-9'
    },
    {
      title: 'Soal Sejarah Indonesia 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-10'
    }
  ];

  const insertForm = dummyData.map((item) => ({
    title: item.title,
    slug: slugify(item.title, { lower: true, strict: true }),
    status: item.status,
    category: item.category,
    token_collab: crypto.randomBytes(64).toString('hex'),
    banner: item.banner
  }))

  await knex('forms').insert(insertForm)
};