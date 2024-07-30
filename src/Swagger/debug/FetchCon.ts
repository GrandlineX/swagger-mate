import { ConHandle, ConHandleResponse } from './BaseCon.js';

async function fcTransform<T>(
  r: Promise<Response>,
): Promise<ConHandleResponse<T>> {
  const res = await r;
  const head: Record<string, any> = {};

  res.headers.forEach((val: any, key: any) => {
    head[key] = val;
  });

  let data = null;

  if (head['content-type']?.includes('application/json')) {
    data = await res.json();
  } else if (head['content-type']?.includes('form-data')) {
    data = await res.formData();
  } else if (head['content-type']?.includes('octet-stream')) {
    data = await res.arrayBuffer();
  } else if (head['content-type']?.includes('text/plain')) {
    data = await res.text();
  }

  return {
    code: res.status,
    data,
    headers: head,
  };
}

function bodyTransform(r: any, headers?: Record<string, string>) {
  if (!r) {
    return {
      headers,
    };
  }
  if (r instanceof FormData) {
    return {
      body: r,
      headers: {
        ...headers,
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

const FetchCon: ConHandle = {
  get: async (url, config) => {
    return fcTransform(
      fetch(url, {
        method: 'GET',
        headers: {
          accept: 'application/json, text/plain, */*',
          ...config?.headers,
        },
      }),
    );
  },
  post: async (url, body, config) => {
    return fcTransform(
      fetch(url, {
        method: 'POST',
        ...bodyTransform(body, config?.headers),
      }),
    );
  },
  patch: async (url, body, config) => {
    return fcTransform(
      fetch(url, {
        method: 'PATCH',
        ...bodyTransform(body, config?.headers),
      }),
    );
  },
  delete: async (url, config) => {
    return fcTransform(
      fetch(url, {
        method: 'DELETE',
        headers: config?.headers,
      }),
    );
  },
};

export default FetchCon;
