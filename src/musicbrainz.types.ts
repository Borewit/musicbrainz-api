import DateTimeFormat = Intl.DateTimeFormat;

export interface IPeriod {
  'begin': string,
  'ended': boolean,
  'end': string
}

export interface IArea {
  id: string,
  'iso-3166-1-codes': string[],
  name: string,
  'sort-name': string,
  disambiguation: string
}

export interface IAlias {
  name: string,
  'sort-name': string,
  ended: boolean,
  'type-id': string,
  type: string,
  locale: string,
  primary: string,
  begin: string,
  end: string
}

export interface IMatch {
  score: number // ToDo: provide feedback: should be a number
}

export interface IArtist {
  id: string;
  name: string;
  disambiguation: string;
  'sort-name': string;
  'type-id'?: string;
  'gender-id'?;
  'life-span'?: IPeriod;
  country?: string;
  ipis?: any[]; // ToDo
  isnis?: string[];
  aliases?: IAlias[];
  gender?: null;
  type?: string;
  area?: IArea;
  begin_area?: IArea;
  end_area?: IArea;
  relations?: IRelation[];
  /**
   * Only defined if 'releases' are includes
   */
  releases?: IRelease[];
}

export interface IArtistCredit {
  artist: IArtist;
  joinphrase: string;
  name: string;
}

export type ReleaseQuality = 'normal';  // ToDo

export interface IRelease {
  id: string;
  title: string;
  'text-representation': { 'language': string, 'script': string },
  disambiguation: string;
  asin: string,
  'status-id': string;
  packaging?: string;
  status: string;
  'packaging-id'?: string;
  'release-events'?: IReleaseEvent[];
  date: string;
  media: IMedium[];
  'cover-art-archive': ICoverArtArchive;
  country: string;
  quality: string; // type ReleaseQuality doesnt work here
  barcode: string;
  relations?: IRelation[];
  'artist-credit'?: IArtistCredit[]; // Include 'artist-credits '
  'release-group'?: IReleaseGroup; // Include: 'release-groups'
}

export interface IReleaseEvent {
  area?: IArea;
  date?: string;
}

export type MediaFormatType = 'Digital Media'; // ToDo

export interface IRecording {
  id: string;
  video: boolean;
  length: number;
  title: string;
  disambiguation: string;
  isrcs?: string[];
  releases?: IRelease;
  relations?: IRelation[];
  'artist-credit'?: IArtistCredit[];
  aliases?: IAlias[];
}

export interface ITrack {
  id: string;
  position: number;
  recording: IRecording;
  number: string; // in JSON, this is a string field
  length: number;
  title: string;
  'artist-credit'?: IArtistCredit[];
}

export interface IMedium {
  title: string;
  format?: string; // optional, type dosent work
  'format-id': string;
  'tracks': ITrack[];
  'track-count': number;
  'track-offset': number;
  'position': number;
}

export interface ICoverArtArchive {
  count: number;
  front: boolean;
  darkened: boolean;
  artwork: boolean;
  back: boolean;
}

export interface IReleaseGroup {
  id: string;
  count: number;
  title: string;
  'primary-type': string;
  'sort-name': string;
  'artist-credit': Array<{ artist: IArtist }>;
  releases?: IRelease[]; // include 'releases'
}

export interface IArtistMatch extends IArtist, IMatch {
}

export interface IReleaseGroupMatch extends IReleaseGroup, IMatch {
}

export interface IReleaseMatch extends IRelease, IMatch {
}

export interface IAreaMatch extends IArea, IMatch {
}

export interface ISearchResult {
  created: DateTimeFormat;
  count: number;
  offset: number;
}

export interface IArtistList extends ISearchResult {
  artists: IArtistMatch[]
}

export interface IAreaList extends ISearchResult {
  areas: IAreaMatch[]
}

export interface IReleaseList extends ISearchResult {
  releases: IReleaseMatch[]
}

export interface IReleaseGroupList extends ISearchResult {
  'release-groups': IReleaseGroupMatch[]
}

export interface IUrlList extends ISearchResult {
  urls: IUrlMatch[]
}
export type RelationDirection = 'backward' | 'forward';

export interface IRelation {
  'attribute-ids': {};
  direction: RelationDirection;
  'target-credit': string;
  end: null | object;
  'source-credit': string;
  ended: boolean;
  'attribute-values': object;
  attributes?: any[];
  type: string;
  begin?: null | object;
  'target-type'?: 'url';
  'type-id': string;
  url?: IURL;
  release?: IRelease;
}

export interface IURL {
  id: string;
  resource: string;
}

export interface IRelationList {
  relations: IRelation[];
}

export interface IWork {
  id: string;
  title: string;
}

export interface ILabel {
  id: string;
  name: string;
}

export interface IUrl {
  id: string,
  resource: string,
  'relation-list': IRelationList[];
}

export interface IUrlMatch extends IMatch, IUrl {
}

export interface IUrlSearchResult extends ISearchResult {
  urls?: IUrlMatch[];
}

export interface IIsrcSearchResult {
  'isrc': string;
  'recordings': IRecording[];
}

export interface IExernalIds {
  [type: string]: string;
}

export interface IReleaseSearchResult extends ISearchResult {
  releases: IRelease[];
}

/**
 * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Subqueries
 */
export type EntityType = 'area' |
  'artist' |
  'collection' |
  'event' |
  'instrument' |
  'label' |
  'place' |
  'recording' |
  'release' |
  'release-group' |
  'series' |
  'work' |
  'url';

export type Relationships = 'area-rels' |
  'artist-rels' |
  'event-rels' |
  'instrument-rels' |
  'label-rels' |
  'place-rels' |
  'recording-rels' |
  'release-rels' |
  'release-group-rels' |
  'series-rels' |
  'url-rels' |
  'work-rels';

export enum LinkType {
  license = 302,
  production = 256,
  samples_IMDb_entry = 258,
  get_the_music = 257,
  purchase_for_download = 254,
  download_for_free = 255,
  stream_for_free = 268,
  crowdfunding_page = 905,
  other_databases = 306,
  Allmusic = 285
}

/**
 * https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Artist
 */
export interface IPagination {
  /**
   * Return search results starting at a given offset. Used for paging through more than one page of results.
   */
  offset?: number;
  /**
   * An integer value defining how many entries should be returned. Only values between 1 and 100 (both inclusive) are allowed. If not given, this defaults to 25.
   */
  limit?: number;
}

/**
 * https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Artist
 */
export interface ISearchQuery extends IPagination {
  /**
   * Lucene search query, this is mandatory
   */
  query: string;
}
