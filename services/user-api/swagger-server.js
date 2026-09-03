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

app.listen(4000, () => {
    console.log("Swagger berjalan di http://localhost:4000/api-docs")
})