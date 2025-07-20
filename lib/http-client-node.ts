import {type Cookie, CookieJar} from "tough-cookie";
import {HttpClient, type IHttpClientOptions} from "./http-client.js";

export type HttpFormData = { [key: string]: string; }

export class HttpClientNode extends HttpClient {

  private cookieJar: CookieJar;

  public constructor(options: IHttpClientOptions) {
    super(options);
    this.cookieJar = new CookieJar();
  }

  protected registerCookies(response: Response): Promise<Cookie | undefined> {
    const cookie = response.headers.get('set-cookie');
    if (cookie) {
      return this.cookieJar.setCookie(cookie, response.url);
    }
    return Promise.resolve(undefined);
  }

  public getCookies(): Promise<string | null> {
    return this.cookieJar.getCookieString(this.httpOptions.baseUrl); // Get cookies for the request
  }

}
