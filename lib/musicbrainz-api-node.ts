import { StatusCodes as HttpStatus } from 'http-status-codes';
import Debug from 'debug';

export { XmlMetadata } from './xml/xml-metadata.js';
export { XmlIsrc } from './xml/xml-isrc.js';
export { XmlIsrcList } from './xml/xml-isrc-list.js';
export { XmlRecording } from './xml/xml-recording.js';
import {HttpClientNode, type HttpFormData} from "./http-client-node.js";
import {MusicBrainzApi as MusicBrainzApiDefault} from "./musicbrainz-api.js";

export * from './musicbrainz.types.js';
export * from './http-client.js';

/*
 * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Subqueries
 */

const debug = Debug('musicbrainz-api-node');

export class MusicBrainzApi extends MusicBrainzApiDefault {

  protected initHttpClient(): HttpClientNode {
    return new HttpClientNode({
      baseUrl: this.config.baseUrl,
      timeout: 20 * 1000,
      userAgent: `${this.config.appName}/${this.config.appVersion} ( ${this.config.appContactInfo} )`
    });
  }

  public async login(): Promise<boolean> {

    if (!this.config.botAccount?.username) throw new Error('bot username should be set');
    if (!this.config.botAccount?.password) throw new Error('bot password should be set');

    if (this.session?.loggedIn) {
      const cookies = await this.httpClient.getCookies() as string;
      return cookies.indexOf('musicbrainz_server_session') !== -1;
    }
    this.session = await this.getSession();

    const redirectUri = '/success';

    const formData: HttpFormData = {
      username: this.config.botAccount.username,
      password: this.config.botAccount.password,
      csrf_session_key: this.session.csrf.sessionKey,
      csrf_token: this.session.csrf.token,
      remember_me: '1'
    };

    const response = await this.httpClient.postForm('login', formData, {
      query: {
        returnto: redirectUri
      },
      followRedirects: false
    });

    const success = response.status === HttpStatus.MOVED_TEMPORARILY && response.headers.get('location') === redirectUri;
    if (success) {
      this.session.loggedIn = true;
    }
    return success;
  }

  /**
   * Logout
   */
  public async logout(): Promise<boolean> {
    const redirectUri = '/success';

    const response = await this.httpClient.post('logout', {
      followRedirects: false,
      query: {
        returnto: redirectUri
      }
    });
    const success = response.status === HttpStatus.MOVED_TEMPORARILY && response.headers.get('location') === redirectUri;
    if (success && this.session) {
      this.session.loggedIn = true;
    }
    return success;
  }

}
