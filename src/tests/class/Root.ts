import { SPathUtil, Swagger } from '../../index.js';

@Swagger({
  info: {
    title: 'KernelTest',
    version: '0.1.0',
  },
  openapi: '3.0.3',
  servers: [
    {
      url: 'http://localhost:9257',
      description: 'LocalDev',
    },
  ],
  paths: {
    '/version': {
      get: {
        description: 'Get version',
        operationId: 'getVersion',
        responses: SPathUtil.defaultResponse('200', '500'),
      },
    },
    '/': {
      patch: {
        operationId: 'getDescriptionSummary',
        description: 'test',
        summary: 'Descritption summary',
        responses: {
          '200': { $ref: '#/components/responses/example' },
          '201': {
            $ref: '#/components/responses/example2',
          },
          '400': {
            description: 'Not Found',
          },
        },
      },
    },
    '/new/{id}': {
      post: {
        operationId: 'getNewById',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          description: 'text',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        description: 'test',
        summary: 'Descritption summary',
        responses: {
          '200': { $ref: '#/components/responses/example' },
          '201': {
            $ref: '#/components/responses/example2',
          },
          '400': {
            description: 'Not Found',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
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
      testSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          password: {
            type: 'string',
          },
          date: {
            type: 'number',
          },
        },
        required: ['name'],
      },
    },
    responses: {
      example: {
        description: 'Example',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                },
                password: {
                  type: 'string',
                },
                date: {
                  type: 'number',
                },
              },
              required: ['name'],
            },
          },
        },
      },
      example2: {
        description: 'Example',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  password: {
                    type: 'string',
                  },
                  date: {
                    type: 'number',
                  },
                },
              },
              required: ['name'],
            },
          },
        },
      },
    },
  },
})
export default class Root {}
