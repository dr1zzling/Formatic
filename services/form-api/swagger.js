const swaggerJsdoc = require("swagger-jsdoc")

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Form API",
            version: "1.0.0",
            description: "API untuk mengelola Form, Soal, dan Submit Form"
        },

        servers: [
            {
                url: "http://localhost:3000",
                description: "Local Development Server"
            }
        ],

        tags: [
            {
                name: "Form",
                description: "Endpoint untuk mengelola form"
            },
            {
                name: "Soal",
                description: "Endpoint untuk mengelola soal dan pilihan soal"
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },

            schemas: {
                CreateFormRequest: {
                    type: "object",
                    required: ["title", "category_id"],
                    properties: {
                        title: {
                            type: "string",
                            example: "Form Pendaftaran Siswa"
                        },
                        category_id: {
                            type: "string",
                            example: "1"
                        }
                    }
                },

                FormData: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1
                        },
                        slug: {
                            type: "string",
                            example: "form-pendaftaran-siswa-1750000000000"
                        },
                        title: {
                            type: "string",
                            example: "Form Pendaftaran Siswa"
                        },
                        status: {
                            type: "string",
                            enum: ["public", "private"],
                            example: "private"
                        },
                        category_id: {
                            type: "integer",
                            example: 1
                        }
                    }
                },

                SoalOption: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1
                        },
                        is_correct: {
                            type: "boolean",
                            example: true
                        },
                        option_value_id: {
                            type: "integer",
                            example: 1
                        },
                        option_value: {
                            type: "string",
                            example: "Jakarta"
                        }
                    }
                },

                Soal: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1
                        },
                        question: {
                            type: "string",
                            example: "Apa ibu kota Indonesia?"
                        },
                        type: {
                            type: "string",
                            example: "radio",
                            enum: [
                                "radio",
                                "checkbox",
                                "rating",
                                "text",
                                "file"
                            ]
                        },
                        options: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/SoalOption"
                            }
                        }
                    }
                },

                CreateSoalRequest: {
                    type: "object",
                    required: ["soal"],
                    properties: {
                        soal: {
                            type: "object",
                            required: ["question", "type"],
                            properties: {
                                question: {
                                    type: "string",
                                    example: "Apa ibu kota Indonesia?"
                                },
                                type: {
                                    type: "string",
                                    enum: [
                                        "radio",
                                        "checkbox",
                                        "rating",
                                        "text",
                                        "file"
                                    ],
                                    example: "radio"
                                }
                            }
                        },

                        option_value: {
                            type: "array",
                            description: "Digunakan untuk radio, checkbox, dan rating",
                            items: {
                                type: "object",
                                properties: {
                                    value: {
                                        type: "string",
                                        example: "Jakarta"
                                    }
                                }
                            }
                        },

                        soal_option: {
                            type: "object",
                            properties: {
                                is_correct: {
                                    type: "boolean",
                                    example: true
                                }
                            }
                        }
                    }
                },

                ErrorResponse: {
                    type: "object",
                    properties: {
                        statusCode: {
                            type: "integer",
                            example: 400
                        },
                        message: {
                            type: "string",
                            example: "Isi Yang Benar"
                        },
                        error: {
                            type: "string",
                            example: "Bad Request"
                        }
                    }
                }
            }
        },

        paths: {

            //FORM

            "/form": {
                get: {
                    tags: ["Form"],
                    summary: "Mendapatkan seluruh form berdasarkan kategori",

                    parameters: [
                        {
                            name: "category",
                            in: "query",
                            required: true,
                            description: "Nama kategori form",
                            schema: {
                                type: "string"
                            },
                            example: "Ujian"
                        }
                    ],

                    responses: {
                        200: {
                            description: "Berhasil mendapatkan seluruh form"
                        },

                        404: {
                            description: "Tidak ada form dari kategori tersebut"
                        }
                    }
                },

                post: {
                    tags: ["Form"],
                    summary: "Membuat form baru",

                    security: [
                        {
                            bearerAuth: []
                        }
                    ],

                    requestBody: {
                        required: true,

                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CreateFormRequest"
                                }
                            }
                        }
                    },

                    responses: {
                        201: {
                            description: "Berhasil membuat form"
                        },

                        400: {
                            description: "Data tidak lengkap"
                        },

                        401: {
                            description: "Unauthorized"
                        }
                    }
                }
            },

            //FORM BY SLUG

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
                                type: "string"
                            },
                            example: "form-pendaftaran-siswa-1750000000000"
                        }
                    ],

                    responses: {
                        200: {
                            description: "Berhasil mendapatkan form"
                        },

                        404: {
                            description: "Form tidak ditemukan"
                        }
                    }
                }
            },

            //User Form

            "/form/user": {
                get: {
                    tags: ["Form"],
                    summary: "Mendapatkan form yang user terlibat",

                    security: [
                        {
                            bearerAuth: []
                        }
                    ],

                    responses: {
                        200: {
                            description: "Berhasil mendapatkan form user"
                        },

                        401: {
                            description: "Unauthorized"
                        }
                    }
                }
            },

            //Submit History

            "/form/submit": {
                get: {
                    tags: ["Form"],
                    summary: "Mendapatkan history submit form",

                    security: [
                        {
                            bearerAuth: []
                        }
                    ],

                    parameters: [
                        {
                            name: "form_id",
                            in: "query",
                            required: true,
                            description: "ID form",
                            schema: {
                                type: "string"
                            },
                            example: "1"
                        }
                    ],

                    responses: {
                        200: {
                            description: "Berhasil mendapatkan history form"
                        },

                        401: {
                            description: "Unauthorized"
                        },

                        404: {
                            description: "Data tidak ditemukan"
                        }
                    }
                }
            },

            //SOAL

            "/form/soal/{id}": {
                get: {
                    tags: ["Soal"],
                    summary: "Mendapatkan seluruh soal dari form",

                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            description: "ID form",
                            schema: {
                                type: "integer"
                            },
                            example: 1
                        }
                    ],

                    responses: {
                        200: {
                            description: "Berhasil mendapatkan soal",

                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: {
                                            $ref: "#/components/schemas/Soal"
                                        }
                                    }
                                }
                            }
                        },

                        404: {
                            description: "Form tidak ditemukan atau tidak memiliki soal"
                        }
                    }
                },

                post: {
                    tags: ["Soal"],
                    summary: "Membuat soal dan pilihan soal",

                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            description: "ID form",
                            schema: {
                                type: "integer"
                            },
                            example: 1
                        }
                    ],

                    requestBody: {
                        required: true,

                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/CreateSoalRequest"
                                }
                            }
                        }
                    },

                    responses: {
                        201: {
                            description: "Berhasil membuat soal"
                        },

                        400: {
                            description: "Request body kosong atau tidak valid"
                        },

                        404: {
                            description: "Form tidak ditemukan"
                        }
                    }
                }
            }
        }
    },

    apis: []
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec