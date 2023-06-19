import FormData from 'form-data';
import * as http from 'http';
import * as https from 'https';
import { IncomingMessage } from 'http';
import { RequestOptions } from 'https';

import {
  ConHandle,
  ConHandleConfig,
  ConHandleResponse,
  HeaderType,
} from './BaseCon.js';

function selectClient(url: string) {
  if (url.startsWith('https')) {
    return https;
  }
  return http;
}

async function fcTransform<T>(
  message: IncomingMessage,
  raw: any
): Promise<ConHandleResponse<T>> {
  let data = null;

  if (message.headers['content-type']?.includes('application/json')) {
    data = JSON.parse(raw);
  } else if (message.headers['content-type']?.includes('form-data')) {
    data = null; // await res.formData()
  } else if (message.headers['content-type']?.includes('octet-stream')) {
    data = Buffer.from(raw);
  } else if (message.headers['content-type']?.startsWith('text/')) {
    data = Buffer.from(raw).toString('utf8');
  }

  return {
    code: message.statusCode || -1,
    data,
    headers: message.headers,
  };
}
function bodyTransform(
  r: any,
  headers?: Record<string, HeaderType>
): {
  headers: Record<string, HeaderType>;
  body: any;
} {
  if (!r) {
    return {
      headers: headers || {},
      body: undefined,
    };
  }
  if (r instanceof FormData) {
    return {
      body: r,
      headers: {
        ...headers,
        'content-type': 'multipart/form-data',
      },
    };
  }
  return {
    body: JSON.stringify(r),
    headers: {
      ...headers,
      'content-type': 'application/json',
    },
  };
}
async function makeRequest<T, J>(
  url: string,
  option: RequestOptions,
  body?: J,
  config?: ConHandleConfig
): Promise<ConHandleResponse<T>> {
  return new Promise((resolve) => {
    let headers: Record<string, any> = config?.headers || {};
    let transForm = null;
    if (body) {
      transForm = bodyTransform(body, option.headers);
      headers = {
        ...headers,
        ...transForm.headers,
      };
    }

    const req = selectClient(url)
      .request(
        url,
        {
          headers,
          ...option,
        },
        (res) => {
          let data = '';

          // A chunk of data has been received.
          res.on('data', (chunk) => {
            data += chunk;
          });

          // The whole response has been received. Print out the result.
          res.on('end', () => {
            resolve(fcTransform(res, data));
          });
        }
      )
      .on('error', (err) => {
        console.log(`Error: ${err.message}`);

        resolve({
          code: -1,
          data: null,
          headers: {},
        });
      });

    if (transForm && transForm.body) {
      req.write(transForm.body);
    }
    req.end();
  });
}

const NodeCon: ConHandle = {
  get: async (url, config) => {
    return makeRequest(url, {}, undefined, config);
  },
  post: async (url, body, config) => {
    return makeRequest(
      url,
      {
        method: 'POST',
      },
      body,
      config
    );
  },
  patch: async (url, body, config) => {
    return makeRequest(
      url,
      {
        method: 'PATCH',
      },
      body,
      config
    );
  },
  delete: async (url, config) => {
    return makeRequest(
      url,
      {
        method: 'DELETE',
      },
      undefined,
      config
    );
  },
};

export default NodeCon;
