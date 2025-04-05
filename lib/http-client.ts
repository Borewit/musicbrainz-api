import type {Cookie} from "tough-cookie";

export type HttpFormData = { [key: string]: string; }

export interface IHttpClientOptions {
  baseUrl: string,
  timeout: number;
  userAgent: string;
  followRedirects?: boolean;
}

export interface IFetchOptions {
    query?: HttpFormData;
    retryLimit?: number;
    body?: string;
    headers?: HeadersInit;
    followRedirects?: boolean;
}

export class HttpClient {

  public constructor(protected options: IHttpClientOptions) {
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

  // biome-ignore lint/complexity/noBannedTypes:
  public postJson(path: string, json: Object,  options?: IFetchOptions) {
    const encodedJson = JSON.stringify(json);
    return this._fetch('post', path, {...options, body: encodedJson, headers: {'Content-Type': 'application/json.'}});
  }

  private async _fetch(method: string, path: string, options?: IFetchOptions): Promise<Response> {

    if (!options) options = {};

    let url = path.startsWith('/') ? `${this.options.baseUrl}${path}` : `${this.options.baseUrl}/${path}`;
    if (options.query) {
        url += `?${new URLSearchParams(options.query)}`;
    }

    const cookies = await this.getCookies();

    const headers: HeadersInit = new Headers(options.headers);
    headers.set('User-Agent', this.options.userAgent);
    if (cookies !== null) {
      headers.set('Cookie', cookies);
    }

    const response = await fetch(url, {
      method,
      ...options,
      headers,
      body: options.body,
      redirect: options.followRedirects === false ? 'manual' : 'follow'
    });
    await this.registerCookies(response);
    return response;
  }

  protected registerCookies(response: Response): Promise<Cookie | undefined> {
    return Promise.resolve(undefined);
  }

  public async getCookies(): Promise<string | null> {
    return Promise.resolve(null);
  }

}
