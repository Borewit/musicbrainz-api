import * as assert from 'assert';

import {StatusCodes as HttpStatus, getReasonPhrase} from 'http-status-codes';
import * as Url from 'url';
import * as Debug from 'debug';

export { XmlMetadata } from './xml/xml-metadata';
export { XmlIsrc } from './xml/xml-isrc';
export { XmlIsrcList } from './xml/xml-isrc-list';
export { XmlRecording } from './xml/xml-recording';

import { XmlMetadata } from './xml/xml-metadata';
import { DigestAuth } from './digest-auth';

import { RateLimiter } from './rate-limiter';
import * as mb from './musicbrainz.types';

import got, { Options } from 'got';
import * as tough from 'tough-cookie';

export * from './musicbrainz.types';

import { promisify } from 'util';

const retries = 3;

/**
 * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Subqueries
 */
export type Includes =
  'artists'
  | 'releases'
  | 'recordings'
  | 'artist-credits'
  | 'isrcs'
  | 'url-rels'
  | 'release-groups'
  | 'aliases'
  | 'discids'
  | 'annotation'
  | 'media' // release-groups
  | 'area-rels'
  | 'artist-rels'
  | 'event-rels'
  | 'instrument-rels'
  | 'label-rels'
  | 'place-rels'
  | 'recording-rels'
  | 'release-rels'
  | 'release-group-rels'
  | 'series-rels'
  | 'work-rels';

const debug = Debug('musicbrainz-api');

export interface IFormData {
  [key: string]: string | number;
}

export interface IMusicBrainzConfig {
  botAccount?: {
    username: string,
    password: string
  },
  baseUrl?: string,

  appName?: string,
  appVersion?: string,

  /**
   * HTTP Proxy
   */
  proxy?: string,

  /**
   * User e-mail address or application URL
   */
  appContactInfo?: string
}

export interface ISessionInformation {
  csrf: {
    sessionKey: string;
    token: string;
  }
  loggedIn?: boolean;
}

export class MusicBrainzApi {

  private static escapeText(text) {
    let str = '';
    for (const chr of text) {
      // Escaping Special Characters: + - && || ! ( ) { } [ ] ^ " ~ * ? : \ /
      // ToDo: && ||
      switch (chr) {
        case '+':
        case '-':
        case '!':
        case '(':
        case ')':
        case '{':
        case '}':
        case '[':
        case ']':
        case '^':
        case '"':
        case '~':
        case '*':
        case '?':
        case ':':
        case '\\':
        case '/':
          str += '\\';

      }
      str += chr;
    }
    return str;
  }

  public readonly config: IMusicBrainzConfig = {
    baseUrl: 'https://musicbrainz.org'
  };

  private rateLimiter: RateLimiter;
  private options: Options;
  private session: ISessionInformation;

  public static fetchCsrf(html: string) {
    return {
      sessionKey: MusicBrainzApi.fetchValue(html, 'csrf_session_key'),
      token: MusicBrainzApi.fetchValue(html, 'csrf_token')
    };
  }

  private static fetchValue(html: string, key: string) {
    let pos = html.indexOf(`name="${key}"`);
    if (pos >= 0) {
      pos = html.indexOf('value="', pos + key.length + 7);
      if (pos >= 0) {
        pos += 7;
        const endValuePos = html.indexOf('"', pos);
        const value = html.substring(pos, endValuePos);
        return value;
      }
    }
  }

  private getCookies: (currentUrl: string | URL) => Promise<tough.Cookie[]>;

  public constructor(_config?: IMusicBrainzConfig) {

    Object.assign(this.config, _config);

    const cookieJar = new tough.CookieJar();
    this.getCookies = promisify(cookieJar.getCookies.bind(cookieJar));

    this.options = {
      prefixUrl: this.config.baseUrl,
      timeout: 20 * 1000,
      headers: {
        'User-Agent': `${this.config.appName}/${this.config.appVersion} ( ${this.config.appContactInfo} )`
      },
      cookieJar
    };

    this.rateLimiter = new RateLimiter(60, 50);
  }

  public async restGet<T>(relUrl: string, query: { [key: string]: any; } = {}, attempt: number = 1): Promise<T> {

    query.fmt = 'json';

    let response: any;
    await this.rateLimiter.limit();
    do {
      response = await got.get('ws/2' + relUrl, {
        searchParams: query,
        responseType: 'json',
        ...this.options
      });
      if (response.statusCode !== 503)
        break;
      debug('Rate limiter kicked in, slowing down...');
      await RateLimiter.sleep(500);
    } while (true);

    switch (response.statusCode) {
      case HttpStatus.OK:
        return response.body;

      case HttpStatus.BAD_REQUEST:
      case HttpStatus.NOT_FOUND:
        throw new Error(`Got response status ${response.statusCode}: ${getReasonPhrase(response.status)}`);

      case HttpStatus.SERVICE_UNAVAILABLE: // 503
      default:
        const msg = `Got response status ${response.statusCode} on attempt #${attempt} (${getReasonPhrase(response.status)})`;
        debug(msg);
        if (attempt < retries) {
          return this.restGet<T>(relUrl, query, attempt + 1);
        } else
          throw new Error(msg);
    }
  }

  // -----------------------------------------------------------------------------------------------------------------
  // Lookup functions
  // -----------------------------------------------------------------------------------------------------------------

  /**
   * Generic lookup function
   * @param entity
   * @param mbid
   * @param inc
   */
  public lookupEntity<T>(entity: mb.EntityType, mbid: string, inc: Includes[] = []): Promise<T> {
    return this.restGet<T>(`/${entity}/${mbid}`, {inc: inc.join(' ')});
  }

  /**
   * Lookup area
   * @param areaId Area MBID
   * @param inc Sub-queries
   */
  public lookupArea(areaId: string, inc: Includes[] = []): Promise<mb.IArea> {
    return this.lookupEntity<mb.IArea>('area', areaId, inc);
  }

  /**
   * Lookup artist
   * @param artistId Artist MBID
   * @param inc Sub-queries
   */
  public lookupArtist(artistId: string, inc: Includes[] = []): Promise<mb.IArtist> {
    return this.lookupEntity<mb.IArtist>('artist', artistId, inc);
  }

  /**
   * Lookup instrument
   * @param artistId Instrument MBID
   * @param inc Sub-queries
   */
  public lookupInstrument(instrumentId: string, inc: Includes[] = []): Promise<mb.IInstrument> {
    return this.lookupEntity<mb.IInstrument>('instrument', instrumentId, inc);
  }

  /**
   * Lookup label
   * @param labelId Area MBID
   * @param inc Sub-queries
   */
  public lookupLabel(labelId: string, inc: Includes[] = []): Promise<mb.ILabel> {
    return this.lookupEntity<mb.ILabel>('label', labelId, inc);
  }

  /**
   * Lookup place
   * @param placeId Area MBID
   * @param inc Sub-queries
   */
  public lookupPlace(placeId: string, inc: Includes[] = []): Promise<mb.IPlace> {
    return this.lookupEntity<mb.IPlace>('place', placeId, inc);
  }

  /**
   * Lookup release
   * @param releaseId Release MBID
   * @param inc Include: artist-credits, labels, recordings, release-groups, media, discids, isrcs (with recordings)
   * ToDo: ['recordings', 'artists', 'artist-credits', 'isrcs', 'url-rels', 'release-groups']
   */
  public lookupRelease(releaseId: string, inc: Includes[] = []): Promise<mb.IRelease> {
    return this.lookupEntity<mb.IRelease>('release', releaseId, inc);
  }

  /**
   * Lookup release-group
   * @param releaseGroupId Release-group MBID
   * @param inc Include: ToDo
   */
  public lookupReleaseGroup(releaseGroupId: string, inc: Includes[] = []): Promise<mb.IReleaseGroup> {
    return this.lookupEntity<mb.IReleaseGroup>('release-group', releaseGroupId, inc);
  }

  /**
   * Lookup recording
   * @param recordingId Label MBID
   * @param inc Include: artist-credits, isrcs
   */
  public lookupRecording(recordingId: string, inc: Includes[] = []): Promise<mb.IRecording> {
    return this.lookupEntity<mb.IRecording>('recording', recordingId, inc);
  }

  /**
   * Lookup work
   * @param workId Work MBID
   */
  public lookupWork(workId: string): Promise<mb.IWork> {
    return this.lookupEntity<mb.IWork>('work', workId);
  }

  /**
   * Lookup URL
   * @param urlId URL MBID
   */
  public lookupUrl(urlId: string): Promise<mb.IUrl> {
    return this.lookupEntity<mb.IUrl>('url', urlId);
  }

  public async postRecording(xmlMetadata: XmlMetadata): Promise<void> {
    return this.post('recording', xmlMetadata);
  }

  public async post(entity: mb.EntityType, xmlMetadata: XmlMetadata): Promise<void> {

    if (!this.config.appName || !this.config.appVersion) {
      throw new Error(`XML-Post requires the appName & appVersion to be defined`);
    }

    const clientId = `${this.config.appName.replace(/-/g, '.')}-${this.config.appVersion}`;

    const path = `ws/2/${entity}/`;
    // Get digest challenge

    let digest: string = null;
    let n = 1;
    const postData = xmlMetadata.toXml();

    do {
      await this.rateLimiter.limit();
      const response: any = await got.post(path, {
        searchParams: {client: clientId},
        headers: {
          authorization: digest,
          'Content-Type': 'application/xml'
        },
        body: postData,
        throwHttpErrors: false,
        ...this.options
      });
      if (response.statusCode === HttpStatus.UNAUTHORIZED) {
        // Respond to digest challenge
        const auth = new DigestAuth(this.config.botAccount);
        const relPath = Url.parse(response.requestUrl).path; // Ensure path is relative
        digest = auth.digest(response.request.method, relPath, response.headers['www-authenticate']);
        ++n;
      } else {
        break;
      }
    } while (n++ < 5);
  }

  public async login(): Promise<boolean> {

    assert.ok(this.config.botAccount.username, 'bot username should be set');
    assert.ok(this.config.botAccount.password, 'bot password should be set');

    if (this.session && this.session.loggedIn) {
      for (const cookie of await this.getCookies(this.options.prefixUrl)) {
        if (cookie.key === 'remember_login') {
          return true;
        }
      }
    }
    this.session = await this.getSession(this.config.baseUrl);

    const redirectUri = '/success';

    const formData = {
      username: this.config.botAccount.username,
      password: this.config.botAccount.password,
      csrf_session_key: this.session.csrf.sessionKey,
      csrf_token: this.session.csrf.token,
      remember_me: 1
    };

    const response: any = await got.post('login', {
      followRedirect: false,
      searchParams: {
        returnto: redirectUri
      },
      form: formData,
      ...this.options
    });
    const success = response.statusCode === HttpStatus.MOVED_TEMPORARILY && response.headers.location === redirectUri;
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

    const response: any = await got.get('logout', {
      followRedirect: false,
      searchParams: {
        returnto: redirectUri
      },
      ...this.options
    });
    const success = response.statusCode === HttpStatus.MOVED_TEMPORARILY && response.headers.location === redirectUri;
    if (success) {
      this.session.loggedIn = true;
    }
    return success;
  }

  /**
   * Submit entity
   * @param entity Entity type e.g. 'recording'
   * @param mbid
   * @param formData
   */
  public async editEntity(entity: mb.EntityType, mbid: string, formData: Record<string, any>): Promise<void> {

    await this.rateLimiter.limit();

    this.session = await this.getSession(this.config.baseUrl);

    formData.csrf_session_key = this.session.csrf.sessionKey;
    formData.csrf_token = this.session.csrf.token;
    formData.username = this.config.botAccount.username;
    formData.password = this.config.botAccount.password;
    formData.remember_me = 1;

    const response: any = await got.post(`${entity}/${mbid}/edit`, {
      form: formData,
      followRedirect: false,
      ...this.options
    });
    if (response.statusCode === HttpStatus.OK)
      throw new Error(`Failed to submit form data`);
    if (response.statusCode === HttpStatus.MOVED_TEMPORARILY)
      return;
    throw new Error(`Unexpected status code: ${response.statusCode}`);
  }

  /**
   * Set URL to recording
   * @param recording Recording to update
   * @param url2add URL to add to the recording
   * @param editNote Edit note
   */
  public async addUrlToRecording(recording: mb.IRecording, url2add: { linkTypeId: mb.LinkType, text: string }, editNote: string = '') {

    const formData = {};

    formData['edit-recording.name'] = recording.title; // Required
    formData['edit-recording.comment'] = recording.disambiguation;
    formData['edit-recording.make_votable'] = true;

    formData['edit-recording.url.0.link_type_id'] = url2add.linkTypeId;
    formData['edit-recording.url.0.text'] = url2add.text;

    for (const i in recording.isrcs) {
      formData[`edit-recording.isrcs.${i}`] = recording.isrcs[i];
    }

    formData['edit-recording.edit_note'] = editNote;

    return this.editEntity('recording', recording.id, formData);
  }

  /**
   * Add ISRC to recording
   * @param recording Recording to update
   * @param isrc ISRC code to add
   * @param editNote Edit note
   */
  public async addIsrc(recording: mb.IRecording, isrc: string, editNote: string = '') {

    const formData = {};

    formData[`edit-recording.name`] = recording.title; // Required

    if (!recording.isrcs) {
      throw new Error('You must retrieve recording with existing ISRC values');
    }

    if (recording.isrcs.indexOf(isrc) === -1) {
      recording.isrcs.push(isrc);

      for (const i in recording.isrcs) {
        formData[`edit-recording.isrcs.${i}`] = recording.isrcs[i];
      }
      return this.editEntity('recording', recording.id, formData);
    }
  }

  // -----------------------------------------------------------------------------------------------------------------
  // Query functions
  // -----------------------------------------------------------------------------------------------------------------

  /**
   * Search an entity using a search query
   * @param query e.g.: '" artist: Madonna, track: Like a virgin"' or object with search terms: {artist: Madonna}
   * @param entity e.g. 'recording'
   * @param query Arguments
   */
  public search<T extends mb.ISearchResult>(entity: mb.EntityType, query: mb.ISearchQuery): Promise<T> {
    const urlQuery: any = {...query};
    if (typeof query.query === 'object') {
      urlQuery.query = makeAndQueryString(query.query);
    }
    if (Array.isArray(query.inc)) {
      urlQuery.inc = urlQuery.inc.join(' ');
    }
    return this.restGet<T>('/' + entity + '/', urlQuery);
  }

  // -----------------------------------------------------------------------------------------------------------------
  // Helper functions
  // -----------------------------------------------------------------------------------------------------------------

  /**
   * Add Spotify-ID to MusicBrainz recording.
   * This function will automatically lookup the recording title, which is required to submit the recording URL
   * @param recording MBID of the recording
   * @param spotifyId Spotify ID
   * @param editNote Comment to add.
   */
  public addSpotifyIdToRecording(recording: mb.IRecording, spotifyId: string, editNote: string) {

    assert.strictEqual(spotifyId.length, 22);

    return this.addUrlToRecording(recording, {
      linkTypeId: mb.LinkType.stream_for_free,
      text: 'https://open.spotify.com/track/' + spotifyId
    }, editNote);
  }

  public searchArea(query: mb.ISearchQuery & mb.ILinkedEntitiesArea): Promise<mb.IAreaList> {
    return this.search<mb.IAreaList>('area', query);
  }

  public searchArtist(query: mb.ISearchQuery & mb.ILinkedEntitiesArtist): Promise<mb.IArtistList> {
    return this.search<mb.IArtistList>('artist', query);
  }

  public searchRelease(query: mb.ISearchQuery & mb.ILinkedEntitiesRelease): Promise<mb.IReleaseList> {
    return this.search<mb.IReleaseList>('release', query);
  }

  public searchReleaseGroup(query: mb.ISearchQuery & mb.ILinkedEntitiesReleaseGroup): Promise<mb.IReleaseGroupList> {
    return this.search<mb.IReleaseGroupList>('release-group', query);
  }

  public searchUrl(query: mb.ISearchQuery & mb.ILinkedEntitiesUrl): Promise<mb.IUrlList> {
    return this.search<mb.IUrlList>('url', query);
  }

  private async getSession(url: string): Promise<ISessionInformation> {

    const response: any = await got.get('login', {
      followRedirect: false, // Disable redirects
      responseType: 'text',
      ...this.options
    });

    return {
      csrf: MusicBrainzApi.fetchCsrf(response.body)
    };
  }
}

export function makeAndQueryString(keyValuePairs: IFormData): string {
  return Object.keys(keyValuePairs).map(key => `${key}:"${keyValuePairs[key]}"`).join(' AND ');
}
