/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  await knex('sub_kategori').del();

  await knex('sub_kategori').insert([
    { name: 'Sosial Hukum', primary_kategori_id: 1 },
    { name: 'Sains', primary_kategori_id: 1 },
    { name: 'Bahasa Indonesia', primary_kategori_id: 1 },
    { name: 'English', primary_kategori_id: 1 },
    { name: 'Bahasa Jepang', primary_kategori_id: 1 },
    { name: 'Matematika', primary_kategori_id: 1},
    { name: 'PKK/KIK', primary_kategori_id: 1},
    { name: 'Desain Grafis/DKV', primary_kategori_id: 1},
    { name: 'Pendidikan Pancasila', primary_kategori_id: 1},
    { name: 'Pendidikan Agama Islam', primary_kategori_id: 1},
    { name: 'Pendidikan Agama Kristen ', primary_kategori_id: 1},

    { name: 'Keuangan ', primary_kategori_id: 1},
    { name: 'Bisnis Digital ', primary_kategori_id: 1},
    { name: 'Bisnis Retail ', primary_kategori_id: 1},
    { name: 'Management Perkantoran', primary_kategori_id: 1},
    { name: 'Management Logistik ', primary_kategori_id: 1},
    { name: 'RPL ', primary_kategori_id: 1},


    { name: 'evaluasi sekolah', primary_kategori_id: 2 },
    { name: 'Minat & Bakat', primary_kategori_id: 2 }
  ]);
};