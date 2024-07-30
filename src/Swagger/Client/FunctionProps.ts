import { isSwaggerRef, SwaggerRPathConf } from '../Meta/SwaggerTypes.js';
import { ifName, IFTag, typeByRef } from './ClientUtil.js';
import { FunctionTemplateProps, reqBody } from './FunctionTemplate.js';

function functionProps(
  route: string,
  t: 'get' | 'post' | 'patch' | 'delete' | 'update',
  cur: SwaggerRPathConf,
): FunctionTemplateProps {
  const comments: string[] = [];

  if (cur.description) {
    comments.push(cur.description);
  }
  if (cur.summary) {
    comments.push(cur.summary);
  }

  const queryKey: string[] = [];
  const param: string[] = [];
  const paramKey: string[] = [];
  let bodyType = 'unknown';
  cur.parameters
    ?.filter((el) => el.in === 'path')
    .forEach((el) => {
      param.push(`${el.name}: string `);
      paramKey.push(el.name);
      if (el.description) {
        comments.push(`@param ${el.name} ${el.description}`);
      }
    });

  if (cur.requestBody && cur.operationId) {
    bodyType = ifName(cur.operationId, IFTag.RequestBody, true);
    param.push(`body: ${bodyType}`);
  }

  cur.parameters
    ?.filter((el) => el.in === 'query')
    .forEach((el) => {
      param.push(`${el.name}?: string `);
      queryKey.push(el.name);
      if (el.description) {
        comments.push(`@param ${el.name} ${el.description}`);
      }
    });

  let type = 'unknown';
  const active = cur.responses?.['200'] || cur.responses?.['201'];

  if (
    cur.operationId &&
    active &&
    !isSwaggerRef(active) &&
    active.content?.['application/json']
  ) {
    type = ifName(cur.operationId, IFTag.Response, true);
  } else if (cur.operationId && active && isSwaggerRef(active)) {
    type = typeByRef(active.$ref, true);
  }

  return {
    FC_PROPS: `${param.join(',')}`,
    FC_BODY: reqBody(
      t.toUpperCase(),
      route,
      paramKey,
      !!cur.requestBody,
      type,
      bodyType,
      queryKey,
    ),
    FC_GEN: '',
    FC_RETURN: `: Promise<HandleRes<${type}>> `,
    FC_ASYNC: 'async ',
    FC_DOC: comments,
  };
}

export default functionProps;
