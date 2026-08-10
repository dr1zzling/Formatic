const express = require("express")
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./swagger")

const app = express()

app.get("/swagger.json", (req, res) => {
    res.json(swaggerSpec)
})

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
        swaggerOptions: {
            url: "/swagger.json"
        }
    })
)

app.listen(3001, () => {
    console.log("Swagger berjalan di http://localhost:3001/api-docs")
})