const swaggerJsdoc = require("swagger-jsdoc")


const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "User API",
            version: "1.0.0",
            description: "Documentation for User Authentication API"
        },

        servers: [
            {
                url: "http://localhost:3000"
            }
        ],

        tags: [
            {
                name: "User",
                description: "User authentication"
            }
        ],

        components: {
            schemas: {
                UserRequest: {
                    type: "object",
                    required: [
                        "username",
                        "password"
                    ],
                    properties: {
                        username: {
                            type: "string",
                            example: "fadhil hebat"
                        },
                        password: {
                            type: "string",
                            example: "fadhil123"
                        }
                    }
                },

                RegisterResponse: {
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            example: 201
                        },
                        message: {
                            type: "string",
                            example: "Berhasil Register Akun"
                        },
                        token: {
                            type: "string",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        }
                    }
                },

                LoginResponse: {
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            example: 200
                        },
                        message: {
                            type: "string",
                            example: "Berhasil Login"
                        },
                        token: {
                            type: "string",
                            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        }
                    }
                },

                ForgotPasswordResponse: {
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            example: 200
                        },
                        message: {
                            type: "string",
                            example: "Instruksi reset password telah dikirim ke email/username"
                        }
                    }
                },

                ErrorResponse: {
                    type: "object",
                    properties: {
                        status: {
                            type: "integer",
                            example: 400
                        },
                        message: {
                            type: "string",
                            example: "Isi Dengan Benar"
                        }
                    }
                }
            }
        },

        paths: {

            "/user/register": {
                post: {
                    tags: [
                        "User"
                    ],

                    summary: "Register user",

                    description:
                        "Mendaftarkan user baru menggunakan username dan password.",

                    requestBody: {
                        required: true,

                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UserRequest"
                                }
                            }
                        }
                    },

                    responses: {

                        "201": {
                            description: "Berhasil register akun",

                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/RegisterResponse"
                                    }
                                }
                            }
                        },

                        "400": {
                            description: "Username atau password kosong",

                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ErrorResponse"
                                    }
                                }
                            }
                        },

                        "409": {
                            description: "Username sudah ada",

                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            status: {
                                                type: "integer",
                                                example: 409
                                            },
                                            message: {
                                                type: "string",
                                                example: "Username Sudah Ada"
                                            }
                                        }
                                    }
                                }
                            }
                        },

                        "500": {
                            description: "Internal Server Error",

                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            status: {
                                                type: "integer",
                                                example: 500
                                            },
                                            message: {
                                                type: "string",
                                                example: "Error"
                                            },
                                            Error: {
                                                type: "string",
                                                example: "Database error"
                                            },
                                            Stack: {
                                                type: "string",
                                                example: "Error stack"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            "/user/login": {
                post: {
                    tags: [
                        "User"
                    ],

                    summary: "Login user",

                    description:
                        "Login menggunakan username dan password.",

                    requestBody: {
                        required: true,

                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UserRequest"
                                }
                            }
                        }
                    },

                    responses: {

                        "200": {
                            description: "Berhasil login",

                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/LoginResponse"
                                    }
                                }
                            }
                        },

                        "400": {
                            description: "Username atau password kosong",

                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ErrorResponse"
                                    }
                                }
                            }
                        },

                        "404": {
                            description: "User tidak ditemukan",

                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            status: {
                                                type: "integer",
                                                example: 404
                                            },
                                            message: {
                                                type: "string",
                                                example: "User Tidak Ada"
                                            }
                                        }
                                    }
                                }
                            }
                        },

                        "401": {
                            description: "Username atau password salah",

                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            status: {
                                                type: "integer",
                                                example: 401
                                            },
                                            message: {
                                                type: "string",
                                                example: "Username atau password salah"
                                            }
                                        }
                                    }
                                }
                            }
                        },

                        "500": {
                            description: "Internal Server Error",

                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            status: {
                                                type: "integer",
                                                example: 500
                                            },
                                            message: {
                                                type: "string",
                                                example: "Internal Server Error"
                                            },
                                            error: {
                                                type: "string",
                                                example: "Database error"
                                            },
                                            stack: {
                                                type: "string",
                                                example: "Error stack"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            "/user/forgot-password": {
                put: {
                    tags: [
                        "User"
                    ],
                    summary: "Lupa password user",
                    description: "Mengubah password user berdasarkan username.",
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/UserRequest"
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Berhasil mengubah password",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ForgotPasswordResponse"
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Username atau password kosong",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/ErrorResponse"
                                    }
                                }
                            }
                        },
                        "404": {
                            description: "User tidak ditemukan",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            status: {
                                                type: "integer",
                                                example: 404
                                            },
                                            message: {
                                                type: "string",
                                                example: "User Tidak Ada"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Internal Server Error",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            status: {
                                                type: "integer",
                                                example: 500
                                            },
                                            message: {
                                                type: "string",
                                                example: "Internal Server Error"
                                            },
                                            error: {
                                                type: "string",
                                                example: "Database error"
                                            },
                                            stack: {
                                                type: "string",
                                                example: "Error stack"
                                            }
                                        }
                                    }
                                }
                            }
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