import type * as mb from '../lib/musicbrainz.types.js';
import type { MusicBrainzApi, Relationships } from '../lib/musicbrainz-api.js';

// Compiled by compile-test, never executed. Expected errors guard against overly broad overloads.
export async function checkRequestTypes(api: MusicBrainzApi) {
  api.lookup('genre', 'genre-id') satisfies Promise<mb.IGenre>;
  api.lookup('genre', 'all', [], { limit: 10 }) satisfies Promise<mb.IBrowseGenresResult>;
  api.getGenres({ limit: 10, offset: 20 }) satisfies Promise<mb.IBrowseGenresResult>;
  api.browse('genre', { collection: 'collection-id' }) satisfies Promise<mb.IBrowseGenresResult>;
  api.lookup('isrc', 'GBAAA9900303', ['releases', 'artist-credits']) satisfies Promise<mb.IIsrcLookupResult>;
  api.lookup('iswc', 'T-000.000.001-0', ['artist-rels']) satisfies Promise<mb.IIswcLookupResult>;
  api.lookup('discid', '-', ['recordings'], {
    toc: '1 1 12000 150',
    cdstubs: 'no',
    'media-format': 'all'
  }) satisfies Promise<mb.IDiscLookupResult>;
  api.getUserTags({ entity: 'release', id: 'release-id' }) satisfies Promise<mb.IUserTagsResult>;
  api.getUserRating({ entity: 'place', id: 'place-id' }) satisfies Promise<mb.IUserRatingResult>;

  api.lookup('artist', 'id', ['releases', 'artist-credits', 'discids', 'various-artists'], {
    type: ['audio drama'],
    status: ['official']
  });
  api.lookup('recording', 'id', ['release-groups', 'work-level-rels', 'work-rels']);
  api.lookup('release', 'id', ['release-group-level-rels', 'work-level-rels', 'user-collections']);
  api.lookup('work', 'id', ['user-tags', 'user-genres', 'user-ratings']);
  'genre-rels' satisfies Relationships;

  api.browse('release', { collection: 'id', type: ['audio drama'] });
  api.browse('release', { track: 'id', status: ['official'] });
  api.browse('event', { event: 'id' });
  api.browse('event', { series: 'id' });
  api.browse('collection', { genre: 'id' });
  api.browse('collection', { instrument: 'id' });
  api.browse('collection', { series: 'id' });
  api.browse('release-group', { artist: 'id', 'release-group-status': 'website-default' });

  // Legacy search-as-browse requests must infer a browse result, without scores or timestamps.
  const browse = await api.search('release', { artist: 'id', inc: ['media'] });
  browse satisfies mb.IBrowseReleasesResult;
  browse['release-count'] satisfies number;
  // @ts-expect-error A browse response does not contain a search timestamp.
  browse.created;
  // @ts-expect-error Browse entities have no match score.
  browse.releases[0].score;
  const search = await api.search('release', { query: { artist: 'Artist' }, dismax: true });
  search satisfies mb.IReleaseList;
  search.created satisfies string;
  search.releases[0].score satisfies number;

  api.search('artist', { recording: 'id' }) satisfies Promise<mb.IBrowseArtistsResult>;
  api.search('recording', { artist: 'id' }) satisfies Promise<mb.IBrowseRecordingsResult>;
  api.search('place', { area: 'id' }) satisfies Promise<mb.IBrowsePlacesResult>;
  api.search('release-group', { release: 'id' }) satisfies Promise<mb.IBrowseReleaseGroupsResult>;
  api.search('url', { resource: 'https://example.test' }) satisfies Promise<mb.IUrl>;

  // @ts-expect-error Genre search is not implemented by the API.
  api.search('genre', { query: 'rock' });
  // @ts-expect-error Genre endpoints accept no includes.
  api.lookup('genre', 'id', ['aliases']);
  // @ts-expect-error Genre browsing requires a collection.
  api.browse('genre', { artist: 'id' });
  // @ts-expect-error No full-text query or browse key.
  api.search('artist', {});
  // @ts-expect-error No artist browse parameter for recordings is named area.
  api.search('recording', { area: 'id' });
  // @ts-expect-error The place browse key is area or collection, not place.
  api.search('place', { place: 'id' });
  // @ts-expect-error Release browsing does not support editor.
  api.browse('release', { editor: 'id' });
  // @ts-expect-error Release browsing does not support event.
  api.browse('release', { event: 'id' });
  // @ts-expect-error Release browsing does not support place.
  api.browse('release', { place: 'id' });
  // @ts-expect-error Release browsing does not support release.
  api.browse('release', { release: 'id' });
  // @ts-expect-error Release browsing does not support work.
  api.browse('release', { work: 'id' });
  // @ts-expect-error Only one linked entity can be supplied.
  api.browse('release', { artist: 'id', collection: 'id' });
  // @ts-expect-error Release-group status is a filter for browsing by artist only.
  api.browse('release-group', { collection: 'id', 'release-group-status': 'all' });
  // @ts-expect-error The release status filter does not apply to release-group browsing.
  api.browse('release-group', { artist: 'id', status: ['official'] });
  // @ts-expect-error Invalid release type.
  api.browse('release', { artist: 'id', type: ['invalid'] });
  // @ts-expect-error Instruments cannot be rated.
  api.lookup('instrument', 'id', ['ratings']);
  // @ts-expect-error Genre includes are not accepted by the ISWC controller.
  api.lookup('iswc', 'id', ['genres']);
  // @ts-expect-error CD-stub switches are yes or no strings.
  api.lookup('discid', '-', [], { cdstubs: false });
  // @ts-expect-error Releases cannot be rated directly.
  api.getUserRating({ entity: 'release', id: 'id' });
}

export const linkedEntities = {
  recording: { artist: 'artist-id' } satisfies mb.ILinkedEntitiesRecording,
  place: { area: 'area-id', collection: 'collection-id' } satisfies mb.ILinkedEntitiesPlace,
  event: { event: 'event-id', series: 'series-id' } satisfies mb.ILinkedEntitiesEvent,
  collection: {
    genre: 'genre-id',
    instrument: 'instrument-id',
    series: 'series-id'
  } satisfies mb.ILinkedEntitiesCollection,
  genre: { collection: 'collection-id' } satisfies mb.ILinkedEntitiesGenre
};
