import type { IFormData } from './musicbrainz-api.js';

export interface IPeriod {
  begin?: string | null;
  ended?: boolean | null;
  end?: string | null;
}

export interface ITypedEntity extends IEntity {
  'type-id'?: string | null;
  type?: string | null;
}

export interface IEntity {
  id: string;
}

/** Backwards-compatible name for the shared date-period shape. */
export type LifeSpan = IPeriod;

export interface IAnnotation {
  entity: string;
  name: string;
  text: string;
  type: string;
}

export interface IArea
  extends ITypedEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres {
  type?: 'Country' | 'Subdivision' | 'County' | 'Municipality' | 'City' | 'District' | 'Island' | null;
  'iso-3166-1-codes'?: string[];
  'iso-3166-2-codes'?: string[];
  'iso-3166-3-codes'?: string[];
  name: string;
  'sort-name': string;
  disambiguation?: string;
  'life-span'?: LifeSpan;
}

export interface IAlias {
  type?: string | null;
  'type-id'?: string | null;
  name: string;
  'sort-name': string;
  ended?: boolean | null;
  locale?: string | null;
  primary?: boolean | null;
  begin?: string | null;
  end?: string | null;
  'begin-date'?: string | null;
  'end-date'?: string | null;
}

export interface IMatch {
  score: number;
}

export type Gender =
  | 'Male'
  | 'Female'
  | 'Other'
  | 'Non-binary'
  | 'Not applicable'
  | 'male'
  | 'female'
  | 'other'
  | 'non-binary'
  | 'not applicable';

export interface IArtist
  extends ITypedEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres,
    IMayHaveRating {
  name: string;
  disambiguation?: string;
  'sort-name': string;
  'gender-id'?: string | null;
  'life-span'?: IPeriod;
  country?: string | null;
  ipis?: string[];
  isnis?: string[];
  gender?: Gender | null;
  area?: IArea | null;
  'begin-area'?: IArea | null;
  'end-area'?: IArea | null;
  // Legacy spellings retained for compatibility.
  begin_area?: IArea | null;
  end_area?: IArea | null;
  recordings?: IRecording[];
  works?: IWork[];
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
  barcode?: string | null;
  comment?: string;
  disambiguation?: string;
  tracks?: ICdStubTrack[];
  'track-count'?: number;
}

export interface ICdStubTrack {
  title: string;
  artist: string | null;
  length: number | null;
}

export interface IArtistCredit {
  artist: IArtist;
  joinphrase: string;
  name: string;
}

export interface ICollection extends ITypedEntity {
  name: string;
  description?: string;
  'area-count'?: number;
  'artist-count'?: number;
  'event-count'?: number;
  'genre-count'?: number;
  'instrument-count'?: number;
  'label-count'?: number;
  'place-count'?: number;
  'recording-count'?: number;
  'release-count'?: number;
  'release-group-count'?: number;
  'series-count'?: number;
  'work-count'?: number;
  areas?: IArea[];
  artists?: IArtist[];
  events?: IEvent[];
  genres?: IGenre[];
  instruments?: IInstrument[];
  labels?: ILabel[];
  places?: IPlace[];
  recordings?: IRecording[];
  releases?: IRelease[];
  'release-groups'?: IReleaseGroup[];
  series?: ISeries[];
  works?: IWork[];
  editor: string;
  'entity-type': string;
}

export interface IEvent
  extends ITypedEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres,
    IMayHaveRating {
  cancelled?: boolean;
  'life-span'?: IPeriod;
  disambiguation?: string;
  time?: string;
  setlist?: string;
  name: string;
}

export type InstrumentType =
  | 'Wind instrument'
  | 'String instrument'
  | 'Percussion instrument'
  | 'Electronic instrument'
  | 'Family'
  | 'Ensemble'
  | 'Other instrument';

export interface IInstrument
  extends ITypedEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres {
  disambiguation?: string;
  name: string;
  type?: InstrumentType | null;
  description?: string;
}

export type ReleaseQuality = 'low' | 'normal' | 'high';
export type ReleaseStatus =
  | 'Official'
  | 'Promotion'
  | 'Bootleg'
  | 'Pseudo-release'
  | 'Withdrawn'
  | 'Expunged'
  | 'Cancelled';
export type ReleasePackaging =
  | 'Book'
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
  | 'None';

export interface IRelease
  extends IEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres {
  title: string;
  'text-representation'?: { language: string | null; script: string | null };
  disambiguation?: string;
  asin?: null | string;
  status?: ReleaseStatus | null;
  'status-id'?: string | null;
  packaging?: ReleasePackaging | null;
  'packaging-id'?: string | null;
  'release-events'?: IReleaseEvent[];
  date?: string;
  media?: IMedium[];
  'cover-art-archive'?: ICoverArtArchive;
  country?: string | null;
  quality?: ReleaseQuality;
  barcode?: string | null;
  'artist-credit'?: IArtistCredit[]; // Include 'artist-credits '
  'release-group'?: IReleaseGroup; // Include: 'release-groups'
  collections?: ICollection[];
  'track-count'?: number;
  'medium-count'?: number;
  'label-info'?: ILabelInfo[]; // Include: 'labels'
}

export interface IReleaseEvent {
  area?: IArea | null;
  date?: string;
}

export type MediaFormatType = 'Digital Media'; // ToDo

export interface IRecording
  extends IEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres,
    IMayHaveRating {
  video?: boolean | null;
  length?: number | null;
  title: string;
  disambiguation?: string;
  isrcs?: string[];
  releases?: IRelease[];
  'artist-credit'?: IArtistCredit[];
  'first-release-date'?: string;
}

export interface ITrack extends IEntity {
  position?: number;
  recording?: IRecording;
  number: string; // in JSON, this is a string field
  length: number | null;
  title: string;
  'artist-credit'?: IArtistCredit[];
}

export interface IMedium {
  id?: string;
  title?: string;
  format?: string | null;
  'format-id'?: string | null;
  tracks?: ITrack[];
  'track-count': number;
  'disc-count'?: number;
  'track-offset'?: number;
  position?: number;
  discs?: IDisc[];
  pregap?: ITrack;
  'data-tracks'?: ITrack[];
}

export interface IDisc extends IEntity {
  'offset-count': number;
  sectors: number;
  offsets?: number[];
  releases?: IRelease[];
}

export interface ICoverArtArchive {
  count: number;
  front: boolean;
  darkened: boolean;
  artwork: boolean;
  back: boolean;
}

export interface IReleaseGroup
  extends IEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres,
    IMayHaveRating {
  disambiguation?: string;
  title: string;
  'secondary-types'?: string[];
  'first-release-date'?: string;
  'primary-type'?: string | null;
  'primary-type-id'?: string | null;
  'secondary-type-ids'?: string[];
  'artist-credit'?: IArtistCredit[];
  releases?: IRelease[]; // include 'releases'
}

export interface ISearchResult {
  created: string;
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

export interface ILabelInfo {
  label: ILabel | null;
  'catalog-number': string | null;
}

export type IPlacesMatch = IPlace & IMatch;
export interface IPlaceList extends ISearchResult {
  places: IPlacesMatch[];
}

export type IReleaseMatch = IRelease & IMatch & { count?: number };
export interface IReleaseList extends ISearchResult {
  releases: IReleaseMatch[];
}

export type IRecordingMatch = IRecording & IMatch;
export interface IRecordingList extends ISearchResult {
  recordings: IRecordingMatch[];
}

export type IReleaseGroupMatch = IReleaseGroup & IMatch & { count?: number };
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
  'attribute-ids'?: Record<string, string>;
  direction: RelationDirection;
  'target-credit'?: string;
  end?: string | null;
  'source-credit'?: string;
  ended?: boolean | null;
  'attribute-values'?: Record<string, string>;
  'attribute-credits'?: Record<string, string>;
  'ordering-key'?: number;
  attributes?: string[];
  type: string;
  begin?: string | null;
  'target-type'?: Exclude<EntityType, 'annotation' | 'collection' | 'release-group'> | 'release_group';
  'type-id': string;
  url?: IUrl;
  release?: IRelease;
  area?: IArea;
  event?: IEvent;
  genre?: IGenre;
  instrument?: IInstrument;
  label?: ILabel;
  place?: IPlace;
  recording?: IRecording;
  release_group?: IReleaseGroup;
  series?: ISeries;
  work?: IWork;
}

export interface IMayHaveAnnotation {
  /** Present when requested with inc=annotation. */
  annotation?: string | null;
}

export interface IMayHaveAliases {
  aliases?: IAlias[];
}

export interface IMayHaveRelations {
  relations?: IRelation[];
}

export interface IWork
  extends ITypedEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres,
    IMayHaveRating {
  title: string;
  disambiguation?: string;
  language?: string | null;
  languages?: string[];
  iswcs?: string[];
  attributes?: IWorkAttribute[];
}

export interface IWorkAttribute {
  type: string;
  'type-id': string;
  value: string;
  'value-id'?: string;
}

export interface ILabel
  extends ITypedEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres,
    IMayHaveRating {
  releases?: IRelease[];
  country?: null | string;
  name: string;
  'sort-name'?: string;
  'life-span'?: LifeSpan;
  disambiguation?: string;
  'label-code'?: number | null;
  ipis?: string[];
  isnis?: string[];
  area?: IArea | null;
}

export interface IPlace
  extends ITypedEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres,
    IMayHaveRating {
  name: string;
  disambiguation?: string;
  address?: string;
  coordinates?: ICoordinates | null;
  'life-span'?: LifeSpan;
  area?: IArea | null;
}

export interface ICoordinates {
  latitude: number | string;
  longitude: number | string;
}

export interface ISeries
  extends ITypedEntity,
    IMayHaveRelations,
    IMayHaveAliases,
    IMayHaveAnnotation,
    IMayHaveTagsAndGenres {
  name: string;
  disambiguation?: string;
}

export interface ITag {
  name: string;
}

export interface IUserVote {
  count: number;
}

export type IUserTag = ITag & IUserVote;
export interface IGenre extends IEntity {
  name: string;
  disambiguation?: string;
}

export interface IMayHaveTagsAndGenres {
  tags?: IUserTag[];
  /** Genre vote counts are present in aggregated genre lists. */
  genres?: (IGenre & IUserVote)[];
  'user-tags'?: ITag[];
  'user-genres'?: IGenre[];
}

export interface IRating {
  value: number | null;
  'votes-count': number;
}

export interface IMayHaveRating {
  rating?: IRating;
  'user-rating'?: IUserRatingResult['user-rating'];
}

export interface IUrl extends IEntity, IMayHaveRelations {
  resource: string;
}

export interface IExernalIds {
  [type: string]: string;
}

export type IReleaseSearchResult = IReleaseList;

/**
 * Entities without MBID
 */
export type OtherEntityTypes = 'annotation' | 'cdstub' | 'tag';

/**
 * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Subqueries
 */
export type EntityType =
  | 'annotation'
  | 'area'
  | 'artist'
  | 'collection'
  | 'event'
  | 'genre'
  | 'instrument'
  | 'label'
  | 'place'
  | 'recording'
  | 'release'
  | 'release-group'
  | 'series'
  | 'work'
  | 'url';

export type Relationships =
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

/**
 * Ref: https://musicbrainz.org/doc/MusicBrainz_API#Release_.28Group.29_Type_and_Status
 */
export type ReleaseStatusQuery = 'official' | 'promotion' | 'bootleg' | 'pseudo-release' | 'withdrawn' | 'cancelled';

/**
 * Ref: https://musicbrainz.org/doc/MusicBrainz_API#Release_.28Group.29_Type_and_Status
 */
export type ReleaseTypeQuery =
  | 'album'
  | 'single'
  | 'ep'
  | 'broadcast'
  | 'other'
  | 'audio drama'
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
  query: string | IFormData;
  /** @deprecated Search responses do not expand inc; use lookup or browse for includes. */
  inc?: I[];
  dismax?: boolean;
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
 * /ws/2/collection        area, artist, editor, event, genre, instrument, label, place, recording, release, release-group, series, work
 */
export interface ILinkedEntitiesCollection {
  genre?: string;
  instrument?: string;
  series?: string;
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
 * /ws/2/event             area, artist, collection, event, place, series
 */
export interface ILinkedEntitiesEvent {
  event?: string;
  series?: string;
  area?: string;
  artist?: string;
  collection?: string;
  place?: string;
}

/**
 * https://musicbrainz.org/doc/MusicBrainz_API#Subqueries
 * /ws/2/genre             collection
 */
export interface ILinkedEntitiesGenre {
  collection?: string;
}

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
export interface ILinkedEntitiesPlace {
  area?: string;
  collection?: string;
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
  artist?: string;
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
  [K in keyof T]: { [P in K]: T[K] } & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];

/**
 * List of entity names allowed for browsing releases by a single MBID.
 * Used as a key set for constructing exclusive query types.
 */
interface BrowseReleasesEntityParams {
  area: string;
  artist: string;
  collection: string;
  label: string;
  recording: string;
  'release-group': string;
  track: string;
  track_artist: string;
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
  genre: string;
  instrument: string;
  series: string;
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
  event: string;
  series: string;
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
export type IBrowseReleaseGroupsQuery = IPagination &
  Pick<IReleaseTypeAndStatus, 'type'> &
  (
    | { artist: string; collection?: never; release?: never; 'release-group-status'?: 'website-default' | 'all' }
    | (OneOf<Omit<BrowseReleaseGroupsEntityParams, 'artist'>> & { artist?: never; 'release-group-status'?: never })
  );

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

export interface IBrowseAreasResult {
  areas: ILookupResultMap['area'][];
  'area-count': number;
  'area-offset': number;
}

export interface IBrowseArtistsResult {
  artists: ILookupResultMap['artist'][];
  'artist-count': number;
  'artist-offset': number;
}

export interface IBrowseCollectionsResult {
  collections: ILookupResultMap['collection'][];
  'collection-count': number;
  'collection-offset': number;
}

export interface IBrowseEventsResult {
  events: ILookupResultMap['event'][];
  'event-count': number;
  'event-offset': number;
}

export interface IBrowseInstrumentsResult {
  instruments: ILookupResultMap['instrument'][];
  'instrument-count': number;
  'instrument-offset': number;
}

export interface IBrowseLabelsResult {
  labels: ILookupResultMap['label'][];
  'label-count': number;
  'label-offset': number;
}

export interface IBrowsePlacesResult {
  places: ILookupResultMap['place'][];
  'place-count': number;
  'place-offset': number;
}

export interface IBrowseRecordingsResult {
  recordings: ILookupResultMap['recording'][];
  'recording-count': number;
  'recording-offset': number;
}

export interface IBrowseReleasesResult {
  releases: ILookupResultMap['release'][];
  'release-count': number;
  'release-offset': number;
}

export interface IBrowseReleaseGroupsResult {
  'release-groups': ILookupResultMap['release-group'][];
  'release-group-count': number;
  'release-group-offset': number;
}

export interface IBrowseSeriesResult {
  series: ILookupResultMap['series'][];
  'series-count': number;
  'series-offset': number;
}

export interface IBrowseWorksResult {
  works: ILookupResultMap['work'][];
  'work-count': number;
  'work-offset': number;
}

export interface IUrlLookupResult {
  'url-offset': number;
  'url-count': number;
  urls: IUrl[];
}

/** Genre/all and genre browsing share this paginated response. */
export interface IBrowseGenresResult {
  genres: ILookupResultMap['genre'][];
  'genre-count': number;
  'genre-offset': number;
}

export interface IBrowseGenresQuery extends IPagination {
  collection: string;
}

export interface IIsrcLookupResult {
  isrc: string;
  recordings: ILookupResultMap['recording'][];
}

/** ISWC uses the work-list serializer; no search timestamp or match scores. */
export interface IIswcLookupResult {
  works: ILookupResultMap['work'][];
  'work-count': number;
  'work-offset': number;
}

export interface IDiscLookupQuery extends IPagination {
  toc?: string;
  cdstubs?: 'yes' | 'no';
  'media-format'?: 'all';
}

export interface IDiscLookup extends IDisc {
  releases: ILookupResultMap['release'][];
}

export interface ICdStubLookup extends ICdStub {
  tracks: ICdStubTrack[];
  'track-count': number;
}

export type IDiscLookupResult = IDiscLookup | ICdStubLookup | IBrowseReleasesResult;

export type TaggedEntityType =
  | 'area'
  | 'artist'
  | 'event'
  | 'instrument'
  | 'label'
  | 'place'
  | 'recording'
  | 'release'
  | 'release-group'
  | 'series'
  | 'work';
export type RatedEntityType = 'artist' | 'event' | 'label' | 'place' | 'recording' | 'release-group' | 'work';

export interface IUserTagsQuery {
  entity: TaggedEntityType;
  id: string;
}

export interface IUserRatingQuery {
  entity: RatedEntityType;
  id: string;
}

export interface IUserTagsResult {
  'user-tags': ITag[];
}

export interface IUserRatingResult {
  'user-rating': { value: number | null };
}

/** Mark guaranteed scalar fields as present without making include-dependent fields required. */
type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
type CompletePeriod = Required<IPeriod> & { ended: boolean };

/**
 * Complete entities returned directly by lookup and browse requests.
 * Search hits and nested references keep the shared, compact entity shapes.
 * The client infers these refinements; callers do not need to supply type arguments.
 */
export interface ILookupResultMap {
  area: WithRequired<IArea, 'type' | 'type-id' | 'disambiguation'> & { 'life-span': CompletePeriod };
  artist: WithRequired<
    IArtist,
    | 'type'
    | 'type-id'
    | 'disambiguation'
    | 'gender'
    | 'gender-id'
    | 'country'
    | 'area'
    | 'begin-area'
    | 'end-area'
    | 'ipis'
    | 'isnis'
  > & { 'life-span': CompletePeriod };
  collection: WithRequired<ICollection, 'type' | 'type-id' | 'description'>;
  event: WithRequired<IEvent, 'type' | 'type-id' | 'disambiguation' | 'cancelled' | 'time' | 'setlist'> & {
    'life-span': CompletePeriod;
  };
  genre: WithRequired<IGenre, 'disambiguation'>;
  instrument: WithRequired<IInstrument, 'type' | 'type-id' | 'disambiguation' | 'description'>;
  label: WithRequired<
    ILabel,
    'type' | 'type-id' | 'sort-name' | 'disambiguation' | 'label-code' | 'country' | 'area' | 'ipis' | 'isnis'
  > & { 'life-span': CompletePeriod };
  place: WithRequired<IPlace, 'type' | 'type-id' | 'disambiguation' | 'address' | 'area'> & {
    'life-span': CompletePeriod;
    coordinates: { latitude: number; longitude: number } | null;
  };
  recording: WithRequired<IRecording, 'disambiguation' | 'length'> & { video: boolean };
  release: WithRequired<
    IRelease,
    | 'text-representation'
    | 'disambiguation'
    | 'asin'
    | 'status'
    | 'status-id'
    | 'packaging'
    | 'packaging-id'
    | 'quality'
    | 'barcode'
    | 'cover-art-archive'
  >;
  'release-group': WithRequired<
    IReleaseGroup,
    | 'disambiguation'
    | 'secondary-types'
    | 'secondary-type-ids'
    | 'first-release-date'
    | 'primary-type'
    | 'primary-type-id'
  >;
  series: WithRequired<ISeries, 'type' | 'type-id' | 'disambiguation'>;
  url: IUrl;
  work: WithRequired<IWork, 'type' | 'type-id' | 'disambiguation' | 'language' | 'languages' | 'iswcs' | 'attributes'>;
}

/** Response types for Lucene searches, separate from browse responses. */
export interface ISearchResultMap {
  annotation: IAnnotationList;
  area: IAreaList;
  artist: IArtistList;
  cdstub: ICdStubList;
  event: IEventList;
  instrument: IInstrumentList;
  label: ILabelList;
  place: IPlaceList;
  recording: IRecordingList;
  release: IReleaseList;
  'release-group': IReleaseGroupList;
  series: ISeriesList;
  tag: ITagList;
  url: IUrlList;
  work: IWorkList;
}

export interface IBrowseResultMap {
  area: IBrowseAreasResult;
  artist: IBrowseArtistsResult;
  collection: IBrowseCollectionsResult;
  event: IBrowseEventsResult;
  genre: IBrowseGenresResult;
  instrument: IBrowseInstrumentsResult;
  label: IBrowseLabelsResult;
  place: IBrowsePlacesResult;
  recording: IBrowseRecordingsResult;
  release: IBrowseReleasesResult;
  'release-group': IBrowseReleaseGroupsResult;
  series: IBrowseSeriesResult;
  url: IUrl;
  work: IBrowseWorksResult;
}

export interface IBrowseQueryMap {
  area: IBrowseAreasQuery;
  artist: IBrowseArtistsQuery;
  collection: IBrowseCollectionsQuery;
  event: IBrowseEventsQuery;
  genre: IBrowseGenresQuery;
  instrument: IBrowseInstrumentsQuery;
  label: IBrowseLabelsQuery;
  place: IBrowsePlacesQuery;
  recording: IBrowseRecordingsQuery;
  release: IBrowseReleasesQuery;
  'release-group': IBrowseReleaseGroupsQuery;
  series: IBrowseSeriesQuery;
  url: IBrowseUrlsQuery;
  work: IBrowseWorksQuery;
}
