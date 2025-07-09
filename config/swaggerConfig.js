const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fashion Designer App API',
      version: '1.0.0',
      description: 'API documentation for the Fashion Designer Web Application. This API allows management of clients, measurements, and style inspirations.',
      contact: {
        name: 'API Support',
        // url: 'http://www.example.com/support', // Optional
        // email: 'support@example.com', // Optional
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000', // Default to localhost if not set
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { // Arbitrary name for the security scheme
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Optional, for documentation purposes
          description: 'Enter JWT Bearer token in the format: Bearer {token}',
        },
      },
      schemas: {
        // Generic Error response schema
        ErrorResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message explaining the issue.',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  value: { type: 'string' },
                  msg: { type: 'string' },
                  path: { type: 'string' },
                  location: { type: 'string' },
                }
              },
              description: 'Array of validation errors (present if applicable).',
              nullable: true,
            },
          },
        },
        // Admin schemas will be defined in authRoutes.js annotations
        // Client schemas will be defined in clientRoutes.js annotations
        // Measurement schemas will be defined in measurementRoutes.js annotations
        // StyleImage schemas will be defined in styleImageRoutes.js annotations
      },
    },
    // Global security definition, can be overridden at the operation level
    // security: [
    //   {
    //     bearerAuth: [], // Applies bearerAuth to all paths by default if uncommented
    //   },
    // ],
  },
  // Path to the API docs files (your route files)
  apis: ['./routes/*.js'], // Glob pattern to find all .js files in the routes folder
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
