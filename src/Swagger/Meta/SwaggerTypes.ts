/* eslint-disable @typescript-eslint/ban-types */

import {
  HttpStatusTypes,
  SDataFormat,
  SDataType,
  SMediaType,
} from './SwaggerTypesStatic.js';

export type SwaggerPathInput = {
  path: SwaggerRPath;
  prefix?: string;
};

export type SwaggerRRef = {
  $ref: string;
};

export function isSwaggerRef(o: unknown): o is SwaggerRRef {
  const a: any = o;
  return typeof a === 'object' && !!a?.$ref;
}

export type SwaggerRPathConfResponseDef = SwaggerCompResponse | SwaggerRRef;

export type SwaggerRPath = SKey<SwaggerRPathTypes>;
export type SwaggerRPathConfResponse = {
  [K in HttpStatusTypes]?: SwaggerRPathConfResponseDef;
};

export interface SwaggerRPathReqBody {
  content?: SwaggerContent;
  description?: string;
}

export interface SwaggerRPathParameter {
  content?: SwaggerContent;
  description?: string;
  name: string;
  required: boolean;
  schema?: SSchemaEl;
  in?: 'query' | 'header' | 'path';
}

export interface SwaggerRPathConf {
  responses?: SwaggerRPathConfResponse;
  description?: string;
  summary?: string;
  tags?: string[];
  operationId?: string;
  requestBody?: SwaggerRPathReqBody;
  parameters?: SwaggerRPathParameter[];
}

export interface SwaggerRPathTypes {
  get?: SwaggerRPathConf;
  post?: SwaggerRPathConf;
  patch?: SwaggerRPathConf;
  delete?: SwaggerRPathConf;
  update?: SwaggerRPathConf;
}

export interface SwaggerRInfoLicence {
  name: string;
  url?: string;
}

export interface SwaggerRServer {
  url: string;
  description?: string;
  variables?: string | string[];
}

export interface SwaggerRInfo {
  title: string;
  description?: string;
  termsOfService?: string;
  version: string;
  license?: SwaggerRInfoLicence;
}

export type SSchemaEl =
  | {
      type: SDataType;
      example?: string;
      format?: SDataFormat;
      description?: string;
      properties?: {
        [key: string]: SSchemaEl;
      };
      items?: SSchemaEl;
      required?: string[];
      enum?: string[];
    }
  | SwaggerRRef;

export type SwaggerContent = {
  [K in SMediaType]?: {
    schema: SSchemaEl;
  };
};
export type SwaggerCompResponse = {
  description?: string;
  content?: SwaggerContent;
};
export type SwaggerComSecuritySchemes = {
  in?: 'query' | 'header' | 'cookie';
  scheme: string;
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  bearerFormat?: string | 'JWT';
  description?: string;
};

export interface SKey<T> {
  [key: string]: T;
}

export interface SwaggerConfigComponents {
  securitySchemes?: SKey<SwaggerComSecuritySchemes>;
  responses?: SKey<SwaggerCompResponse>;
  schemas?: SKey<SSchemaEl>;
}

export interface SwaggerConfig {
  openapi: string;
  info: SwaggerRInfo;
  servers?: SwaggerRServer[];
  paths: SwaggerRPath;
  security?: [SKey<any[]>];
  tags?: string[];
  components?: SwaggerConfigComponents;
}

export interface MergeInputType {
  path: SwaggerPathInput | undefined;
  comp: SwaggerConfigComponents | undefined;
}
