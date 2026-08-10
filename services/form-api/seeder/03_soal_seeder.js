/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('soal_option').del()
  await knex('soal').del()

  const soal = [
    { question: '2 + 2 = ?', form_id: 1, type: 'radio' },
    { question: 'Pilih semua angka genap', form_id: 1, type: 'checkbox' },
    { question: 'Tuliskan nama ibu kota Indonesia', form_id: 1, type: 'text' },
    { question: 'Upload file identitas', form_id: 1, type: 'file' },
    { question: 'Bahasa pemrograman yang benar adalah?', form_id: 1, type: 'radio' },

    { question: 'Sebutkan 2 nama planet', form_id: 2, type: 'text' },
    { question: 'Pilih warna dasar', form_id: 2, type: 'radio' },
    { question: 'Pilih semua benda yang bisa terbang', form_id: 2, type: 'checkbox' },
    { question: 'Upload bukti foto', form_id: 2, type: 'file' },
    { question: 'Bentuk bumi adalah?', form_id: 2, type: 'radio' },

    { question: 'Nama hewan berkaki 4 adalah?', form_id: 3, type: 'radio' },
    { question: 'Pilih semua huruf vokal', form_id: 3, type: 'checkbox' },
    { question: 'Tuliskan hari ini', form_id: 3, type: 'text' },
    { question: 'Upload foto produk', form_id: 3, type: 'file' },
    { question: 'Benda yang digunakan untuk menulis adalah?', form_id: 3, type: 'radio' },
  ]

  await knex('soal').insert(soal)
}