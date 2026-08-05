/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex('soal').del()
  await knex('soal').insert([
    {
      question: 'Tentukan turunan pertama dari fungsi f(x) = 3x² + 5x – 7.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Hitung integral ∫ (2x + 3) dx.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Diketahui limit lim (x→2) (x² – 4)/(x – 2). Tentukan nilainya.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan nilai determinan dari matriks A = [[2,3],[1,4]].',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Jika diketahui barisan aritmetika dengan U1 = 5 dan beda = 3, tentukan U10.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan suku ke-6 dari barisan geometri dengan U1 = 2 dan r = 3.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Selesaikan persamaan logaritma log₂ (x – 1) = 3.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan hasil dari (sin² 30° + cos² 30°).',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Jika diketahui f(x) = 2x + 1 dan g(x) = x² – 3, tentukan (f ∘ g)(x).',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan luas daerah di bawah kurva y = x² dari x = 0 hingga x = 2.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan turunan pertama dari f(x) = 5x³ – 4x² + 7.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Hitung integral ∫ (4x² – 6x) dx.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan limit lim (x→∞) (3x² + 2)/(x² + 1).',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan determinan matriks B = [[1,2,3],[0,4,5],[1,0,6]].',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Jika barisan aritmetika memiliki U1 = 7 dan beda = 5, tentukan U15.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan jumlah 8 suku pertama barisan aritmetika U1 = 3, beda = 4.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan suku ke-5 barisan geometri U1 = 4 dan r = 2.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Selesaikan persamaan logaritma log₃ (x² – 4) = 2.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan nilai cos² 60° + sin² 60°.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Jika f(x) = x² – 1 dan g(x) = 2x + 3, tentukan (g ∘ f)(x).',
      form_id: 1,
      type: 'radio'
    }, {
      question: 'Tentukan luas daerah di bawah kurva y = 3x dari x = 0 hingga x = 4.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan turunan dari f(x) = √x.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan integral ∫ (1/x) dx.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan limit lim (x→0) (sin x)/x.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan determinan matriks [[2,1],[7,3]].',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan jumlah 10 suku pertama barisan aritmetika U1 = 2, beda = 3.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Jika U1 = 5 dan r = 1/2, tentukan jumlah 6 suku pertama barisan geometri.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Selesaikan logaritma log₁₀ (x) = 4.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan nilai sin 45° × cos 45°.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Jika f(x) = 3x – 2 dan g(x) = 5x², tentukan (f ∘ g)(2).',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan luas daerah di bawah kurva y = x³ dari x = 0 hingga x = 2.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan turunan dari f(x) = (x² + 1)(x – 3).',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan integral ∫ (2e^x) dx.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan limit lim (x→∞) (5x + 3)/(2x + 7).',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan determinan matriks [[3,0,2],[1,4,0],[0,5,1]].',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Hitung jumlah 12 suku pertama barisan aritmetika U1 = 6, beda = 2.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan suku ke-7 dari barisan geometri U1 = 3, r = 4.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Selesaikan logaritma log₂ (x) + log₂ (x – 2) = 3.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Jika f(x) = 2x² dan g(x) = x + 1, tentukan (f ∘ g)(3).',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan nilai tan 45°.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan luas daerah di bawah kurva y = 2x² dari x = 1 hingga x = 3.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan turunan kedua dari f(x) = x³ – 6x² + 4.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan integral ∫ (cos x) dx.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan limit lim (x→0) (1 – cos x)/x².',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan determinan matriks [[4,1],[2,3]].',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Hitung jumlah 5 suku pertama barisan geometri U1 = 2, r = 3.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan peluang muncul angka genap dari pelemparan dadu.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Jika sebuah kotak berisi 5 bola merah dan 3 bola biru, tentukan peluang mengambil bola merah.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Sebuah koin dilempar sekali, tentukan peluang muncul gambar.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Tentukan nilai maksimum fungsi f(x) = –x² + 4x + 1.',
      form_id: 1,
      type: 'radio'
    },
    {
      question: 'Sila pertama Pancasila dilambangkan dengan simbol...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Nilai utama yang terkandung dalam sila ketiga Pancasila adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Kedudukan Pancasila sebagai dasar negara Indonesia tertuang dalam Pembukaan UUD 1945 alinea ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Contoh penerapan sila kedua Pancasila dalam kehidupan sehari-hari adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Musyawarah untuk mencapai mufakat merupakan perwujudan dari sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Rumusan Pancasila yang sah dan resmi tercantum di dalam...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Tokoh yang menyampaikan gagasan Lima Dasar Negara pada tanggal 1 Juni 1945 adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Sila kelima Pancasila dilambangkan dengan gambar...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Fungsi Pancasila sebagai pandangan hidup bangsa mengandung arti bahwa...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Hak asasi manusia dalam Pancasila dijamin dan dilindungi berdasarkan prinsip...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Sikap toleransi antarumat beragama merupakan pengamalan sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Kerjasama dan gotong royong dalam masyarakat merupakan ciri khas bangsa Indonesia yang sesuai dengan sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Lembaga negara yang berwenang mengubah dan menetapkan UUD 1945 adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Makna dari semboyan Bhinneka Tunggal Ika adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Pengakuan terhadap persamaan derajat, hak, dan kewajiban antarmanusia sesuai dengan sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Pancasila sebagai ideologi terbuka memiliki arti bahwa Pancasila...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Tanggal 1 Juni diperingati sebagai Hari Lahir...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'BPUPKI dibentuk oleh pemerintah Jepang pada tanggal...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Ketua BPUPKI yang memimpin sidang perumusan dasar negara adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Panitia Sembilan berhasil merumuskan dokumen penting yang dikenal dengan nama...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Sila ke-4 Pancasila menekankan pentingnya pengambilan keputusan melalui...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Menjaga kelestarian lingkungan hidup merupakan wujud tanggung jawab warga negara yang sesuai dengan sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Cinta tanah air dan bangsa merupakan bentuk pengamalan Pancasila sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Pancasila sebagai sumber dari segala sumber hukum negara mengandung makna bahwa...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Norma yang bersumber dari tata kehidupan atau kebiasaan masyarakat setempat disebut norma...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Salah satu contoh hak warga negara yang diatur dalam UUD 1945 adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Kewajiban utama warga negara dalam upaya membela negara diatur dalam UUD 1945 Pasal...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Lambang Negara Republik Indonesia adalah Garuda Pancasila dengan cengkeraman pita bertuliskan...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Jumlah bulu pada leher Burung Garuda melambangkan tahun kemerdekaan Indonesia yaitu sebanyak...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Tanggal proklamasi kemerdekaan Indonesia dirayakan setiap tanggal...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Salah satu bentuk kepatuhan terhadap hukum di lingkungan sekolah adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Sikap tidak membeda-bedakan teman berdasarkan suku, ras, atau agama adalah wujud sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Badan yang bertugas menggantikan BPUPKI untuk mempersiapkan kemerdekaan Indonesia adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Piagam Jakarta dirumuskan pada tanggal...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Perubahan kalimat pada sila pertama Piagam Jakarta dilakukan demi menjaga...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Landasan hukum pelaksanaan hak dan kewajiban warga negara Indonesia adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Prinsip kedaulatan rakyat menyatakan bahwa kekuasaan tertinggi berada di tangan...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Nilai praksis Pancasila adalah perwujudan nilai dasar dalam...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Upaya mencegah terjadinya pelanggaran HAM di lingkungan masyarakat dapat dilakukan dengan cara...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Bentuk negara Indonesia menurut UUD 1945 Pasal 1 Ayat 1 adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Lembaga yang bertugas mengawasi pelaksanaan undang-undang di Indonesia adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Menghargai hasil karya orang lain merupakan pengamalan Pancasila khususnya sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Sistem pemerintahan yang dianut oleh negara Indonesia adalah sistem...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Salah satu contoh perwujudan nilai Pancasila di bidang ekonomi adalah...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Cinta produk dalam negeri merupakan salah satu bentuk pengamalan sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Wawasan Nusantara adalah cara pandang bangsa Indonesia tentang...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Asas keadilan sosial bagi seluruh rakyat Indonesia bertujuan untuk mewujudkan...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Sikap menghormati pendapat orang lain saat berdiskusi adalah contoh pengamalan sila ke-...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Hak atas pekerjaan dan penghidupan yang layak bagi kemanusiaan diatur dalam UUD 1945 Pasal...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Menjaga persatuan dan kesatuan bangsa di tengah keragaman budaya merupakan kewajiban dari...',
      form_id: 2,
      type: 'radio'
    },
    {
      question: 'Pertanyaan form 3 nomor 1',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 2',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 3',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 4',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 5',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 6',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 7',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 8',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 9',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 10',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 11',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 12',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 13',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 14',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 15',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 16',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 17',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 18',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 19',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 20',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 21',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 22',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 23',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 24',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 25',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 26',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 27',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 28',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 29',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 30',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 31',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 32',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 33',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 34',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 35',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 36',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 37',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 38',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 39',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 40',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 41',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 42',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 43',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 44',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 45',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 46',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 47',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 48',
      form_id: 3,
      type: 'file'
    },
    {
      question: 'Pertanyaan form 3 nomor 49',
      form_id: 3,
      type: 'text'
    },
    {
      question: 'Pertanyaan form 3 nomor 50',
      form_id: 3,
      type: 'file'
    },
  ])
};
