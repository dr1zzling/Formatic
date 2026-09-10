const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const express = require("express");

const app = express();
const PORT = 3001;

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Formatic Form API",
            version: "1.0.0",
            description: "API documentation for Formatic Form and Soal Service",
        },

        servers: [
            {
                url: "http://localhost:5000",
                description: "Local Development Server",
            },
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Masukkan JWT token",
                },
            },

            schemas: {

                // FORM

                Form: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1,
                        },
                        title: {
                            type: "string",
                            example: "Ujian Pemrograman",
                        },
                        slug: {
                            type: "string",
                            example: "ujian-pemrograman-1753850000000",
                        },
                        status: {
                            type: "string",
                            enum: ["public", "private"],
                            example: "private",
                        },
                        category: {
                            type: "string",
                            example: "ujian",
                        },
                        banner: {
                            type: "string",
                            example: "/uploads/banner-1753850000-123456789.png",
                        },
                    },
                },

                CreateFormResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Berhasil Membuat Form",
                        },
                        data: {
                            type: "object",
                            properties: {
                                user: {
                                    type: "object",
                                    properties: {
                                        user_id: {
                                            type: "integer",
                                            example: 1,
                                        },
                                        username: {
                                            type: "string",
                                            example: "fanny",
                                        },
                                        access_type: {
                                            type: "string",
                                            example: "Creator",
                                        },
                                    },
                                },
                                form: {
                                    type: "object",
                                    properties: {
                                        form_id: {
                                            type: "integer",
                                            example: 10,
                                        },
                                        form_title: {
                                            type: "string",
                                            example: "Ujian Pemrograman",
                                        },
                                        form_slug: {
                                            type: "string",
                                            example: "ujian-pemrograman-1753850000000",
                                        },
                                        form_status: {
                                            type: "string",
                                            example: "private",
                                        },
                                        form_banner: {
                                            type: "string",
                                            example: "/uploads/banner-1753850000-123456789.png",
                                        },
                                        category: {
                                            type: "string",
                                            example: "ujian",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },

                // SOAL

                SoalOption: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1,
                        },
                        option_value_id: {
                            type: "integer",
                            example: 1,
                        },
                        option_value: {
                            type: "string",
                            example: "A",
                        },
                        is_correct: {
                            type: "boolean",
                            example: true,
                        },
                    },
                },

                Soal: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1,
                        },
                        question: {
                            type: "string",
                            example: "Apa kepanjangan dari HTML?",
                        },
                        type: {
                            type: "string",
                            example: "radio",
                        },
                        options: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/SoalOption",
                            },
                        },
                    },
                },

                CreateSoal: {
                    type: "object",
                    properties: {
                        soal: {
                            type: "object",
                            properties: {
                                question: {
                                    type: "string",
                                    example: "Apa kepanjangan dari HTML?",
                                },
                                type: {
                                    type: "string",
                                    enum: [
                                        "radio",
                                        "checkbox",
                                        "rating",
                                        "text",
                                        "file",
                                    ],
                                    example: "radio",
                                },
                            },
                            required: ["question", "type"],
                        },

                        options: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    value: {
                                        type: "string",
                                        example: "Hyper Text Markup Language",
                                    },
                                    is_correct: {
                                        type: "boolean",
                                        example: true,
                                    },
                                },
                                required: ["value"],
                            },
                        },
                    },
                    required: ["soal"],
                },
            },
        },
    },

    apis: [],
};

const swaggerSpec = swaggerJsdoc(options);


// GET ALL FORM


swaggerSpec.paths = {

    "/form": {
        get: {
            tags: ["Form"],
            summary: "Mendapatkan seluruh form",
            description: "Mengambil maksimal 20 form.",
            responses: {
                200: {
                    description: "Berhasil mendapatkan seluruh form",
                },
                404: {
                    description: "Tidak ada form",
                },
            },
        },

        post: {
            tags: ["Form"],
            summary: "Membuat form baru",
            description:
                "Membuat form baru dengan banner image. Endpoint ini membutuhkan JWT dan menggunakan multipart/form-data.",

            security: [
                {
                    bearerAuth: [],
                },
            ],

            requestBody: {
                required: true,
                content: {
                    "multipart/form-data": {
                        schema: {
                            type: "object",
                            required: ["title", "category", "banner"],
                            properties: {
                                title: {
                                    type: "string",
                                    example: "Ujian Pemrograman",
                                },
                                category: {
                                    type: "string",
                                    example: "ujian",
                                },
                                banner: {
                                    type: "string",
                                    format: "binary",
                                },
                            },
                        },
                    },
                },
            },

            responses: {
                201: {
                    description: "Berhasil membuat form",
                },
                400: {
                    description: "Judul dan kategori wajib diisi",
                },
                401: {
                    description: "Unauthorized",
                },
            },
        },

        patch: {
            tags: ["Form"],
            summary: "Mengubah status form",
            description: "Mengubah status form menjadi public atau private.",

            security: [
                {
                    bearerAuth: [],
                },
            ],

            parameters: [
                {
                    name: "form_slug",
                    in: "query",
                    required: true,
                    description: "Slug form yang ingin diubah",
                    schema: {
                        type: "string",
                    },
                    example: "ujian-pemrograman-1753850000000",
                },
            ],

            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            required: ["status"],
                            properties: {
                                status: {
                                    type: "string",
                                    enum: ["public", "private"],
                                    example: "public",
                                },
                            },
                        },
                    },
                },
            },

            responses: {
                200: {
                    description: "Berhasil mengubah status",
                },
                400: {
                    description: "Status tidak valid",
                },
                401: {
                    description: "Unauthorized",
                },
            },
        },

        delete: {
            tags: ["Form"],
            summary: "Menghapus form",

            security: [
                {
                    bearerAuth: [],
                },
            ],

            parameters: [
                {
                    name: "form_slug",
                    in: "query",
                    required: true,
                    description: "Slug form yang ingin dihapus",
                    schema: {
                        type: "string",
                    },
                    example: "ujian-pemrograman-1753850000000",
                },
            ],

            responses: {
                200: {
                    description: "Berhasil menghapus form",
                },
                401: {
                    description: "Unauthorized",
                },
            },
        },
    },

    // GET FORM BY CATEGORY

    "/form/category": {
        get: {
            tags: ["Form"],
            summary: "Mendapatkan form berdasarkan kategori",

            parameters: [
                {
                    name: "category",
                    in: "query",
                    required: true,
                    description: "Kategori form",
                    schema: {
                        type: "string",
                    },
                    example: "ujian",
                },
            ],

            responses: {
                200: {
                    description: "Berhasil mendapatkan form berdasarkan kategori",
                },
                404: {
                    description: "Tidak ada form dari kategori tersebut",
                },
            },
        },
    },

    // GET FORM BY SLUG

    "/form/slug/": {
        get: {
            tags: ["Form"],
            summary: "Mendapatkan form berdasarkan slug",

            parameters: [
                {
                    name: "slug",
                    in: "query",
                    required: true,
                    description: "Slug form",
                    schema: {
                        type: "string",
                    },
                    example: "ujian-pemrograman-1753850000000",
                },
            ],

            responses: {
                200: {
                    description: "Berhasil mendapatkan form",
                },
                404: {
                    description: "Form tidak ditemukan",
                },
            },
        },
    },

    // GET MY FORM

    "/form/user": {
        get: {
            tags: ["Form"],
            summary: "Mendapatkan form yang user terlibat",

            security: [
                {
                    bearerAuth: [],
                },
            ],

            responses: {
                200: {
                    description: "Berhasil mendapatkan form yang user terlibat",
                },
                401: {
                    description: "Unauthorized",
                },
            },
        },
    },
};


// SWAGGER SERVER


app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.get("/", (req, res) => {
    res.redirect("/api-docs");
});

app.listen(PORT, () => {
    console.log(`Swagger berjalan di http://localhost:${PORT}/api-docs`);
});