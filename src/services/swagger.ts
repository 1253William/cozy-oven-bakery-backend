import swaggerJSDoc from "swagger-jsdoc";

const options = {
    swaggerDefinition: {
        openapi: "3.0.0",
       info: {
        title: "Vire Workplace API Documentation",
        version: "1.0.0",
        description: "Backend API for Vire Workplace employee and workflow automation system.",
        },
        contact: {
            name: "The Vire Agency",
            title: "Project Maintainer: Vire Agency Engineering Team",
            url: "https://www.vire.agency",
            email: "vireworkspace@gmail.com",
        },
        license: {
            name: "MIT License",
            url: "https://github.com/vireagency/vireworkplace-backend.git#readme",
        },
        servers: [
            {
                url: "http://localhost:6000",
                description: "Development server",
            },
            {
                url: "https://api.vire.agency",
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
    apis: ["src/routes/*.ts"],
}

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
