#!/usr/bin/env node
/**
 * GrandLineX Swagger Cli
 */

import * as fs from 'fs';
import * as Path from 'path';
import { ICoreKernel } from '@grandlinex/core';
import SwaggerUtil from './Swagger/SwaggerUtil.js';
import SwaggerClient from './Swagger/Client/SwaggerClient.js';

const arg = process.argv;
const cwd = process.cwd();

const ppid = process.env.CI_PIPELINE_IID;

async function importKernel(path: string): Promise<ICoreKernel<any>> {
  const DefaultClass = (await import(Path.join(cwd, path))).default;
  return new DefaultClass();
}

function runDebug(obj: any) {
  console.log(Reflect.getMetadataKeys(obj));
  Reflect.getMetadataKeys(obj).forEach((key) => {
    console.log(key, Reflect.getMetadata(key, obj));
  });
}

async function run() {
  console.log('Running Swagger Cli');
  const p = fs.readFileSync(Path.join(cwd, 'package.json'), 'utf-8');
  const pkg = JSON.parse(p);
  const kPath = pkg?.glx?.kernel;
  if (!kPath) {
    throw new Error('No Kernel defined in package.json [glx.kernel]');
  }
  console.log(`Importing Kernel @ ${kPath}`);
  const [param01] = arg.slice(2);
  console.log(`Args: ${param01}`);
  const kernel = await importKernel(kPath);

  const conf = SwaggerUtil.metaExtractor(
    kernel,
    true,
    ...kernel.getActionList(true)
  );
  if (conf) {
    SwaggerUtil.writeMeta(conf, 'JSON');
    if (arg[arg.length - 1] === '--serve') {
      console.log('Serving Swagger Meta');
      const auth = process.env.SW_AUTH || undefined;
      const port = process.env.SW_PORT || undefined;

      SwaggerUtil.serveMeta(conf, port ? parseInt(port, 10) : undefined, auth);
    }
    if (arg[arg.length - 2] === '--build') {
      console.log('Building Swagger Meta');
      switch (arg[arg.length - 1]) {
        case '--main':
          SwaggerClient.genAPICConnector({
            conf,
            name: `${pkg.name}-con`,
            version: pkg.version,
          });
          break;
        case '--dev':
          SwaggerClient.genAPICConnector({
            conf,
            name: `${pkg.name}-con`,
            version: `${pkg.version}-alpha.${ppid || '0'}`,
          });
          break;
        default:
          break;
      }
    }
  } else {
    runDebug(kernel);
  }
}

run();
