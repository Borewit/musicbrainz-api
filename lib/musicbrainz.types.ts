import DateTimeFormat = Intl.DateTimeFormat;
import type {IFormData} from './musicbrainz-api.js';


export interface IPeriod {
  'begin': string;
  'ended': boolean;
  'end': string;
}

export interface ITypedEntity extends IEntity {
  'type-id': string;
  type: string;
  id: string;
}

export interface IEntity {
  id: string;
}

export interface LifeSpan {
  ended: boolean,
  begin: null | string,
  end: null | string
}

export interface IAnnotation {
  entity: string;
  name: string;
  text: string;
  type: string;
}

export interface IArea extends ITypedEntity {
  type: 'Country' | 'Subdivision' | 'Municipality' | 'City' | 'District' | 'Island'
  'iso-3166-1-codes'?: string[];
  primary: boolean,
  name: string;
  'sort-name': string;
  disambiguation: string;
  'life-span': LifeSpan
}

export interface IAlias extends ITypedEntity {
  name: string;
  'sort-name': string;
  ended: boolean;
  locale: string;
  primary: string;
  begin: string;
  end: string;
}

export interface IMatch {
  score: number;
}

export type Gender = 'male' | 'female' | 'other' | 'not applicable';

export interface IArtist extends ITypedEntity, IMayHaveRelations {
  name: string;
  disambiguation: string;
  'sort-name': string;
  'gender-id'?: string;
  'life-span'?: IPeriod;
  country?: string;
  ipis?: string[];
  isnis?: string[];
  aliases?: IAlias[];
  gender?: Gender;
  area?: IArea;
  begin_area?: IArea;
  end_area?: IArea;
  /**
   * Only defined if 'releases' are includes
   */
  releases?: IRelease[];
  'release-groups'?: IReleaseGroup[];
}

export interface ICdStub {
  id: string;
  title: string;
  artist: string;
  barcode: string;
  comment: string;
}

export interface IArtistCredit {
  artist: IArtist;
  joinphrase: string;
  name: string;
}

export interface ICollection extends ITypedEntity {
  type: 'Recording collection';
  name: string;
  'recording-count': number;
  editor: string;
  'entity-type': string;
}

export interface IEvent extends ITypedEntity {
  cancelled: boolean;
  'life-span': IPeriod;
  disambiguation: string;
  time: string;
  setlist: string;
  name: string;
}

export type InstrumentType =
  'Wind instrument'
  | 'String instrument'
  | 'Percussion instrument'
  | 'Electronic instrument'
  | 'Family'
  | 'Ensemble'
  | 'Other instrument'

export interface IInstrument extends ITypedEntity {
  disambiguation: string;
  name: string;
  type: InstrumentType;
  description: string;
}

export type ReleaseQuality = 'normal' | 'high';
export type ReleaseStatus =
  'Official'
  | 'Promotion'
  | 'Bootleg'
  | 'Pseudo-release'
  | 'Withdrawn'
  | 'Expunged'
  | 'Cancelled';
export type ReleasePackaging =
  'Book'
  | 'Box'
  | 'Cardboard/Paper Sleeve'
  | 'Cassette Case'
  | 'Clamshell Case'
  | 'Digibook'
  | 'Digifile'
  | 'Digipak'
  | 'Discbox Slider'
  | 'Fatbox'
  | 'Gatefold Cover'
  | 'Jewel case'
  | 'Keep Case'
  | 'Longbox'
  | 'Metal Tin'
  | 'Plastic sleeve'
  | 'Slidepack'
  | 'Slim Jewel Case'
  | 'Snap Case'
  | 'SnapPack'
  | 'Super Jewel Box'
  | 'Other'
  | 'None'

export interface IRelease extends IEntity, IMayHaveRelations {
  title: string;
  'text-representation': { 'language': string, 'script': string },
  disambiguation: string;
  asin: null | string,
  status: ReleaseStatus;
  'status-id': string;
  packaging?: ReleasePackaging;
  'packaging-id'?: string;
  'release-events'?: IReleaseEvent[];
  date: string;
  media: IMedium[];
  'cover-art-archive': ICoverArtArchive;
  country: string;
  quality: ReleaseQuality;
  barcode: string;
  'artist-credit'?: IArtistCredit[]; // Include 'artist-credits '
  'release-group'?: IReleaseGroup; // Include: 'release-groups'
  collections?: ICollection[],
  'track-count'?: number;
  count?: number;
}

export interface IReleaseEvent {
  area?: IArea;
  date?: string;
}

export type MediaFormatType = 'Digital Media'; // ToDo

export interface IRecording extends IEntity, IMayHaveRelations {
  video: boolean;
  length: number;
  title: string;
  disambiguation: string;
  isrcs?: string[];
  releases?: IRelease[];
  'artist-credit'?: IArtistCredit[];
  aliases?: IAlias[];
  'first-release-date': string;
}

export interface ITrack extends IEntity {
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

export interface ISearchResult {
  created: DateTimeFormat;
  count: number;
  offset: number;
}

export type IAnnotationMatch = IAnnotation & IMatch;
export interface IAnnotationList extends ISearchResult {
  annotations: IAnnotationMatch[];
}

export type IAreaMatch = IArea & IMatch;
export interface IAreaList extends ISearchResult {
  areas: IAreaMatch[];
}

export type IArtistMatch = IArtist & IMatch;
export interface IArtistList extends ISearchResult {
  artists: IArtistMatch[];
}

export type ICdStubMatch = ICdStub & IMatch;
export interface ICdStubList extends ISearchResult {
  cdstubs: ICdStubMatch[];
}

export type IEventMatch = IEvent & IMatch;
export interface IEventList extends ISearchResult {
  events: IEventMatch[];
}

export type IInstrumentMatch = IInstrument & IMatch;
export interface IInstrumentList extends ISearchResult {
  instruments: IInstrumentMatch[];
}

export type ILabelMatch = ILabel & IMatch;
export interface ILabelList extends ISearchResult {
  labels: ILabelMatch[];
}

export type IPlacesMatch = IPlace & IMatch;
export interface IPlaceList extends ISearchResult {
  places: IPlacesMatch[];
}

export type IReleaseMatch = IRelease & IMatch;
export interface IReleaseList extends ISearchResult {
  releases: IReleaseMatch[];
  'release-count': number;
}

export type IRecordingMatch = IRecording & IMatch;
export interface IRecordingList extends ISearchResult {
  recordings: IRecordingMatch[];
  'recordings-count': number;
}

export type IReleaseGroupMatch = IReleaseGroup & IMatch;
export interface IReleaseGroupList extends ISearchResult {
  'release-groups': IReleaseGroupMatch[];
}

export type ISeriesGroupMatch = ISeries & IMatch;
export interface ISeriesList extends ISearchResult {
  series: ISeriesGroupMatch[];
}

export type ITagMatch = ITag & IMatch;
export interface ITagList extends ISearchResult {
  tags: ITagMatch[];
}

export type IUrlMatch = IUrl & IMatch;
export interface IUrlList extends ISearchResult {
  urls: IUrlMatch[];
}

export type IWorkMatch = IWork & IMatch;
export interface IWorkList extends ISearchResult {
  works: IWorkMatch[];
}

export type RelationDirection = 'backward' | 'forward';

export interface IRelation {
  artist?: IArtist;
  'attribute-ids': unknown[];
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

export interface IMayHaveRelations {
  relations?: IRelation[];
}

export interface IWork extends IEntity {
  title: string;
}

export interface ILabel extends IEntity {
  asin: null | string;
  barcode: null | string;
  country: null | string;
  name: string;
  'sort-name': string;
  'life-span': LifeSpan;
  disambiguation?: string;
  'label-code': null | string;
  ipis: string[];
  area: IArea;
}

export interface IPlace extends IEntity {
  name: string;
}

export interface ISeries extends ITypedEntity {
  name: string;
  disambiguation: string;
}

export interface ITag {
  name: string;
}

export interface IUrl extends IEntity, IMayHaveRelations {
  id: string,
  resource: string;
}

export interface IExernalIds {
  [type: string]: string;
}

export interface IReleaseSearchResult extends ISearchResult {
  releases: IRelease[];
}

/**
 * Entities without MBID
 */
export type OtherEntityTypes = 'annotation' | 'cdstub' | 'tag';

/**
 * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Subqueries
 */
export type EntityType = 'annotation' |
  'area' |
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

/**
 * Ref: https://musicbrainz.org/doc/MusicBrainz_API#Release_.28Group.29_Type_and_Status
 */
export type ReleaseStatusQuery = 'official' | 'promotion' | 'bootleg' | 'pseudo-release' |  'withdrawn' | 'cancelled';

/**
 * Ref: https://musicbrainz.org/doc/MusicBrainz_API#Release_.28Group.29_Type_and_Status
 */
export type ReleaseTypeQuery = 'album'
  | 'single'
  | 'ep'
  | 'broadcast'
  | 'other'
  | 'audiobook'
  | 'compilation'
  | 'demo'
  | 'dj-mix'
  | 'field recording'
  | 'interview'
  | 'live'
  | 'mixtape/street'
  | 'remix'
  | 'soundtrack'
  | 'spokenword';





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
 * Release and release-group types
 */
export interface IReleaseTypeAndStatus {
  status?: ReleaseStatusQuery[];
  type?: ReleaseTypeQuery[];
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
 * /ws/2/place             area, collection, release
 */
export interface ILinkedEntitiesPlace {
  place?: string;
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

// Shared utility to enforce only one key
export type OneOf<T> = {
  [K in keyof T]: { [P in K]: T[K] } & Partial<Record<Exclude<keyof T, K>, never>>
}[keyof T];

/**
 * List of entity names allowed for browsing releases by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseReleasesEntityParams {
  area: string;
  artist: string;
  editor: string;
  event: string;
  label: string;
  place: string;
  recording: string;
  release: string;
  'release-group': string;
  track_artist: string;
  work: string;
}
export type IBrowseReleasesQuery = IPagination & IReleaseTypeAndStatus & OneOf<BrowseReleasesEntityParams>;

/**
 * List of entity names allowed for browsing artists by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseArtistsEntityParams {
  area: string;
  collection: string;
  recording: string;
  release: string;
  'release-group': string;
  work: string;
}
export type IBrowseArtistsQuery = IPagination & OneOf<BrowseArtistsEntityParams>;

/**
 * List of entity names allowed for browsing collections by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseCollectionsEntityParams {
  area: string;
  artist: string;
  editor: string;
  event: string;
  label: string;
  place: string;
  recording: string;
  release: string;
  'release-group': string;
  work: string;
}
export type IBrowseCollectionsQuery = IPagination & OneOf<BrowseCollectionsEntityParams>;

/**
 * List of entity names allowed for browsing events by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseEventsEntityParams {
  area: string;
  artist: string;
  collection: string;
  place: string;
}
export type IBrowseEventsQuery = IPagination & OneOf<BrowseEventsEntityParams>;

/**
 * List of entity names allowed for browsing labels by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseLabelsEntityParams {
  area: string;
  collection: string;
  release: string;
}
export type IBrowseLabelsQuery = IPagination & OneOf<BrowseLabelsEntityParams>;

/**
 * List of entity names allowed for browsing places by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowsePlacesEntityParams {
  area: string;
  collection: string;
}
export type IBrowsePlacesQuery = IPagination & OneOf<BrowsePlacesEntityParams>;

/**
 * List of entity names allowed for browsing recordings by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseRecordingsEntityParams {
  artist: string;
  collection: string;
  release: string;
  work: string;
}
export type IBrowseRecordingsQuery = IPagination & OneOf<BrowseRecordingsEntityParams>;

/**
 * List of entity names allowed for browsing release-groups by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseReleaseGroupsEntityParams {
  artist: string;
  collection: string;
  release: string;
}
export type IBrowseReleaseGroupsQuery = IPagination & IReleaseTypeAndStatus & OneOf<BrowseReleaseGroupsEntityParams>;

/**
 * List of entity names allowed for browsing works by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseWorksEntityParams {
  artist: string;
  collection: string;
}
export type IBrowseWorksQuery = IPagination & OneOf<BrowseWorksEntityParams>;

/**
 * Query for browsing areas by collection MBID.
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseAreasQuery extends IPagination {
  collection?: string;
}

/**
 * Query for browsing instruments by collection MBID.
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseInstrumentsQuery extends IPagination {
  collection?: string;
}

/**
 * Query for browsing series by collection MBID.
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseSeriesQuery extends IPagination {
  collection?: string;
}

/**
 * Query for browsing URLs by resource URI.
 * https://wiki.musicbrainz.org/MusicBrainz_API#Linked_entities
 */
export interface IBrowseUrlsQuery extends IPagination {
  resource?: string;
}

// Results interfaces remain the same
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

export interface IUrlLookupResult {
  'url-offset': number;
  'url-count': number;
  urls: IUrl[];
}
