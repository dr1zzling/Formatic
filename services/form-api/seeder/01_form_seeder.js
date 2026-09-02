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
      banner: '/uploads/banner/soal-1',
      is_random: true
    },
    {
      title: 'Soal Pendidikan Pancasila 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/banner/soal-2',
      is_random: true
    },
    {
      title: 'Soal Bahasa Asing 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-3',
      is_random: false
    },
    {
      title: 'Soal Fisika Dasar 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-4',
      is_random: false
    },
    {
      title: 'Survei Kepuasan Siswa 2026',
      status: 'public',
      category: 'survei',
      banner: '/uploads/banner/soal-5',
      is_random: true
    },
    {
      title: 'Soal Kimia Organik 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/banner/soal-6',
      is_random: true
    },
    {
      title: 'Survei Ekstrakurikuler yang diminati 2026',
      status: 'public',
      category: 'survei',
      banner: '/uploads/banner/soal-7',
      is_random: false
    },
    {
      title: 'Soal Biologi Umum 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-8',
      is_random: false
    },
    {
      title: 'Kuesioner Fasilitas Sekolah 2026',
      status: 'private',
      category: 'survei',
      banner: '/uploads/banner/soal-9',
      is_random: true
    },
    {
      title: 'Soal Sejarah Indonesia 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-10',
      is_random: true
    },
    {
      title: 'Soal Geografi Indonesia 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-11',
      is_random: true
    },
    {
      title: 'Soal Bahasa Indonesia 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/banner/soal-12',
      is_random: false
    },
    {
      title: 'Survei Kegiatan Belajar Mengajar 2026',
      status: 'public',
      category: 'survei',
      banner: '/uploads/banner/soal-13',
      is_random: true
    },
    {
      title: 'Soal Ekonomi Dasar 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-14',
      is_random: false
    },
    {
      title: 'Kuesioner Minat Baca Siswa 2026',
      status: 'private',
      category: 'survei',
      banner: '/uploads/banner/soal-15',
      is_random: true
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