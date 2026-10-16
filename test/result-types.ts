import type * as mb from '../lib/musicbrainz.types.js';
import type { MusicBrainzApi } from '../lib/musicbrainz-api.js';

// Compile-only regressions for ordinary client code: no casts or non-null assertions.
export async function checkResultUsability(api: MusicBrainzApi) {
  const artist = await api.lookup('artist', 'artist-id');
  artist['sort-name'].toLowerCase();
  artist.disambiguation.trim();
  artist.ipis.map(ipi => ipi.trim());
  artist.isnis.map(isni => isni.trim());
  artist.country satisfies string | null;
  artist['life-span'].ended satisfies boolean;
  artist['life-span'].begin satisfies string | null;
  // @ts-expect-error Unknown dates are still nullable.
  artist['life-span'].begin.toUpperCase();
  // @ts-expect-error Include-dependent releases are not guaranteed.
  artist.releases.map(release => release.title);

  const release = await api.lookup('release', 'release-id');
  release.quality satisfies mb.ReleaseQuality;
  release.status satisfies mb.ReleaseStatus | null;
  release.barcode satisfies string | null;
  release['text-representation'].language satisfies string | null;
  release['cover-art-archive'].count satisfies number;
  // @ts-expect-error Media requires an include and cannot be assumed present.
  release.media.map(medium => medium.tracks);
  // @ts-expect-error Search-only counts are not release metadata.
  release.count;

  const work = await api.lookup('work', 'work-id');
  work.languages.map(language => language.toLowerCase());
  work.attributes.map(attribute => attribute.value);
  work.iswcs.map(iswc => iswc.trim());
  const recording = await api.lookup('recording', 'recording-id');
  recording.video satisfies boolean;
  recording.length satisfies number | null;
  // @ts-expect-error First-release-date is omitted for recordings that have never been released.
  recording['first-release-date'].toUpperCase();

  const label = await api.lookup('label', 'label-id');
  label['sort-name'].toLowerCase();
  label['label-code'] satisfies number | null;
  const event = await api.lookup('event', 'event-id');
  event.cancelled satisfies boolean;
  event.setlist.trim();
  const place = await api.lookup('place', 'place-id');
  place.address.trim();
  if (place.coordinates) {
    place.coordinates.latitude.toFixed(6);
    place.coordinates.longitude.toFixed(6);
  }
  const instrument = await api.lookup('instrument', 'instrument-id');
  instrument.description.trim();
  const collection = await api.lookup('collection', 'collection-id');
  collection.description.trim();

  const browsedArtists = await api.browse('artist', { area: 'area-id' });
  browsedArtists.artists[0]['sort-name'].toLowerCase();
  browsedArtists.artists[0].ipis.map(ipi => ipi.trim());
  const browsedWorks = await api.browse('work', { artist: 'artist-id' });
  browsedWorks.works[0].languages.map(language => language.toLowerCase());
  const legacyBrowse = await api.search('release', { artist: 'artist-id' });
  legacyBrowse.releases[0].quality satisfies mb.ReleaseQuality;
  const isrc = await api.lookup('isrc', 'GBAAA9900303');
  isrc.recordings[0].video satisfies boolean;
  const iswc = await api.lookup('iswc', 'T-000.000.001-0');
  iswc.works[0].languages.map(language => language.toLowerCase());

  // Search and embedded entities must continue accepting legitimately sparse responses.
  const search = await api.search('release', { query: 'Album' });
  search.releases[0].score satisfies number;
  // @ts-expect-error Quality is not guaranteed on search hits.
  search.releases[0].quality satisfies mb.ReleaseQuality;
  // @ts-expect-error Browse counts do not occur in search envelopes.
  search['release-count'];
  const searchAlias: mb.IReleaseSearchResult = search;
  searchAlias.releases[0].score satisfies number;

  if (artist.genres) {
    artist.genres[0].count satisfies number;
  }
  const genre = await api.lookup('genre', 'genre-id');
  genre.disambiguation.trim();
  // @ts-expect-error Standalone genres do not include votes.
  genre.count;
  if (artist['user-genres']) {
    // @ts-expect-error User genres do not include vote counts.
    artist['user-genres'][0].count;
  }
}

export const compactEntities = {
  artist: { id: 'artist-id', name: 'Artist', 'sort-name': 'Artist' } satisfies mb.IArtist,
  release: { id: 'release-id', title: 'Release' } satisfies mb.IRelease,
  recording: { id: 'recording-id', title: 'Recording', video: null } satisfies mb.IRecording,
  work: { id: 'work-id', title: 'Work' } satisfies mb.IWork,
  date: { ended: null } satisfies mb.IPeriod,
  legacyDate: { ended: null } satisfies mb.LifeSpan
};

export function checkCompleteResults(
  artist: mb.ILookupResultMap['artist'],
  track: mb.ITrack,
  disc: mb.IDisc,
  area: mb.IArea,
  alias: mb.IAlias
) {
  const sharedArtist: mb.IArtist = artist;
  sharedArtist.name.trim();
  sharedArtist['sort-name'].trim();
  area['sort-name'].trim();
  alias['sort-name'].trim();
  track.length satisfies number | null;
  // @ts-expect-error Compact references cannot be promoted to full lookup results.
  compactEntities.artist satisfies mb.ILookupResultMap['artist'];
  // @ts-expect-error Tracks do not have annotations.
  track.annotation;
  // @ts-expect-error Discs do not have annotations.
  disc.annotation;
}
