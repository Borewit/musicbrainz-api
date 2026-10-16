import Debug from 'debug';
import { StatusCodes as HttpStatus } from 'http-status-codes';
import { RateLimitThreshold } from 'rate-limit-threshold';
import { DigestAuth } from './digest-auth.js';
import { HttpClient, type IHttpClientOptions, type MultiQueryFormData } from './http-client.js';
import type * as mb from './musicbrainz.types.js';
import type { XmlMetadata } from './xml/xml-metadata.js';

export * from './musicbrainz.types.js';
export { XmlIsrc } from './xml/xml-isrc.js';
export { XmlIsrcList } from './xml/xml-isrc-list.js';
export { XmlMetadata } from './xml/xml-metadata.js';
export { XmlRecording } from './xml/xml-recording.js';

/*
 * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Subqueries
 */

export type RelationsIncludes =
  | 'area-rels'
  | 'artist-rels'
  | 'event-rels'
  | 'genre-rels'
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
  | 'discids'
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

export type MiscIncludes = 'aliases' | 'annotation' | 'tags' | 'genres' | 'ratings' | 'media';

export type AreaIncludes = MiscIncludes | RelationsIncludes;

export type ArtistIncludes = MiscIncludes | RelationsIncludes | 'recordings' | 'releases' | 'release-groups' | 'works';

export type CollectionIncludes = MiscIncludes | RelationsIncludes | 'user-collections';

export type EventIncludes = MiscIncludes | RelationsIncludes;

export type GenreIncludes = MiscIncludes;

export type InstrumentIncludes = MiscIncludes | RelationsIncludes;

export type LabelIncludes = MiscIncludes | RelationsIncludes | 'releases';

export type PlaceIncludes = MiscIncludes | RelationsIncludes;

export type RecordingIncludes = MiscIncludes | RelationsIncludes | SubQueryIncludes | 'artists' | 'releases' | 'isrcs';

export type ReleaseIncludes =
  | MiscIncludes
  | SubQueryIncludes
  | RelationsIncludes
  | 'artists'
  | 'collections'
  | 'labels'
  | 'recordings'
  | 'release-groups'
  | 'recording-level-rels';

export type ReleaseGroupIncludes = MiscIncludes | SubQueryIncludes | RelationsIncludes | 'artists' | 'releases';

export type SeriesIncludes = MiscIncludes | RelationsIncludes;

export type WorkIncludes = MiscIncludes | RelationsIncludes;

export type UrlIncludes = RelationsIncludes;

export type IFormData = { [key: string]: string | number };

const debug = Debug('musicbrainz-api');

export interface IMusicBrainzConfig {
  botAccount?: {
    username?: string;
    password?: string;
  };
  baseUrl?: string;

  appName?: string;
  appVersion?: string;

  /**
   * OAuth Bearer access token for authenticated requests.
   */
  accessToken?: string;

  /**
   * HTTP Proxy
   */
  proxy?: string;

  /**
   * User e-mail address or application URL
   */
  appContactInfo?: string;

  disableRateLimiting?: boolean;
  /**
   * Optional rate limit configuration.
   *
   * [maxRequests, periodSeconds]
   *
   * maxRequests     The maximum number of allowed requests within the period
   * periodSeconds   The time window in seconds during which requests are counted
   *
   * Default is [15, 18], which allows up to 15 requests every 18 seconds
   */
  rateLimit?: [number, number];
  /**
   * Maximum number of attempts for a GET request, including the initial request.
   * Defaults to 10. Set to 1 to disable retries.
   */
  retryLimit?: number;
}

interface IInternalConfig extends IMusicBrainzConfig {
  baseUrl: string;
}

type MusicBrainzErrorBody = {
  error?: string;
  help?: string;
};

async function safeJson(res: any): Promise<unknown | undefined> {
  // Some responses might not be JSON, or the client may have already consumed the body.
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

export class MusicBrainzApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly body?: unknown;
  public readonly url?: string;

  constructor(message: string, opts: { status: number; statusText: string; body?: unknown; url?: string }) {
    super(message);
    this.name = 'MusicBrainzApiError';
    this.status = opts.status;
    this.statusText = opts.statusText;
    this.body = opts.body;
    this.url = opts.url;
  }
}

export class MusicBrainzApi {
  public readonly config: IInternalConfig;

  protected rateLimiter: RateLimitThreshold;
  protected httpClient: HttpClient;
  public constructor(_config?: IMusicBrainzConfig) {
    this.config = {
      ...{
        baseUrl: 'https://musicbrainz.org'
      },
      ..._config
    };

    // RFC 6750 §5.3: Bearer tokens require TLS. Reject non-HTTPS baseUrl when
    // an accessToken is configured to prevent token leakage over plain HTTP.
    if (this.config.accessToken && !/^https:\/\//i.test(this.config.baseUrl)) {
      throw new Error(
        `MusicBrainzApi: 'accessToken' requires an HTTPS baseUrl (RFC 6750). Received baseUrl="${this.config.baseUrl}".`
      );
    }

    this.httpClient = this.initHttpClient();

    const limits = this.config.rateLimit ?? [15, 18];
    this.rateLimiter = new RateLimitThreshold(limits[0], limits[1]);
  }

  protected getHttpClientOptions(): IHttpClientOptions {
    const config = this.config;
    return {
      baseUrl: this.config.baseUrl,
      timeout: 500,
      userAgent: `${this.config.appName}/${this.config.appVersion} ( ${this.config.appContactInfo} )`,
      // Keep transport credentials in sync with the public API configuration.
      get accessToken() {
        return config.accessToken;
      }
    };
  }

  protected initHttpClient(): HttpClient {
    return new HttpClient(this.getHttpClientOptions());
  }

  public async restGet<T>(relUrl: string, query: MultiQueryFormData = {}): Promise<T> {
    query.fmt = 'json';

    await this.applyRateLimiter();

    const response = await this.httpClient.get(`/ws/2${relUrl}`, {
      query,
      retryLimit: this.config.retryLimit ?? 10
    });

    if (!response.ok) {
      const body = await safeJson(response);
      const mb = (body ?? {}) as MusicBrainzErrorBody;

      // Prefer the API-provided message when available.
      const message = mb.error
        ? `MusicBrainz request failed (${response.status}): ${mb.error}`
        : `MusicBrainz request failed (${response.status}): ${response.statusText}`;

      throw new MusicBrainzApiError(message, {
        status: response.status,
        statusText: response.statusText,
        body,
        url: response.url
      });
    }

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
    return this.restGet<T>(`/${entity}/${mbid}`, { inc: inc.join(' ') });
  }

  public lookupUrl(url: string, inc?: UrlIncludes[]): Promise<mb.IUrl>;
  public lookupUrl(url: string[], inc?: UrlIncludes[]): Promise<mb.IUrlLookupResult>;
  public async lookupUrl(url: string | string[], inc: UrlIncludes[] = []): Promise<mb.IUrlLookupResult | mb.IUrl> {
    const result = await this.restGet<mb.IUrlLookupResult>('/url', { resource: url, inc: inc.join(' ') });
    if (Array.isArray(url) && url.length <= 1) {
      return {
        'url-count': 1,
        'url-offset': 0,
        urls: [result as any as mb.IUrl]
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
  public browse(
    entity: 'artist',
    query?: mb.IBrowseArtistsQuery,
    inc?: ArtistIncludes[]
  ): Promise<mb.IBrowseArtistsResult>;
  public browse(
    entity: 'collection',
    query?: mb.IBrowseCollectionsQuery,
    inc?: CollectionIncludes[]
  ): Promise<mb.IBrowseCollectionsResult>;
  public browse(entity: 'event', query?: mb.IBrowseEventsQuery, inc?: EventIncludes[]): Promise<mb.IBrowseEventsResult>;
  public browse(entity: 'label', query?: mb.IBrowseLabelsQuery, inc?: LabelIncludes[]): Promise<mb.IBrowseLabelsResult>;
  public browse(
    entity: 'instrument',
    query?: mb.IBrowseInstrumentsQuery,
    inc?: InstrumentIncludes[]
  ): Promise<mb.IBrowseInstrumentsResult>;
  public browse(entity: 'place', query?: mb.IBrowsePlacesQuery, inc?: PlaceIncludes[]): Promise<mb.IBrowsePlacesResult>;
  public browse(
    entity: 'recording',
    query?: mb.IBrowseRecordingsQuery,
    inc?: RecordingIncludes[]
  ): Promise<mb.IBrowseRecordingsResult>;
  public browse(
    entity: 'release',
    query?: mb.IBrowseReleasesQuery,
    inc?: ReleaseIncludes[]
  ): Promise<mb.IBrowseReleasesResult>;
  public browse(
    entity: 'release-group',
    query?: mb.IBrowseReleaseGroupsQuery,
    inc?: ReleaseGroupIncludes[]
  ): Promise<mb.IBrowseReleaseGroupsResult>;
  public browse(
    entity: 'series',
    query?: mb.IBrowseSeriesQuery,
    inc?: SeriesIncludes[]
  ): Promise<mb.IBrowseSeriesResult>;
  public browse(entity: 'url', query?: mb.IBrowseUrlsQuery, inc?: UrlIncludes[]): Promise<mb.IUrl>;
  public browse(entity: 'work', query?: mb.IBrowseWorksQuery, inc?: WorkIncludes[]): Promise<mb.IBrowseWorksResult>;
  public browse<T>(entity: mb.EntityType, query?: { [key: string]: any }, inc?: string[]): Promise<T> {
    const browseQuery = query ? { ...query } : {};
    if (inc) {
      // Serialize include parameter
      browseQuery.inc = inc.join(' ');
    }
    for (const pipedFilter of ['type', 'status']) {
      if (browseQuery[pipedFilter]) {
        // Serialize type parameter
        browseQuery[pipedFilter] = browseQuery[pipedFilter].join('|');
      }
    }
    return this.restGet<T>(`/${entity}`, browseQuery);
  }

  // -----------------------------------------------------------------------------------------------------------------
  // Query functions
  // -----------------------------------------------------------------------------------------------------------------

  /**
   * Search an entity using a search query
   * @param entity e.g. 'recording'
   * @param query e.g.: '" artist: Madonna, track: Like a virgin"' or object with search terms: {artist: Madonna}
   */
  public async search(
    entity: 'annotation',
    query: mb.ISearchQuery<MiscIncludes | RelationsIncludes>
  ): Promise<mb.IAnnotationList>;
  public async search(
    entity: 'area',
    query: mb.ISearchQuery<AreaIncludes> & mb.ILinkedEntitiesArea
  ): Promise<mb.IAreaList>;
  public async search(
    entity: 'artist',
    query: mb.ISearchQuery<ArtistIncludes> & mb.ILinkedEntitiesArea
  ): Promise<mb.IArtistList>;
  public async search(
    entity: 'cdstub',
    query: mb.ISearchQuery<MiscIncludes | RelationsIncludes>
  ): Promise<mb.ICdStubList>;
  public async search(
    entity: 'event',
    query: mb.ISearchQuery<EventIncludes> & mb.ILinkedEntitiesEvent
  ): Promise<mb.IEventList>;
  public async search(
    entity: 'instrument',
    query: mb.ISearchQuery<InstrumentIncludes> & mb.ILinkedEntitiesInstrument
  ): Promise<mb.IInstrumentList>;
  public async search(
    entity: 'label',
    query: mb.ISearchQuery<LabelIncludes> & mb.ILinkedEntitiesLabel
  ): Promise<mb.ILabelList>;
  public async search(
    entity: 'place',
    query: mb.ISearchQuery<PlaceIncludes> & mb.ILinkedEntitiesPlace
  ): Promise<mb.IPlaceList>;
  public async search(
    entity: 'recording',
    query: mb.ISearchQuery<RecordingIncludes> & mb.ILinkedEntitiesArea
  ): Promise<mb.IRecordingList>;
  public async search(
    entity: 'release',
    query: mb.ISearchQuery<ReleaseIncludes> & mb.ILinkedEntitiesArea
  ): Promise<mb.IReleaseList>;
  public async search(
    entity: 'release-group',
    query: mb.ISearchQuery<ReleaseGroupIncludes> & mb.ILinkedEntitiesArea
  ): Promise<mb.IReleaseGroupList>;
  public async search(
    entity: 'series',
    query: mb.ISearchQuery<SeriesIncludes> & mb.ILinkedEntitiesSeries
  ): Promise<mb.ISeriesList>;
  public async search(entity: 'tag', query: mb.ISearchQuery<MiscIncludes | RelationsIncludes>): Promise<mb.ITagList>;
  public async search(entity: 'url', query: mb.ISearchQuery<UrlIncludes> & mb.ILinkedEntitiesUrl): Promise<mb.IUrlList>;
  public async search(
    entity: 'work',
    query: mb.ISearchQuery<WorkIncludes> & mb.ILinkedEntitiesWork
  ): Promise<mb.IWorkList>;
  public async search<T extends mb.ISearchResult, I extends string = never>(
    entity: mb.EntityType | mb.OtherEntityTypes,
    query: mb.ISearchQuery<I>
  ): Promise<T> {
    const urlQuery: any = { ...query };
    if (typeof query.query === 'object') {
      urlQuery.query = makeAndQueryString(query.query);
    }
    if (Array.isArray(query.inc)) {
      urlQuery.inc = urlQuery.inc.join(' ');
    }
    const result = await this.restGet<T>(`/${entity}/`, urlQuery);

    // Temporary workaround for https://tickets.metabrainz.org/browse/SEARCH-444
    // Should be resolved by https://github.com/metabrainz/mb-solr/pull/69
    if (entity === 'url') {
      // @ts-expect-error
      (result as mb.IUrlList).urls.forEach(url => {
        // @ts-expect-error
        if (!url.relations && url['relation-list']) {
          // @ts-expect-error
          url.relations = url['relation-list'];
        }
      });
    }

    return result;
  }

  // ---------------------------------------------------------------------------

  public async postRecording(xmlMetadata: XmlMetadata): Promise<void> {
    return this.post('recording', xmlMetadata);
  }

  public async post(entity: mb.EntityType, xmlMetadata: XmlMetadata): Promise<void> {
    if (!this.config.appName || !this.config.appVersion) {
      throw new Error('XML-Post requires the appName & appVersion to be defined');
    }

    // Require credentials before serializing XML or making a network request.
    if (!this.config.accessToken && !this.config.botAccount) {
      throw new Error("XML-Post requires either 'accessToken' or 'botAccount' credentials to be configured");
    }

    const clientId = `${this.config.appName.replace(/-/g, '.')}-${this.config.appVersion}`;

    const path = `/ws/2/${entity}/`;
    const postData = xmlMetadata.toXml();

    const requestUrl = new URL(`${this.config.baseUrl}${path}`);
    requestUrl.searchParams.set('client', clientId);
    const digestUri = requestUrl.pathname + requestUrl.search;
    let digest: string | undefined;

    for (let attempt = 0; attempt < 5; ++attempt) {
      await this.applyRateLimiter();
      const headers: Record<string, string> = { 'Content-Type': 'application/xml' };
      if (digest) {
        headers.Authorization = digest;
      }
      const response = await this.httpClient.post(path, {
        query: { client: clientId },
        headers,
        body: postData
      });

      const challenge = response.headers.get('www-authenticate');
      if (
        !this.config.accessToken &&
        response.status === HttpStatus.UNAUTHORIZED &&
        challenge &&
        /^Digest\s/i.test(challenge) &&
        attempt < 4
      ) {
        // Native fetch exposes status and Headers, not the former client's response fields.
        await response.text();
        const auth = new DigestAuth(this.config.botAccount as { username: string; password: string });
        digest = auth.digest('POST', digestUri, challenge);
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new MusicBrainzApiError(
          `MusicBrainz submission failed (${response.status}): ${body || response.statusText}`,
          {
            status: response.status,
            statusText: response.statusText,
            body,
            url: response.url
          }
        );
      }
      return;
    }
  }

  protected async applyRateLimiter() {
    if (!this.config.disableRateLimiting) {
      const delay = await this.rateLimiter.limit();
      debug(`Client side rate limiter activated: cool down for ${Math.round(delay / 100) / 10} s...`);
    }
  }
}

export function makeAndQueryString(keyValuePairs: IFormData): string {
  return Object.keys(keyValuePairs)
    .map(key => `${key}:"${keyValuePairs[key]}"`)
    .join(' AND ');
}
