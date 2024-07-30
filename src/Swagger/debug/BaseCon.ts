/**
 * THIS FILE IS AUTOMATICALLY GENERATED
 * DO NOT EDIT THIS FILE
 */

import FormData from 'form-data';

export type ErrorType = {
  type: string;
  global?: string[];
  field?: { key: string; message: string }[];
};

export type HeaderType = string | string[] | number | undefined;
export type HandleRes<T> = {
  success: boolean;
  data: T | null;
  code?: number;
  error?: ErrorType;
  headers?: Record<string, HeaderType>;
};

export type PathParam = { [key: string]: string | number | undefined };
export function isErrorType(x: any): x is ErrorType {
  return x && typeof x === 'object' && x.type === 'error';
}

export interface ConHandleConfig {
  headers?: Record<string, string>;
  param?: PathParam;
  query?: PathParam;
}
export interface ConHandleResponse<T> {
  code: number;
  data: T | null;
  headers: Record<string, HeaderType>;
}

export interface ConHandle {
  get<T>(url: string, config?: ConHandleConfig): Promise<ConHandleResponse<T>>;
  post<T, J>(
    url: string,
    body?: J,
    config?: ConHandleConfig,
  ): Promise<ConHandleResponse<T>>;
  patch<T, J>(
    url: string,
    body?: J,
    config?: ConHandleConfig,
  ): Promise<ConHandleResponse<T>>;

  delete<T>(
    url: string,
    config?: ConHandleConfig,
  ): Promise<ConHandleResponse<T>>;
}
export default class BaseCon {
  api: string;

  permanentHeader: undefined | Record<string, string>;

  authorization: string | null;

  disconnected: boolean;

  failFlag: boolean;

  logger: (arg: any) => void;

  con: ConHandle;

  reconnect: () => Promise<boolean>;

  onReconnect: (con: BaseCon) => Promise<boolean>;

  constructor(conf: {
    con: ConHandle;
    endpoint: string;
    logger?: (arg: any) => void;
  }) {
    this.api = conf.endpoint;
    this.logger = conf.logger || console.log;
    this.disconnected = true;
    this.authorization = null;
    this.failFlag = false;
    this.con = conf.con;
    this.reconnect = async () => {
      this.disconnected = true;
      return false;
    };
    this.onReconnect = () => Promise.resolve(true);
    this.handle = this.handle.bind(this);
  }

  // Class helper functions

  isConnected() {
    return this.authorization !== null && !this.disconnected;
  }

  token() {
    return this.authorization || '';
  }

  p(path: string, config?: ConHandleConfig) {
    let pp = path;
    if (config?.param) {
      const e = Object.keys(config.param);
      for (const d of e) {
        pp = pp.replace(`{${d}}`, `${config.param[d]}`);
      }
    }
    if (config?.query) {
      const e = Object.keys(config.query);
      const slices = [];
      for (const d of e) {
        if (config.query[d]) {
          slices.push(`${d}=${config.query[d]}`);
        }
      }
      if (slices.length > 0) {
        pp += `?${slices.join('&')}`;
      }
    }
    return `${this.api}${pp}`;
  }

  async ping(): Promise<boolean> {
    try {
      const version = await this.con.get<{ api: number }>(this.p('/version'));
      return version.data?.api === 1 && version.code === 200;
    } catch (e) {
      this.logger('ping failed');
      return false;
    }
  }

  async test(email: string, password: string): Promise<boolean> {
    const ping = await this.ping();

    if (ping) {
      try {
        this.logger({ email, password });
        const con = await this.con.post<
          { token: string },
          {
            username: string;
            token: string;
          }
        >(this.p('/token'), {
          username: email,
          token: password,
        });
        return con.code === 200 || con.code === 201;
      } catch (e) {
        this.logger(e);
        this.logger('cant connect to backend');
      }
    }
    this.logger('test ping failed');

    return false;
  }

  async testToken(): Promise<boolean> {
    const ping = await this.ping();

    if (ping) {
      try {
        const con = await this.con.get<{ token: string }>(
          this.p('/test/auth'),
          {
            headers: {
              Authorization: this.token(),
            },
          },
        );
        return con.code === 200 || con.code === 201;
      } catch (e) {
        this.logger(e);
        this.logger('cant connect to backend');
      }
    }
    this.logger('test ping failed');

    return false;
  }

  async connect(email: string, pw: string): Promise<boolean> {
    const ping = await this.ping();

    if (ping) {
      try {
        const token = await this.con.post<
          { token: string },
          {
            username: string;
            token: string;
          }
        >(this.p('/token'), {
          username: email,
          token: pw,
        });
        // TODO check token
        if (token.code === 200 || token.code === 201) {
          this.authorization = `Bearer ${token.data?.token}`;
          this.disconnected = false;
          this.reconnect = async () => {
            return (await this.connect(email, pw)) && (await this.testToken());
          };
          return true;
        }
      } catch (e) {
        this.logger(e);
      }
    }
    this.logger('cant connect to backend');
    this.authorization = null;
    this.disconnected = true;
    return false;
  }

  /**
   * Enable client before auth
   */
  fakeEnableClient() {
    this.authorization = 'DEBUG';
    this.disconnected = false;
  }

  async handle<T, J>(
    type: 'POST' | 'GET' | 'PATCH' | 'DELETE',
    path: string,
    body?: J,
    config?: ConHandleConfig,
  ): Promise<HandleRes<T>> {
    if (!this.authorization || this.disconnected) {
      this.logger('Disconnected');
      return {
        success: false,
        data: null,
        code: -1,
      };
    }
    let formHeader = null;
    const cK = body as any;
    if (
      cK &&
      (cK instanceof FormData || typeof cK?.getHeaders === 'function')
    ) {
      formHeader = cK?.getHeaders?.() || {};
    } else {
      formHeader = {};
    }

    let dat: ConHandleResponse<T> | null;
    switch (type) {
      case 'GET':
        dat = await this.con.get<T>(this.p(path, config), {
          ...config,
          headers: {
            Authorization: this.token(),
            ...formHeader,
            ...config?.headers,
            ...this.permanentHeader,
          },
        });
        break;
      case 'POST':
        dat = await this.con.post<T, J>(this.p(path, config), body, {
          ...config,
          headers: {
            Authorization: this.token(),
            ...formHeader,
            ...config?.headers,
            ...this.permanentHeader,
          },
        });
        break;
      case 'PATCH':
        dat = await this.con.patch<T, J>(this.p(path, config), body, {
          ...config,
          headers: {
            Authorization: this.token(),
            ...formHeader,
            ...config?.headers,
            ...this.permanentHeader,
          },
        });
        break;
      case 'DELETE':
        dat = await this.con.delete<T>(this.p(path, config), {
          ...config,
          headers: {
            Authorization: this.token(),
            ...formHeader,
            ...config?.headers,
            ...this.permanentHeader,
          },
        });
        break;
      default:
        return {
          success: false,
          data: null,
          code: -1,
        };
    }

    let error: ErrorType | undefined;
    if (isErrorType(dat.data)) {
      error = dat.data;
    }
    let x = false;
    switch (dat.code) {
      case 200:
      case 201:
        return {
          success: true,
          data: dat.data,
          code: dat.code,
          error,
          headers: dat.headers,
        };

      case 498:
        x = await this.reconnect();
        if (x) {
          this.onReconnect(this).catch((dx) => {
            this.logger(dx);
          });
          return this.handle(type, path, body, config);
        }
        this.reconnect = async () => {
          this.disconnected = true;
          return false;
        };

        this.disconnected = true;
        return {
          success: false,
          data: null,
          code: dat.code,
          error,
          headers: dat.headers,
        };

      case 401:
        this.logger('AUTH NOT VALID');
        this.disconnected = true;
        return {
          success: false,
          data: null,
          code: dat.code,
          error,
          headers: dat.headers,
        };
      case 403:
        return {
          success: false,
          data: null,
          error,
          code: dat.code,
          headers: dat.headers,
        };

      default:
        return {
          success: false,
          data: null,
          error,
          code: dat.code,
          headers: dat.headers,
        };
    }
  }
}
