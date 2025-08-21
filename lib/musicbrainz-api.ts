import { StatusCodes as HttpStatus } from 'http-status-codes';
import Debug from 'debug';
import type { XmlMetadata } from './xml/xml-metadata.js';
import { DigestAuth } from './digest-auth.js';

import { RateLimitThreshold } from 'rate-limit-threshold';
import * as mb from './musicbrainz.types.js';
import { HttpClient, type MultiQueryFormData } from "./http-client.js";

export { XmlMetadata } from './xml/xml-metadata.js';
export { XmlIsrc } from './xml/xml-isrc.js';
export { XmlIsrcList } from './xml/xml-isrc-list.js';
export { XmlRecording } from './xml/xml-recording.js';

export * from './musicbrainz.types.js';

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

export type AreaIncludes = MiscIncludes | RelationsIncludes;

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
  | 'release-groups'
  | 'recording-level-rels';

export type ReleaseGroupIncludes =
  MiscIncludes
  | SubQueryIncludes
  | RelationsIncludes
  | 'artists'
  | 'releases';

export type SeriesIncludes = MiscIncludes | RelationsIncludes;

export type WorkIncludes = MiscIncludes | RelationsIncludes;

export type UrlIncludes = RelationsIncludes;

export type IFormData = { [key: string]: string | number };


const debug = Debug('musicbrainz-api');

export interface IMusicBrainzConfig {
  botAccount?: {
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
  appContactInfo?: string,

  disableRateLimiting?: boolean
}

interface IInternalConfig extends IMusicBrainzConfig {
  baseUrl: string,
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

  public readonly config: IInternalConfig;

  protected rateLimiter: RateLimitThreshold;
  protected httpClient: HttpClient;
  protected session?: ISessionInformation;

  public static fetchCsrf(html: string): ICsrfSession {
    return {
      sessionKey: MusicBrainzApi.fetchValue(html, 'csrf_session_key') as string,
      token: MusicBrainzApi.fetchValue(html, 'csrf_token') as string
    };
  }

  private static fetchValue(html: string, key: string): string | undefined {
    let pos = html.indexOf(`name="${key}"`);
    if (pos >= 0) {
      pos = html.indexOf('value="', pos + key.length + 7);
      if (pos >= 0) {
        pos += 7;
        const endValuePos = html.indexOf('"', pos);
        return html.substring(pos, endValuePos);
      }
    }
  }

  public constructor(_config?: IMusicBrainzConfig) {

    this.config = {
      ...{
        baseUrl: 'https://musicbrainz.org'
      },
      ..._config
    }

    this.httpClient = this.initHttpClient();

    this.rateLimiter = new RateLimitThreshold(15, 18);
  }

  protected initHttpClient(): HttpClient {
    return new HttpClient({
      baseUrl: this.config.baseUrl,
      timeout: 500,
      userAgent: `${this.config.appName}/${this.config.appVersion} ( ${this.config.appContactInfo} )`
    });
  }

  public async restGet<T>(relUrl: string, query: MultiQueryFormData = {}): Promise<T> {

    query.fmt = 'json';

    await this.applyRateLimiter();

    const response = await this.httpClient.get(`/ws/2${relUrl}`, {
      query,
      retryLimit: 10
    });
    return response.json();
  }

  /**
   * Lookup entity
   * @param entity 'area', 'artist', collection', 'instrument', 'label', 'place', 'release', 'release-group', 'recording', 'series', 'work', 'url' or 'event'
   * @param mbid Entity MBID
   * @param inc Includes, which allows you to request more information to be included about the entity
   */
  public lookup(entity: 'area', mbid: string, inc?: AreaIncludes[]): Promise<mb.IArea>;
  public lookup(entity: 'artist', mbid: string, inc?: ArtistIncludes[]): Promise<mb.IArtist>;
  public lookup(entity: 'collection', mbid: string, inc?: CollectionIncludes[]): Promise<mb.ICollection>;
  public lookup(entity: 'instrument', mbid: string, inc?: InstrumentIncludes[]): Promise<mb.IInstrument>;
  public lookup(entity: 'label', mbid: string, inc?: LabelIncludes[]): Promise<mb.ILabel>;
  public lookup(entity: 'place', mbid: string, inc?: PlaceIncludes[]): Promise<mb.IPlace>;
  public lookup(entity: 'release', mbid: string, inc?: ReleaseIncludes[]): Promise<mb.IRelease>;
  public lookup(entity: 'release-group', mbid: string, inc?: ReleaseGroupIncludes[]): Promise<mb.IReleaseGroup>;
  public lookup(entity: 'recording', mbid: string, inc?: RecordingIncludes[]): Promise<mb.IRecording>;
  public lookup(entity: 'series', mbid: string, inc?: SeriesIncludes[]): Promise<mb.ISeries>;
  public lookup(entity: 'work', mbid: string, inc?: WorkIncludes[]): Promise<mb.IWork>;
  public lookup(entity: 'url', mbid: string, inc?: UrlIncludes[]): Promise<mb.IUrl>;
  public lookup(entity: 'event', mbid: string, inc?: EventIncludes[]): Promise<mb.IEvent>;
  public lookup<T, I extends string = never>(entity: mb.EntityType, mbid: string, inc: I[] = []): Promise<T> {
    return this.restGet<T>(`/${entity}/${mbid}`, {inc: inc.join(' ')});
  }

  public lookupUrl(url: string, inc?: UrlIncludes[]): Promise<mb.IUrl>;
  public lookupUrl(url: string[], inc?: UrlIncludes[]): Promise<mb.IUrlLookupResult>;
  public async lookupUrl(url: string | string[], inc: UrlIncludes[] = []): Promise<mb.IUrlLookupResult | mb.IUrl> {
    const result = await this.restGet<mb.IUrlLookupResult>('/url', {resource: url, inc: inc.join(' ')});
    if (Array.isArray(url) && url.length <= 1) {
      return {
        'url-count': 1,
        'url-offset': 0,
        urls: [result as any as mb.IUrl],
      };
    }
    return result;
  }

  /**
   * Browse entity
   * https://wiki.musicbrainz.org/MusicBrainz_API#Browse
   * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
   * https://wiki.musicbrainz.org/Development/JSON_Web_Service#Browse_Requests
   * For example: http://musicbrainz.org/ws/2/release?label=47e718e1-7ee4-460c-b1cc-1192a841c6e5&offset=12&limit=2
   * @param entity MusicBrainz entity
   * @param query Query, like: {<entity>: <MBID:}
   * @param inc Includes, which allows you to request more information to be included about the entity
   */
  public browse(entity: 'area', query?: mb.IBrowseAreasQuery, inc?: AreaIncludes[]): Promise<mb.IBrowseAreasResult>;
  public browse(entity: 'artist', query?: mb.IBrowseArtistsQuery, inc?: ArtistIncludes[]): Promise<mb.IBrowseArtistsResult>;
  public browse(entity: 'collection', query?: mb.IBrowseCollectionsQuery, inc?: CollectionIncludes[]): Promise<mb.IBrowseCollectionsResult> ;
  public browse(entity: 'event', query?: mb.IBrowseEventsQuery, inc?: EventIncludes[]): Promise<mb.IBrowseEventsResult>;
  public browse(entity: 'label', query?: mb.IBrowseLabelsQuery, inc?: LabelIncludes[]): Promise<mb.IBrowseLabelsResult>;
  public browse(entity: 'instrument', query?: mb.IBrowseInstrumentsQuery, inc?: InstrumentIncludes[]): Promise<mb.IBrowseInstrumentsResult>;
  public browse(entity: 'place', query?: mb.IBrowsePlacesQuery, inc?: PlaceIncludes[]): Promise<mb.IBrowsePlacesResult>;
  public browse(entity: 'recording', query?: mb.IBrowseRecordingsQuery, inc?: RecordingIncludes[]): Promise<mb.IBrowseRecordingsResult>;
  public browse(entity: 'release', query?: mb.IBrowseReleasesQuery, inc?: ReleaseIncludes[]): Promise<mb.IBrowseReleasesResult>;
  public browse(entity: 'release-group', query?: mb.IBrowseReleaseGroupsQuery, inc?: ReleaseGroupIncludes[]): Promise<mb.IBrowseReleaseGroupsResult>;
  public browse(entity: 'series', query?: mb.IBrowseSeriesQuery, inc?: SeriesIncludes[]): Promise<mb.IBrowseSeriesResult>;
  public browse(entity: 'url', query?: mb.IBrowseUrlsQuery, inc?: UrlIncludes[]): Promise<mb.IUrl>;
  public browse(entity: 'work', query?: mb.IBrowseWorksQuery, inc?: WorkIncludes[]): Promise<mb.IBrowseWorksResult>;
  public browse<T>(entity: mb.EntityType, query?: { [key: string]: any; }, inc?: string[]): Promise<T> {
    query = query ? query : {};
    if (inc) {
      // Serialize include parameter
      query.inc = inc.join(' ');
    }
    return this.restGet<T>(`/${entity}`, query);
  }

  // -----------------------------------------------------------------------------------------------------------------
  // Query functions
  // -----------------------------------------------------------------------------------------------------------------

  /**
   * Search an entity using a search query
   * @param entity e.g. 'recording'
   * @param query e.g.: '" artist: Madonna, track: Like a virgin"' or object with search terms: {artist: Madonna}
   */
  public search(entity: 'annotation', query: mb.ISearchQuery<(MiscIncludes | RelationsIncludes)>): Promise<mb.IAnnotationList>;
  public search(entity: 'area', query: mb.ISearchQuery<AreaIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IAreaList>;
  public search(entity: 'artist', query: mb.ISearchQuery<ArtistIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IArtistList>;
  public search(entity: 'cdstub', query: mb.ISearchQuery<(MiscIncludes | RelationsIncludes)>): Promise<mb.ICdStubList>;
  public search(entity: 'event', query: mb.ISearchQuery<EventIncludes> & mb.ILinkedEntitiesEvent): Promise<mb.IEventList>;
  public search(entity: 'instrument', query: mb.ISearchQuery<InstrumentIncludes> & mb.ILinkedEntitiesInstrument): Promise<mb.IInstrumentList>;
  public search(entity: 'label', query: mb.ISearchQuery<LabelIncludes> & mb.ILinkedEntitiesLabel): Promise<mb.ILabelList>;
  public search(entity: 'place', query: mb.ISearchQuery<PlaceIncludes> & mb.ILinkedEntitiesPlace): Promise<mb.IPlaceList>;
  public search(entity: 'recording', query: mb.ISearchQuery<RecordingIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IRecordingList>;
  public search(entity: 'release', query: mb.ISearchQuery<ReleaseIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IReleaseList>;
  public search(entity: 'release-group', query: mb.ISearchQuery<ReleaseGroupIncludes> & mb.ILinkedEntitiesArea): Promise<mb.IReleaseGroupList>;
  public search(entity: 'series', query: mb.ISearchQuery<SeriesIncludes> & mb.ILinkedEntitiesSeries): Promise<mb.ISeriesList>;
  public search(entity: 'tag', query: mb.ISearchQuery<MiscIncludes | RelationsIncludes>): Promise<mb.ITagList>;
  public search(entity: 'url', query: mb.ISearchQuery<UrlIncludes> & mb.ILinkedEntitiesUrl): Promise<mb.IUrlList>;
  public search(entity: 'work', query: mb.ISearchQuery<WorkIncludes> & mb.ILinkedEntitiesWork): Promise<mb.IWorkList>;
  public search<T extends mb.ISearchResult, I extends string = never>(entity: mb.EntityType | mb.OtherEntityTypes, query: mb.ISearchQuery<I>): Promise<T> {
    const urlQuery: any = {...query};
    if (typeof query.query === 'object') {
      urlQuery.query = makeAndQueryString(query.query);
    }
    if (Array.isArray(query.inc)) {
      urlQuery.inc = urlQuery.inc.join(' ');
    }
    return this.restGet<T>(`/${entity}/`, urlQuery);
  }

  // ---------------------------------------------------------------------------

  public async postRecording(xmlMetadata: XmlMetadata): Promise<void> {
    return this.post('recording', xmlMetadata);
  }

  public async post(entity: mb.EntityType, xmlMetadata: XmlMetadata): Promise<void> {

    if (!this.config.appName || !this.config.appVersion) {
      throw new Error("XML-Post requires the appName & appVersion to be defined");
    }

    const clientId = `${this.config.appName.replace(/-/g, '.')}-${this.config.appVersion}`;

    const path = `/ws/2/${entity}/`;
    // Get digest challenge

    let digest = '';
    let n = 1;
    const postData = xmlMetadata.toXml();

    do {
      await this.applyRateLimiter();
      const response: any = await this.httpClient.post(path, {
        query: {client: clientId},
        headers: {
          authorization: digest,
          'Content-Type': 'application/xml'
        },
        body: postData
      });

      if (response.statusCode === HttpStatus.UNAUTHORIZED) {
        // Respond to digest challenge
        const auth = new DigestAuth(this.config.botAccount as { username: string, password: string });
        const relPath = response.requestUrl.pathname; // Ensure path is relative
        digest = auth.digest(response.request.method, relPath as string, response.headers['www-authenticate']);
        ++n;
      } else {
        break;
      }
    } while (n++ < 5);
  }

  /**
   * Submit entity
   * @param entity Entity type e.g. 'recording'
   * @param mbid
   * @param formData
   */
  public async editEntity(entity: mb.EntityType, mbid: string, formData: Record<string, any>): Promise<void> {

    await this.applyRateLimiter();

    this.session = await this.getSession();

    formData.csrf_session_key = this.session.csrf.sessionKey;
    formData.csrf_token = this.session.csrf.token;
    formData.username = this.config.botAccount?.username;
    formData.password = this.config.botAccount?.password;
    formData.remember_me = 1;

    const response = await this.httpClient.postForm(`/${entity}/${mbid}/edit`, formData, {
      followRedirects: false
    });
    if (response.status === HttpStatus.OK)
      throw new Error("Failed to submit form data");
    if (response.status === HttpStatus.MOVED_TEMPORARILY)
      return;
    throw new Error(`Unexpected status code: ${response.status}`);
  }

  /**
   * Set URL to recording
   * @param recording Recording to update
   * @param url2add URL to add to the recording
   * @param editNote Edit note
   */
  public async addUrlToRecording(recording: mb.IRecording, url2add: {
    linkTypeId: mb.LinkType,
    text: string
  }, editNote = '') {

    const formData: { [key: string]: string | boolean | number } = {};

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
   */
  public async addIsrc(recording: mb.IRecording, isrc: string) {

    const formData: IFormData = {};

    formData["edit-recording.name"] = recording.title; // Required

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

    if (spotifyId.length !== 22) {
      throw new Error('Invalid Spotify ID length');
    }

    return this.addUrlToRecording(recording, {
      linkTypeId: mb.LinkType.stream_for_free,
      text: `https://open.spotify.com/track/${spotifyId}`
    }, editNote);
  }

  protected async getSession(): Promise<ISessionInformation> {

    const response = await this.httpClient.get('login', {
      followRedirects: false
    });
    return {
      csrf: MusicBrainzApi.fetchCsrf(await response.text())
    };
  }

  protected async applyRateLimiter() {
    if (!this.config.disableRateLimiting) {
      const delay = await this.rateLimiter.limit();
      debug(`Client side rate limiter activated: cool down for ${Math.round(delay / 100) / 10} s...`);
    }
  }
}

export function makeAndQueryString(keyValuePairs: IFormData): string {
  return Object.keys(keyValuePairs).map(key => `${key}:"${keyValuePairs[key]}"`).join(' AND ');
}
