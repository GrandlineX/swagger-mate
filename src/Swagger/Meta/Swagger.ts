import 'reflect-metadata';
import { ObjectLike } from '@grandlinex/core';
import {
  SwaggerConfig,
  SwaggerConfigComponents,
  SwaggerPathInput,
  SwaggerRPath,
} from './SwaggerTypes.js';

const swaggerKey = Symbol('swagger');
const pathKey = Symbol('sPath');
const compKey = Symbol('sComp');

const Swagger = (config: SwaggerConfig): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(swaggerKey, config, target.prototype);
  };
};

function getSwaggerMeta<T extends ObjectLike>(
  target: T,
): SwaggerConfig | undefined {
  return Reflect.getMetadata(swaggerKey, target.constructor.prototype);
}

const SPath = (path: SwaggerRPath, prefix?: string): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(
      pathKey,
      {
        path,
        prefix,
      },
      target.prototype,
    );
  };
};

function getSPath<T extends ObjectLike>(
  target: T,
): SwaggerPathInput | undefined {
  return Reflect.getMetadata(pathKey, target.constructor.prototype);
}

const SComponent = (comp: SwaggerConfigComponents): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(compKey, comp, target.prototype);
  };
};

function getSComponent<T extends ObjectLike>(
  target: T,
): SwaggerConfigComponents | undefined {
  return Reflect.getMetadata(compKey, target.constructor.prototype);
}

export { Swagger, SPath, getSwaggerMeta, getSPath, SComponent, getSComponent };
