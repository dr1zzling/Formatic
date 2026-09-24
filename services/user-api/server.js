require("dotenv").config()
// dotenv overschrijft bestaande process-env vars niet (default). Als de shell
// een lege SECRET="" meeneemt, blijft die leeg en faalt jwtToken() (→ 500 bij
// OTP verify). Verwijder daarom een lege/whitespace SECRET zodat dotenv de
// waarde uit `.env` kan laden. Een niet-lege SECRET blijft onaangeraakt.
if (typeof process.env.SECRET === 'string' && process.env.SECRET.trim() === '') {
    delete process.env.SECRET
    require("dotenv").config()
}
const express = require("express")
const app = express()
const jwt = require("jsonwebtoken")
const port = process.env.APP_PORT || 3000
const cors = require("cors")
const { pool } = require("./db")
const bcrypt = require("bcrypt")
const pLimit = require("p-limit")
const { rateLimit } = require("express-rate-limit")
const { transporter } = require("./smtp")

const limit = pLimit(10)

const otpStorage = new Map()

app.use(express.json())
app.use(cors({
    origin: ["https://formatic.commandspes.tech", "http://localhost:5173", "http://localhost:3000"],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
}))
app.set('trust proxy', 1)

function jwtToken(payload) {
    return jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' })
}

function isPasswordStrong(password) {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    return minLength && hasLowerCase && hasUpperCase && hasNumber
}

async function queryWithLimit(text, params) {
    return limit(() => pool.query(text, params))
}

async function userExist(data) {
    try {
        const get = await pool.query(
            `SELECT id, username, email, password FROM users WHERE username = $1 OR email = $1`,
            [data]
        )
        if (get.rows.length === 0) return null
        return get.rows[0]
    } catch (err) {
        console.error('userExist error:', err.message)
        return null
    }
}

// Register
app.post('/user/register', async (req, res) => {
    try {
        const { username, password, email } = req.body

        if (!username || !password || !email) {
            return res.status(400).json({ 
                status: 400, 
                message: "Semua field (username, password, email) wajib diisi" 
            })
        }

        // PERBAIKAN 1: Cek duplikasi berdasarkan Username ATAU Email secara spesifik
        const checkUsername = await userExist(username)
        if (checkUsername) {
            return res.status(409).json({ 
                status: 409, 
                message: "Username sudah digunakan oleh akun lain" 
            })
        }

        const checkEmail = await userExist(email)
        if (checkEmail) {
            return res.status(409).json({ 
                status: 409, 
                message: "Email sudah terdaftar di sistem" 
            })
        }

        const isSpace = password.trim()
        if (!isPasswordStrong(isSpace)) {
            return res.status(400).json({ 
                status: 400, 
                message: "Password Min 8 Char, 1 Kapital, 1 Lower, 1 Angka" 
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const generateOtp = Math.floor(100000 + Math.random() * 900000)

        otpStorage.set(email, {
            type: 'register',
            username,
            hashedPassword,
            otp: generateOtp.toString(),
            expiresAt: Date.now() + 5 * 60 * 1000
        })

        // PERBAIKAN 2: Desain HTML Email yang lebih bagus & profesional
        const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; padding: 40px 0; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Formatic</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Secure Verification Service</p>
                </div>
                <div style="padding: 35px 30px; color: #334155;">
                    <p style="margin-top: 0; font-size: 16px; font-weight: 600;">Halo,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
                        Kami menerima permintaan untuk verifikasi akun Anda di <b>Formatic</b>. Gunakan kode OTP di bawah ini untuk melanjutkan proses:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; color: #1e293b; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 15px 30px; border-radius: 8px;">
                            ${generateOtp}
                        </span>
                    </div>
                    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                        Kode ini bersifat rahasia dan akan kedaluwarsa dalam waktu <b>5 menit</b>. Jangan berikan kode ini kepada siapa pun.
                    </p>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        &copy; 2026 Formatic. All rights reserved. Pesan ini dikirim secara otomatis, mohon tidak membalas.
                    </p>
                </div>
            </div>
        </div>
        `

        await transporter.sendMail({
            from: '"Formatic Auth" <nabixka05@gmail.com>',
            to: email,
            subject: "🔒 Kode Verifikasi OTP Anda (Formatic)",
            text: `Kode OTP Anda adalah: ${generateOtp}. Berlaku selama 5 menit.`,
            html: htmlTemplate
        })

        return res.status(200).json({
            status: 200,
            message: "OTP berhasil dikirim ke email. Silakan verifikasi."
        })
    } catch (err) {
        return res.status(500).json({ 
            status: 500, 
            message: "Error", error: err.message 
        })
    }
})

// Verify Register
app.post('/user/verify-register', async (req, res) => {
    try {
        const { email, otp } = req.body
        const pendingData = otpStorage.get(email)

        if (!pendingData || pendingData.type !== 'register') {
            return res.status(400).json({ 
                status: 400, 
                message: "Data registrasi tidak ditemukan atau sudah kadaluarsa" 
            })
        }

        if (Date.now() > pendingData.expiresAt) {
            otpStorage.delete(email)
            return res.status(400).json({ 
                status: 400, 
                message: "Kode OTP sudah kadaluarsa" 
            })
        }

        if (pendingData.otp !== otp) {
            return res.status(400).json({ 
                status: 400, 
                message: "Kode OTP Salah! Akun gagal dibuat." 
            })
        }

        const register = await queryWithLimit(
            `INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, username`,
            [email, pendingData.username, pendingData.hashedPassword]
        )

        otpStorage.delete(email)

        const token = jwtToken({ id: register.rows[0].id, username: register.rows[0].username })

        return res.status(201).json({
            status: 201,
            message: "Berhasil Register Akun & Verifikasi",
            token: token
        })
    } catch (err) {
        console.error('[verify-register] error:', err.message)
        return res.status(500).json({ 
            status: 500, 
            message: "Internal Server Error", error: err.message 
        })
    }
})

// Login
app.post('/user/login', async (req, res) => {
    try {
        const { data, password } = req.body
        if (!data || !password) {
            return res.status(400).json({ 
                status: 400, 
                message: "Isi Dengan Benar (Username/Email dan Password)" 
            })
        }

        const exist = await userExist(data)
        if (!exist) {
            return res.status(401).json({ 
                status: 401, 
                message: "Username/Email atau password salah" 
            })
        }

        const isMatch = await bcrypt.compare(password, exist.password)
        if (!isMatch) {
            return res.status(401).json({ 
                status: 401, 
                message: "Username atau password salah" 
            })
        }

        const generateOtp = Math.floor(100000 + Math.random() * 900000)

        otpStorage.set(exist.email, {
            type: 'login',
            userId: exist.id,
            username: exist.username,
            otp: generateOtp.toString(),
            expiresAt: Date.now() + 5 * 60 * 1000
        })

        const htmlLoginTemplate = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; padding: 40px 0; margin: 0;">
            <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Formatic</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Login Security Check</p>
                </div>
                <div style="padding: 35px 30px; color: #334155;">
                    <p style="margin-top: 0; font-size: 16px; font-weight: 600;">Halo, ${exist.username}</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
                        Kami mendeteksi percobaan masuk ke akun Anda. Gunakan kode OTP berikut untuk menyelesaikan login:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; color: #1e293b; font-size: 32px; font-weight: 700; letter-spacing: 6px; padding: 15px 30px; border-radius: 8px;">
                            ${generateOtp}
                        </span>
                    </div>
                    <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 0;">
                        Kode ini berlaku selama <b>5 menit</b>. Jika Anda tidak merasa mencoba login, abaikan pesan ini.
                    </p>
                </div>
                <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        &copy; 2026 Formatic. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
        `

        await transporter.sendMail({
            from: '"Formatic Auth" <nabixka05@gmail.com>',
            to: exist.email,
            subject: "🔑 Kode OTP Login Anda (Formatic)",
            text: `Kode OTP Login Anda adalah: ${generateOtp}`,
            html: htmlLoginTemplate
        })

        return res.status(200).json({
            status: 200,
            message: "Password benar. OTP dikirim ke email untuk verifikasi login.",
            email: exist.email
        })
    } catch (err) {
        return res.status(500).json({ 
            status: 500, 
            message: "Internal Server Error", error: err.message 
        })
    }
})

// VerifyLogin
app.post('/user/verify-login', async (req, res) => {
    try {
        const { email, otp } = req.body
        const pendingData = otpStorage.get(email)

        if (!pendingData || pendingData.type !== 'login') {
            return res.status(400).json({ 
                status: 400, 
                message: "Sesi login tidak ditemukan atau kadaluarsa" 
            })
        }

        if (Date.now() > pendingData.expiresAt) {
            otpStorage.delete(email)
            return res.status(400).json({ 
                status: 400, 
                message: "Kode OTP sudah kadaluarsa" 
            })
        }

        if (pendingData.otp !== otp) {
            return res.status(400).json({ 
                status: 400, 
                message: "Kode OTP Salah!" 
            })
        }

        otpStorage.delete(email)
        const token = jwtToken({ id: pendingData.userId, username: pendingData.username })

        return res.status(200).json({
            status: 200,
            message: "Berhasil Login",
            token: token
        })
    } catch (err) {
        console.error('[verify-login] error:', err.message)
        return res.status(500).json({ 
            status: 500, 
            message: "Internal Server Error", error: err.message 
        })
    }
})

// Forgot Password
// Endpoint digunakan voor TWEE flow:
//  1) forgot-password (reset):  body = { username, password }               (geen current_password)
//  2) change-password (ingelogd): body = { username, password, current_password }
// Als `current_password` meegegeven word, MOET het matchen met de huidige
// password (bcrypt.compare, zelfde mechanisme als login) voordat de nieuwe
// password word opgeslagen.
app.put('/user/forgot-password', async (req, res) => {
    try {
        const { username, password, current_password: currentPassword } = req.body
        if (!username || !password) {
            return res.status(400).json({ 
                status: 400, 
                message: "Isi Yang Benar" 
            })
        }

        const exist = await userExist(username)
        if (!exist) {
            return res.status(404).json({ 
                status: 404, 
                message: "User Tidak Ada" 
            })
        }

        // Change-password flow: verifieer de huidige password echt (bcrypt,
        // geen plaintext vergelijking) voordat er iets word veranderd.
        if (typeof currentPassword === 'string' && currentPassword.length > 0) {
            const isCurrentMatch = await bcrypt.compare(currentPassword, exist.password)
            if (!isCurrentMatch) {
                return res.status(401).json({
                    status: 401,
                    message: "Password Saat Ini Salah"
                })
            }
        }

        const cleanCode = password.trim()
        if (!isPasswordStrong(cleanCode)) {
            return res.status(400).json({ 
                status: 400, 
                message: "Password Min 8 Char, 1 Kapital, 1 Lower" 
            })
        }

        const hashPassword = await bcrypt.hash(password, 10)

        await queryWithLimit(
            `UPDATE users SET password = $1 WHERE username = $2`,
            [hashPassword, username]
        )

        return res.status(200).json({ 
            status: 200, 
            message: "Berhasil Mengubah Password" 
        })
    }
    catch (err) {
        return res.status(500).json({ 
            status: 500, 
            message: "Internal Server Error", error: err.message 
        })
    }
})

app.listen(port, () => console.log(`server berhasil berjalan di port ${port}`))