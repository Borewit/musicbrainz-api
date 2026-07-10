import Debug from 'debug';

export type HttpFormData = { [key: string]: string };

const debug = Debug('musicbrainz-api:http-client');

/**
 * Allows multiple entries for the same key
 */
export type MultiQueryFormData = { [key: string]: string | string[] };

export interface IHttpClientOptions {
  baseUrl: string;
  /**
   * Base retry delay in milliseconds. The delay increases linearly after each failed attempt.
   */
  timeout: number;
  userAgent: string;
  /**
   * OAuth Bearer access token sent as the Authorization header.
   */
  accessToken?: string;
  followRedirects?: boolean;
  /** milliseconds after which to timeout request */
  requestTimeout?: number;
}

export interface IFetchOptions {
  query?: MultiQueryFormData;
  /** Maximum number of attempts, including the initial request. Defaults to 1. */
  retryLimit?: number;
  body?: string;
  headers?: HeadersInit;
  followRedirects?: boolean;
}

function isTransientConnectionError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) {
    return false;
  }

  const error = err as { code?: unknown; cause?: unknown; errors?: unknown };
  // Node can mix IPv4 timeouts with unreachable IPv6 addresses in one aggregate.
  if (Array.isArray(error.errors)) {
    return error.errors.length > 0 && error.errors.every(isTransientConnectionError);
  }

  if (
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
    error.code === 'ENETUNREACH'
  ) {
    return true;
  }

  // Fetch wraps Node/Undici connection errors in a TypeError's cause.
  return isTransientConnectionError(error.cause);
}

export class HttpClient {
  public constructor(protected httpOptions: IHttpClientOptions) {}

  public get(path: string, options?: IFetchOptions): Promise<Response> {
    return this._fetch('get', path, options);
  }

  public post(path: string, options?: IFetchOptions) {
    return this._fetch('post', path, options);
  }

  public postForm(path: string, formData: HttpFormData, options?: IFetchOptions) {
    const encodedFormData = new URLSearchParams(formData).toString();
    return this._fetch('post', path, {
      ...options,
      body: encodedFormData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  public postJson(path: string, json: object, options?: IFetchOptions) {
    const encodedJson = JSON.stringify(json);
    return this._fetch('post', path, {
      ...options,
      body: encodedJson,
      headers: { 'Content-Type': 'application/json.' }
    });
  }

  private async _fetch(method: string, path: string, options?: IFetchOptions): Promise<Response> {
    const requestOptions = options || {};

    const maxAttempts =
      typeof requestOptions.retryLimit === 'number' && Number.isFinite(requestOptions.retryLimit)
        ? Math.max(1, Math.floor(requestOptions.retryLimit))
        : 1;
    const retryTimeout = this.httpOptions.timeout ? this.httpOptions.timeout : 500;
    const url = this._buildUrl(path, requestOptions.query);

    const headers = new Headers(requestOptions.headers);
    headers.set('User-Agent', this.httpOptions.userAgent);

    const existingAuth = headers.get('Authorization');
    if (this.httpOptions.accessToken && (!existingAuth || existingAuth.trim() === '')) {
      if (new URL(url).protocol !== 'https:') {
        throw new Error("HttpClient: 'accessToken' requires an HTTPS baseUrl (RFC 6750).");
      }
      headers.set('Authorization', `Bearer ${this.httpOptions.accessToken}`);
    }

    let attempt = 0;
    while (attempt < maxAttempts) {
      if (attempt > 0) {
        await this._delay(retryTimeout * attempt);
      }
      ++attempt;
      const retryDelay = retryTimeout * attempt;
      const signal = this.httpOptions.requestTimeout !== undefined
        ? AbortSignal.timeout(this.httpOptions.requestTimeout)
        : undefined;
      let response: Response;
      try {
        response = await fetch(url, {
          method,
          ...requestOptions,
          signal,
          headers,
          body: requestOptions.body,
          redirect: requestOptions.followRedirects === false ? 'manual' : 'follow'
        });
      } catch (err) {
        if (attempt < maxAttempts && isTransientConnectionError(err)) {
          debug(
            `Transient connection failure on attempt ${attempt}/${maxAttempts}: ${err instanceof Error ? err.message : 'unknown error'}; retry in ${retryDelay} ms`
          );
          continue;
        }
        debug('Fetch failed on attempt %d/%d: %O', attempt, maxAttempts, err);
        throw err;
      }

      if ((response.status === 429 || response.status === 503) && attempt < maxAttempts) {
        debug(`Received status=${response.status} on attempt ${attempt}/${maxAttempts}, retry in ${retryDelay} ms`);
        await response.body?.cancel();
        continue;
      }

      debug(`Received status=${response.status}`);

      return response;
    }

    throw new Error(`Failed to fetch ${url} after ${maxAttempts} attempts`);
  }

  // Helper: Builds URL with query string
  private _buildUrl(path: string, query?: Record<string, string | string[]>): string {
    let url = path.startsWith('/') ? `${this.httpOptions.baseUrl}${path}` : `${this.httpOptions.baseUrl}/${path}`;

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
}
