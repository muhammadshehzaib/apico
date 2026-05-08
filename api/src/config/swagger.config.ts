import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Apico API',
      version: '1.0.0',
      description: 'Open-source REST API testing tool — backend API documentation',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        Workspace: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            ownerId: { type: 'string' },
            role: { type: 'string', enum: ['OWNER', 'EDITOR', 'VIEWER'] },
            memberCount: { type: 'integer' },
          },
        },
        Collection: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            workspaceId: { type: 'string' },
            folderId: { type: 'string', nullable: true },
            order: { type: 'integer' },
          },
        },
        SavedRequest: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] },
            url: { type: 'string' },
            collectionId: { type: 'string' },
            headers: { type: 'array', items: { type: 'object' } },
            params: { type: 'array', items: { type: 'object' } },
            body: { type: 'string', nullable: true },
          },
        },
        ExecuteResult: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            statusText: { type: 'string' },
            headers: { type: 'object' },
            body: { type: 'string' },
            duration: { type: 'integer', description: 'Response time in milliseconds' },
            size: { type: 'integer', description: 'Response size in bytes' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Workspaces', description: 'Workspace management' },
      { name: 'Collections', description: 'Collection CRUD' },
      { name: 'Requests', description: 'Saved request management and execution' },
      { name: 'Environments', description: 'Environment and variable management' },
      { name: 'History', description: 'Request history' },
      { name: 'Tags', description: 'Tag management' },
      { name: 'Folders', description: 'Folder management' },
    ],
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8, description: 'Min 8 chars, must include uppercase, lowercase, number and special char' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            400: { description: 'Email already registered or validation error' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful, returns access and refresh tokens' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'New access token issued' },
            401: { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/workspaces': {
        get: {
          tags: ['Workspaces'],
          summary: 'List workspaces for the authenticated user',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'List of workspaces' } },
        },
        post: {
          tags: ['Workspaces'],
          summary: 'Create a new workspace',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
              },
            },
          },
          responses: { 201: { description: 'Workspace created' } },
        },
      },
      '/requests/execute': {
        post: {
          tags: ['Requests'],
          summary: 'Execute an HTTP request via the proxy',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['method', 'url', 'headers', 'params'],
                  properties: {
                    method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] },
                    url: { type: 'string' },
                    headers: { type: 'array' },
                    params: { type: 'array' },
                    body: { type: 'string' },
                    auth: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Request executed, returns response data' },
          },
        },
      },
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          responses: { 200: { description: 'API is healthy' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
