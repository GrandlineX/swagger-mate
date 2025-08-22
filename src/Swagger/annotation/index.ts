import 'reflect-metadata';
import { CoreEntity, ObjectLike } from '@grandlinex/core';
import { SSchemaEl, SwaggerRPathConf } from '../Meta/SwaggerTypes.js';
import { HttpStatusTypes } from '../Meta/SwaggerTypesStatic.js';

export enum ActionMode {
  'DEFAULT',
  'DMZ',
  'DMZ_WITH_USER',
}
const routeKey = Symbol('route');

export type ActionTypes = 'POST' | 'GET' | 'USE' | 'PATCH' | 'DELETE';
export type ResponseTypes = 'LIST';

export type RouteMeta = {
  pathOverride?: string;
  mode?: ActionMode;
  requestSchema?: SSchemaEl;
  responseSchema?: SSchemaEl | CoreEntity | string;
  responseType?: ResponseTypes;
  responseCodes?: HttpStatusTypes[];
} & SwaggerRPathConf;
export type RouteData = {
  type: ActionTypes;
  path: string;
  meta?: RouteMeta;
};

export const Route = (
  type: RouteData['type'],
  path: RouteData['path'],
  meta?: RouteMeta,
): ClassDecorator => {
  return (target) => {
    const metadata: RouteData = {
      type,
      path,
      meta,
    };
    Reflect.defineMetadata(routeKey, metadata, target.prototype);
  };
};

export function getRouteMeta<T extends ObjectLike>(
  target: T,
): RouteData | undefined {
  return Reflect.getMetadata(routeKey, target.constructor.prototype);
}
