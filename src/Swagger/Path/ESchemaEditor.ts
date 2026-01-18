import {
  CoreEntity,
  DataType,
  getColumnMeta,
  getEntityMeta,
} from '@grandlinex/core';
import { SKey, SSchemaEl, SSchemaElObj } from '../Meta/SwaggerTypes.js';
import { SDataType } from '../Meta/SwaggerTypesStatic.js';

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
export type ESchemaAddOption = {
  key: string;
  list?: boolean;
  entity?: CoreEntity;
  schema?: SSchemaEl;
  required?: boolean;
  nullable?: boolean;
};
export class ESchemaEditor<T extends CoreEntity> {
  private data: SSchemaElObj;

  private name: string;

  private constructor(entity: T, name: string) {
    this.data = ESchemaEditor.schemaFromEntity(entity)!;
    this.name = name;
  }

  /**
   * Removes the specified keys from the schema's properties and updates the required list.
   *
   * @param {...(keyof T)} keys - The keys of the properties to remove.
   * @returns {ESchemaEditor<T>} The editor instance for method chaining.
   */
  remove(...keys: (keyof T)[]): ESchemaEditor<T> {
    if (this.data.properties) {
      for (const key of keys) {
        this.data.properties = Object.fromEntries(
          Object.entries(this.data.properties).filter(
            ([e]) => key !== (e as keyof T),
          ),
        );
        this.data.required = (this.data.required || []).filter(
          (e) => key !== (e as keyof T),
        );
      }
    }
    return this;
  }

  /**
   * Adds properties to the schema based on the provided options.
   *
   * @param {...ESchemaAddOption} options The options describing the properties to add. Each option may specify a
   *   `key`, a `schema` or an `entity`, and optionally whether the property is a `list`, `nullable`, or `required`.
   * @returns {ESchemaEditor<T>} The editor instance for chaining.
   */
  add(...options: ESchemaAddOption[]): ESchemaEditor<T> {
    if (!this.data.properties) {
      return this;
    }
    for (const option of options) {
      if (option.schema) {
        if (option.list) {
          this.data.properties[option.key] = {
            type: 'array',
            items: option.schema,
            nullable: option.nullable,
          };
        } else {
          this.data.properties[option.key] = option.schema;
        }
      } else if (option.entity) {
        const scheme = ESchemaEditor.fromEntity(option.entity).getSchema();
        if (option.nullable) {
          scheme.nullable = true;
        }
        if (option.list) {
          this.data.properties[option.key] = {
            type: 'array',
            items: scheme,
          };
        } else {
          this.data.properties[option.key] = scheme;
        }
      }
      if (option.required) {
        this.data.required = [...(this.data.required || []), option.key];
      }
    }
    return this;
  }

  getSchema(): SSchemaElObj {
    return this.data;
  }

  getSKeySchema(): SKey<SSchemaElObj> {
    return {
      [this.name]: this.data,
    };
  }

  static fromEntity<J extends CoreEntity>(e: J): ESchemaEditor<J> {
    const meta = getEntityMeta(e);
    if (meta) {
      return new ESchemaEditor<J>(e, meta.name);
    }
    throw new Error('Entity metadata not found');
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
   * @returns {SSchemaElObj | undefined} The generated schema object, or `undefined`
   *          if the entity's metadata could not be retrieved.
   */
  static schemaFromEntity<T extends CoreEntity>(
    entity: T,
  ): SSchemaElObj | undefined {
    const schema: SSchemaElObj = {
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
}
