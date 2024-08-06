import DateTimeFormat = Intl.DateTimeFormat;
import type { IFormData } from './musicbrainz-api.js';

export interface IPeriod {
  'begin': string;
  'ended': boolean;
  'end': string;
}

export interface IEntity {
  id: string;
}

export interface IArea extends IEntity {
  'iso-3166-1-codes': string[];
  name: string;
  'sort-name': string;
  disambiguation: string;
}

export interface IAlias extends IEntity {
  name: string;
  'sort-name': string;
  ended: boolean;
  'type-id': string;
  type: string;
  locale: string;
  primary: string;
  begin: string;
  end: string;
}

export interface IMatch {
  score: number; // ToDo: provide feedback: should be a number
}

export interface IArtist extends IEntity {
  name: string;
  disambiguation: string;
  'sort-name': string;
  'type-id'?: string;
  'gender-id'?: string;
  'life-span'?: IPeriod;
  country?: string;
  ipis?: string[];
  isnis?: string[];
  aliases?: IAlias[];
  gender?: string;
  type?: string;
  area?: IArea;
  begin_area?: IArea;
  end_area?: IArea;
  relations?: IRelation[];
  /**
   * Only defined if 'releases' are includes
   */
  releases?: IRelease[];
  'release-groups'?: IReleaseGroup[];
}

export interface IArtistCredit {
  artist: IArtist;
  joinphrase: string;
  name: string;
}

export interface ICollection extends IEntity {
  type: string;
  name: string;
  'type-id': string;
  'recording-count': number;
  editor: string;
  'entity-type': string;
}

export interface IEvent extends IEntity {
  cancelled: boolean;
  type: string;
  'life-span': IPeriod;
  disambiguation: string;
  'type-id': string;
  time: string;
  setlist: string;
  name: string;
}

export interface IInstrument extends IEntity {
  disambiguation: string;
  name: string;
  'type-id': string;
  type: string;
  description: string;
}

export type ReleaseQuality = 'normal';  // ToDo

export interface IRelease extends IEntity {
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
  collections?: ICollection[]
}

export interface IReleaseEvent {
  area?: IArea;
  date?: string;
}

export type MediaFormatType = 'Digital Media'; // ToDo

export interface IRecording extends IEntity {
  video: boolean;
  length: number;
  title: string;
  disambiguation: string;
  isrcs?: string[];
  releases?: IRelease[];
  relations?: IRelation[];
  'artist-credit'?: IArtistCredit[];
  aliases?: IAlias[];
}

export interface ITrack extends IEntity{
  position: number;
  recording: IRecording;
  'number': string; // in JSON, this is a string field
  length: number;
  title: string;
  'artist-credit'?: IArtistCredit[];
}

export interface IMedium {
  title: string;
  format?: string; // optional, type doesn't work
  'format-id': string;
  tracks: ITrack[];
  'track-count': number;
  'track-offset': number;
  position: number;
}

export interface ICoverArtArchive {
  count: number;
  front: boolean;
  darkened: boolean;
  artwork: boolean;
  back: boolean;
}

export interface IReleaseGroup extends IEntity {
  count: number;
  disambiguation?: string;
  title: string;
  'secondary-types': string[];
  'first-release-date': string;
  'primary-type': string;
  'primary-type-id'?: string,
  'secondary-type-ids'?: string[],
  'sort-name': string;
  'artist-credit': { artist: IArtist, name: string, joinphrase: string }[];
  releases?: IRelease[]; // include 'releases'
}

export interface IAreaMatch extends IArea, IMatch {
}

export interface IArtistMatch extends IArtist, IMatch {
}

export interface IRecordingMatch extends IRecording, IMatch {
}

export interface IReleaseGroupMatch extends IReleaseGroup, IMatch {
}

export interface IReleaseMatch extends IRelease, IMatch {
}

export interface ISearchResult {
  created: DateTimeFormat;
  count: number;
  offset: number;
}

export interface IArtistList extends ISearchResult {
  artists: IArtistMatch[];
}

export interface IAreaList extends ISearchResult {
  areas: IAreaMatch[];
}

export interface IReleaseList extends ISearchResult {
  releases: IReleaseMatch[];
  'release-count': number;
}

export interface IRecordingList extends ISearchResult {
  recordings: IRecordingMatch[];
  'recordings-count': number;
}

export interface IReleaseGroupList extends ISearchResult {
  'release-groups': IReleaseGroupMatch[];
}

export interface IUrlList extends ISearchResult {
  urls: IUrlMatch[];
}

export type RelationDirection = 'backward' | 'forward';

export interface IRelation {
  'attribute-ids':unknown[];
  direction: RelationDirection;
  'target-credit': string;
  end: null | unknown;
  'source-credit': string;
  ended: boolean;
  'attribute-values': unknown[];
  attributes?: any[];
  type: string;
  begin?: null | unknown;
  'target-type'?: 'url';
  'type-id': string;
  url?: IUrl;
  release?: IRelease;
}

export interface IRelationList {
  relations: IRelation[];
}

export interface IWork extends IEntity {
  title: string;
}

export interface ILabel extends IEntity {
  name: string;
}

export interface IPlace extends IEntity {
  name: string;
}

export interface ISeries extends IEntity {
  name: string;
  type: string;
  disambiguation: string;
  'type-id': string;
}

export interface IUrl extends IEntity {
  id: string,
  resource: string,
  'relation-list'?: IRelationList[];
}

export interface IUrlMatch extends IMatch, IUrl {
}

export interface IUrlSearchResult extends ISearchResult {
  urls?: IUrlMatch[];
}

export interface IIsrcSearchResult extends ISearchResult {
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
export interface ISearchQuery<I extends string> extends IPagination {
  /**
   * Lucene search query, this is mandatory
   */
  query?: string | IFormData,
  inc?: I[]
  artist?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Browse
 * /ws/2/area              collection
 */
export interface ILinkedEntitiesArea {
  collection?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Browse
 * /ws/2/artist            area, collection, recording, release, release-group, work
 */
export interface ILinkedEntitiesArtist {
  area?: string;
  collection?: string;
  recording?: string;
  release?: string;
  'release-group'?: string;
  work?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Browse
 * /ws/2/collection        area, artist, editor, event, label, place, recording, release, release-group, work
 */
export interface ILinkedEntitiesCollection {
  area?: string;
  artist?: string;
  editor?: string;
  event?: string;
  label?: string;
  place?: string;
  recording?: string;
  release?: string;
  'release-group'?: string;
  work?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/event             area, artist, collection, place
 */
export interface ILinkedEntitiesEvent {
  area?: string;
  artist?: string;
  collection?: string;
  place?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/instrument        collection
 */
export interface ILinkedEntitiesInstrument {
  collection?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/label             area, collection, release
 */
export interface ILinkedEntitiesLabel {
  area?: string;
  collection?: string;
  release?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/place             area, collection
 */
export interface IBrowseArgumentPlace {
  area?: string;
  collection?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/recording         artist, collection, release, work
 */
export interface ILinkedEntitiesRecording {
  area?: string;
  collection?: string;
  release?: string;
  work?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/release           area, artist, collection, label, track, track_artist, recording, release-group
 */
export interface ILinkedEntitiesRelease {
  area?: string;
  artist?: string;
  collection?: string;
  label?: string;
  track?: string;
  track_artist?: string;
  recording?: string;
  'release-group'?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/release-group     artist, collection, release
 */
export interface ILinkedEntitiesReleaseGroup {
  artist?: string;
  collection?: string;
  release?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/series            collection
 */
export interface ILinkedEntitiesSeries {
  collection?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Browse
 * /ws/2/work              artist, collection
 */
export interface ILinkedEntitiesWork {
  artist?: string;
  collection?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Browse
 * /ws/2/url               resource
 */
export interface ILinkedEntitiesUrl {
  resource?: string;
}

/**
 * Browse artist query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseAreasQuery extends IPagination {
  collection?: string;
}

/**
 * Browse artist query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseArtistsQuery extends IPagination {
  area?: string;
  collection?: string;
  recording?: string;
  release?: string;
  'release-group'?: string;
  work?: string;
}

/**
 * Browse collection query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseCollectionsQuery extends IPagination {
  area?: string;
  artist?: string;
  editor?: string;
  event?: string;
  label?: string;
  place?: string;
  recording?: string;
  release?: string;
  'release-group'?: string;
  work?: string;
}

/**
 * Browse events query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseEventsQuery extends IPagination {
  area?: string;
  artist?: string;
  collection?: string;
  place?: string;
}

/**
 * Browse instruments query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseInstrumentsQuery extends IPagination {
  collection?: string;
}

/**
 * Browse labels query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseLabelsQuery extends IPagination {
  area?: string;
  collection?: string;
  release?: string;
}

/**
 * Browse places query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowsePlacesQuery extends IPagination {
  area?: string;
  collection?: string;
}
/**
 * Browse recordings query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseRecordingsQuery extends IPagination {
  artist?: string;
  collection?: string;
  release?: string;
  work?: string;
}

/**
 * Browse releases query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseReleasesQuery extends IPagination {
  area?: string;
  artist?: string;
  editor?: string;
  event?: string;
  label?: string;
  place?: string;
  recording?: string;
  release?: string;
  'release-group'?: string;
  work?: string;
}

/**
 * Browse release-groups query <entity>: <MBID>
 */
export interface IBrowseReleaseGroupsQuery extends IPagination {
  artist?: string;
  collection?: string;
  release?: string;
}

/**
 * Browse release query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseSeriesQuery extends IPagination {
  collection?: string;
}

/**
 * Browse urls query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseUrlsQuery extends IPagination {
  resource?: string;
}

/**
 * Browse works query <entity>: <MBID>
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseWorksQuery extends IPagination {
  artist?: string;
  collection?: string;
}

export interface IBrowseAreasResult {
  area: IArea;
  'area-count': number;
  'area-offset': number;
}

export interface IBrowseArtistsResult {
  artists: IArtist[];
  'artist-count': number;
  'artist-offset': number;
}

export interface IBrowseCollectionsResult {
  collections: ICollection[];
  'collection-count': number;
  'collection-offset': number;
}

export interface IBrowseEventsResult {
  events: IEvent[];
  'event-count': number;
  'event-offset': number;
}

export interface IBrowseInstrumentsResult {
  instruments: IInstrument[];
  'instrument-count': number;
  'instrument-offset': number;
}

export interface IBrowseLabelsResult {
  label: ILabel[];
  'label-count': number;
  'label-offset': number;
}

export interface IBrowsePlacesResult {
  place: IPlace[];
  'place-count': number;
  'place-offset': number;
}

export interface IBrowseRecordingsResult {
  recording: IRecording[];
  'recording-count': number;
  'recording-offset': number;
}

export interface IBrowseReleasesResult {
  releases: IRelease[];
  'release-count': number;
  'release-offset': number;
}

export interface IBrowseReleaseGroupsResult {
  'release-groups': IReleaseGroup[];
  'release-group-count': number;
  'release-group-offset': number;
}

export interface IBrowseSeriesResult {
  series: IReleaseGroup[];
  'series-count': number;
  'series-offset': number;
}

export interface IBrowseWorksResult {
  works: IReleaseGroup[];
  'work-count': number;
  'work-offset': number;
}
