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

export type RelationsIncludes = mb.Relationships;

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

export type TagIncludes = 'tags' | 'genres' | 'user-tags' | 'user-genres';
export type RatingIncludes = 'ratings' | 'user-ratings';
export type MiscIncludes = 'aliases' | 'annotation' | TagIncludes | RatingIncludes;

export type AreaIncludes = MiscIncludes | RelationsIncludes;

export type ArtistIncludes =
  | MiscIncludes
  | RelationsIncludes
  | SubQueryIncludes
  | 'recordings'
  | 'releases'
  | 'release-groups'
  | 'works';

export type CollectionIncludes =
  | 'user-collections'
  | 'tags'
  | 'areas'
  | 'artists'
  | 'events'
  | 'genres'
  | 'instruments'
  | 'labels'
  | 'places'
  | 'recordings'
  | 'releases'
  | 'release-groups'
  | 'series'
  | 'works';

export type EventIncludes = MiscIncludes | RelationsIncludes;

/** Genre lookup and browsing currently accept no includes. */
export type GenreIncludes = never;

export type InstrumentIncludes = Exclude<MiscIncludes, RatingIncludes> | RelationsIncludes;

export type LabelIncludes =
  | MiscIncludes
  | RelationsIncludes
  | Exclude<SubQueryIncludes, 'various-artists' | 'isrcs'>
  | 'releases';

export type PlaceIncludes = MiscIncludes | RelationsIncludes;

export type RecordingIncludes =
  | MiscIncludes
  | RelationsIncludes
  | Exclude<SubQueryIncludes, 'various-artists'>
  | 'artists'
  | 'releases'
  | 'release-groups'
  | 'work-level-rels';

export type ReleaseIncludes =
  | MiscIncludes
  | Exclude<SubQueryIncludes, 'various-artists'>
  | RelationsIncludes
  | 'artists'
  | 'collections'
  | 'user-collections'
  | 'labels'
  | 'recordings'
  | 'release-groups'
  | 'recording-level-rels'
  | 'release-group-level-rels'
  | 'work-level-rels';

export type ReleaseGroupIncludes =
  | MiscIncludes
  | Exclude<SubQueryIncludes, 'various-artists' | 'isrcs'>
  | RelationsIncludes
  | 'artists'
  | 'releases';

export type SeriesIncludes = Exclude<MiscIncludes, RatingIncludes> | RelationsIncludes;

export type WorkIncludes = MiscIncludes | RelationsIncludes | 'artist-credits';

export type UrlIncludes = RelationsIncludes | 'artist-credits';

// Non-MBID controllers have their own allowed includes, which differ from MBID lookups.
export type IsrcIncludes =
  | RelationsIncludes
  | 'artists'
  | 'releases'
  | 'isrcs'
  | 'artist-credits'
  | 'aliases'
  | 'tags'
  | 'user-tags'
  | RatingIncludes
  | 'discids'
  | 'media';
export type IswcIncludes =
  | RelationsIncludes
  | 'artists'
  | 'artist-credits'
  | 'aliases'
  | 'tags'
  | 'user-tags'
  | RatingIncludes;
export type DiscIncludes =
  | RelationsIncludes
  | TagIncludes
  | 'artists'
  | 'labels'
  | 'recordings'
  | 'release-groups'
  | 'artist-credits'
  | 'aliases'
  | 'isrcs';

export interface EntityIncludesMap {
  annotation: MiscIncludes | RelationsIncludes;
  area: AreaIncludes;
  artist: ArtistIncludes;
  cdstub: MiscIncludes | RelationsIncludes;
  collection: CollectionIncludes;
  event: EventIncludes;
  genre: GenreIncludes;
  instrument: InstrumentIncludes;
  label: LabelIncludes;
  place: PlaceIncludes;
  recording: RecordingIncludes;
  release: ReleaseIncludes;
  'release-group': ReleaseGroupIncludes;
  series: SeriesIncludes;
  tag: MiscIncludes | RelationsIncludes;
  url: UrlIncludes;
  work: WorkIncludes;
}

/** Serialize API query values without modifying the caller's options. */
function serializeQuery(query: object): MultiQueryFormData {
  const result: MultiQueryFormData = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      result[key] =
        key === 'inc' ? value.join(' ') : key === 'type' || key === 'status' ? value.join('|') : value.map(String);
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

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
   * @param entity Core entity, collection, or identifier resource (discid, isrc, iswc).
   * @param mbid Entity MBID or resource identifier
   * @param inc Includes, which allows you to request more information to be included about the entity
   */
  public lookup(entity: 'area', mbid: string, inc?: AreaIncludes[]): Promise<mb.ILookupResultMap['area']>;
  public lookup(
    entity: 'artist',
    mbid: string,
    inc?: ArtistIncludes[],
    query?: mb.IReleaseTypeAndStatus
  ): Promise<mb.ILookupResultMap['artist']>;
  public lookup(
    entity: 'collection',
    mbid: string,
    inc?: CollectionIncludes[]
  ): Promise<mb.ILookupResultMap['collection']>;
  public lookup(
    entity: 'instrument',
    mbid: string,
    inc?: InstrumentIncludes[]
  ): Promise<mb.ILookupResultMap['instrument']>;
  public lookup(
    entity: 'label',
    mbid: string,
    inc?: LabelIncludes[],
    query?: mb.IReleaseTypeAndStatus
  ): Promise<mb.ILookupResultMap['label']>;
  public lookup(entity: 'place', mbid: string, inc?: PlaceIncludes[]): Promise<mb.ILookupResultMap['place']>;
  public lookup(
    entity: 'release',
    mbid: string,
    inc?: ReleaseIncludes[],
    query?: mb.IReleaseTypeAndStatus
  ): Promise<mb.ILookupResultMap['release']>;
  public lookup(
    entity: 'release-group',
    mbid: string,
    inc?: ReleaseGroupIncludes[],
    query?: mb.IReleaseTypeAndStatus
  ): Promise<mb.ILookupResultMap['release-group']>;
  public lookup(
    entity: 'recording',
    mbid: string,
    inc?: RecordingIncludes[],
    query?: mb.IReleaseTypeAndStatus
  ): Promise<mb.ILookupResultMap['recording']>;
  public lookup(entity: 'series', mbid: string, inc?: SeriesIncludes[]): Promise<mb.ILookupResultMap['series']>;
  public lookup(entity: 'work', mbid: string, inc?: WorkIncludes[]): Promise<mb.ILookupResultMap['work']>;
  public lookup(entity: 'url', mbid: string, inc?: UrlIncludes[]): Promise<mb.IUrl>;
  public lookup(entity: 'event', mbid: string, inc?: EventIncludes[]): Promise<mb.ILookupResultMap['event']>;
  public lookup(
    entity: 'genre',
    mbid: 'all',
    inc?: GenreIncludes[],
    query?: mb.IPagination
  ): Promise<mb.IBrowseGenresResult>;
  public lookup(entity: 'genre', mbid: string, inc?: GenreIncludes[]): Promise<mb.ILookupResultMap['genre']>;
  public lookup(
    entity: 'isrc',
    mbid: string,
    inc?: IsrcIncludes[],
    query?: mb.IReleaseTypeAndStatus
  ): Promise<mb.IIsrcLookupResult>;
  public lookup(entity: 'iswc', mbid: string, inc?: IswcIncludes[]): Promise<mb.IIswcLookupResult>;
  public lookup(
    entity: 'discid',
    mbid: string,
    inc?: DiscIncludes[],
    query?: mb.IDiscLookupQuery
  ): Promise<mb.IDiscLookupResult>;
  public lookup<T>(
    entity: mb.EntityType | 'isrc' | 'iswc' | 'discid',
    mbid: string,
    inc: string[] = [],
    query: mb.IReleaseTypeAndStatus | mb.IDiscLookupQuery | mb.IPagination = {}
  ): Promise<T> {
    return this.restGet<T>(`/${entity}/${encodeURIComponent(mbid)}`, serializeQuery({ ...query, inc }));
  }

  /** Fetch the alphabetically ordered, paginated genre list. */
  public getGenres(query: mb.IPagination = {}): Promise<mb.IBrowseGenresResult> {
    return this.restGet('/genre/all', serializeQuery(query));
  }

  public getUserTags(query: mb.IUserTagsQuery): Promise<mb.IUserTagsResult> {
    return this.restGet('/tag', serializeQuery(query));
  }

  public getUserRating(query: mb.IUserRatingQuery): Promise<mb.IUserRatingResult> {
    return this.restGet('/rating', serializeQuery(query));
  }

  public lookupUrl(url: string, inc?: UrlIncludes[]): Promise<mb.IUrl>;
  public lookupUrl(url: string[], inc?: UrlIncludes[]): Promise<mb.IUrlLookupResult>;
  public async lookupUrl(url: string | string[], inc: UrlIncludes[] = []): Promise<mb.IUrlLookupResult | mb.IUrl> {
    const result = await this.restGet<mb.IUrlLookupResult | mb.IUrl>('/url', { resource: url, inc: inc.join(' ') });
    if (Array.isArray(url) && url.length <= 1) {
      return {
        'url-count': 1,
        'url-offset': 0,
        urls: [result as mb.IUrl]
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
  public browse<E extends keyof mb.IBrowseResultMap>(
    entity: E,
    query?: mb.IBrowseQueryMap[NoInfer<E>],
    inc?: EntityIncludesMap[NoInfer<E>][]
  ): Promise<mb.IBrowseResultMap[E]>;
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
  public search<E extends keyof mb.ISearchResultMap>(
    entity: E,
    query: mb.ISearchQuery<EntityIncludesMap[NoInfer<E>]>
  ): Promise<mb.ISearchResultMap[E]>;
  /** Compatibility with callers using search() for browse requests. */
  public search<E extends keyof mb.IBrowseResultMap>(
    entity: E,
    query: mb.IBrowseQueryMap[NoInfer<E>] & { query?: never; inc?: EntityIncludesMap[NoInfer<E>][] }
  ): Promise<mb.IBrowseResultMap[E]>;
  public async search<T>(
    entity: mb.EntityType | mb.OtherEntityTypes,
    query: { query?: string | IFormData; inc?: string[] }
  ): Promise<T> {
    const urlQuery = { ...query };
    if (typeof query.query === 'object') {
      urlQuery.query = makeAndQueryString(query.query);
    }
    const result = await this.restGet<T>(`/${entity}/`, serializeQuery(urlQuery));

    // Temporary workaround for https://tickets.metabrainz.org/browse/SEARCH-444
    // Should be resolved by https://github.com/metabrainz/mb-solr/pull/69
    if (entity === 'url' && query.query !== undefined) {
      const urls = (result as mb.IUrlList).urls;
      for (const url of urls) {
        const legacy = url as mb.IUrl & { 'relation-list'?: mb.IRelation[] };
        if (!url.relations && legacy['relation-list']) {
          url.relations = legacy['relation-list'];
        }
      }
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
