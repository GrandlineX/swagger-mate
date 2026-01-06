/* eslint-disable prettier/prettier */
import { IfMappingKeyType, rq, S, sK, rN } from './ClientUtil.js';

function interfaceTemplate(
    IF_NAME: string,
    types: IfMappingKeyType[],
    rawType?: string
) {
    if (rawType) {
        return `export type ${IF_NAME} = ${rawType};`;
    }

    return `export interface ${IF_NAME} {
${types.map(({key, type, required, nullable}) => `${S(2)}${sK(key)}${rq(required)} ${rN(type,nullable)};`).join('\n')}
}`;
}

export {
    // eslint-disable-next-line import/prefer-default-export
    interfaceTemplate,
};
