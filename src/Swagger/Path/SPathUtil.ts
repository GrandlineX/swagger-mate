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
  isSwaggerRef,
  SKey,
  SSchemaEl,
  SwaggerContent,
  SwaggerRPathConfResponse,
  SwaggerRPathReqBody,
} from '../Meta/SwaggerTypes.js';

function resolveDBType(dType: DataType): SDataType {
  switch (dType) {
    case 'int':
    case 'long':
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
  /**
   * Generates a default response mapping for the specified HTTP status types.
   *
   * @param {HttpStatusTypes[]} types - The HTTP status types for which default responses should be created.
   * @return {SwaggerRPathConfResponse} An object mapping each provided status type to its default response definition. */
  static defaultResponse(
    ...types: HttpStatusTypes[]
  ): SwaggerRPathConfResponse {
    const res: SwaggerRPathConfResponse = {};

    types.forEach((el) => {
      res[el] = map[el];
    });

    return res;
  }

  /**
   * Creates a request body definition for JSON content type using the provided schema.
   *
   * @param {SSchemaEl} schema - The JSON schema used for validating the request body.
   * @return {SwaggerRPathReqBody} A Swagger path request body object specifying application/json content type with the provided schema.
   */
  static jsonBody(schema: SSchemaEl): SwaggerRPathReqBody {
    return {
      content: {
        'application/json': {
          schema,
        },
      },
    };
  }

  /**
   * Builds a Swagger request body for `multipart/form-data` requests.
   *
   * @param {SSchemaEl} [schema] Optional schema describing the form data.
   *        If omitted, a default schema with a single binary `file` field is provided.
   * @return {SwaggerRPathReqBody} Swagger request body definition with
   *         `multipart/form-data` content and the supplied or default schema. */
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

  /**
   * Generates a Swagger content definition for the provided entity.
   *
   * @param {T} entity - The entity instance to derive the Swagger schema from.
   * @param {boolean} [list] - When true, the schema will be wrapped in an array type, representing a list of entities.
   *
   * @returns {SwaggerContent|undefined} The Swagger content object for the entity, or `undefined` if the entity does not have a schema.
   */
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

  /**
   * @template T extends CoreEntity
   * @param {T} entity - The entity instance for which to build the response configuration.
   * @param {boolean} [list] - Indicates whether the response should represent a list of entities.
   * @param {boolean} [create] - Indicates whether the response corresponds to a creation operation (status code 201); otherwise 200.
   * @returns {SwaggerRPathConfResponse} The Swagger response configuration object containing the appropriate status code and content.
   */
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

  /**
   * Builds a JSON schema reference path for the given component name.
   *
   * @param {string} inp - The name of the schema component.
   * @return {string} The JSON reference path formatted as `#/components/schemas/<inp>`.
   */
  static schemaPath(inp: string): string {
    return `#/components/schemas/${inp}`;
  }

  /**
   * Creates a Swagger request body definition that references a schema.
   *
   * @param {string | CoreEntity} $ref
   *   Either the string reference to a schema or a `CoreEntity` instance whose
   *   class name will be used to build the reference path.
   * @param {boolean} list
   *   If true, the referenced schema is wrapped in an array; otherwise the
   *   schema is used directly.
   * @returns {SwaggerRPathReqBody}
   *   The request body object containing the appropriate content and schema
   *   configuration.
   */
  static refRequest(
    $ref: string | CoreEntity,
    list: boolean,
  ): SwaggerRPathReqBody {
    const t =
      typeof $ref === 'string'
        ? { $ref }
        : {
            $ref: this.schemaPath(XUtil.getEntityNames($ref).className),
          };
    if (list) {
      return {
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: t,
            },
          },
        },
      };
    }
    return {
      content: {
        'application/json': {
          schema: t,
        },
      },
    };
  }

  /**
   * Creates a Swagger response configuration for a given HTTP status code.
   *
   * @param {HttpStatusTypes} code - The primary HTTP status code for */
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

  /**
   * Builds a Swagger response configuration object for a given HTTP status code and schema.
   *
   * @param {HttpStatusTypes} code - The primary HTTP status code for the response.
   * @param {SSchemaEl} schema - The JSON schema definition for the response body.
   * @param {boolean} list - If true, the schema is wrapped in an array for list responses.
   * @param {...HttpStatusTypes} addCodes - Additional HTTP status codes for default responses.
   * @return {SwaggerRPathConfResponse} The constructed response configuration object.
   */
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

  /**
   * Generates a JSON schema representation from a CoreEntity instance.
   *
   * This method inspects the entity's metadata to construct a schema object
   * describing the entity's shape. The resulting schema contains:
   * - `type`: always `"object"`.
   * - `description`: a string indicating the entity name.
   * - `required`: an array of property names that are defined on the entity.
   * - `properties`: an object mapping each property name to an object that
   *   includes the resolved database type and its nullability.
   *
   * If no metadata is found for the provided entity, the method returns `undefined`.
   *
   * @param {T} entity - The entity instance for which to create a schema.
   * @returns {SSchemaEl | undefined} The generated schema object, or `undefined`
   *          if the entity's metadata could not be retrieved.
   */
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
        schema.required!.push(k as string);
        schema.properties[k as string] = {
          type: resolveDBType(cMeta.dataType),
          nullable: cMeta.canBeNull,
        };
      }
    });

    return schema;
  }

  /**
   * Generates a content schema object for the given entity. The schema contains a description derived from the entity metadata and a JSON content schema based on the entity's structure.
   *
   * @param {T} entity - The entity instance for which to generate the content schema. The generic type `T` must extend {@link CoreEntity}.
   * @returns {{ description: string; content: { 'application/json': { schema: SSchemaEl } }; } | undefined} An object containing the content schema, or `undefined` if no metadata is available for the entity.
   */
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
   * Generates a mapping from entity names to their corresponding schema objects.
   *
   * @param {CoreEntity[]} e The entities for which schema entries should be generated.
   * @return {SKey<SSchemaEl>} An object whose keys are entity names and values are the schemas derived from those entities.
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

  /**
   * Builds a JSON schema representation for an entity view that includes both the
   * entity data and its related entity map.
   *
   * @param entity The primary entity used to construct the `dat` portion of the schema.
   * @param entityMap The related entity map used to construct the `join_map` portion of the schema.
   * @returns A {@link SSchemaEl} object schema with properties `i`, `dat`, and `join_map`.
   */
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

  /**
   * Extends an entity schema object by merging additional schema options.
   *
   * @param {CoreEntity} entity
   *   The entity for which the schema should be extended.
   *
   * @param {...Object} options
   *   One or more objects defining schema extensions. Each object may contain:
   *   - `key` (string): The property key to add or extend.
   *   - `list` (boolean, optional): Indicates whether the property is a list.
   *   - `entity` (CoreEntity, optional): The entity type for the property.
   *   - `schema` (SSchemaEl, optional): A custom schema definition for the property.
   *   - `required` (boolean, optional): Whether the property is required.
   *
   * @return {SSchemaEl}
   *   The resulting schema element. If a single property is returned by
   *   `extendEntitySchema`, its schema is returned directly; otherwise an
   *   object schema with a type of `'object'` is returned.
   */
  public static extendEntitySchemaObject(
    entity: CoreEntity,
    ...options: {
      key: string;
      list?: boolean;
      entity?: CoreEntity;
      schema?: SSchemaEl;
      required?: boolean;
    }[]
  ): SSchemaEl {
    const schema = this.extendEntitySchema(entity, ...options);
    const ent = Object.entries(schema);
    if (ent.length === 1) {
      return ent[0][1];
    }
    return {
      type: 'object',
    };
  }

  /**
   * Extends the schema of a given {@link CoreEntity} with additional properties.
   *
   * @param {CoreEntity} entity
   *   The entity whose schema will be extended.
   *
   * @param {...{
   *   key: string,
   *   list?: boolean,
   *   entity?: CoreEntity,
   *   schema?: SSchemaEl,
   *   required?: boolean
   * }} options
   *   One or more option objects specifying the extensions to apply. Each option
   *   may provide either a direct schema (`schema`) or an entity reference
   *   (`entity`). The `list` flag indicates whether the property should be
   *   represented as an array of the provided schema. The `required` flag
   *   adds the property to the schema’s required list.
   *
   * @returns {SKey<SSchemaEl>}
   *   An object containing the updated schema for the entity, keyed by the
   *   entity’s name. If the entity metadata cannot be found, an empty
   *   object is returned.
   */
  public static extendEntitySchema(
    entity: CoreEntity,
    ...options: {
      key: string;
      list?: boolean;
      entity?: CoreEntity;
      schema?: SSchemaEl;
      required?: boolean;
    }[]
  ): SKey<SSchemaEl> {
    const meta = getEntityMeta(entity);
    if (meta) {
      const schema = SPathUtil.schemaEntryGen(entity)[meta.name];
      if (schema && !isSwaggerRef(schema) && schema.properties) {
        for (const option of options) {
          if (option.schema) {
            if (option.list) {
              schema.properties[option.key] = {
                type: 'array',
                items: option.schema,
              };
            } else {
              schema.properties[option.key] = option.schema;
            }
          } else if (option.entity) {
            const eMeta = getEntityMeta(option.entity);
            if (eMeta) {
              const scheme = SPathUtil.schemaEntryGen(option.entity)[
                eMeta.name
              ];
              if (option.list) {
                schema.properties[option.key] = {
                  type: 'array',
                  items: scheme,
                };
              } else {
                schema.properties[option.key] = scheme;
              }
            }
          }
          if (option.required) {
            schema.required = [...(schema.required || []), option.key];
          }
        }
      }
      return {
        [meta.name]: schema,
      };
    }
    return {};
  }

  /**
   * Reduces the entity schema to a single schema element or a generic object.
   *
   * @param entity The entity whose schema should be reduced.
   * @param keys Optional list of keys to include in the reduced schema. If omitted, all keys are considered.
   * @return Returns the schema element of the sole key if only one key is present; otherwise, returns a generic object schema with type `'object'`. */
  public static reduceEntitySchemaObject<T extends CoreEntity>(
    entity: T,
    ...keys: (keyof T)[]
  ): SSchemaEl {
    const schema = this.reduceEntitySchema(entity, ...keys);
    const ent = Object.entries(schema);
    if (ent.length === 1) {
      return ent[0][1];
    }
    return {
      type: 'object',
    };
  }

  /**
   * Creates a reduced version of an entity's schema by excluding specified properties.
   *
   * @param {CoreEntity} entity - The entity whose schema is to be processed.
   * @param {...string} keys - Property names to remove from the schema's `properties` and `required` lists.
   *
   * @returns */
  public static reduceEntitySchema<T extends CoreEntity>(
    entity: T,
    ...keys: (keyof T)[]
  ): SKey<SSchemaEl> {
    const meta = getEntityMeta(entity);
    if (meta) {
      const schema = SPathUtil.schemaEntryGen(entity)[meta.name];
      if (schema && !isSwaggerRef(schema) && schema.properties) {
        schema.properties = Object.fromEntries(
          Object.entries(schema.properties).filter(
            ([e]) => !keys.includes(e as keyof T),
          ),
        );
        schema.required = (schema.required || []).filter(
          (e) => !keys.includes(e as keyof T),
        );
      }
      return { [meta.name]: schema };
    }
    return {};
  }
}
