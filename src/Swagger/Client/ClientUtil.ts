import { isSwaggerRef, SSchemaEl } from '../Meta/SwaggerTypes.js';

export type IfMappingKeyType = {
  key: string;
  type: string;
  required?: boolean;
};
export type IfMappingType = {
  name: string;
  keys: IfMappingKeyType[];
  rawType?: string;
};

/**
 * Save string from unknown
 * @param e
 */
export function eS(e: any): string {
  return e || '';
}
/**
 * Optional field
 * @param required
 */
export function rq(required?: boolean): string {
  if (!required) {
    return '?:';
  }
  return ':';
}

export function sK(e: string): string {
  if (e.indexOf(':') >= 0) {
    return `'${e}'`;
  }
  return e;
}

/**
 * Cast first letter to uppercase
 * @param e
 */
export function fuc(e: string): string {
  if (e.length === 0) {
    return '';
  }
  return e.charAt(0).toUpperCase() + e.substring(1);
}

/**
 * Spacing function
 * @param c number of spaces
 */
export function S(c: number): string {
  let o = '';
  for (let i = 0; i < c; i++) {
    o += ' ';
  }
  return o;
}

export enum IFTag {
  'RequestBody' = 'RequestBody',
  'Response' = 'Response',
}
/**
 * InterfaceName secure function
 */
export function saveName(inp: string) {
  return inp.replace(/[^a-zA-Z0-9[\]]/g, 'X');
}
/**
 * InterfaceName Helper function
 */
export function ifName(operation: string, tag: IFTag | string, use?: boolean) {
  return `${use ? 'TX.' : ''}${saveName(fuc(operation))}${saveName(fuc(tag))}`;
}

export function typeByRef(ref: string, use?: boolean): string {
  return `${use ? 'TX.' : ''}${fuc(ref.substring(1 + ref.lastIndexOf('/')))}`;
}

/**
 * Map schema to typescript interface
 * @param operation
 * @param tag
 * @param schema
 */
export function transformInterface(
  operation: string,
  tag: IFTag | string,
  schema: SSchemaEl,
): IfMappingType[] {
  const out: IfMappingType[] = [];
  const cur: IfMappingType = {
    name: ifName(operation, tag),
    keys: [],
  };
  let keys: null | string[] = null;
  if (!isSwaggerRef(schema)) {
    switch (schema.type) {
      case 'object':
        if (schema.properties) {
          keys = Object.keys(schema.properties || {});
          for (const key of keys) {
            const prop = schema.properties[key];
            const isRequired = schema.required && schema.required.includes(key);
            if (!isSwaggerRef(prop)) {
              switch (prop.type) {
                case 'number':
                case 'integer':
                  cur.keys.push({ key, type: 'number', required: isRequired });
                  break;
                case 'string':
                  cur.keys.push({ key, type: 'string', required: isRequired });
                  break;
                case 'boolean':
                  cur.keys.push({ key, type: 'boolean', required: isRequired });
                  break;
                case 'object':
                  if (!prop.properties) {
                    cur.keys.push({ key, type: 'any', required: isRequired });
                  } else {
                    cur.keys.push({
                      key,
                      type: ifName(cur.name, key),
                      required: isRequired,
                    });
                    out.push(...transformInterface(cur.name, key, prop));
                  }
                  break;
                case 'array':
                  if (isSwaggerRef(prop.items)) {
                    cur.keys.push({
                      key,
                      type: `${typeByRef(prop.items.$ref)}[]`,
                      required: isRequired,
                    });
                  } else {
                    cur.keys.push({
                      key,
                      type: `${ifName(cur.name, `${key}Element`)}[]`,
                      required: isRequired,
                    });
                    out.push(...transformInterface(cur.name, key, prop));
                  }
                  break;
                default:
              }
            } else {
              cur.keys.push({
                key,
                type: typeByRef(prop.$ref),
                required: isRequired,
              });
            }
          }
          out.push(cur);
        } else {
          out.push({
            ...cur,
            rawType: 'any',
          });
        }
        break;
      case 'array':
        if (schema.items) {
          if (isSwaggerRef(schema.items)) {
            out.push({
              keys: [],
              name: cur.name,
              rawType: `${typeByRef(schema.items.$ref)}[]`,
            });
          } else {
            const int = transformInterface(cur.name, 'Element', schema.items);
            out.push(...int);
            out.push({
              keys: [],
              name: cur.name,
              rawType: `${ifName(cur.name, 'Element')}[]`,
            });
          }
        }
        break;
      case 'string':
        out.push({
          keys: [],
          name: cur.name,
          rawType: `string`,
        });
        break;
      case 'integer':
      case 'number':
        out.push({
          keys: [],
          name: cur.name,
          rawType: `number`,
        });
        break;
      case 'boolean':
        out.push({
          keys: [],
          name: cur.name,
          rawType: `boolean`,
        });
        break;
      default:
        break;
    }
  } else {
    cur.rawType = `${typeByRef(schema.$ref)}`;
    out.push(cur);
  }

  return out;
}

/**
 * Map schema to typescript interface
 * @param operation
 * @param tag
 * @param schema
 */
export function transformFormInterface(
  operation: string,
  tag: IFTag | string,
  // schema: SSchemaEl,
): IfMappingType[] {
  const out: IfMappingType[] = [];
  const cur: IfMappingType = {
    name: ifName(operation, tag),
    keys: [],
  };
  // const keys: null | string[] = null;

  cur.rawType = `FormData`;
  out.push(cur);

  return out;
}
