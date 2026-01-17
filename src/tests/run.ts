import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'process';
import Path from 'path';
import { SwaggerUtil } from '../index.js';
import PathHelp, { getBaseFolder } from '../PathHelp.js';

process.env.SM__DIRNAME = Path.join(
  dirname(fileURLToPath(import.meta.url)),
  '..'
);

const meta = SwaggerUtil.readMeta(
    PathHelp(getBaseFolder(), 'tests', 'openapi.json')
);

SwaggerUtil.serveMeta(meta, {
    port:9000,
    type: "rapi-doc"
});