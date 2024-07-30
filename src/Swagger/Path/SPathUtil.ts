import {
  CoreEntity,
  DataType,
  getEntityMeta,
  XUtil,
  getColumnMeta,
} from '@grandlinex/core';
import map from './SUtilMap.js';
import { HttpStatusTypes, SDataType } from '../Meta/SwaggerTypesStatic.js';
import {
  SKey,
  SSchemaEl,
  SwaggerContent,
  SwaggerRPathConfResponse,
  SwaggerRPathReqBody,
} from '../Meta/SwaggerTypes.js';

function resolveDBType(dType: DataType): SDataType {
  switch (dType) {
    case 'int':
      return 'integer';
    case 'double':
    case 'float':
      return 'number';
    case 'blob':
      return 'string';
    case 'string':
    case 'text':
    case 'uuid':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'date':
      return 'string';
    case 'json':
      return 'object';
    default:
      throw Error('TypeNotSupported');
  }
}

export default class SPathUtil {
  static defaultResponse(
    ...types: HttpStatusTypes[]
  ): SwaggerRPathConfResponse {
    const res: SwaggerRPathConfResponse = {};

    types.forEach((el) => {
      res[el] = map[el];
    });

    return res;
  }

  static jsonBody(schema: SSchemaEl): SwaggerRPathReqBody {
    return {
      content: {
        'application/json': {
          schema,
        },
      },
    };
  }

  static formBody(schema?: SSchemaEl): SwaggerRPathReqBody {
    return {
      content: {
        'multipart/form-data': {
          schema: schema || {
            type: 'object',
            properties: {
              file: {
                type: 'string',
                format: 'binary',
                description: 'File to upload',
              },
            },
          },
        },
      },
    };
  }

  static entityContent<T extends CoreEntity>(
    entity: T,
    list?: boolean,
  ): SwaggerContent | undefined {
    const schema = this.schemaFromEntity(entity);

    if (!schema) {
      return undefined;
    }
    if (list) {
      return {
        'application/json': {
          schema: {
            type: 'array',
            items: schema,
          },
        },
      };
    }
    return {
      'application/json': {
        schema,
      },
    };
  }

  static entityResponse<T extends CoreEntity>(
    entity: T,
    list?: boolean,
    create?: boolean,
  ): SwaggerRPathConfResponse {
    const code = create ? '201' : '200';
    const an: SwaggerRPathConfResponse = {};

    an[code] = {
      description: map[code].description,
      content: this.entityContent(entity, list),
    };

    return an;
  }

  static schemaPath(inp: string): string {
    return `#/components/schemas/${inp}`;
  }

  static refResponse(
    code: HttpStatusTypes,
    $ref: string | CoreEntity,
    list: boolean,
    ...addCodes: HttpStatusTypes[]
  ): SwaggerRPathConfResponse {
    const an: SwaggerRPathConfResponse = {
      ...this.defaultResponse(...addCodes),
    };
    const t =
      typeof $ref === 'string'
        ? { $ref }
        : {
            $ref: this.schemaPath(XUtil.getEntityNames($ref).className),
          };
    if (list) {
      an[code] = {
        description: map[code].description,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: t,
            },
          },
        },
      };
    } else {
      an[code] = {
        description: map[code].description,
        content: {
          'application/json': {
            schema: t,
          },
        },
      };
    }
    return an;
  }

  static jsonResponse(
    code: HttpStatusTypes,
    schema: SSchemaEl,
    list: boolean,
    ...addCodes: HttpStatusTypes[]
  ): SwaggerRPathConfResponse {
    const an: SwaggerRPathConfResponse = {
      ...this.defaultResponse(...addCodes),
    };

    if (list) {
      an[code] = {
        description: map[code].description,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: schema,
            },
          },
        },
      };
    } else {
      an[code] = {
        description: map[code].description,
        content: {
          'application/json': {
            schema,
          },
        },
      };
    }

    return an;
  }

  static schemaFromEntity<T extends CoreEntity>(
    entity: T,
  ): SSchemaEl | undefined {
    const schema: SSchemaEl = {
      type: 'object',
      properties: {},
    };
    const meta = getEntityMeta(entity);
    if (!meta) {
      return undefined;
    }
    schema.description = `Entity: ${meta.name}`;
    schema.required = [];
    const keys = Object.keys(entity) as (keyof T)[];

    keys.forEach((k) => {
      const cMeta = getColumnMeta(entity, k);
      if (cMeta && schema.properties) {
        if (!cMeta.canBeNull) {
          schema.required?.push(k as string);
        }
        schema.properties[k as string] = {
          type: resolveDBType(cMeta.dataType),
        };
      }
    });

    return schema;
  }

  static contentSchemaFromEntity<T extends CoreEntity>(entity: T) {
    const meta = getEntityMeta(entity);
    if (!meta) {
      return undefined;
    }
    return {
      description: `Entity: ${meta.name}`,
      content: {
        'application/json': {
          schema: this.schemaFromEntity(entity) as SSchemaEl,
        },
      },
    };
  }

  /**
   * generate global schema
   * @param e
   */
  static schemaEntryGen(...e: CoreEntity[]): SKey<SSchemaEl> {
    const out: SKey<any> = {};
    e.forEach((el) => {
      const meta = getEntityMeta(el);
      if (meta) {
        out[meta.name] = SPathUtil.schemaFromEntity(el);
      }
    });
    return out;
  }

  static schemaFromEntityView<A extends CoreEntity, B extends CoreEntity>(
    entity: A,
    entityMap: B,
  ): SSchemaEl {
    return {
      type: 'object',
      properties: {
        i: {
          type: 'integer',
        },
        dat: this.schemaFromEntity(entity) as SSchemaEl,
        join_map: this.schemaFromEntity(entityMap) as SSchemaEl,
      },
    };
  }
}
