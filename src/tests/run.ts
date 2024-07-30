import { CoreEntity, Entity } from '@grandlinex/core';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'process';
import Path from 'path';
import { SwaggerClient, SwaggerUtil } from '../index.js';
import PathHelp, { getBaseFolder } from '../PathHelp.js';

process.env.SM__DIRNAME = Path.join(
  dirname(fileURLToPath(import.meta.url)),
  '..'
);

const endpoint = '';
const email = '';
const password = '';

@Entity('A')
class A extends CoreEntity {}
(async () => {
  // const r = await con.ping();
  // const reg = await con.connect(email, password);
  // const t = await con.testToken();
  // console.log([r, reg, t]);
  // await SwaggerUtil.serveMeta();

  const meta = SwaggerUtil.readMeta(
    PathHelp(getBaseFolder(), 'tests', 'openapi.json')
  );
  SwaggerClient.genAPICConnector({
    conf: meta, exclude: [], module: false, name: "test123", version: "0.0.1", writeMeta: false
  });
  SwaggerUtil.serveMeta(meta, 9000);
})();
