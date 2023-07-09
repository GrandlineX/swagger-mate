import * as Path from 'path';
import * as fs from 'fs';
import { XUtil } from '@grandlinex/core';
import {
  isSwaggerRef,
  SwaggerConfig,
  SwaggerRPathTypes,
} from '../Meta/SwaggerTypes.js';
import {
  abstractInterfaceTemplate,
  functionInterfaceTemplate,
  functionTemplate,
} from './FunctionTemplate.js';
import { interfaceTemplate } from './InterfaceTemplate.js';
import {
  IFTag,
  transformFormInterface,
  transformInterface,
} from './ClientUtil.js';
import functionProps from './FunctionProps.js';
import SwaggerUtil from '../SwaggerUtil.js';
import PathHelp, { getBaseFolder } from '../../PathHelp.js';

const base = process.cwd();
const baseR = `${base}/gen`;
const baseGen = `${baseR}/src`;

function cp(path: string, file: string) {
  const dest = Path.join(path, file);
  const target = Path.join(baseGen, file);
  if (fs.existsSync(dest)) {
    fs.copyFileSync(dest, target);
  } else {
    console.error(`cant copy file ${file}`);
  }
}

// # undefined, undefined, undefined

function insertHandler(
  conf: SwaggerConfig,
  temp: [string, string, string]
): [string, string, string] {
  const functionList: string[] = [];
  const functionInterfaceList: string[] = [];
  const abstractInterfaceList: string[] = [];

  const routes = Object.keys(conf.paths);

  for (const route of routes) {
    const r = conf.paths[route];
    const types = Object.keys(r) as (keyof SwaggerRPathTypes)[];
    for (const t of types) {
      const cur = r[t];
      if (cur && cur.operationId) {
        functionList.push(
          functionTemplate(cur.operationId, functionProps(route, t, cur))
        );
        functionInterfaceList.push(
          functionInterfaceTemplate(
            cur.operationId,
            functionProps(route, t, cur)
          )
        );
        abstractInterfaceList.push(
          abstractInterfaceTemplate(
            cur.operationId,
            functionProps(route, t, cur)
          )
        );
      } else {
        console.warn(`Missing operationId #${t} @${route}`);
      }
    }
  }

  return [
    temp[0].replace('  /* REPLACE_ME */', functionList.join('\n\n')),
    temp[1].replace('  /* REPLACE_ME */', functionInterfaceList.join('\n\n')),
    temp[2].replace('  /* REPLACE_ME */', abstractInterfaceList.join('\n\n')),
  ];
}

function interfaceHandler(conf: SwaggerConfig): string {
  const interfaceList: string[] = [];
  interfaceList.push("import FormData from 'form-data';\n");
  const routes = Object.keys(conf.paths);

  for (const route of routes) {
    const r = conf.paths[route];
    const types = Object.keys(r) as (keyof SwaggerRPathTypes)[];
    for (const t of types) {
      const cur = r[t];
      if (cur && cur.operationId) {
        if (cur.requestBody?.content?.['application/json']) {
          interfaceList.push(
            ...transformInterface(
              cur.operationId,
              IFTag.RequestBody,
              cur.requestBody.content['application/json'].schema
            ).map((val) => interfaceTemplate(val.name, val.keys, val.rawType))
          );
        }
        if (cur.requestBody?.content?.['multipart/form-data']) {
          interfaceList.push(
            ...transformFormInterface(
              cur.operationId,
              IFTag.RequestBody,
              cur.requestBody.content['multipart/form-data'].schema
            ).map((val) => interfaceTemplate(val.name, val.keys, val.rawType))
          );
        }
        const active = cur.responses?.['200'] || cur.responses?.['201'];
        if (
          active &&
          !isSwaggerRef(active) &&
          active.content?.['application/json']
        ) {
          interfaceList.push(
            ...transformInterface(
              cur.operationId,
              IFTag.Response,
              active.content['application/json'].schema
            ).map((val) => interfaceTemplate(val.name, val.keys, val.rawType))
          );
        }
      } else {
        console.warn(`Missing operationId #${t} @${route}`);
      }
    }
  }
  const responses = conf.components?.responses;
  if (responses) {
    const keys = Object.keys(responses);
    for (const resp of keys) {
      const cur = responses[resp];
      if (cur.content?.['application/json']) {
        interfaceList.push(
          ...transformInterface(
            resp,
            '',
            cur.content['application/json'].schema
          ).map((val) => interfaceTemplate(val.name, val.keys, val.rawType))
        );
      }
    }
  }

  const schema = conf.components?.schemas;
  if (schema) {
    const keys = Object.keys(schema);
    for (const resp of keys) {
      const cur = schema[resp];
      if (cur) {
        interfaceList.push(
          ...transformInterface(resp, '', cur).map((del) =>
            interfaceTemplate(del.name, del.keys)
          )
        );
      }
    }
  }

  return interfaceList.join('\n');
}

type Excludes = ('NodeCon' | 'FetchCon' | 'AxiosCon')[];

function indexHelper(template: string, exclude?: Excludes) {
  const exportList: string[] = [
    'ApiCon',
    'BaseCon',
    'CApiCon',
    'IApiCon',
    'FormData',
  ];
  const lines = [...template.split('\n')];
  if (!exclude || !exclude.includes('NodeCon')) {
    lines.push(`import NodeCon from './NodeCon.js';`);
    exportList.push('NodeCon');
  }
  if (!exclude || !exclude.includes('FetchCon')) {
    lines.push(`import FetchCon from './FetchCon.js';`);
    exportList.push('FetchCon');
  }
  if (!exclude || !exclude.includes('AxiosCon')) {
    lines.push(`import AxiosCon from './AxiosCon.js';`);
    exportList.push('AxiosCon');
  }
  lines.push(`export { ${exportList.join(', ')} };`);
  return lines.join('\n');
}
function buildCon(conf: SwaggerConfig, exclude?: Excludes) {
  const template = PathHelp(getBaseFolder(), '..', 'res', 'templates');

  const funcTemo = fs.readFileSync(
    Path.join(template, 'class', 'ApiCon.ts'),
    'utf-8'
  );
  const indexTemp = fs.readFileSync(
    Path.join(template, 'class', 'index.ts'),
    'utf-8'
  );
  const ifTemp = fs.readFileSync(
    Path.join(template, 'class', 'IApiCon.ts'),
    'utf-8'
  );

  const cTemp = fs.readFileSync(
    Path.join(template, 'class', 'CApiCon.ts'),
    'utf-8'
  );

  fs.writeFileSync(
    Path.join(baseGen, 'index.ts'),
    indexHelper(indexTemp, exclude)
  );
  fs.writeFileSync(Path.join(baseGen, 'ApiTypes.ts'), interfaceHandler(conf));
  const [con, iCon, cCon] = insertHandler(conf, [funcTemo, ifTemp, cTemp]);
  fs.writeFileSync(Path.join(baseGen, 'ApiCon.ts'), con);
  fs.writeFileSync(Path.join(baseGen, 'IApiCon.ts'), iCon);
  fs.writeFileSync(Path.join(baseGen, 'CApiCon.ts'), cCon);
}

function createPackage(name?: string, version?: string, module?: boolean) {
  const conf: Record<string, any> = {
    name: name || '@swagger/con',
    version: version || '0.0.1',
    main: 'dist/index.js',
    types: 'dist/index.d.ts',
    module: module ? 'dist/index.js' : undefined,
    type: module ? 'module' : undefined,
    dependencies: {
      'form-data': '4.0.0',
      axios: '1.1.3',
    },
    devDependencies: {
      '@types/node': '^20.3.0',
      typescript: '^5.1.3',
    },
    scripts: {
      build: 'tsc',
      buildPack: 'tsc && npm pack',
    },
  };
  fs.writeFileSync(
    Path.join(baseR, 'package.json'),
    JSON.stringify(conf, null, 2)
  );
  const tsConf = {
    compilerOptions: {
      jsx: 'react',
      baseUrl: './src',
      declaration: true,
      target: 'ES2020',
      module: module ? 'NodeNext' : 'commonjs',
      outDir: './dist',
      strict: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      moduleResolution: module ? 'NodeNext' : undefined,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    exclude: ['node_modules', 'dist'],
  };
  fs.writeFileSync(
    Path.join(baseR, 'tsconfig.json'),
    JSON.stringify(tsConf, null, 2)
  );
  const ignore = ['src', 'node_modules', '*.tgz'];
  fs.writeFileSync(Path.join(baseR, '.npmignore'), ignore.join('\n'));
}

export default class SwaggerClient {
  static genAPICConnector(options: {
    conf: SwaggerConfig;
    name?: string;
    version?: string;
    writeMeta?: boolean;
    module?: boolean;
    exclude?: Excludes;
  }) {
    const { name, version, writeMeta, module, exclude, conf } = options;
    const template = PathHelp(getBaseFolder(), '..', 'res', 'templates');

    XUtil.createFolderBulk(baseR, baseGen);

    cp(Path.join(template, 'class'), 'BaseCon.ts');
    if (!exclude || !exclude.includes('FetchCon')) {
      cp(Path.join(template, 'class'), 'FetchCon.ts');
    }
    if (!exclude || !exclude.includes('NodeCon')) {
      cp(Path.join(template, 'class'), 'NodeCon.ts');
    }
    if (!exclude || !exclude.includes('AxiosCon')) {
      cp(Path.join(template, 'class'), 'AxiosCon.ts');
    }

    cp(Path.join(template, 'class'), 'index.ts');
    buildCon(conf, exclude);
    createPackage(name, version, module);
    if (writeMeta || writeMeta === undefined) {
      SwaggerUtil.writeMeta(conf, 'JSON', baseR);
    }
  }
}
