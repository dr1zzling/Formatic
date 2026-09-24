require("dotenv").config()
const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

transporter.verify((error, success) => {
    if(error){
        console.log("SMTP Connection Error", error)
    }
    else{
        console.log("SMTP Server is ready to make our message")
    }
})

module.exports = { transporter }