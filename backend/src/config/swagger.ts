import type { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CinéConnect API',
      version: '1.0.0',
      description:
        'API for CinéConnect - A collaborative platform to discover, filter, rate, and discuss movies',
      contact: {
        name: 'CinéConnect Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            avatarUrl: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Film: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tmdbId: { type: 'integer' },
            title: { type: 'string' },
            year: { type: 'string' },
            poster: { type: 'string' },
            plot: { type: 'string' },
            director: { type: 'string' },
            actors: { type: 'string' },
            genre: { type: 'string' },
            runtime: { type: 'string' },
            tmdbRating: { type: 'string' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            filmId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Films', description: 'Film-related endpoints' },
      { name: 'Reviews', description: 'Review management endpoints' },
      { name: 'Messages', description: 'Real-time messaging endpoints' },
      { name: 'Friends', description: 'Friend management endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'CinéConnect API Documentation',
    })
  );
}
