/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('soal_option').del()
  await knex('soal_option').insert([

    // 1. f(x) = 3x² + 5x – 7 => f'(x) = 6x + 5
    { soal_id: 1, option_value: '6x + 5', is_correct: true },
    { soal_id: 1, option_value: '6x - 5', is_correct: false },
    { soal_id: 1, option_value: '3x + 5', is_correct: false },
    { soal_id: 1, option_value: '6x² + 5', is_correct: false },

    // 2. ∫ (2x + 3) dx = x² + 3x + C
    { soal_id: 2, option_value: 'x² + 3x + C', is_correct: true },
    { soal_id: 2, option_value: '2x² + 3x + C', is_correct: false },
    { soal_id: 2, option_value: 'x² + 3 + C', is_correct: false },
    { soal_id: 2, option_value: '2x + 3x + C', is_correct: false },

    // 3. lim (x→2) (x² – 4)/(x – 2) = 4
    { soal_id: 3, option_value: '4', is_correct: true },
    { soal_id: 3, option_value: '2', is_correct: false },
    { soal_id: 3, option_value: '0', is_correct: false },
    { soal_id: 3, option_value: '8', is_correct: false },

    // 4. Det [[2,3],[1,4]] = 8 - 3 = 5
    { soal_id: 4, option_value: '5', is_correct: true },
    { soal_id: 4, option_value: '11', is_correct: false },
    { soal_id: 4, option_value: '8', is_correct: false },
    { soal_id: 4, option_value: '2', is_correct: false },

    // 5. U1=5, b=3 => U10 = 5 + 9(3) = 32
    { soal_id: 5, option_value: '32', is_correct: true },
    { soal_id: 5, option_value: '35', is_correct: false },
    { soal_id: 5, option_value: '29', is_correct: false },
    { soal_id: 5, option_value: '30', is_correct: false },

    // 6. U1=2, r=3 => U6 = 2 * 3^5 = 486
    { soal_id: 6, option_value: '486', is_correct: true },
    { soal_id: 6, option_value: '162', is_correct: false },
    { soal_id: 6, option_value: '1458', is_correct: false },
    { soal_id: 6, option_value: '243', is_correct: false },

    // 7. log₂ (x – 1) = 3 => x - 1 = 8 => x = 9
    { soal_id: 7, option_value: '9', is_correct: true },
    { soal_id: 7, option_value: '7', is_correct: false },
    { soal_id: 7, option_value: '8', is_correct: false },
    { soal_id: 7, option_value: '10', is_correct: false },

    // 8. sin² 30° + cos² 30° = 1
    { soal_id: 8, option_value: '1', is_correct: true },
    { soal_id: 8, option_value: '0', is_correct: false },
    { soal_id: 8, option_value: '1/2', is_correct: false },
    { soal_id: 8, option_value: '2', is_correct: false },

    // 9. f(x)=2x+1, g(x)=x²–3 => (f ∘ g)(x) = 2(x²–3)+1 = 2x² – 5
    { soal_id: 9, option_value: '2x² – 5', is_correct: true },
    { soal_id: 9, option_value: '2x² – 3', is_correct: false },
    { soal_id: 9, option_value: '4x² – 1', is_correct: false },
    { soal_id: 9, option_value: '2x² + 1', is_correct: false },

    // 10. ∫₀² x² dx = [x³/3]₀² = 8/3
    { soal_id: 10, option_value: '8/3', is_correct: true },
    { soal_id: 10, option_value: '4/3', is_correct: false },
    { soal_id: 10, option_value: '2', is_correct: false },
    { soal_id: 10, option_value: '16/3', is_correct: false },

    // 11. f(x) = 5x³ – 4x² + 7 => f'(x) = 15x² – 8x
    { soal_id: 11, option_value: '15x² – 8x', is_correct: true },
    { soal_id: 11, option_value: '15x² – 4x', is_correct: false },
    { soal_id: 11, option_value: '5x² – 8x', is_correct: false },
    { soal_id: 11, option_value: '15x³ – 8x', is_correct: false },

    // 12. ∫ (4x² – 6x) dx = (4/3)x³ – 3x² + C
    { soal_id: 12, option_value: '(4/3)x³ – 3x² + C', is_correct: true },
    { soal_id: 12, option_value: '4x³ – 3x² + C', is_correct: false },
    { soal_id: 12, option_value: '(4/3)x³ – 6x² + C', is_correct: false },
    { soal_id: 12, option_value: '2x³ – 3x² + C', is_correct: false },

    // 13. lim (x→∞) (3x² + 2)/(x² + 1) = 3
    { soal_id: 13, option_value: '3', is_correct: true },
    { soal_id: 13, option_value: '2', is_correct: false },
    { soal_id: 13, option_value: '1', is_correct: false },
    { soal_id: 13, option_value: '∞', is_correct: false },

    // 14. Det [[1,2,3],[0,4,5],[1,0,6]] = 1(24-0) - 2(0-5) + 3(0-4) = 24 + 10 - 12 = 22
    { soal_id: 14, option_value: '22', is_correct: true },
    { soal_id: 14, option_value: '18', is_correct: false },
    { soal_id: 14, option_value: '24', is_correct: false },
    { soal_id: 14, option_value: '12', is_correct: false },

    // 15. U1 = 7, b = 5 => U15 = 7 + 14(5) = 77
    { soal_id: 15, option_value: '77', is_correct: true },
    { soal_id: 15, option_value: '72', is_correct: false },
    { soal_id: 15, option_value: '82', is_correct: false },
    { soal_id: 15, option_value: '80', is_correct: false },

    // 16. S8 = 8/2 * (2(3) + 7(4)) = 4 * (6 + 28) = 136
    { soal_id: 16, option_value: '136', is_correct: true },
    { soal_id: 16, option_value: '128', is_correct: false },
    { soal_id: 16, option_value: '144', is_correct: false },
    { soal_id: 16, option_value: '120', is_correct: false },

    // 17. U1 = 4, r = 2 => U5 = 4 * 2^4 = 64
    { soal_id: 17, option_value: '64', is_correct: true },
    { soal_id: 17, option_value: '32', is_correct: false },
    { soal_id: 17, option_value: '128', is_correct: false },
    { soal_id: 17, option_value: '16', is_correct: false },

    // 18. log₃ (x² – 4) = 2 => x² - 4 = 9 => x² = 13 => x = √13
    { soal_id: 18, option_value: '√13', is_correct: true },
    { soal_id: 18, option_value: '√5', is_correct: false },
    { soal_id: 18, option_value: '3', is_correct: false },
    { soal_id: 18, option_value: '√11', is_correct: false },

    // 19. cos² 60° + sin² 60° = 1
    { soal_id: 19, option_value: '1', is_correct: true },
    { soal_id: 19, option_value: '1/2', is_correct: false },
    { soal_id: 19, option_value: '3/4', is_correct: false },
    { soal_id: 19, option_value: '0', is_correct: false },

    // 20. f(x)=x²–1, g(x)=2x+3 => (g ∘ f)(x) = 2(x²–1)+3 = 2x² + 1
    { soal_id: 20, option_value: '2x² + 1', is_correct: true },
    { soal_id: 20, option_value: '2x² + 3', is_correct: false },
    { soal_id: 20, option_value: '4x² + 1', is_correct: false },
    { soal_id: 20, option_value: '2x² – 1', is_correct: false },

    // 21. ∫₀⁴ 3x dx = [1.5x²]₀⁴ = 24
    { soal_id: 21, option_value: '24', is_correct: true },
    { soal_id: 21, option_value: '12', is_correct: false },
    { soal_id: 21, option_value: '48', is_correct: false },
    { soal_id: 21, option_value: '18', is_correct: false },

    // 22. f(x) = √x => f'(x) = 1/(2√x)
    { soal_id: 22, option_value: '1 / (2√x)', is_correct: true },
    { soal_id: 22, option_value: '1 / √x', is_correct: false },
    { soal_id: 22, option_value: '2 / √x', is_correct: false },
    { soal_id: 22, option_value: '1 / (x√x)', is_correct: false },

    // 23. ∫ (1/x) dx = ln|x| + C
    { soal_id: 23, option_value: 'ln|x| + C', is_correct: true },
    { soal_id: 23, option_value: '1/x² + C', is_correct: false },
    { soal_id: 23, option_value: 'e^x + C', is_correct: false },
    { soal_id: 23, option_value: '-1/x² + C', is_correct: false },

    // 24. lim (x→0) (sin x)/x = 1
    { soal_id: 24, option_value: '1', is_correct: true },
    { soal_id: 24, option_value: '0', is_correct: false },
    { soal_id: 24, option_value: '∞', is_correct: false },
    { soal_id: 24, option_value: '1/2', is_correct: false },

    // 25. Det [[2,1],[7,3]] = 6 - 7 = -1
    { soal_id: 25, option_value: '-1', is_correct: true },
    { soal_id: 25, option_value: '1', is_correct: false },
    { soal_id: 25, option_value: '13', is_correct: false },
    { soal_id: 25, option_value: '-13', is_correct: false },

    // 26. S10 = 10/2 * (2(2) + 9(3)) = 5 * (4 + 27) = 155
    { soal_id: 26, option_value: '155', is_correct: true },
    { soal_id: 26, option_value: '150', is_correct: false },
    { soal_id: 26, option_value: '160', is_correct: false },
    { soal_id: 26, option_value: '145', is_correct: false },

    // 27. U1=5, r=1/2 => S6 = 5*(1 - (1/2)^6)/(1 - 1/2) = 10 * (63/64) = 315/32
    { soal_id: 27, option_value: '315/32', is_correct: true },
    { soal_id: 27, option_value: '315/64', is_correct: false },
    { soal_id: 27, option_value: '63/32', is_correct: false },
    { soal_id: 27, option_value: '155/16', is_correct: false },

    // 28. log₁₀ (x) = 4 => x = 10000
    { soal_id: 28, option_value: '10.000', is_correct: true },
    { soal_id: 28, option_value: '1.000', is_correct: false },
    { soal_id: 28, option_value: '40', is_correct: false },
    { soal_id: 28, option_value: '100.000', is_correct: false },

    // 29. sin 45° × cos 45° = (√2/2)*(√2/2) = 1/2
    { soal_id: 29, option_value: '1/2', is_correct: true },
    { soal_id: 29, option_value: '1', is_correct: false },
    { soal_id: 29, option_value: '1/4', is_correct: false },
    { soal_id: 29, option_value: '√2/2', is_correct: false },

    // 30. f(x)=3x-2, g(x)=5x² => g(2)=20 => f(20) = 58
    { soal_id: 30, option_value: '58', is_correct: true },
    { soal_id: 30, option_value: '28', is_correct: false },
    { soal_id: 30, option_value: '60', is_correct: false },
    { soal_id: 30, option_value: '52', is_correct: false },

    // 31. ∫₀² x³ dx = [x⁴/4]₀² = 4
    { soal_id: 31, option_value: '4', is_correct: true },
    { soal_id: 31, option_value: '8', is_correct: false },
    { soal_id: 31, option_value: '2', is_correct: false },
    { soal_id: 31, option_value: '16', is_correct: false },

    // 32. f(x) = (x²+1)(x–3) = x³ – 3x² + x – 3 => f'(x) = 3x² – 6x + 1
    { soal_id: 32, option_value: '3x² – 6x + 1', is_correct: true },
    { soal_id: 32, option_value: '3x² – 6x', is_correct: false },
    { soal_id: 32, option_value: '2x² – 3', is_correct: false },
    { soal_id: 32, option_value: '3x² + 1', is_correct: false },

    // 33. ∫ (2e^x) dx = 2e^x + C
    { soal_id: 33, option_value: '2e^x + C', is_correct: true },
    { soal_id: 33, option_value: 'e^x + C', is_correct: false },
    { soal_id: 33, option_value: '2e^(2x) + C', is_correct: false },
    { soal_id: 33, option_value: '(1/2)e^x + C', is_correct: false },

    // 34. lim (x→∞) (5x + 3)/(2x + 7) = 5/2
    { soal_id: 34, option_value: '5/2', is_correct: true },
    { soal_id: 34, option_value: '3/7', is_correct: false },
    { soal_id: 34, option_value: '∞', is_correct: false },
    { soal_id: 34, option_value: '0', is_correct: false },

    // 35. Det [[3,0,2],[1,4,0],[0,5,1]] = 3(4-0) - 0 + 2(5-0) = 12 + 10 = 22
    { soal_id: 35, option_value: '22', is_correct: true },
    { soal_id: 35, option_value: '12', is_correct: false },
    { soal_id: 35, option_value: '17', is_correct: false },
    { soal_id: 35, option_value: '26', is_correct: false },

    // 36. S12 = 12/2 * (2(6) + 11(2)) = 6 * (12 + 22) = 204
    { soal_id: 36, option_value: '204', is_correct: true },
    { soal_id: 36, option_value: '192', is_correct: false },
    { soal_id: 36, option_value: '216', is_correct: false },
    { soal_id: 36, option_value: '180', is_correct: false },

    // 37. U1=3, r=4 => U7 = 3 * 4^6 = 3 * 4096 = 12288
    { soal_id: 37, option_value: '12.288', is_correct: true },
    { soal_id: 37, option_value: '3.072', is_correct: false },
    { soal_id: 37, option_value: '49.152', is_correct: false },
    { soal_id: 37, option_value: '6.144', is_correct: false },

    // 38. log₂ (x(x–2)) = 3 => x² - 2x = 8 => x² - 2x - 8 = 0 => (x-4)(x+2)=0 => x = 4
    { soal_id: 38, option_value: '4', is_correct: true },
    { soal_id: 38, option_value: '2', is_correct: false },
    { soal_id: 38, option_value: '-2', is_correct: false },
    { soal_id: 38, option_value: '8', is_correct: false },

    // 39. f(x)=2x², g(x)=x+1 => g(3)=4 => f(4) = 2(16) = 32
    { soal_id: 39, option_value: '32', is_correct: true },
    { soal_id: 39, option_value: '18', is_correct: false },
    { soal_id: 39, option_value: '64', is_correct: false },
    { soal_id: 39, option_value: '25', is_correct: false },

    // 40. tan 45° = 1
    { soal_id: 40, option_value: '1', is_correct: true },
    { soal_id: 40, option_value: '0', is_correct: false },
    { soal_id: 40, option_value: '1/2', is_correct: false },
    { soal_id: 40, option_value: '√3', is_correct: false },

    // 41. ∫₁³ 2x² dx = [2/3 x³]₁³ = 2/3(27 - 1) = 52/3
    { soal_id: 41, option_value: '52/3', is_correct: true },
    { soal_id: 41, option_value: '26/3', is_correct: false },
    { soal_id: 41, option_value: '18', is_correct: false },
    { soal_id: 41, option_value: '54/3', is_correct: false },

    // 42. f(x) = x³ – 6x² + 4 => f'(x) = 3x² - 12x => f''(x) = 6x – 12
    { soal_id: 42, option_value: '6x – 12', is_correct: true },
    { soal_id: 42, option_value: '3x – 12', is_correct: false },
    { soal_id: 42, option_value: '6x – 6', is_correct: false },
    { soal_id: 42, option_value: '6x²', is_correct: false },

    // 43. ∫ (cos x) dx = sin x + C
    { soal_id: 43, option_value: 'sin x + C', is_correct: true },
    { soal_id: 43, option_value: '-sin x + C', is_correct: false },
    { soal_id: 43, option_value: 'tan x + C', is_correct: false },
    { soal_id: 43, option_value: '-cos x + C', is_correct: false },

    // 44. lim (x→0) (1 – cos x)/x² = 1/2
    { soal_id: 44, option_value: '1/2', is_correct: true },
    { soal_id: 44, option_value: '0', is_correct: false },
    { soal_id: 44, option_value: '1', is_correct: false },
    { soal_id: 44, option_value: '2', is_correct: false },

    // 45. Det [[4,1],[2,3]] = 12 - 2 = 10
    { soal_id: 45, option_value: '10', is_correct: true },
    { soal_id: 45, option_value: '14', is_correct: false },
    { soal_id: 45, option_value: '8', is_correct: false },
    { soal_id: 45, option_value: '12', is_correct: false },

    // 46. U1=2, r=3 => S5 = 2*(3^5 - 1)/(3 - 1) = 242
    { soal_id: 46, option_value: '242', is_correct: true },
    { soal_id: 46, option_value: '243', is_correct: false },
    { soal_id: 46, option_value: '121', is_correct: false },
    { soal_id: 46, option_value: '484', is_correct: false },

    // 47. Peluang angka genap (2,4,6 dari 6) = 3/6 = 1/2
    { soal_id: 47, option_value: '1/2', is_correct: true },
    { soal_id: 47, option_value: '1/3', is_correct: false },
    { soal_id: 47, option_value: '1/6', is_correct: false },
    { soal_id: 47, option_value: '2/3', is_correct: false },

    // 48. Peluang bola merah = 5 / (5+3) = 5/8
    { soal_id: 48, option_value: '5/8', is_correct: true },
    { soal_id: 48, option_value: '3/8', is_correct: false },
    { soal_id: 48, option_value: '5/3', is_correct: false },
    { soal_id: 48, option_value: '1/2', is_correct: false },

    // 49. Peluang muncul gambar pada koin = 1/2
    { soal_id: 49, option_value: '1/2', is_correct: true },
    { soal_id: 49, option_value: '1/4', is_correct: false },
    { soal_id: 49, option_value: '1', is_correct: false },
    { soal_id: 49, option_value: '0', is_correct: false },

    // 50. f(x) = -x² + 4x + 1 => Maksimum di x = -b/(2a) = 2 => f(2) = -4 + 8 + 1 = 5
    { soal_id: 50, option_value: '5', is_correct: true },
    { soal_id: 50, option_value: '4', is_correct: false },
    { soal_id: 50, option_value: '1', is_correct: false },
    { soal_id: 50, option_value: '9', is_correct: false },

    // SOAL PPKN (51 - 100)

    // 51. Sila 1 dilambangkan dengan...
    { soal_id: 51, option_value: 'Bintang', is_correct: true },
    { soal_id: 51, option_value: 'Rantai', is_correct: false },
    { soal_id: 51, option_value: 'Pohon Beringin', is_correct: false },
    { soal_id: 51, option_value: 'Kepala Banteng', is_correct: false },

    // 52. Nilai utama sila ketiga...
    { soal_id: 52, option_value: 'Persatuan dan kesatuan bangsa', is_correct: true },
    { soal_id: 52, option_value: 'Keadilan sosial', is_correct: false },
    { soal_id: 52, option_value: 'Toleransi beragama', is_correct: false },
    { soal_id: 52, option_value: 'Musyawarah mufakat', is_correct: false },

    // 53. Pancasila di Pembukaan UUD 1945 alinea ke...
    { soal_id: 53, option_value: '4', is_correct: true },
    { soal_id: 53, option_value: '1', is_correct: false },
    { soal_id: 53, option_value: '2', is_correct: false },
    { soal_id: 53, option_value: '3', is_correct: false },

    // 54. Penerapan sila kedua...
    { soal_id: 54, option_value: 'Menghargai hak asasi dan memperlakukan sesama secara adil', is_correct: true },
    { soal_id: 54, option_value: 'Beribadah tepat waktu', is_correct: false },
    { soal_id: 54, option_value: 'Ikut serta dalam pemilu', is_correct: false },
    { soal_id: 54, option_value: 'Membeli produk lokal', is_correct: false },

    // 55. Musyawarah mufakat sila ke...
    { soal_id: 55, option_value: '4', is_correct: true },
    { soal_id: 55, option_value: '2', is_correct: false },
    { soal_id: 55, option_value: '3', is_correct: false },
    { soal_id: 55, option_value: '5', is_correct: false },

    // 56. Rumusan Pancasila sah dan resmi tercantum di...
    { soal_id: 56, option_value: 'Pembukaan UUD 1945', is_correct: true },
    { soal_id: 56, option_value: 'Piagam Jakarta', is_correct: false },
    { soal_id: 56, option_value: 'Batang Tubuh UUD 1945', is_correct: false },
    { soal_id: 56, option_value: 'Ketetapan MPR', is_correct: false },

    // 57. Gagasan 1 Juni 1945...
    { soal_id: 57, option_value: 'Ir. Soekarno', is_correct: true },
    { soal_id: 57, option_value: 'Mr. Muhammad Yamin', is_correct: false },
    { soal_id: 57, option_value: 'Dr. Soepomo', is_correct: false },
    { soal_id: 57, option_value: 'Drs. Mohammad Hatta', is_correct: false },

    // 58. Sila kelima dilambangkan...
    { soal_id: 58, option_value: 'Padi dan Kapas', is_correct: true },
    { soal_id: 58, option_value: 'Rantai', is_correct: false },
    { soal_id: 58, option_value: 'Bintang', is_correct: false },
    { soal_id: 58, option_value: 'Pohon Beringin', is_correct: false },

    // 59. Pandangan hidup mengandung arti...
    { soal_id: 59, option_value: 'Petunjuk arah dan pedoman dalam kehidupan sehari-hari', is_correct: true },
    { soal_id: 59, option_value: 'Aturan hukum tertulis tertinggi negara', is_correct: false },
    { soal_id: 59, option_value: 'Simbol kedaulatan di mata dunia', is_correct: false },
    { soal_id: 59, option_value: 'Syarat mutlak pembentukan organisasi', is_correct: false },

    // 60. HAM dalam Pancasila dijamin berdasarkan prinsip...
    { soal_id: 60, option_value: 'Keseimbangan antara hak dan kewajiban', is_correct: true },
    { soal_id: 60, option_value: 'Kebebasan mutlak individu', is_correct: false },
    { soal_id: 60, option_value: 'Pengutamaan hak negara di atas individu', is_correct: false },
    { soal_id: 60, option_value: 'Keadilan sepihak', is_correct: false },

    // 61. Toleransi antarumat beragama...
    { soal_id: 61, option_value: '1', is_correct: true },
    { soal_id: 61, option_value: '2', is_correct: false },
    { soal_id: 61, option_value: '3', is_correct: false },
    { soal_id: 61, option_value: '5', is_correct: false },

    // 62. Gotong royong sesuai sila ke...
    { soal_id: 62, option_value: '5', is_correct: true },
    { soal_id: 62, option_value: '1', is_correct: false },
    { soal_id: 62, option_value: '2', is_correct: false },
    { soal_id: 62, option_value: '4', is_correct: false },

    // 63. Lembaga berwenang mengubah UUD...
    { soal_id: 63, option_value: 'Majelis Permusyawaratan Rakyat (MPR)', is_correct: true },
    { soal_id: 63, option_value: 'Dewan Perwakilan Rakyat (DPR)', is_correct: false },
    { soal_id: 63, option_value: 'Presiden', is_correct: false },
    { soal_id: 63, option_value: 'Mahkamah Konstitusi (MK)', is_correct: false },

    // 64. Makna Bhinneka Tunggal Ika...
    { soal_id: 64, option_value: 'Berbeda-beda tetapi tetap satu jua', is_correct: true },
    { soal_id: 64, option_value: 'Bersatu kita teguh bercerai kita runtuh', is_correct: false },
    { soal_id: 64, option_value: 'Berbeda-beda untuk saling mengalahkan', is_correct: false },
    { soal_id: 64, option_value: 'Satu bangsa tanpa perbedaan', is_correct: false },

    // 65. Persamaan derajat hak dan kewajiban...
    { soal_id: 65, option_value: '2', is_correct: true },
    { soal_id: 65, option_value: '1', is_correct: false },
    { soal_id: 65, option_value: '3', is_correct: false },
    { soal_id: 65, option_value: '4', is_correct: false },

    // 66. Ideologi terbuka berarti...
    { soal_id: 66, option_value: 'Dapat menyesuaikan diri dengan perkembangan zaman tanpa mengubah nilai dasarnya', is_correct: true },
    { soal_id: 66, option_value: 'Dapat diganti kapan saja oleh rakyat', is_correct: false },
    { soal_id: 66, option_value: 'Mengikuti seluruh ideologi asing', is_correct: false },
    { soal_id: 66, option_value: 'Bebas dari segala bentuk aturan hukum', is_correct: false },

    // 67. 1 Juni diperingati sebagai...
    { soal_id: 67, option_value: 'Hari Lahir Pancasila', is_correct: true },
    { soal_id: 67, option_value: 'Hari Kesaktian Pancasila', is_correct: false },
    { soal_id: 67, option_value: 'Hari Kemerdekaan RI', is_correct: false },
    { soal_id: 67, option_value: 'Hari Sumpah Pemuda', is_correct: false },

    // 68. BPUPKI dibentuk tanggal...
    { soal_id: 68, option_value: '1 Maret 1945', is_correct: true },
    { soal_id: 68, option_value: '29 Mei 1945', is_correct: false },
    { soal_id: 68, option_value: '17 Agustus 1945', is_correct: false },
    { soal_id: 68, option_value: '22 Juni 1945', is_correct: false },

    // 69. Ketua BPUPKI...
    { soal_id: 69, option_value: 'Dr. K.R.T. Radjiman Wedyodiningrat', is_correct: true },
    { soal_id: 69, option_value: 'Ir. Soekarno', is_correct: false },
    { soal_id: 69, option_value: 'Drs. Mohammad Hatta', is_correct: false },
    { soal_id: 69, option_value: 'RP Soeroso', is_correct: false },

    // 70. Dokumen Panitia Sembilan...
    { soal_id: 70, option_value: 'Piagam Jakarta (Jakarta Charter)', is_correct: true },
    { soal_id: 70, option_value: 'Teks Proklamasi', is_correct: false },
    { soal_id: 70, option_value: 'Dekrit Presiden', is_correct: false },
    { soal_id: 70, option_value: 'Sumpah Pemuda', is_correct: false },

    // 71. Sila 4 menekankan keputusan melalui...
    { soal_id: 71, option_value: 'Musyawarah untuk mufakat', is_correct: true },
    { soal_id: 71, option_value: 'Voting terbanyak semata', is_correct: false },
    { soal_id: 71, option_value: 'Keputusan pemimpin tertinggi', is_correct: false },
    { soal_id: 71, option_value: 'Pendapat kelompok mayoritas', is_correct: false },

    // 72. Kelestarian lingkungan sesuai sila ke...
    { soal_id: 72, option_value: '5', is_correct: true },
    { soal_id: 72, option_value: '1', is_correct: false },
    { soal_id: 72, option_value: '3', is_correct: false },
    { soal_id: 72, option_value: '4', is_correct: false },

    // 73. Cinta tanah air sila ke...
    { soal_id: 73, option_value: '3', is_correct: true },
    { soal_id: 73, option_value: '1', is_correct: false },
    { soal_id: 73, option_value: '2', is_correct: false },
    { soal_id: 73, option_value: '5', is_correct: false },

    // 74. Sumber dari segala sumber hukum...
    { soal_id: 74, option_value: 'Semua peraturan perundang-undangan tidak boleh bertentangan dengan Pancasila', is_correct: true },
    { soal_id: 74, option_value: 'Pancasila adalah satu-satunya hukum tertulis di Indonesia', is_correct: false },
    { soal_id: 74, option_value: 'Hukum internasional tidak berlaku di Indonesia', is_correct: false },
    { soal_id: 74, option_value: 'Pancasila dibuat oleh lembaga kehakiman', is_correct: false },

    // 75. Norma dari kebiasaan masyarakat...
    { soal_id: 75, option_value: 'Norma Kesopanan / Adat', is_correct: true },
    { soal_id: 75, option_value: 'Norma Hukum', is_correct: false },
    { soal_id: 75, option_value: 'Norma Agama', is_correct: false },
    { soal_id: 75, option_value: 'Norma Kesusilaan', is_correct: false },

    // 76. Contoh hak warga negara...
    { soal_id: 76, option_value: 'Mendapatkan pendidikan yang layak', is_correct: true },
    { soal_id: 76, option_value: 'Membayar pajak tepat waktu', is_correct: false },
    { soal_id: 76, option_value: 'Mentaati rambu lalu lintas', is_correct: false },
    { soal_id: 76, option_value: 'Menjaga keamanan lingkungan', is_correct: false },

    // 77. Kewajiban bela negara diatur dalam Pasal...
    { soal_id: 77, option_value: '27 Ayat 3 dan Pasal 30 Ayat 1', is_correct: true },
    { soal_id: 77, option_value: 'Pasal 28A', is_correct: false },
    { soal_id: 77, option_value: 'Pasal 29 Ayat 2', is_correct: false },
    { soal_id: 77, option_value: 'Pasal 31 Ayat 1', is_correct: false },

    // 78. Pita cengkeraman Garuda bertuliskan...
    { soal_id: 78, option_value: 'Bhinneka Tunggal Ika', is_correct: true },
    { soal_id: 78, option_value: 'Pancasila Sakti', is_correct: false },
    { soal_id: 78, option_value: 'Indonesia Raya', is_correct: false },
    { soal_id: 78, option_value: 'Tut Wuri Handayani', is_correct: false },

    // 79. Jumlah bulu leher Garuda...
    { soal_id: 79, option_value: '45', is_correct: true },
    { soal_id: 79, option_value: '17', is_correct: false },
    { soal_id: 79, option_value: '8', is_correct: false },
    { soal_id: 79, option_value: '19', is_correct: false },

    // 80. Tanggal proklamasi...
    { soal_id: 80, option_value: '17 Agustus', is_correct: true },
    { soal_id: 80, option_value: '1 Juni', is_correct: false },
    { soal_id: 80, option_value: '28 Oktober', is_correct: false },
    { soal_id: 80, option_value: '10 November', is_correct: false },

    // 81. Kepatuhan hukum di sekolah...
    { soal_id: 81, option_value: 'Mentaati tata tertib dan seragam sekolah', is_correct: true },
    { soal_id: 81, option_value: 'Membayar pajak kendaraan', is_correct: false },
    { soal_id: 81, option_value: 'Ikut ronda malam lingkungan', is_correct: false },
    { soal_id: 81, option_value: 'Memiliki SIM saat berkendara', is_correct: false },

    // 82. Tidak membeda-bedakan teman...
    { soal_id: 82, option_value: '3', is_correct: true },
    { soal_id: 82, option_value: '1', is_correct: false },
    { soal_id: 82, option_value: '4', is_correct: false },
    { soal_id: 82, option_value: '5', is_correct: false },

    // 83. Badan pengganti BPUPKI...
    { soal_id: 83, option_value: 'PPKI', is_correct: true },
    { soal_id: 83, option_value: 'Panitia Sembilan', is_correct: false },
    { soal_id: 83, option_value: 'KNIP', is_correct: false },
    { soal_id: 83, option_value: 'TNI', is_correct: false },

    // 84. Piagam Jakarta dirumuskan pada...
    { soal_id: 84, option_value: '22 Juni 1945', is_correct: true },
    { soal_id: 84, option_value: '17 Agustus 1945', is_correct: false },
    { soal_id: 84, option_value: '18 Agustus 1945', is_correct: false },
    { soal_id: 84, option_value: '1 Juni 1945', is_correct: false },

    // 85. Perubahan sila ke-1 Piagam Jakarta demi menjaga...
    { soal_id: 85, option_value: 'Persatuan dan kesatuan bangsa Indonesia', is_correct: true },
    { soal_id: 85, option_value: 'Hubungan dengan pemerintah Jepang', is_correct: false },
    { soal_id: 85, option_value: 'Kemenangan perang Pasifik', is_correct: false },
    { soal_id: 85, option_value: 'Kepentingan kelompok mayoritas semata', is_correct: false },

    // 86. Landasan hukum hak dan kewajiban warga negara...
    { soal_id: 86, option_value: 'UUD NRI Tahun 1945', is_correct: true },
    { soal_id: 86, option_value: 'Peraturan Daerah', is_correct: false },
    { soal_id: 86, option_value: 'Hukum Adat', is_correct: false },
    { soal_id: 86, option_value: 'Konvensi Internasional', is_correct: false },

    // 87. Kedaulatan rakyat menyatakan kekuasaan tertinggi di tangan...
    { soal_id: 87, option_value: 'Rakyat', is_correct: true },
    { soal_id: 87, option_value: 'Presiden', is_correct: false },
    { soal_id: 87, option_value: 'DPR', is_correct: false },
    { soal_id: 87, option_value: 'TNI/Polri', is_correct: false },

    // 88. Nilai praksis adalah perwujudan dalam...
    { soal_id: 88, option_value: 'Pengamalan nyata dalam kehidupan sehari-hari', is_correct: true },
    { soal_id: 88, option_value: 'Naskah teks UUD saja', is_correct: false },
    { soal_id: 88, option_value: 'Sumpah jabatan pejabat negara', is_correct: false },
    { soal_id: 88, option_value: 'Wacana dan teori politik', is_correct: false },

    // 89. Mencegah pelanggaran HAM di masyarakat...
    { soal_id: 89, option_value: 'Meningkatkan sikap saling menghormati dan toleransi antarwarga', is_correct: true },
    { soal_id: 89, option_value: 'Main hakim sendiri terhadap pelaku kejahatan', is_correct: false },
    { soal_id: 89, option_value: 'Acuh tak acuh terhadap lingkungan sekitar', is_correct: false },
    { soal_id: 89, option_value: 'Membatasi kebebasan berpendapat secara sepihak', is_correct: false },

    // 90. Bentuk negara Indonesia Pasal 1 Ayat 1...
    { soal_id: 90, option_value: 'Negara Kesatuan yang berbentuk Republik', is_correct: true },
    { soal_id: 90, option_value: 'Negara Serikat / Federasi', is_correct: false },
    { soal_id: 90, option_value: 'Negara Monarki Tradisional', is_correct: false },
    { soal_id: 90, option_value: 'Negara Konfederasi', is_correct: false },

    // 91. Lembaga pengawas pelaksanaan UU...
    { soal_id: 91, option_value: 'DPR', is_correct: true },
    { soal_id: 91, option_value: 'MA', is_correct: false },
    { soal_id: 91, option_value: 'KPU', is_correct: false },
    { soal_id: 91, option_value: 'BPK', is_correct: false },

    // 92. Menghargai hasil karya orang lain sila ke...
    { soal_id: 92, option_value: '5', is_correct: true },
    { soal_id: 92, option_value: '1', is_correct: false },
    { soal_id: 92, option_value: '2', is_correct: false },
    { soal_id: 92, option_value: '3', is_correct: false },

    // 93. Sistem pemerintahan Indonesia...
    { soal_id: 93, option_value: 'Presidensial', is_correct: true },
    { soal_id: 93, option_value: 'Parlementer', is_correct: false },
    { soal_id: 93, option_value: 'Monarki Absolut', is_correct: false },
    { soal_id: 93, option_value: 'Semi-Parlementer', is_correct: false },

    // 94. Perwujudan Pancasila di bidang ekonomi...
    { soal_id: 94, option_value: 'Pengembangan ekonomi berbasis koperasi dan kekeluargaan', is_correct: true },
    { soal_id: 94, option_value: 'Sistem ekonomi kapitalis bebas', is_correct: false },
    { soal_id: 94, option_value: 'Monopoli pasar oleh perusahaan asing', is_correct: false },
    { soal_id: 94, option_value: 'Sistem eksploitasi sumber daya tanpa batas', is_correct: false },

    // 95. Cinta produk dalam negeri sila ke...
    { soal_id: 95, option_value: '3', is_correct: true },
    { soal_id: 95, option_value: '1', is_correct: false },
    { soal_id: 95, option_value: '2', is_correct: false },
    { soal_id: 95, option_value: '4', is_correct: false },

    // 96. Wawasan Nusantara adalah cara pandang tentang...
    { soal_id: 96, option_value: 'Diri dan lingkungan bangsa Indonesia dalam mencapai tujuan nasional', is_correct: true },
    { soal_id: 96, option_value: 'Peta geografi wilayah luar negeri', is_correct: false },
    { soal_id: 96, option_value: 'Strategi perang antarnegara', is_correct: false },
    { soal_id: 96, option_value: 'Sistem perdagangan internasional', is_correct: false },

    // 97. Keadilan sosial bertujuan mewujudkan...
    { soal_id: 97, option_value: 'Kesejahteraan bagi seluruh rakyat Indonesia', is_correct: true },
    { soal_id: 97, option_value: 'Keuntungan bagi pemilik modal besar', is_correct: false },
    { soal_id: 97, option_value: 'Pusat kekayaan hanya di kota-kota besar', is_correct: false },
    { soal_id: 97, option_value: 'Kebebasan pasar tanpa campur tangan negara', is_correct: false },

    // 98. Menghormati pendapat saat berdiskusi sila ke...
    { soal_id: 98, option_value: '4', is_correct: true },
    { soal_id: 98, option_value: '1', is_correct: false },
    { soal_id: 98, option_value: '2', is_correct: false },
    { soal_id: 98, option_value: '3', is_correct: false },

    // 99. Pekerjaan dan penghidupan layak diatur Pasal...
    { soal_id: 99, option_value: '27 Ayat 2', is_correct: true },
    { soal_id: 99, option_value: '29 Ayat 1', is_correct: false },
    { soal_id: 99, option_value: '30 Ayat 2', is_correct: false },
    { soal_id: 99, option_value: '33 Ayat 1', is_correct: false },

    // 100. Menjaga persatuan di tengah keragaman adalah kewajiban...
    { soal_id: 100, option_value: 'Seluruh warga negara Indonesia', is_correct: true },
    { soal_id: 100, option_value: 'Pemerintah saja', is_correct: false },
    { soal_id: 100, option_value: 'TNI dan Polri saja', is_correct: false },
    { soal_id: 100, option_value: 'Tokoh agama dan adat saja', is_correct: false },
  ]);
};
