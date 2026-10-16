import type * as mb from '../lib/musicbrainz.types.js';

// Compile-time fixtures for lookup, search and browse response shapes.
// Reference: https://github.com/metabrainz/musicbrainz-server/tree/master/lib/MusicBrainz/Server/WebService/Serializer/JSON/2
const emptyPeriod = { begin: null, end: null, ended: false };
const unknownType = { type: null, 'type-id': null };
export const alias = {
  name: 'Artist alias',
  'sort-name': 'Artist alias',
  type: null,
  'type-id': null,
  locale: null,
  primary: null,
  begin: null,
  end: null,
  ended: false
} satisfies mb.IAlias;

export const artistSearch = {
  created: '2026-10-16T15:13:33.276Z',
  count: 1,
  offset: 0,
  artists: [
    {
      id: 'ab2528d9-719f-4261-8098-21849222a0f2',
      name: 'Stromae',
      'sort-name': 'Stromae',
      score: 100,
      gender: 'male',
      'life-span': { begin: '1985-03-12', ended: null },
      aliases: [{ name: 'Paul Van Haver', 'sort-name': 'Van Haver, Paul', 'begin-date': null, 'end-date': null }]
    }
  ]
} satisfies mb.IArtistList;

export const artistLookup = {
  id: 'artist-id',
  name: 'Artist',
  'sort-name': 'Artist',
  disambiguation: '',
  'life-span': emptyPeriod,
  ipis: [],
  isnis: [],
  ...unknownType,
  gender: 'Female',
  'gender-id': null,
  country: null,
  area: null,
  'begin-area': null,
  'end-area': null,
  annotation: null,
  recordings: [{ id: 'recording-id', title: 'Recording' }],
  works: [{ id: 'work-id', title: 'Work' }],
  'user-tags': [{ name: 'rock' }],
  'user-genres': [{ id: 'genre-id', name: 'rock' }],
  'user-rating': { value: null }
} satisfies mb.ILookupResultMap['artist'];

export const releaseLookup = {
  disambiguation: '',
  asin: null,
  'cover-art-archive': { count: 0, front: false, back: false, artwork: false, darkened: false },
  id: 'release-id',
  title: 'Release',
  status: null,
  'status-id': null,
  packaging: null,
  'packaging-id': null,
  barcode: null,
  quality: 'low',
  'text-representation': { language: null, script: null },
  'release-events': [{ date: '', area: null }],
  'label-info': [{ label: { id: 'label-id', name: 'Label', 'label-code': 123 }, 'catalog-number': null }],
  media: [
    {
      title: '',
      format: null,
      'format-id': null,
      position: 1,
      'track-count': 0,
      discs: [{ id: 'disc-id', 'offset-count': 1, offsets: [150], sectors: 12000 }],
      pregap: { id: 'pregap-id', title: 'Pregap', number: '0', length: null },
      'data-tracks': [{ id: 'data-track-id', title: 'Data', number: '1', length: null }]
    }
  ]
} satisfies mb.ILookupResultMap['release'];

export const releaseSearch = {
  created: '2026-10-16T15:13:33.276Z',
  count: 1,
  offset: 0,
  releases: [{ id: 'release-id', title: 'Release', score: 100, media: [{ 'track-count': 10 }] }]
} satisfies mb.IReleaseList;

export const recordingSearch = {
  created: '2026-10-16T15:13:33.276Z',
  count: 1,
  offset: 0,
  recordings: [{ id: 'recording-id', title: 'Recording', score: 100, video: null, length: null }]
} satisfies mb.IRecordingList;

export const releaseGroupLookup = {
  disambiguation: '',
  'first-release-date': '',
  'secondary-types': [],
  'secondary-type-ids': [],
  id: 'release-group-id',
  title: 'Release group',
  'primary-type': null,
  'primary-type-id': null
} satisfies mb.ILookupResultMap['release-group'];

export const searchRelation = {
  type: 'composer',
  'type-id': 'relation-type-id',
  direction: 'backward',
  artist: { id: 'artist-id', name: 'Artist', 'sort-name': 'Artist' }
} satisfies mb.IRelation;

export const lookupRelation = {
  type: 'instrument',
  'type-id': 'relation-type-id',
  direction: 'backward',
  'target-type': 'artist',
  'attribute-ids': { guitar: 'attribute-id' },
  'attribute-values': { instrument: 'custom instrument' },
  'attribute-credits': { guitar: 'guitars' },
  attributes: ['guitar'],
  'ordering-key': 1,
  begin: null,
  end: null,
  ended: false
} satisfies mb.IRelation;

export const work = {
  ...unknownType,
  disambiguation: '',
  languages: [],
  iswcs: [],
  id: 'work-id',
  title: 'Work',
  language: null,
  attributes: [{ type: 'Key', 'type-id': 'attribute-type-id', value: 'C major', 'value-id': 'attribute-value-id' }]
} satisfies mb.ILookupResultMap['work'];

export const collection = {
  description: '',
  'type-id': 'collection-type-id',
  id: 'collection-id',
  name: 'Releases',
  editor: 'Editor',
  type: 'Release collection',
  'entity-type': 'release',
  'release-count': 1,
  releases: [{ id: 'release-id', title: 'Release' }]
} satisfies mb.ILookupResultMap['collection'];

export const areaLookup = {
  ...unknownType,
  id: 'area-id',
  name: 'Area',
  'sort-name': 'Area',
  disambiguation: '',
  'life-span': emptyPeriod,
  'iso-3166-2-codes': ['GB-ENG'],
  'iso-3166-3-codes': []
} satisfies mb.ILookupResultMap['area'];

export const labelLookup = {
  ...unknownType,
  id: 'label-id',
  name: 'Label',
  'sort-name': 'Label',
  disambiguation: '',
  'label-code': null,
  country: null,
  area: null,
  ipis: [],
  isnis: [],
  'life-span': emptyPeriod
} satisfies mb.ILookupResultMap['label'];

export const placeLookup = {
  ...unknownType,
  id: 'place-id',
  name: 'Place',
  disambiguation: '',
  address: '',
  coordinates: null,
  area: null,
  'life-span': emptyPeriod
} satisfies mb.ILookupResultMap['place'];

export const recordingLookup = {
  id: 'recording-id',
  title: 'Recording',
  disambiguation: '',
  length: null,
  video: false
} satisfies mb.ILookupResultMap['recording'];

export const seriesLookup = {
  ...unknownType,
  id: 'series-id',
  name: 'Series',
  disambiguation: ''
} satisfies mb.ILookupResultMap['series'];

export const eventLookup = {
  ...unknownType,
  id: 'event-id',
  name: 'Event',
  disambiguation: '',
  cancelled: false,
  time: '',
  setlist: '',
  'life-span': emptyPeriod
} satisfies mb.ILookupResultMap['event'];

export const instrumentLookup = {
  ...unknownType,
  id: 'instrument-id',
  name: 'Instrument',
  disambiguation: '',
  description: ''
} satisfies mb.ILookupResultMap['instrument'];

export const browseAreas = {
  'area-count': 1,
  'area-offset': 0,
  areas: [areaLookup]
} satisfies mb.IBrowseAreasResult;

export const browseLabels = {
  'label-count': 1,
  'label-offset': 0,
  labels: [labelLookup]
} satisfies mb.IBrowseLabelsResult;

export const browsePlaces = {
  'place-count': 1,
  'place-offset': 0,
  places: [placeLookup]
} satisfies mb.IBrowsePlacesResult;

export const browseRecordings = {
  'recording-count': 1,
  'recording-offset': 0,
  recordings: [recordingLookup]
} satisfies mb.IBrowseRecordingsResult;

export const browseSeries = {
  'series-count': 1,
  'series-offset': 0,
  series: [seriesLookup]
} satisfies mb.IBrowseSeriesResult;

export const browseWorks = {
  'work-count': 1,
  'work-offset': 0,
  works: [work]
} satisfies mb.IBrowseWorksResult;

export const genres = {
  'genre-count': 1,
  'genre-offset': 0,
  genres: [{ id: 'genre-id', name: 'rock', disambiguation: '' }]
} satisfies mb.IBrowseGenresResult;

export const genreCollection = {
  description: '',
  'type-id': 'collection-type-id',
  id: 'collection-id',
  name: 'Genres',
  editor: 'Editor',
  type: 'Genre collection',
  'entity-type': 'genre',
  'genre-count': 1,
  genres: genres.genres
} satisfies mb.ILookupResultMap['collection'];

export const isrcLookup = {
  isrc: 'GBAAA9900303',
  recordings: [recordingLookup]
} satisfies mb.IIsrcLookupResult;

export const iswcLookup = {
  'work-count': 1,
  'work-offset': 0,
  works: [work]
} satisfies mb.IIswcLookupResult;

export const discLookup = {
  id: 'disc-id',
  'offset-count': 1,
  offsets: [150],
  sectors: 12000,
  releases: [
    {
      ...releaseLookup,
      media: [{ id: 'medium-id', 'track-count': 1 }]
    }
  ]
} satisfies mb.IDiscLookupResult;

export const cdStubLookup = {
  id: 'disc-id',
  title: 'CD stub',
  artist: 'Artist',
  barcode: null,
  disambiguation: '',
  'track-count': 1,
  tracks: [{ title: 'Track', artist: null, length: 100000 }]
} satisfies mb.IDiscLookupResult;

export const tocLookup = {
  'release-count': 1,
  'release-offset': 0,
  releases: [releaseLookup]
} satisfies mb.IDiscLookupResult;
