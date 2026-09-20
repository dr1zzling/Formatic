/**
 * DIAGNOSTIC SCRIPT — READ-ONLY. Tidak mengubah data apapun.
 * Hanya SELECT + bcrypt.compare (read-only operation).
 * Hapus file ini setelah diagnosis selesai.
 */
require("dotenv").config()
const { Pool } = require("pg")
const bcrypt = require("bcrypt")

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    port: Number(process.env.DB_PORT) || 6543,
    connectionTimeoutMillis: 8000
})

async function run() {
    let client
    try {
        client = await pool.connect()
        console.log("[OK] Koneksi berhasil")
        console.log("     host     :", process.env.DB_HOST)
        console.log("     database :", process.env.DB_NAME)
        console.log("     port     :", process.env.DB_PORT)
        console.log("     user     :", process.env.DB_USER)
    } catch (err) {
        console.error("[FAIL] Koneksi GAGAL:", err.message)
        await pool.end()
        process.exit(1)
    }

    try {
        // ── 1. Pastikan tabel users ada ─────────────────────────────────────
        const tableCheck = await client.query(
            `SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'users'`
        )
        if (tableCheck.rows.length === 0) {
            console.log("\n[FAIL] Tabel 'users' TIDAK ADA di schema public pada database ini")
            return
        }
        console.log("\n[OK]   Tabel 'users' ada di schema public")

        // ── 2. Hitung total user ─────────────────────────────────────────────
        const countRes = await client.query(`SELECT COUNT(*)::int AS total FROM users`)
        console.log("[INFO] Total baris di tabel users:", countRes.rows[0].total)

        // ── 3. Cari nextherin ────────────────────────────────────────────────
        // Ambil hash penuh hanya untuk keperluan compare, TIDAK ditampilkan
        const userRes = await client.query(
            `SELECT id, username, password,
                    LENGTH(password)            AS hash_len,
                    SUBSTRING(password, 1, 4)   AS hash_algo   -- misal $2b$ atau $2a$
             FROM users
             WHERE username = $1`,
            ["nextherin"]
        )

        if (userRes.rows.length === 0) {
            console.log("\n[RESULT] username 'nextherin' : TIDAK DITEMUKAN")
            console.log("\n[INFO] Daftar username yang ada (maks 20, tanpa password):")
            const listRes = await client.query(
                `SELECT id, username FROM users ORDER BY id LIMIT 20`
            )
            if (listRes.rows.length === 0) {
                console.log("         (tabel kosong — belum ada user sama sekali)")
            } else {
                listRes.rows.forEach(u =>
                    console.log(`         id=${String(u.id).padEnd(5)} username=${u.username}`)
                )
            }
            return
        }

        const row = userRes.rows[0]
        const storedHash = row.password   // digunakan untuk compare, tidak ditampilkan

        console.log("\n[RESULT] username 'nextherin' : DITEMUKAN")
        console.log(`         id         : ${row.id}`)
        console.log(`         hash_len   : ${row.hash_len} chars`)
        console.log(`         hash_algo  : ${row.hash_algo}...  (4 char pertama — cukup untuk identifikasi format)`)

        const isValidBcrypt = row.hash_algo === "$2b$" || row.hash_algo === "$2a$"
        console.log(`         format ok  : ${isValidBcrypt
            ? "Ya — hash berformat bcrypt ($2b$/$2a$)"
            : "TIDAK — hash bukan bcrypt, ini bisa jadi plain text atau MD5/SHA"
        }`)

        // ── 4. bcrypt.compare dengan password yang diuji ────────────────────
        // Tidak ada nilai hash yang ditampilkan ke output
        const testPwd = "12345678"
        console.log(`\n[BCRYPT] Menguji compare("${testPwd}", <hash tidak ditampilkan>)...`)

        let isMatch = false
        let compareError = null
        try {
            isMatch = await bcrypt.compare(testPwd, storedHash)
        } catch (e) {
            compareError = e.message
        }

        if (compareError) {
            console.log("[BCRYPT] compare() THROW ERROR:", compareError)
            console.log("         → Hash mungkin corrupt atau bukan format bcrypt valid")
        } else {
            console.log(`[BCRYPT] isMatch = ${isMatch}`)
            if (isMatch) {
                console.log("         → Password '12345678' COCOK dengan hash di database")
                console.log("         → Jika login masih 401, ada masalah lain (middleware, cache, env lama)")
            } else {
                console.log("         → Password '12345678' TIDAK COCOK dengan hash di database")
                console.log("         → User 'nextherin' terdaftar dengan password yang berbeda")
            }
        }

        // ── 5. Cek apakah mungkin password di-hash dua kali ─────────────────
        // Beberapa bug menyebabkan hash di-hash lagi saat update
        // Tidak ada data yang diubah — hanya pengujian compare read-only
        console.log("\n[INFO] Mengecek kemungkinan double-hash (bcrypt dari bcrypt)...")
        // Jika hash_len > 75, kemungkinan adalah bcrypt normal (~60 char)
        // Jika hash_len < 30, kemungkinan plain text atau MD5
        const hashLen = Number(row.hash_len)
        if (hashLen >= 58 && hashLen <= 61) {
            console.log(`         hash_len ${hashLen} — tampak normal (bcrypt menghasilkan 60 char)`)
        } else if (hashLen > 61) {
            console.log(`         hash_len ${hashLen} — lebih panjang dari normal, kemungkinan ada padding atau double encoding`)
        } else {
            console.log(`         hash_len ${hashLen} — terlalu pendek untuk bcrypt, kemungkinan plain text atau hash lain`)
        }

    } catch (err) {
        console.error("[ERROR]", err.message)
    } finally {
        client.release()
        await pool.end()
        console.log("\n[DONE] Koneksi ditutup.")
    }
}

run()
