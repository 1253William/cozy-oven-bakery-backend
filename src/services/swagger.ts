import swaggerJSDoc from "swagger-jsdoc";

const options = {
    swaggerDefinition: {
        openapi: "3.0.0",
       info: {
        title: "cozy-oven-bakery-backend",
        version: "1.0.0",
        description: "A Node.js + Express backend powering Cozy Oven’s bakery store.",
        },
        contact: {
            name: "Partechnologies And Consult",
            title: "Project Maintainer: Partechnologies And Consult",
            email: "williamofosu677@gmail.com",
        },
        license: {
            name: "MIT License",
            url: "https://github.com/1253William/cozy-oven-bakery-backend.git",
        },
        servers: [
            {
                url: "http://localhost:6000",
                description: "Development server",
            },
            {
                url: "https://api.cozyoven.store",
                description: "Live server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["src/services/**/*.route.ts"],
}

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
