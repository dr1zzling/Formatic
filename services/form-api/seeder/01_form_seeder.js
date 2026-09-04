const slugify = require("slugify");
const crypto = require("crypto");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('forms').del();

  const dummyData = [
    {
      title: 'Soal Matematika 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-1.jpg',
      is_random: true,
      duration: 120,
      theme_color: '#3B82F6'
    },
    {
      title: 'Soal Pendidikan Pancasila 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/banner/soal-2.jpg',
      is_random: true,
      duration: 90,
      theme_color: '#EF4444'
    },
    {
      title: 'Soal Bahasa Asing 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-3.jpg',
      is_random: false,
      duration: 60,
      theme_color: '#10B981'
    },
    {
      title: 'Soal Fisika Dasar 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-4.jpg',
      is_random: false,
      duration: 90,
      theme_color: '#8B5CF6'
    },
    {
      title: 'Survei Kepuasan Siswa 2026',
      status: 'public',
      category: 'survei',
      banner: '/uploads/banner/soal-5.jpg',
      is_random: true,
      duration: null,
      theme_color: '#F59E0B'
    },
    {
      title: 'Soal Kimia Organik 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/banner/soal-6.jpg',
      is_random: true,
      duration: 100,
      theme_color: '#EC4899'
    },
    {
      title: 'Survei Ekstrakurikuler yang diminati 2026',
      status: 'public',
      category: 'survei',
      banner: '/uploads/banner/soal-7.jpg',
      is_random: false,
      duration: null,
      theme_color: '#06B6D4'
    },
    {
      title: 'Soal Biologi Umum 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-8.jpg',
      is_random: false,
      duration: 75,
      theme_color: '#10B981'
    },
    {
      title: 'Kuesioner Fasilitas Sekolah 2026',
      status: 'private',
      category: 'survei',
      banner: '/uploads/banner/soal-9.jpg',
      is_random: true,
      duration: null,
      theme_color: '#6366F1'
    },
    {
      title: 'Soal Sejarah Indonesia 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-10.jpg',
      is_random: true,
      duration: 90,
      theme_color: '#B45309'
    },
    {
      title: 'Soal Geografi Indonesia 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-11.jpg',
      is_random: true,
      duration: 80,
      theme_color: '#047857'
    },
    {
      title: 'Soal Bahasa Indonesia 2026',
      status: 'private',
      category: 'ujian',
      banner: '/uploads/banner/soal-12.jpg',
      is_random: false,
      duration: 90,
      theme_color: '#DC2626'
    },
    {
      title: 'Survei Kegiatan Belajar Mengajar 2026',
      status: 'public',
      category: 'survei',
      banner: '/uploads/banner/soal-13.jpg',
      is_random: true,
      duration: null,
      theme_color: '#64748B'
    },
    {
      title: 'Soal Ekonomi Dasar 2026',
      status: 'public',
      category: 'ujian',
      banner: '/uploads/banner/soal-14.jpg',
      is_random: false,
      duration: 90,
      theme_color: '#0D9488'
    },
    {
      title: 'Kuesioner Minat Baca Siswa 2026',
      status: 'private',
      category: 'survei',
      banner: '/uploads/banner/soal-15.jpg',
      is_random: true,
      duration: null,
      theme_color: '#A855F7'
    }
  ];

  const insertForm = dummyData.map((item) => ({
    title: item.title,
    slug: slugify(item.title, { lower: true, strict: true }),
    status: item.status,
    category: item.category,
    token_respon: crypto.randomBytes(4).toString('hex'),
    token_collab: crypto.randomBytes(8).toString('hex'),
    is_random: item.is_random,
    duration: item.duration,
    start_at: new Date(),
    banner: item.banner,
    theme_color: item.theme_color
  }));

  await knex('forms').insert(insertForm);
};