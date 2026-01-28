import { Server } from 'net';
import axios from 'axios';
import {
  getSPath,
  getSwaggerMeta,
  SPathUtil,
  SwaggerUtil,
  SwaggerClient,
  getSComponent,
} from '../index.js';
import Root from './class/Root.js';
import {ActonOne, ActonTwo, ActonThree, ActonFour, ActonFive, ActonSix} from './class/Actions.js';
import { Entity01 } from './class/Entity.js';

const root = new Root();
const elements = [new ActonOne(), new ActonTwo(), new ActonThree(),new ActonFour(),new ActonFive(),new ActonSix()];
describe('MetaValidation', () => {
  test('root', () => {
    const meta = getSwaggerMeta(root);
    expect(meta).not.toBeUndefined();
  });
  test('call-1', () => {
    const meta = getSPath(elements[0]);
    const comp = getSComponent(elements[0]);
    expect(meta).not.toBeUndefined();
    expect(comp).not.toBeUndefined();
  });
  test('call-2', () => {
    const meta = getSPath(elements[1]);
    expect(meta).not.toBeUndefined();
  });
  test('call-write', () => {
    const meta = SwaggerUtil.metaExtractor(root, true, ...elements);

    expect(meta).not.toBeUndefined();

    if (meta) {
      SwaggerUtil.writeMeta(meta, 'JSON');
      SwaggerUtil.writeMeta(meta, 'YAML');
    }
  });
  test('schema', () => {
    expect(SPathUtil.entityResponse(new Entity01())).not.toBeNull();
  });
});

describe('Client Gen', () => {
  const meta = SwaggerUtil.metaExtractor(root, true, ...elements);
  test('call-write', () => {
    expect(meta).not.toBeUndefined();

    if (meta) {
      SwaggerClient.genAPICConnector({conf: meta});
    }
  });
});

describe('WebInterface', () => {
  const meta = SwaggerUtil.metaExtractor(root, true, ...elements);
  let app: null | Server = null;
  test('start', async () => {
    expect(meta).not.toBeUndefined();
    if (meta) {
      app = await SwaggerUtil.serveMeta(meta, {port: 9009});
    }
    expect(app).not.toBeNull();
  });

  test('calls', async () => {
    if (app) {
      const base = await axios.get('http://localhost:9009/');
      expect(base.status).toBe(200);
      const dev = await axios.get('http://localhost:9009/spec');
      expect(base.status).toBe(200);
    }
  });
  test('stop', async () => {
    if (app) {
      app.close();
    }
  });
});
