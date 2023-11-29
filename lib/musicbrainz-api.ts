import * as assert from 'assert';

import { StatusCodes as HttpStatus } from 'http-status-codes';
import Debug from 'debug';

export { XmlMetadata } from './xml/xml-metadata.js';
export { XmlIsrc } from './xml/xml-isrc.js';
export { XmlIsrcList } from './xml/xml-isrc-list.js';
export { XmlRecording } from './xml/xml-recording.js';

import { XmlMetadata } from './xml/xml-metadata.js';
import { DigestAuth } from './digest-auth.js';

import { RateLimitThreshold } from 'rate-limit-threshold';
import * as mb from './musicbrainz.types.js';

import got, {type Options, type ToughCookieJar} from 'got';

import {type Cookie, CookieJar} from 'tough-cookie';

export * from './musicbrainz.types.js';

import { promisify } from 'util';

/*
 * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Subqueries
 */

export type RelationsIncludes =
  'area-rels'
  | 'artist-rels'
  | 'event-rels'
  | 'instrument-rels'
  | 'label-rels'
  | 'place-rels'
  | 'recording-rels'
  | 'release-rels'
  | 'release-group-rels'
  | 'series-rels'
  | 'url-rels'
  | 'work-rels';

export type SubQueryIncludes =
  /**
   * include discids for all media in the releases
   */
  'discids'
  /**
   * include media for all releases, this includes the # of tracks on each medium and its format.
   */
  | 'media'
  /**
   * include isrcs for all recordings
   */
  | 'isrcs'
  /**
   * include artists credits for all releases and recordings
   */
  | 'artist-credits'
  /**
   * include only those releases where the artist appears on one of the tracks, only valid on artists in combination with `releases`
   */
  | 'various-artists';

export type MiscIncludes =
  'aliases'
  | 'annotation'
  | 'tags'
  | 'genres'
  | 'ratings'
  | 'media';

export type AreaIncludes = Exclude<MiscIncludes, "ratings"> | RelationsIncludes;

export type ArtistIncludes =
  MiscIncludes
  | RelationsIncludes
  | 'recordings'
  | 'releases'
  | 'release-groups'
  | 'works';

export type CollectionIncludes =
  MiscIncludes
  | RelationsIncludes
  | 'user-collections';

export type EventIncludes = MiscIncludes | RelationsIncludes;

export type GenreIncludes = MiscIncludes;

export type InstrumentIncludes = MiscIncludes | RelationsIncludes;

export type LabelIncludes =
  MiscIncludes
  | RelationsIncludes
  | 'releases';

export type PlaceIncludes = MiscIncludes | RelationsIncludes;

export type RecordingIncludes =
  MiscIncludes
  | RelationsIncludes
  | SubQueryIncludes
  | 'artists'
  | 'releases'
  | 'isrcs';

export type ReleaseIncludes =
  MiscIncludes
  | SubQueryIncludes
  | RelationsIncludes
  | 'artists'
  | 'collections'
  | 'labels'
  | 'recordings'
  | 'release-groups';

export type ReleaseGroupIncludes =
  MiscIncludes
  | SubQueryIncludes
  | RelationsIncludes
  | 'artists'
  | 'releases';

export type SeriesIncludes = MiscIncludes | RelationsIncludes;

export type WorkIncludes = MiscIncludes | RelationsIncludes;

export type UrlIncludes = RelationsIncludes;

export type IFormData = {[key: string]: string | number};

const debug = Debug('musicbrainz-api');

export interface IMusicBrainzConfig {
  botAccount: {
    username?: string,
    password?: string
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

export interface ICsrfSession {
  sessionKey: string;
  token: string;
}

export interface ISessionInformation {
  csrf: ICsrfSession,
  loggedIn?: boolean;
}

export class MusicBrainzApi {

  private static escapeText(text: string): string {
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
    baseUrl: 'https://musicbrainz.org',
    botAccount: {}
  };

  private rateLimiter: RateLimitThreshold;
  private options: Options;
  private session?: ISessionInformation;

  public static fetchCsrf(html: string): ICsrfSession {
    return {
      sessionKey: MusicBrainzApi.fetchValue(html, 'csrf_session_key') as string,
      token: MusicBrainzApi.fetchValue(html, 'csrf_token') as string
    };
  }

  private static fetchValue(html: string, key: string): string | undefined{
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

  private getCookies: (currentUrl: string) => Promise<Cookie[]>;

  public constructor(_config?: IMusicBrainzConfig) {

    Object.assign(this.config, _config);

    const cookieJar: CookieJar = new CookieJar();
    this.getCookies = promisify(cookieJar.getCookies.bind(cookieJar));

    // @ts-ignore
    this.options = {
      prefixUrl: this.config.baseUrl as string,
      timeout: {
        read: 20 * 1000
      },
      headers: {
        'User-Agent': `${this.config.appName}/${this.config.appVersion} ( ${this.config.appContactInfo} )`
      },
      cookieJar: cookieJar as ToughCookieJar
    };

    this.rateLimiter = new RateLimitThreshold(15, 18);
  }

  public async restGet<T>(relUrl: string, query: { [key: string]: any; } = {}, attempt: number = 1): Promise<T> {

    query.fmt = 'json';

    const delay = await this.rateLimiter.limit();
    debug(`Client side rate limiter activated: cool down for ${Math.round(delay / 100)/10} s...`);
    const response: any = await got.get('ws/2' + relUrl, {
      ...this.options,
      searchParams: query,
      responseType: 'json',
      retry: {
        limit: 10
      }
    });
    return response.body;
  }

  /**
   * Lookup entity
   * @param entity 'area', 'artist', collection', 'instrument', 'label', 'place', 'release', 'release-group', 'recording', 'series', 'work', 'url' or 'event'
   * @param mbid Entity MBID
   * @param inc Query, like: {<entity>: <MBID:}
   */
  public lookup(entity: 'area', mbid: string): Promise<mb.IArea>;
  public lookup<T extends (keyof mb.LookupAreaIncludes)[]>(entity: 'area', mbid: string, inc: T): Promise<mb.IArea & { [K in T[number]]: mb.LookupAreaIncludes[K] }>;
  public lookup(entity: 'artist', mbid: string): Promise<mb.IArtist>;
  public lookup<T extends (keyof mb.LookupArtistIncludes)[]>(entity: 'artist', mbid: string, inc: T): Promise<mb.IArtist & { [K in T[number]]: mb.LookupArtistIncludes[K] }>;
  public lookup(entity: 'collection', mbid: string): Promise<mb.ICollection>;
  public lookup<T extends (keyof mb.LookupCollectionIncludes)[]>(entity: 'collection', mbid: string, inc: T): Promise<mb.ICollection & { [K in T[number]]: mb.LookupCollectionIncludes[K] }>;
  public lookup(entity: 'instrument', mbid: string): Promise<mb.IInstrument>;
  public lookup<T extends (keyof mb.LookupInstrumentIncludes)[]>(entity: 'instrument', mbid: string, inc: T): Promise<mb.IInstrument& { [K in T[number]]: mb.LookupInstrumentIncludes[K] }>;
  public lookup(entity: 'label', mbid: string): Promise<mb.ILabel>;
  public lookup<T extends (keyof mb.LookupLabelIncludes)[]>(entity: 'label', mbid: string, inc: T): Promise<mb.ILabel & { [K in T[number]]: mb.LookupLabelIncludes[K] }>;
  public lookup(entity: 'place', mbid: string): Promise<mb.IPlace>;
  public lookup<T extends (keyof mb.LookupPlaceIncludes)[]>(entity: 'place', mbid: string, inc: T): Promise<mb.IPlace & { [K in T[number]]: mb.LookupPlaceIncludes[K] }>;
  public lookup(entity: 'release', mbid: string): Promise<mb.IRelease>;
  public lookup<T extends (keyof mb.LookupReleaseIncludes)[]>(entity: 'release', mbid: string, inc: T): Promise<mb.IRelease & { [K in T[number]]: mb.LookupReleaseIncludes[K] }>;
  public lookup(entity: 'release-group', mbid: string): Promise<mb.IReleaseGroup>;
  public lookup<T extends (keyof mb.LookupReleaseGroupIncludes)[]>(entity: 'release-group', mbid: string, inc: T): Promise<mb.IReleaseGroup & { [K in T[number]]: mb.LookupReleaseGroupIncludes[K] }>;
  public lookup(entity: 'recording', mbid: string): Promise<mb.IRecording>;
  public lookup<T extends (keyof mb.LookupRecordingIncludes)[]>(entity: 'recording', mbid: string, inc: T): Promise<mb.IRecording & { [K in T[number]]: mb.LookupRecordingIncludes[K] }>;
  public lookup(entity: 'series', mbid: string): Promise<mb.ISeries>;
  public lookup<T extends (keyof mb.LookupSeriesIncludes)[]>(entity: 'series', mbid: string, inc: T): Promise<mb.ISeries & { [K in T[number]]: mb.LookupSeriesIncludes[K] }>;
  public lookup(entity: 'work', mbid: string): Promise<mb.IWork>;
  public lookup<T extends (keyof mb.LookupWorkIncludes)[]>(entity: 'work', mbid: string, inc: T): Promise<mb.IWork & { [K in T[number]]: mb.LookupWorkIncludes[K] }>;
  public lookup(entity: 'url', mbid: string): Promise<mb.IUrl>;
  public lookup<T extends (keyof mb.LookupUrlIncludes)[]>(entity: 'url', mbid: string, inc: T): Promise<mb.IUrl & { [K in T[number]]: mb.LookupUrlIncludes[K] }>;
  public lookup(entity: 'event', mbid: string): Promise<mb.IEvent>;
  public lookup<T extends (keyof mb.LookupEventIncludes)[]>(entity: 'event', mbid: string, inc: T): Promise<mb.IEvent & { [K in T[number]]: mb.LookupEventIncludes[K] }>;
  public lookup<T, I extends string = never>(entity: mb.EntityType, mbid: string, inc: I[] = []): Promise<T> {
    return this.restGet<T>(`/${entity}/${mbid}`, {inc: inc.join(' ')});
  }

  /**
   * Browse entity
   * https://wiki.musicbrainz.org/MusicBrainz_API#Browse
   * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
   * https://wiki.musicbrainz.org/Development/JSON_Web_Service#Browse_Requests
   * For example: http://musicbrainz.org/ws/2/release?label=47e718e1-7ee4-460c-b1cc-1192a841c6e5&offset=12&limit=2
   * @param entity MusicBrainz entity
   * @param query Query, like: {<entity>: <MBID:}
   */
  public browse(entity: 'area', query?: mb.IBrowseAreasQuery): Promise<mb.IBrowseAreasResult>;
  public browse(entity: 'artist', query?: mb.IBrowseArtistsQuery): Promise<mb.IBrowseArtistsResult>;
  public browse(entity: 'collection', query?: mb.IBrowseCollectionsQuery): Promise<mb.IBrowseCollectionsResult> ;
  public browse(entity: 'event', query?: mb.IBrowseEventsQuery): Promise<mb.IBrowseEventsResult>;
  public browse(entity: 'label', query?: mb.IBrowseLabelsQuery): Promise<mb.IBrowseLabelsResult>;
  public browse(entity: 'instrument', query?: mb.IBrowseInstrumentsQuery): Promise<mb.IBrowseInstrumentsResult>;
  public browse(entity: 'place', query?: mb.IBrowsePlacesQuery): Promise<mb.IBrowsePlacesResult>;
  public browse(entity: 'recording', query?: mb.IBrowseRecordingsQuery): Promise<mb.IBrowseRecordingsResult>;
  public browse(entity: 'release', query?: mb.IBrowseReleasesQuery): Promise<mb.IBrowseReleasesResult>;
  public browse(entity: 'release-group', query?: mb.IBrowseReleaseGroupsQuery): Promise<mb.IBrowseReleaseGroupsResult>;
  public browse(entity: 'series', query?: mb.IBrowseSeriesQuery): Promise<mb.IBrowseSeriesResult>;
  public browse(entity: 'url', query?: mb.IBrowseUrlsQuery): Promise<mb.IUrl>;
  public browse(entity: 'work', query?: mb.IBrowseWorksQuery): Promise<mb.IBrowseWorksResult>;
  public browse<T>(entity: mb.EntityType, query?: { [key: string]: any; }): Promise<T> {
    return this.restGet<T>(`/${entity}`, query);
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
  public search(entity:'area', query: mb.ISearchQuery<AreaIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IAreaList>;
  public search(artist:'artist', query: mb.ISearchQuery<ArtistIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IArtistList>;
  public search(artist:'recording', query: mb.ISearchQuery<AreaIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IRecordingList>;
  public search(artist:'release', query: mb.ISearchQuery<ReleaseIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IReleaseList>;
  public search(artist:'release-group', query: mb.ISearchQuery<ReleaseGroupIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IReleaseGroupList>;
  public search(artist:'url', query: mb.ISearchQuery<UrlIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IUrlList>;
  public search<T extends mb.ISearchResult, I extends string = never>(entity: mb.EntityType, query: mb.ISearchQuery<I>): Promise<T> {
    const urlQuery: any = {...query};
    if (typeof query.query === 'object') {
      urlQuery.query = makeAndQueryString(query.query);
    }
    if (Array.isArray(query.inc)) {
      urlQuery.inc = urlQuery.inc.join(' ');
    }
    return this.restGet<T>('/' + entity + '/', urlQuery);
  }

  // ---------------------------------------------------------------------------

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

    let digest: string | undefined;
    let n = 1;
    const postData = xmlMetadata.toXml();

    do {
      await this.rateLimiter.limit();
      const response: any = await got.post(path, {
        ...this.options,
        searchParams: {client: clientId},
        headers: {
          authorization: digest,
          'Content-Type': 'application/xml'
        },
        body: postData,
        throwHttpErrors: false
      });
      if (response.statusCode === HttpStatus.UNAUTHORIZED) {
        // Respond to digest challenge
        const auth = new DigestAuth(this.config.botAccount as {username: string, password: string});
        const relPath = response.requestUrl.pathname; // Ensure path is relative
        digest = auth.digest(response.request.method, relPath as string, response.headers['www-authenticate']);
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
      for (const cookie of await this.getCookies(this.options.prefixUrl as string)) {
        if (cookie.key === 'remember_login') {
          return true;
        }
      }
    }
    this.session = await this.getSession();

    const redirectUri = '/success';

    const formData = {
      username: this.config.botAccount.username,
      password: this.config.botAccount.password,
      csrf_session_key: this.session.csrf.sessionKey,
      csrf_token: this.session.csrf.token,
      remember_me: 1
    };

    const response = await got.post('login', {
      ...this.options,
      followRedirect: false,
      searchParams: {
        returnto: redirectUri
      },
      form: formData
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

    const response = await got.get('logout', {
      ...this.options,
      followRedirect: false,
      searchParams: {
        returnto: redirectUri
      }
    });
    const success = response.statusCode === HttpStatus.MOVED_TEMPORARILY && response.headers.location === redirectUri;
    if (success && this.session) {
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

    this.session = await this.getSession();

    formData.csrf_session_key = this.session.csrf.sessionKey;
    formData.csrf_token = this.session.csrf.token;
    formData.username = this.config.botAccount.username;
    formData.password = this.config.botAccount.password;
    formData.remember_me = 1;

    const response = await got.post(`${entity}/${mbid}/edit`, {
      ...this.options,
      form: formData,
      followRedirect: false
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

    const formData: {[key: string]: string | boolean | number} = {};

    formData['edit-recording.name'] = recording.title; // Required
    formData['edit-recording.comment'] = recording.disambiguation;
    formData['edit-recording.make_votable'] = true;

    formData['edit-recording.url.0.link_type_id'] = url2add.linkTypeId;
    formData['edit-recording.url.0.text'] = url2add.text;

    recording.isrcs?.forEach((isrcs, i) => {
      formData[`edit-recording.isrcs.${i}`] = isrcs;
    });

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

    const formData: IFormData = {};

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

  private async getSession(): Promise<ISessionInformation> {

    const response = await got.get('login', {
      ...this.options,
      followRedirect: false, // Disable redirects
      responseType: 'text'
    });

    return {
      csrf: MusicBrainzApi.fetchCsrf(response.body)
    };
  }
}

export function makeAndQueryString(keyValuePairs: IFormData): string {
  return Object.keys(keyValuePairs).map(key => `${key}:"${keyValuePairs[key]}"`).join(' AND ');
}
