import axios, { AxiosResponse } from 'axios';
import { ConHandle, ConHandleResponse } from './BaseCon.js';

async function acTransform<T>(
    r: Promise<AxiosResponse<T>>
): Promise<ConHandleResponse<T>> {
    const res = await r;
    return {
        code: res.status,
        data: res.data,
        headers: res.headers as Record<string, any>,
    };
}
const AxiosCon: ConHandle = {
    get: async (url, config) => {
        return acTransform(
            axios.get(url, {
                headers: config?.headers,
                validateStatus: (status) => true,
            })
        );
    },
    post: async (url, body, config) => {
        return acTransform(
            axios.post(url, body, {
                headers: config?.headers,
                validateStatus: (status) => true,
            })
        );
    },
    patch: async (url, body, config) => {
        return acTransform(
            axios.patch(url, body, {
                headers: config?.headers,
                validateStatus: (status) => true,
            })
        );
    },
    delete: async (url, config) => {
        return acTransform(
            axios.delete(url, {
                headers: config?.headers,
                validateStatus: (status) => true,
            })
        );
    },
};

export default AxiosCon;
