/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex('soal_option').del()
  await knex('option_value').del()

  await knex('option_value').insert([
    // Form 1 - Matematika
    /* 1  */ { value: '4' },
    /* 2  */ { value: '5' },
    /* 3  */ { value: '6' },
    /* 4  */ { value: '7' },
    /* 5  */ { value: '2' },
    /* 6  */ { value: '3' },
    /* 7  */ { value: '30' },
    /* 8  */ { value: '25' },

    // Form 2 - Pancasila
    /* 9  */ { value: '3 Sila' },
    /* 10 */ { value: '5 Sila' },
    /* 11 */ { value: '7 Sila' },
    /* 12 */ { value: 'Bintang' },
    /* 13 */ { value: 'Rantai' },
    /* 14 */ { value: 'Pohon Beringin' },
    /* 15 */ { value: 'Kepala Banteng' },

    // Form 3 - Bahasa Asing
    /* 16 */ { value: 'Terima kasih' },
    /* 17 */ { value: 'Sama-sama' },
    /* 18 */ { value: 'Halo' },
    /* 19 */ { value: 'Book' },
    /* 20 */ { value: 'Run' },
    /* 21 */ { value: 'Beautiful' },
    /* 22 */ { value: 'Pen' },
    /* 23 */ { value: 'Receive' },
    /* 24 */ { value: 'Recieve' },

    // Form 4 - Fisika Dasar
    /* 25 */ { value: 'Joule' },
    /* 26 */ { value: 'Newton' },
    /* 27 */ { value: 'Pascal' },
    /* 28 */ { value: 'Hukum I Newton' },
    /* 29 */ { value: 'Hukum II Newton' },
    /* 30 */ { value: 'Hukum Ohm' },
    /* 31 */ { value: 'Voltmeter' },
    /* 32 */ { value: 'Ampermeter' },

    // Form 5 - Survei Kepuasan Siswa
    /* 33 */ { value: 'Sangat Puas' },
    /* 34 */ { value: 'Puas' },
    /* 35 */ { value: 'Kurang Puas' },
    /* 36 */ { value: 'Perpustakaan' },
    /* 37 */ { value: 'Kantin' },
    /* 38 */ { value: 'Laboratorium' },
    /* 39 */ { value: 'Ya' },
    /* 40 */ { value: 'Tidak' },

    // Form 6 - Kimia Organik
    /* 41 */ { value: 'Oksigen' },
    /* 42 */ { value: 'Karbon' },
    /* 43 */ { value: 'Nitrogen' },
    /* 44 */ { value: 'Alkanol' },
    /* 45 */ { value: 'Alkanal' },
    /* 46 */ { value: 'Benzena' },
    /* 47 */ { value: '2' },
    /* 48 */ { value: '4' },

    // Form 7 - Pendaftaran Ekstrakurikuler
    /* 49 */ { value: 'Senin & Rabu' },
    /* 50 */ { value: 'Selasa & Kamis' },
    /* 51 */ { value: 'Sabtu' },
    /* 52 */ { value: 'Pramuka' },
    /* 53 */ { value: 'Paskibra' },
    /* 54 */ { value: 'Futsal' },
    /* 55 */ { value: 'Pernah' },
    /* 56 */ { value: 'Belum Pernah' },

    // Form 8 - Biologi Umum
    /* 57 */ { value: 'Mitokondria' },
    /* 58 */ { value: 'Ribosom' },
    /* 59 */ { value: 'Kucing' },
    /* 60 */ { value: 'Burung' },
    /* 61 */ { value: 'Cacing' },
    /* 62 */ { value: 'Mitosis' },
    /* 63 */ { value: 'Meiosis' },

    // Form 9 - Kuesioner Fasilitas Sekolah
    /* 64 */ { value: 'Sangat Bersih' },
    /* 65 */ { value: 'Cukup Bersih' },
    /* 66 */ { value: 'Kotor' },
    /* 67 */ { value: 'Kantin Belakang' },
    /* 68 */ { value: 'Samping Lab' },
    /* 69 */ { value: 'Sangat Stabil' },
    /* 70 */ { value: 'Sering Putus' },

    // Form 10 - Sejarah Indonesia
    /* 71 */ { value: '17 Agustus 1945' },
    /* 72 */ { value: '18 Agustus 1945' },
    /* 73 */ { value: '20 Mei 1908' },
    /* 74 */ { value: 'Pangeran Diponegoro' },
    /* 75 */ { value: 'Jenderal Soedirman' },
    /* 76 */ { value: 'Sisingamangaraja' },
    /* 77 */ { value: 'Jakarta' },
    /* 78 */ { value: 'Bandung' }
  ])
}