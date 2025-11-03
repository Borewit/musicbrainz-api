import type {Cookie} from "tough-cookie";
import Debug from "debug";

export type HttpFormData = { [key: string]: string; }

const debug = Debug('musicbrainz-api-node');

/**
 * Allows multiple entries for the same key
 */
export type MultiQueryFormData = { [key: string]: string | string[]; }

export interface IHttpClientOptions {
  baseUrl: string,
  /**
   * Retry time-out, default 500 ms
   */
  timeout: number;
  userAgent: string;
  followRedirects?: boolean;
}

export interface IFetchOptions {
    query?: MultiQueryFormData;
    retryLimit?: number;
    body?: string;
    headers?: HeadersInit;
    followRedirects?: boolean;
}

function isConnectionReset(err: unknown): boolean {
  // Undici puts the OS error on .cause, with .code like 'ECONNRESET'
  const code = (err as any)?.cause?.code ?? (err as any)?.code;
  // Add other transient codes you consider safe to retry:
  return typeof code === "string" && code === 'ECONNRESET';
}

export class HttpClient {

  public constructor(protected httpOptions: IHttpClientOptions) {
  }

  public get(path: string, options?: IFetchOptions): Promise<Response> {
    return this._fetch('get', path, options);
  }

  public post(path: string, options?: IFetchOptions) {
    return this._fetch('post', path, options);
  }

  public postForm(path: string, formData: HttpFormData,  options?: IFetchOptions) {
    const encodedFormData = new URLSearchParams(formData).toString();
    return this._fetch('post', path, {...options, body: encodedFormData, headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
  }

  public postJson(path: string, json: Object,  options?: IFetchOptions) {
    const encodedJson = JSON.stringify(json);
    return this._fetch('post', path, {...options, body: encodedJson, headers: {'Content-Type': 'application/json.'}});
  }

  private async _fetch(method: string, path: string, options?: IFetchOptions): Promise<Response> {
    if (!options) options = {};

    let retryLimit = options.retryLimit && options.retryLimit > 1 ? options.retryLimit : 1;
    const retryTimeout = this.httpOptions.timeout ? this.httpOptions.timeout : 500;
    const url = this._buildUrl(path, options.query);
    const cookies = await this.getCookies();

    const headers: HeadersInit = new Headers(options.headers);
    headers.set('User-Agent', this.httpOptions.userAgent);
    if (cookies !== null) {
      headers.set('Cookie', cookies);
    }

    while (retryLimit > 0) {
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          ...options,
          headers,
          body: options.body,
          redirect: options.followRedirects === false ? 'manual' : 'follow'
        })}
      catch(err) {
        if(isConnectionReset(err)) {
          // Retry on TCP connection resets
          await this._delay(retryTimeout); // wait 200ms before retry
          continue;
        }
        throw err;
      }

      if (response.status === 429 || response.status === 503) {
        debug(`Received status=${response.status}, assume reached rate limit, retry in ${retryTimeout} ms`);
        retryLimit--;

        if (retryLimit > 0) {
          await this._delay(retryTimeout); // wait 200ms before retry
          continue;
        }
      }

      await this.registerCookies(response);
      return response;
    }

    throw new Error(`Failed to fetch ${url} after retries`);
  }

// Helper: Builds URL with query string
  private _buildUrl(path: string, query?: Record<string, string | string[]>): string {
    let url = path.startsWith('/')
      ? `${this.httpOptions.baseUrl}${path}`
      : `${this.httpOptions.baseUrl}/${path}`;

    if (query) {
      const urlSearchParams = new URLSearchParams();
      for (const key of Object.keys(query)) {
        const value = query[key];
        (Array.isArray(value) ? value : [value]).forEach(v => {
          urlSearchParams.append(key, v);
        });
      }
      url += `?${urlSearchParams.toString()}`;
    }

    return url;
  }

// Helper: Delays execution
  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected registerCookies(_response: Response): Promise<Cookie | undefined> {
    return Promise.resolve(undefined);
  }

  public async getCookies(): Promise<string | null> {
    return Promise.resolve(null);
  }

}
