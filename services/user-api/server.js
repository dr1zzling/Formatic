require("dotenv").config()
const express = require("express")
const app = express()
const jwt = require("jsonwebtoken")
const port = process.env.APP_PORT
const cors = require("cors")
const { pool } = require("./db")
const bcrypt = require("bcrypt")
const pLimit = require("p-limit")

const limit = pLimit(10)

app.use(express.json())
app.use(cors())

function jwtToken(payload){
    return jwt.sign(payload, process.env.SECRET, { expiresIn: '365d'})
}

async function queryWithLimit(text, params) {
    return limit(() => pool.query(text, params))
}

async function userExist(username){
    try {
        const get = await queryWithLimit(
            `SELECT id, username, password FROM users WHERE username = $1`, 
            [username]
        )
        
        if (get.rows.length === 0) return null
        return get.rows[0]
    } catch(err) {
        console.error('userExist error:', err.message)
        return null  // fix: return null bukan object saat error
    }
}

// Register
app.post('/user/register', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({
                status: 400,
                message: "Isi Dengan Benar"
            })
        }

        const exist = await userExist(username)
        if (exist) {
            return res.status(409).json({
                status: 409,
                message: "Username Sudah Ada"
            })
        }

        const hashPassword = await bcrypt.hash(password, 10)
        
        // Gunakan queryWithLimit
        const register = await queryWithLimit(
            `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id`, 
            [username, hashPassword]
        )

        const getId = register.rows[0].id

        const get = await queryWithLimit(
            `SELECT id, username FROM users WHERE id = $1`, 
            [getId]
        )

        const token = jwtToken(get.rows[0])

        return res.status(201).json({
            status: 201,
            message: "Berhasil Register Akun",
            token: token
        })
    }
    catch (err) {
        return res.status(500).json({
            status: 500,
            message: "Error",
            Error: err.message,
            Stack: err.stack
        })
    }
})

// Login
app.post('/user/login', async (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({
                status: 400,
                message: "Isi Dengan Benar"
            })
        }

        const exist = await userExist(username)
        if (!exist) {
            return res.status(401).json({
                status: 401,
                message: "Username atau password salah",
            })
        }

        const isMatch = await bcrypt.compare(password, exist.password)
        if (!isMatch) {
            return res.status(401).json({
                status: 401,
                message: "Username atau password salah"
            })
        }

        const token = jwtToken({ id: exist.id, username: exist.username })

        return res.status(200).json({
            status: 200,
            message: "Berhasil Login",
            token: token
        })
    }
    catch (err) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: err.message,
            stack: err.stack
        })
    }
})

// Forgot Password
app.put('/user/forgot-password', async (req, res) => {
    try {
        const { username, password } = req.body
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
                message: "User Tidak Ada",
            })
        }

        const hashPassword = await bcrypt.hash(password, 10)

        // Gunakan queryWithLimit
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
            message: "Internal Server Error",
            error: err.message,
            stack: err.stack
        })
    }
})

app.listen(port, () => console.log(`server berhasil berjalan di port ${port}`))