import { eS, S } from './ClientUtil.js';

export type FunctionTemplateProps = {
  FC_PROPS: string;
  FC_BODY: string;
  FC_GEN: string;
  FC_RETURN: string;
  FC_ASYNC: string;
  FC_DOC: string[];
};

function docTemplate(inp: string, doc?: string[]) {
  const dDoc: string[] = [];
  if (doc && doc.length > 0) {
    dDoc.push(`${S(2)}/**`);
    doc.forEach((el) => dDoc.push(`${S(2)} * ${el}`));
    dDoc.push(`${S(2)} */`);

    return [...dDoc, inp].join('\n');
  }
  return inp;
}

function functionTemplate(
  FC_NAME: string,
  props: Partial<FunctionTemplateProps>,
) {
  const { FC_PROPS, FC_BODY, FC_RETURN, FC_GEN, FC_ASYNC } = props;
  return docTemplate(
    `${S(2)}${eS(FC_ASYNC)}${eS(FC_NAME)}${eS(FC_GEN)}(${eS(FC_PROPS)})${eS(
      FC_RETURN,
    )}{
${S(4)}${eS(FC_BODY)}
${S(2)}}`,
    props.FC_DOC,
  );
}

function functionInterfaceTemplate(
  FC_NAME: string,
  props: Partial<FunctionTemplateProps>,
) {
  const { FC_PROPS, FC_RETURN, FC_GEN, FC_DOC } = props;
  return docTemplate(
    `${S(2)}${eS(FC_NAME)}${eS(FC_GEN)}(${eS(FC_PROPS)})${eS(FC_RETURN)}`,
    FC_DOC,
  );
}

function abstractInterfaceTemplate(
  FC_NAME: string,
  props: Partial<FunctionTemplateProps>,
) {
  const { FC_PROPS, FC_RETURN, FC_GEN, FC_DOC } = props;
  return docTemplate(
    `${S(2)}abstract ${eS(FC_NAME)}${eS(FC_GEN)}(${eS(FC_PROPS)})${eS(
      FC_RETURN,
    )};`,
    FC_DOC,
  );
}

function reqBody(
  rType: string,
  path: string,
  paramKey: string[],
  hasBody: boolean,
  type: string,
  bodyType: string,
  queryKey: string[],
): string {
  let q = 'undefined';
  if (queryKey.length > 0 || paramKey.length > 0) {
    const comp = [];
    if (paramKey.length > 0) {
      comp.push(`param: {${paramKey.join(',')}}`);
    }

    if (queryKey.length > 0) {
      comp.push(`query: {${queryKey.join(',')}}`);
    }
    q = `{${comp.join(',')}}`;
  }

  return `return this.handle<${type}, ${bodyType}>('${rType}','${path}',${
    hasBody ? 'body' : 'undefined'
  }, ${q});`;
}

export {
  functionTemplate,
  reqBody,
  functionInterfaceTemplate,
  abstractInterfaceTemplate,
};
