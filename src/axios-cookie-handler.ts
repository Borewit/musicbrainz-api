import {AxiosInstance} from "axios";
import * as tough from 'tough-cookie';

const cookieJar = new tough.CookieJar();

export function enableCookies(axios: AxiosInstance) {

  axios.interceptors.request.use(async config => {

    const url = (config.url.indexOf('://') > 0 || config.url.indexOf('//') === 0) ? config.url : config.baseURL + config.url;

    const cookies = await getCookies(url);

    if (!config.headers) {
      config.headers = {};
    }
    config.headers.cookie = cookies.join('; ');

    return config;
  });

  axios.interceptors.response.use(async response => {
    if (response.headers['set-cookie']) {
      for (const strCookie of response.headers['set-cookie']) {
        const cookie = tough.Cookie.parse(strCookie);
        await setCookie(cookie, response.request.path);
      }
    }
    return response;
  });
}

function setCookie(cookie: tough.Cookie, url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    cookieJar.setCookie(cookie, url, err => {
      if (err)
        reject(err);
      else resolve();
    });
  });
}

export function getCookies(url: string): Promise<tough.Cookie> {
  return new Promise<string[]>((resolve, reject) => {
    cookieJar.getCookies(url, (err, cookies) => {
      if (err)
        reject(err);
      else
        resolve(cookies);
    });
  });
}
