// eslint-disable-next-line max-classes-per-file
import { Entity01 } from './Entity.js';
import { SPath, SPathUtil, SComponent } from '../../index.js';

@SPath({
  '/': {
    get: {
      description: 'test',
      operationId: 'getTestRoot',
      summary: 'Descritption summary',
      responses: {
        '200': {
          $ref: '#/components/responses/actionOneResponse',
        },
        '201': {
          description: 'Success',
        },
        '400': {
          description: 'Not Found',
        },
      },
    },
  },
})
@SComponent({
  responses: {
    actionOneResponse: {
      ...SPathUtil.contentSchemaFromEntity(new Entity01()),
    },
  },
})
export class ActonOne {}

@SPath(
  {
    '/e/element': {
      post: {
        operationId: 'getElementWithPrefix',
        description: 'test',
        parameters: [
          {
            in: 'query',
            name: 'par',
            required: false,
          },
        ],
        summary: 'Descritption summary',
        requestBody: SPathUtil.jsonBody({
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            example: {
              type: 'string',
            },
          },
          required: ['id'],
        }),
        responses: {
          ...SPathUtil.entityResponse(new Entity01(), true),
          ...SPathUtil.defaultResponse('400', '500'),
        },
      },
    },
  },
  '/prefix'
)
@SComponent({
  responses: {
    actionTwoResponse: {
      ...SPathUtil.contentSchemaFromEntity(new Entity01()),
    },
  },
})
export class ActonTwo {}

@SPath({
  '/api/test': {
    post: {
      operationId: 'uploadFile',
      description: 'upload file',
      summary: 'Descritption summary',
      requestBody: SPathUtil.formBody(),
      responses: SPathUtil.jsonResponse(
        '200',
        {
          type: 'object',
          properties: {
            status: {
              type: 'boolean',
            },
            message: {
              type: 'string',
            },
          },
        },
        false,
        '400',
        '500'
      ),
    },
  },
})
export class ActonThree {}

@SPath({
  '/api/test': {
    delete: {
      operationId: 'deleteFile',
      description: 'delete file',
      summary: 'Descritption summary',
      responses: SPathUtil.jsonResponse(
        '200',
        {
          type: 'string'
        },
        false,
        '400',
        '500'
      ),
    },
  },
})
export class ActonFour {}
