import * as Path from 'path';
import * as fs from 'fs';
import jsyaml from 'js-yaml';
import { CMap, ObjectLike } from '@grandlinex/core';
import express from 'express';
import { Server } from 'net';
import * as process from 'process';
import {
  MergeInputType,
  SSchemaEl,
  SwaggerCompResponse,
  SwaggerComSecuritySchemes,
  SwaggerConfig,
  SwaggerConfigComponents,
  SwaggerPathInput,
  SwaggerRPath,
  SwaggerRPathConf,
  SwaggerRPathTypes,
} from './Meta/SwaggerTypes.js';
import { getSComponent, getSPath, getSwaggerMeta } from './Meta/Swagger.js';
import PathHelp, { getBaseFolder } from '../PathHelp.js';
import { getRouteMeta, RouteData } from './annotation/index.js';
import { SPathUtil } from '../index.js';

export default class SwaggerUtil {
  static writeMeta(conf: SwaggerConfig, kind: 'JSON' | 'YAML', path?: string) {
    if (kind === 'JSON') {
      const p = Path.join(path || process.cwd(), 'openapi.json');
      fs.writeFileSync(p, JSON.stringify(conf, null, 2));
    } else {
      const y = Path.join(path || process.cwd(), 'openapi.yml');
      fs.writeFileSync(y, jsyaml.dump(conf));
    }
  }

  static readMeta(path: string) {
    const file = fs.readFileSync(path, 'utf-8');
    try {
      return JSON.parse(file);
    } catch (e) {
      return null;
    }
  }

  static async serveMeta(conf: SwaggerConfig, port?: number, auth?: string) {
    const resFiles = PathHelp(getBaseFolder(), '..', 'res', 'html');
    const key = auth ? `?auth=${auth}` : '';
    const app = express();
    app.use('/', express.static(resFiles));
    app.get('/spec', (req, res) => {
      res.status(200).send(conf);
    });

    return new Promise<Server | null>((resolve) => {
      const s = app.listen(port || 9000, () => {
        console.log(`listen on http://localhost:${port || 9000}${key}#`);
        resolve(s);
      });
    });
  }

  static metaExtractor(
    root: ObjectLike,
    npmPackageVersion: boolean,
    ...path: ObjectLike[]
  ) {
    const rootMeta = getSwaggerMeta(root);
    if (!rootMeta) {
      return undefined;
    }

    if (npmPackageVersion) {
      const version = process.env.npm_package_version;
      if (version) {
        rootMeta.info.version = version;
      }
    }

    return this.merge(
      rootMeta,
      path.map((el) => {
        const sPath: SwaggerPathInput | undefined = getSPath(el);
        const meta = getRouteMeta(el);
        let sMeta: SwaggerPathInput | undefined;
        if (meta) {
          sMeta = {
            path: this.routeToSwaggerPath(meta),
          };
        }

        return {
          path: sPath || sMeta,
          comp: getSComponent(el),
        };
      }),
    );
  }

  static routeToSwaggerPath(route: RouteData): SwaggerRPath {
    const conf: SwaggerRPathConf = {
      responses: route.meta?.responses,
      description: route.meta?.description,
      summary: route.meta?.summary,
      tags: route.meta?.tags,
      operationId: route.meta?.operationId,
      requestBody: route.meta?.requestBody,
      parameters: route.meta?.parameters,
    };
    if (route.meta) {
      if (route.meta.requestSchema && !conf.requestBody) {
        conf.requestBody = SPathUtil.jsonBody(route.meta.requestSchema);
      }
      if (route.meta.responseSchema && !conf.responses) {
        const ax = route.meta.responseCodes?.slice(1) || [];
        conf.responses = SPathUtil.jsonResponse(
          route.meta.responseCodes?.[0] || '200',
          route.meta.responseSchema,
          route.meta.responseType === 'LIST',
          ...ax,
        );
      } else if (route.meta.responseCodes) {
        conf.responses = SPathUtil.defaultResponse(...route.meta.responseCodes);
      } else {
        conf.responses = SPathUtil.defaultResponse('200');
      }
    }

    const convertedPath =
      route.meta?.pathOverride ||
      route.path
        .split('/')
        .map((e) => {
          if (e.startsWith(':')) {
            return `{${e.substring(1)}}`;
          }
          return e;
        })
        .join('/');

    const path: SwaggerRPath = {};
    switch (route.type) {
      case 'POST':
        path[convertedPath] = {
          post: conf,
        };
        break;
      case 'GET':
        path[convertedPath] = {
          get: conf,
        };
        break;
      case 'PATCH':
        path[convertedPath] = {
          patch: conf,
        };
        break;
      case 'DELETE':
        path[convertedPath] = {
          delete: conf,
        };
        break;
      case 'USE':
        path[convertedPath] = {
          get: conf,
          patch: conf,
          post: conf,
          delete: conf,
        };
        break;
      default:
    }
    return path;
  }

  static merge(root: SwaggerConfig, data: MergeInputType[]): SwaggerConfig {
    const out: any = root;
    if (!out.paths) {
      out.paths = {};
    }
    if (!out.components) {
      out.components = {};
    }
    data.forEach(({ path, comp }) => {
      if (path && out.paths) {
        const keys = Object.keys(path.path);
        for (const key of keys) {
          if (key) {
            const nKey = `${path.prefix || ''}${key}`;
            const ac = path.path[key];
            if (ac) {
              const comps = Object.keys(ac);
              if (!out.paths[nKey]) {
                out.paths[nKey] = {};
              }
              if (out.paths[nKey]) {
                for (const c of comps) {
                  const nC = c as keyof SwaggerRPathTypes;
                  out.paths[nKey][nC] = ac[nC];
                }
              }
            }
          }
        }
      }
      if (comp && out.components) {
        const keys = Object.keys(comp);
        for (const key of keys) {
          if (key) {
            const nKey = key as keyof SwaggerConfigComponents;
            const ac = comp[nKey];
            if (ac) {
              const comps = Object.keys(ac);
              if (!out.components[nKey]) {
                out.components[nKey] = {};
              }
              if (out.components[nKey]) {
                for (const c of comps) {
                  out.components[nKey][c] = ac[c];
                }
              }
            }
          }
        }
      }
    });
    return out;
  }

  static mergeConfig(
    root: SwaggerConfig,
    data: SwaggerConfig[],
  ): SwaggerConfig {
    const out: SwaggerConfig = root;
    const path = new CMap<string, SwaggerRPathTypes>();
    const compSecurity = new CMap<string, SwaggerComSecuritySchemes>();
    const compSchema = new CMap<string, SSchemaEl>();
    const compRespons = new CMap<string, SwaggerCompResponse>();

    function fillKeys<X>(
      obj: Record<string, X> | undefined,
      map: CMap<string, X>,
    ) {
      if (obj) {
        const keys = Object.keys(obj);
        for (const key of keys) {
          if (!map.has(key)) {
            map.set(key, obj[key]);
          }
        }
      }
    }

    if (!out.paths) {
      out.paths = {};
    }
    if (!out.components) {
      out.components = {};
    }
    [root, ...data].forEach((sc) => {
      fillKeys(sc.paths, path);
      fillKeys(sc.components?.securitySchemes, compSecurity);
      fillKeys(sc.components?.schemas, compSchema);
      fillKeys(sc.components?.responses, compRespons);
    });

    if (path.size > 0) {
      path.forEach((x, key) => {
        out.paths![key] = x;
      });
    }

    if (compSecurity.size > 0) {
      out.components!.securitySchemes = {};
      compSecurity.forEach((x, key) => {
        out.components!.securitySchemes![key] = x;
      });
    }

    if (compSchema.size > 0) {
      out.components!.schemas = {};
      compSchema.forEach((x, key) => {
        out.components!.schemas![key] = x;
      });
    }
    if (compRespons.size > 0) {
      out.components!.responses = {};
      compRespons.forEach((x, key) => {
        out.components!.responses![key] = x;
      });
    }

    return out;
  }
}
