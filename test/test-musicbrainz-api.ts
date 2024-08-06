import {
  CoverArtArchiveApi,
  XmlMetadata,
  type EventIncludes,
  type IBrowseArtistsResult,
  type IBrowseCollectionsResult,
  type IBrowseEventsResult,
  type IBrowseInstrumentsResult,
  type IBrowseLabelsResult,
  type IBrowsePlacesResult,
  type IBrowseRecordingsResult,
  type IBrowseReleaseGroupsResult,
  type IBrowseReleasesResult,
  type IBrowseSeriesResult,
  type IBrowseWorksResult,
  type IEvent,
  type IRelease,
  type IReleaseGroup,
  type ReleaseGroupIncludes,
  type ReleaseIncludes,
  LinkType,
  MusicBrainzApi, type RecordingIncludes, type IRecording
} from '../lib/index.js';
import { assert, expect } from 'chai';
import type * as mb from '../lib/musicbrainz.types.js';
import { readFile } from 'node:fs/promises';

const appUrl = 'https://github.com/Borewit/musicbrainz-api';

const testBotAccount = {
  username: process.env.MBUSER,
  password: process.env.MBPWD
};

async function readPackageInfo() {
  return JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8'));
}

async function makeTestApi(): Promise<MusicBrainzApi> {
  const packageInfo = await readPackageInfo();
  return new MusicBrainzApi({
    botAccount: testBotAccount,
    baseUrl: 'https://test.musicbrainz.org',

    /**
     * Enable proxy, like Fiddler
     */
    proxy: process.env.MBPROXY,

    appName: packageInfo.name,
    appVersion: packageInfo.version,
    appContactInfo: appUrl
  });
}

async function makeSearchApi(): Promise<MusicBrainzApi> {
  const packageInfo = await readPackageInfo();
  return new MusicBrainzApi({

    baseUrl: 'https://musicbrainz.org',

    /**
     * Enable proxy, like Fiddler
     */
    proxy: process.env.MBPROXY,

    appName: packageInfo.name,
    appVersion: packageInfo.version,
    appContactInfo: appUrl
  });
}

const mbid = {
  area: {
    Belgium: '5b8a5ee5-0bb3-34cf-9a75-c27c44e341fc',
    IleDeFrance: 'd79e4501-8cba-431b-96e7-bb9976f0ae76',
    Lisbon: '9aee8c1a-c7d5-4713-af71-c022bccf50b4'
  },
  artist: {
    Stromae: 'ab2528d9-719f-4261-8098-21849222a0f2',
    DeadCombo: '092ae9e2-60bf-4b66-aa33-9e31754d1924'
  },
  collection: {
    Ringtone: 'de4fdfc4-53aa-458a-b463-8761cc7f5af8'
  },
  event: {
    DireStraitsAlchemyLoveOverGold: '6d32c658-151e-45ec-88c4-fb8787524d61'
  },
  instrument: {
    spanishAcousticGuitar: '43f378cf-b099-46da-8ec3-a39b6f5e5258'
  },
  label: {
    Mosaert: '0550200c-22c1-4c62-b761-ef0b3665262b'
  },
  place: {
    Paradiso: '4efe54e1-41f6-490a-85f5-e1c19b04649c'
  },
  recording: {
    Formidable: '16afa384-174e-435e-bfa3-5591accda31c',
    Montilla: '2faab3ff-1b3a-4378-bfa2-0513446644ed'
  },
  release: {
    Formidable: '976e0677-a480-4a5e-a177-6a86c1900bbf',
    Anomalie: '478aaba4-9425-4a67-8951-a77739462df4',
    RacineCarree: [
      '348662a8-54ce-4d14-adf5-3ce2cefd57bb',
      'c22bdb3a-69c0-449a-9ef5-99796bb0f2d7',
      'de57c1d9-5e65-420f-a896-1332e87d4c09'
    ],
    DireStraits: 'f7b24036-ac2e-4df5-a210-6f8e92883564'
  },
  releaseGroup: {
    Formidable: '19099ea5-3600-4154-b482-2ec68815883e',
    RacineCarree: 'd079dc50-fa9b-4a88-90f4-5e8723accd75'
  },
  work: {
    Formidable: 'b2aa02f4-6c95-43be-a426-aedb9f9a3805'
  },
  series: {
    DireStraitsRemastered: '1ae6c9bc-2931-4d75-bee4-3dc53dfd246a'
  },
  url: {
    SpotifyLisboaMulata: 'c69556a6-7ded-4c54-809c-afb45a1abe7d'
  }
};

describe('MusicBrainz-api', function () {

  let mbTestApi: MusicBrainzApi;
  let mbApi: MusicBrainzApi;

  before(async () => {
    mbTestApi = await makeTestApi();
    mbApi = await makeSearchApi();
    // Hack a shared rate-limiter
    (mbApi as any).rateLimiter = (mbTestApi as any).rateLimiter;
  });

  this.timeout(40000); // MusicBrainz has a rate limiter

  const spotify = {
    album: {
      RacineCarree: {
        id: '6uyslsVGFsHKzdGUosFwBM'
      }
    },
    track: {
      Formidable: {
        id: '2AMysGXOe0zzZJMtH3Nizb'
      }
    }
  };

  it('Required environment variable', () => {
    assert.isDefined(process.env.MBUSER, 'process.env.MBUSER');
    assert.isDefined(process.env.MBPWD, 'process.env.MBPWD');
  });

  it('Extract CSRF', async () => {
    const html = await readFile(new URL('./csrf.html', import.meta.url), 'utf8');
    const csrf = MusicBrainzApi.fetchCsrf(html);
    assert.deepStrictEqual(csrf, {
      sessionKey: 'csrf_token:x0VIlHob5nPcWKqJIwNPwE5Y3kE+nGQ9fccgTSYbuMU=',
      token: '6G9f/xJ6Y4fLVvfYGHrzBUM34j6hy4CJrBi3VkVwO9I='
    }, 'CSRF data');
  });

  describe('Read metadata', () => {

    describe('Lookup', () => {

      it('area', async () => {
        const area = await mbApi.lookup('area', mbid.area.Belgium);
        assert.strictEqual(area.id, mbid.area.Belgium);
        assert.strictEqual(area.name, 'Belgium');
      });

      it('artist', async () => {
        const artist = await mbApi.lookup('artist', mbid.artist.Stromae);
        assert.strictEqual(artist.id, mbid.artist.Stromae);
        assert.strictEqual(artist.name, 'Stromae');
        // Ref: https://musicbrainz.org/doc/IPI
        expect(artist.ipis).include('00497406811', 'Contain an Interested Parties Information Code (IPI)');
      });

      it('collection', async () => {
        const collection = await mbApi.lookup('collection', mbid.collection.Ringtone);
        assert.strictEqual(collection.id, mbid.collection.Ringtone);
        assert.strictEqual(collection.name, 'Ringtone');
      });

      it('instrument', async () => {
        const instrument = await mbApi.lookup('instrument', mbid.instrument.spanishAcousticGuitar);
        assert.strictEqual(instrument.id, mbid.instrument.spanishAcousticGuitar);
        assert.strictEqual(instrument.type, 'String instrument');
      });

      it('label', async () => {
        const label = await mbApi.lookup('label', mbid.label.Mosaert);
        assert.strictEqual(label.id, mbid.label.Mosaert);
        assert.strictEqual(label.name, 'Mosaert');
      });

      describe('release', () => {

        it('release Formidable', async () => {
          const release = await mbApi.lookup('release', mbid.release.Formidable);
          assert.strictEqual(release.id, mbid.release.Formidable);
          assert.strictEqual(release.title, 'Formidable');
        });

        it('check release Anomalie', async () => {
          const release = await mbApi.lookup('release', mbid.release.Anomalie);
          assert.strictEqual(release.id, mbid.release.Anomalie);
          assert.strictEqual(release.title, 'Anomalie');
        });

        const includes: {inc: ReleaseIncludes, key: keyof IRelease}[] = [
          {inc: 'artist-credits', key: 'artist-credit'},
          {inc: 'artists', key: 'artist-credit'},
          {inc: 'collections', key: 'collections'},
          {inc: 'labels', key: 'release-events'},
          {inc: 'media', key: 'media'},
          // {inc: 'recordings', key: 'recordings'},
          {inc: 'release-groups', key: 'release-group'}
        ];

        includes.forEach(inc => {
          it(`get release, include: '${inc.inc}'`, async () => {
            const release = await mbApi.lookup('release', mbid.release.Formidable, [inc.inc]);
            assert.strictEqual(release.id, mbid.release.Formidable);
            assert.strictEqual(release.title, 'Formidable');
            assert.isDefined(release[inc.key], `Should include '${inc.key}'`);
          });
        });

      });

      describe('Release-group', () => {

        it('release-group', async () => {
          const releaseGroup = await mbApi.lookup('release-group', mbid.releaseGroup.Formidable);
          assert.strictEqual(releaseGroup.id, mbid.releaseGroup.Formidable);
          assert.strictEqual(releaseGroup.title, 'Formidable');
        });

        const includes: {inc: ReleaseGroupIncludes, key: keyof IReleaseGroup}[] = [
          {inc: 'artist-credits', key: 'artist-credit'}
        ];

        includes.forEach(inc => {

          it(`get release-group, include: '${inc.inc}'`, async () => {
            const group = await mbApi.lookup('release-group', mbid.releaseGroup.Formidable, [inc.inc]);
            assert.strictEqual(group.id, mbid.releaseGroup.Formidable);
            assert.strictEqual(group.title, 'Formidable');
            assert.isDefined(group[inc.key], `Should include '${inc.key}'`);
          });
        });

      });

      it('series', async () => {
        const series = await mbApi.lookup('series', mbid.series.DireStraitsRemastered);
        assert.strictEqual(series.id, mbid.series.DireStraitsRemastered, 'series.id');
        assert.strictEqual(series.name, 'Dire Straits Remastered', 'series.name');
        assert.strictEqual(series.disambiguation, '', 'series.disambiguation');
        assert.strictEqual(series['type-id'], '52b90f1e-ff62-3bd0-b254-5d91ced5d757', 'series[\'type-id\']');
      });

      it('work', async () => {
        const work = await mbApi.lookup('work', mbid.work.Formidable);
        assert.strictEqual(work.id, mbid.work.Formidable);
        assert.strictEqual(work.title, 'Formidable');
      });

      describe('Recording', () => {

        it('recording', async () => {
          const recording = await mbApi.lookup('recording', mbid.recording.Formidable);
          assert.strictEqual(recording.id, mbid.recording.Formidable);
          assert.strictEqual(recording.title, 'Formidable');
          assert.isUndefined(recording.isrcs);
          assert.isUndefined(recording['artist-credit']);
          assert.isUndefined(recording.releases);
        });

        const includes:{inc: RecordingIncludes, key: keyof IRecording}[] = [
          {inc: 'isrcs', key: 'isrcs'},
          {inc: 'artist-credits', key: 'artist-credit'},
          {inc: 'artists', key: 'artist-credit'},
          {inc: 'releases', key: 'releases'}
        ];

        includes.forEach(inc => {

          it(`recording, include: '${inc.inc}'`, async () => {
            const recording = await mbApi.lookup('recording', mbid.recording.Formidable, [inc.inc]);
            assert.strictEqual(recording.id, mbid.recording.Formidable);
            assert.strictEqual(recording.title, 'Formidable');
            assert.isDefined(recording[inc.key], `Should include '${inc.key}'`);
          });
        });

        it('extended recording', async () => {
          const recording = await mbApi.lookup('recording', mbid.recording.Formidable, ['isrcs', 'artists', 'releases', 'url-rels']);
          assert.strictEqual(recording.id, mbid.recording.Formidable);
          assert.strictEqual(recording.title, 'Formidable');
          assert.isDefined(recording.isrcs);
          assert.isDefined(recording['artist-credit']);
        });
      });

      describe('release-group', () => {

        it('release-group', async () => {
          const releaseGroup = await mbApi.lookup('release-group', mbid.releaseGroup.Formidable);
          assert.strictEqual(releaseGroup.id, mbid.releaseGroup.Formidable);
          assert.strictEqual(releaseGroup.title, 'Formidable');
        });

        [
          {inc: 'artist-credits' as ReleaseGroupIncludes, key: 'artist-credit' as keyof IReleaseGroup}
        ].forEach(inc => {

          it(`get release-group, include: '${inc.inc}'`, async () => {
            const group = await mbApi.lookup('release-group', mbid.releaseGroup.Formidable, [inc.inc]);
            assert.strictEqual(group.id, mbid.releaseGroup.Formidable);
            assert.strictEqual(group.title, 'Formidable');
            assert.isDefined(group[inc.key], `Should include '${inc.key}'`);
          });
        });

      });

      it('work', async () => {
        const work = await mbApi.lookup('work', mbid.work.Formidable);
        assert.strictEqual(work.id, mbid.work.Formidable);
        assert.strictEqual(work.title, 'Formidable');
      });

      it('url', async () => {
        const url = await mbApi.lookup('url', mbid.url.SpotifyLisboaMulata);
        assert.strictEqual(url.id, mbid.url.SpotifyLisboaMulata);
        assert.strictEqual(url.resource, 'https://open.spotify.com/album/5PCfptvsmuFcxsMt86L6wn');
      });


      describe('event', () => {
        it('event', async () => {
          const event = await mbApi.lookup('event', mbid.event.DireStraitsAlchemyLoveOverGold);
          assert.strictEqual(event.id, mbid.event.DireStraitsAlchemyLoveOverGold);
          assert.strictEqual(event.name, "Dire Straits - Love Over Gold");
          assert.strictEqual(event.type, "Concert");
        });

        [
          {inc: 'tags' as EventIncludes, key: 'tags' as keyof IEvent},
          {inc: 'artist-rels' as EventIncludes, key: 'relations' as keyof IEvent},
          {inc: 'ratings' as EventIncludes, key: 'rating' as keyof IEvent}
        ].forEach(inc => {

          it(`event, include: '${inc.inc}'`, async () => {
            const event = await mbApi.lookup('event', mbid.event.DireStraitsAlchemyLoveOverGold, [inc.inc]);
            assert.strictEqual(event.id, mbid.event.DireStraitsAlchemyLoveOverGold);
            assert.strictEqual(event.name, "Dire Straits - Love Over Gold");
            assert.isDefined(event[inc.key], `Should include '${inc.key}'`);
          });
        });

      });

    });

    describe('Browse', () => {

      function areBunchOf(entity: string, bunch: any) {
        assert.isObject(bunch);
        assert.isNumber(bunch[`${entity}-count`]);
        assert.isNumber(bunch[`${entity}-offset`]);
        assert.isArray(bunch[entity.endsWith('s') ? entity : (`${entity}s`)]);
      }

      describe('area', async () => {
        function areBunchOfAreas(areas : mb.IBrowseAreasResult) {
          areBunchOf('area', areas);
        }

        it('by collection', async () => {
          const areas = await mbApi.browse('area', {collection: 'de4fdfc4-53aa-458a-b463-8761cc7f5af8', limit: 3});
          areBunchOfAreas(areas);
        });

      });

      describe('artist', async () => {

        function areBunchOfArtists(artists: IBrowseArtistsResult) {
          areBunchOf('artist', artists);
        }

        it('by area', async () => {
          const artists = await mbApi.browse('artist', {area: mbid.area.Lisbon, limit: 3});
          areBunchOfArtists(artists);
        });

        it('by collection', async () => {
          const artists = await mbApi.browse('artist', {collection: 'de4fdfc4-53aa-458a-b463-8761cc7f5af8', limit: 3});
          areBunchOfArtists(artists);
        });

        it('by recording', async () => {
          const artists = await mbApi.browse('artist', {recording: 'a6c9e941-58ab-4f2e-9684-3b1b230f915f', limit: 3});
          areBunchOfArtists(artists);
          assert.strictEqual(artists.artists[0].name, 'Dead Combo');
        });

        it('by release', async () => {
          const artists = await mbApi.browse('artist', {release: 'd9e00093-7a4b-44f1-830d-611e88ec694a', limit: 3});
          areBunchOfArtists(artists);
          assert.strictEqual(artists.artists[0].name, 'Dead Combo');
        });

        it('by release-group', async () => {
          const artists = await mbApi.browse('artist', {
            'release-group': 'f9726e3b-833a-4997-b16a-b1baf22ff87e',
            limit: 3
          });
          areBunchOfArtists(artists);
          assert.strictEqual(artists.artists[0].name, 'Dead Combo');
        });

        it('by work', async () => {
          const artists = await mbApi.browse('artist', {work: '6d7fbf07-3795-4ee1-8c69-4cc5c08e8f09', limit: 3});
          areBunchOfArtists(artists);
          assert.strictEqual(artists.artists[0].name, 'Dead Combo');
        });

      });

      describe('collection', () => {

        function areBunchOfCollections(collections: IBrowseCollectionsResult) {
          areBunchOf('collection', collections);
        }

        it('by area', async () => {
          const collections = await mbApi.browse('collection', {area: mbid.area.Lisbon, limit: 3});
          areBunchOfCollections(collections);
        });

        it('by artist', async () => {
          const collections = await mbApi.browse('collection', {artist: mbid.artist.Stromae, limit: 3});
          areBunchOfCollections(collections);
        });

        it('by editor', async () => {
          const collections = await mbApi.browse('collection', {editor: 'Borewit', limit: 3});
          areBunchOfCollections(collections);
        });

        it('by event', async () => {
          const collections = await mbApi.browse('collection', {
            event: mbid.event.DireStraitsAlchemyLoveOverGold,
            limit: 3
          });
          areBunchOfCollections(collections);
        });

      });

      describe('event', () => {

        function areBunchOfEvents(events: IBrowseEventsResult) {
          areBunchOf('event', events);
        }

        it('by area', async () => {
          const events = await mbApi.browse('event', {area: mbid.area.Lisbon, limit: 3});
          areBunchOfEvents(events);
        });

        it('by artist', async () => {
          const events = await mbApi.browse('event', {artist: mbid.artist.DeadCombo, limit: 3});
          areBunchOfEvents(events);
        });

        it('by collection', async () => {
          const events = await mbApi.browse('event', {collection: mbid.collection.Ringtone, limit: 3});
          areBunchOfEvents(events);
        });

        it('by place', async () => {
          const events = await mbApi.browse('event', {place: mbid.place.Paradiso, limit: 3});
          areBunchOfEvents(events);
        });

      });

      describe('instrument', () => {

        function areBunchOfInstruments(instruments: IBrowseInstrumentsResult) {
          areBunchOf('instrument', instruments);
        }

        it('by collection', async () => {
          const instruments = await mbApi.browse('instrument', {collection: mbid.collection.Ringtone, limit: 3});
          areBunchOfInstruments(instruments);
        });

      });

      describe('label', () => {

        function areBunchOfLabels(labels: IBrowseLabelsResult) {
          areBunchOf('label', labels);
        }

        it('by area', async () => {
          const labels = await mbApi.browse('label', {area: mbid.area.Lisbon, limit: 3});
          areBunchOfLabels(labels);
        });

        it('by collection', async () => {
          const labels = await mbApi.browse('label', {collection: mbid.collection.Ringtone, limit: 3});
          areBunchOfLabels(labels);
        });

        it('by release', async () => {
          const labels = await mbApi.browse('label', {release: mbid.release.Formidable, limit: 3});
          areBunchOfLabels(labels);
        });
      });

      describe('place', () => {

        function areBunchOfPlaces(places: IBrowsePlacesResult) {
          areBunchOf('place', places);
        }

        it('by area', async () => {
          const places = await mbApi.browse('place', {area: mbid.area.Lisbon, limit: 3});
          areBunchOfPlaces(places);
        });

        it('by collection', async () => {
          const places = await mbApi.browse('place', {collection: mbid.collection.Ringtone, limit: 3});
          areBunchOfPlaces(places);
        });

      });

      describe('recording', () => {

        function areBunchOfRecordings(recordings: IBrowseRecordingsResult) {
          areBunchOf('recording', recordings);
        }

        it('by artist', async () => {
          const recordings = await mbApi.browse('recording', {artist: mbid.artist.DeadCombo, limit: 3});
          areBunchOfRecordings(recordings);
        });

        it('by collection', async () => {
          const recordings = await mbApi.browse('recording', {collection: mbid.collection.Ringtone, limit: 3});
          areBunchOfRecordings(recordings);
        });

        it('by release', async () => {
          const recordings = await mbApi.browse('recording', {release: mbid.release.Formidable, limit: 3});
          areBunchOfRecordings(recordings);
        });

        it('by work', async () => {
          const recordings = await mbApi.browse('recording', {work: mbid.work.Formidable, limit: 3});
          areBunchOfRecordings(recordings);
        });

      });

      describe('release', () => {

        function areBunchOfReleases(releases: IBrowseReleasesResult) {
          areBunchOf('release', releases);
        }

        it('by area', async () => {
          const releases = await mbApi.browse('release', {area: mbid.area.Lisbon, limit: 3});
          areBunchOfReleases(releases);
        });

        it('by artist', async () => {
          const releases = await mbApi.browse('release', {artist: mbid.artist.DeadCombo, limit: 3});
          areBunchOfReleases(releases);
        });

        it('by labels', async () => {
          const releases = await mbApi.browse('release', {label: mbid.label.Mosaert, limit: 3});
          areBunchOfReleases(releases);
        });

        it('by recording', async () => {
          const releases = await mbApi.browse('release', {recording: mbid.recording.Montilla, limit: 3});
          areBunchOfReleases(releases);
        });

        it('by release-group', async () => {
          const releases = await mbApi.browse('release', {'release-group': mbid.releaseGroup.Formidable, limit: 3});
          areBunchOfReleases(releases);
        });
      });

      describe('release-group', () => {

        function areBunchOfReleaseGroups(releaseGroups: IBrowseReleaseGroupsResult) {
          areBunchOf('release-group', releaseGroups);
        }

        it('by artist', async () => {
          const releaseGroups = await mbApi.browse('release-group', {artist: mbid.artist.DeadCombo, limit: 3});
          areBunchOfReleaseGroups(releaseGroups);
        });

        it('by collection', async () => {
          const releaseGroups = await mbApi.browse('release-group', {collection: mbid.collection.Ringtone, limit: 3});
          areBunchOfReleaseGroups(releaseGroups);
        });

        it('by release', async () => {
          const releaseGroups = await mbApi.browse('release-group', {release: mbid.release.Formidable, limit: 3});
          areBunchOfReleaseGroups(releaseGroups);
        });

      });

      describe('series', () => {

        function areBunchOfSeries(series: IBrowseSeriesResult) {
          areBunchOf('series', series);
        }

        it('by collection', async () => {
          const series = await mbApi.browse('series', {collection: mbid.collection.Ringtone, limit: 3});
          areBunchOfSeries(series);
        });
      });

      describe('work', async () => {

        function areBunchOfWorks(works: IBrowseWorksResult) {
          areBunchOf('work', works);
        }

        it('by collection', async () => {
          const works = await mbApi.browse('work', {collection: mbid.collection.Ringtone, limit: 3});
          areBunchOfWorks(works);
        });
      });

      describe('url', async () => {

        it('by resources', async () => {
          const url = await mbApi.browse('url', {
            resource: 'https://open.spotify.com/album/5PCfptvsmuFcxsMt86L6wn',
            limit: 3
          });
          assert.isString(url.id);
        });
      });

    });

    describe('Query', () => {

      it('query: Queen - We Will Rock You', async () => {
        const query = 'query="We Will Rock You" AND arid:0383dadf-2a4e-4d10-a46a-e9e041da8eb3';
        const result = await mbApi.search('release-group', {query});
        assert.isAtLeast(result.count, 1);
      });

    });

    describe('Search', () => {

      describe('area', () => {

        it('find area by name', async () => {
          const result = await mbApi.search('area', {query: 'Île-de-France'});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.areas.length, 1);
          assert.strictEqual(result.areas[0].id, mbid.area.IleDeFrance);
        });
      });

      describe('artist', () => {

        it('find artist: Stromae', async () => {
          const result = await mbApi.search('artist', {query: 'Stromae'});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.artists.length, 1);
          assert.strictEqual(result.artists[0].id, mbid.artist.Stromae);
        });

      });

      describe('recording', () => {

        it('find recording by artist and recoding name', async () => {
          const result = await mbApi.search('recording', {query: {name: 'Formidable', artist: 'Stromae'}});
          assert.isAtLeast(result.count, 2);
          assert.isAtLeast(result.recordings.length, 2);
          assert.includeMembers(result.recordings.map(recording => recording.id), [mbid.recording.Formidable]);
        });
      });


      describe('release', () => {

        it('find release-group: Racine carrée', async () => {
          const result = await mbApi.search('release', {query: {release: 'Racine carrée'}});
          assert.isAtLeast(result.count, 2);
          assert.isAtLeast(result.releases.length, 2);
          assert.includeMembers(result.releases.map(release => release.id), mbid.release.RacineCarree);
        });

        it('find release by barcode', async () => {
          const result = await mbApi.search('release', {query: {barcode: 602537479870}});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.releases.length, 1);
          assert.equal(result.releases[0].id, mbid.release.RacineCarree[2]);
        });

        it('find release by barcode', async () => {
          const result = await mbApi.search('release', {query: {barcode: 602537479870}});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.releases.length, 1);
          assert.equal(result.releases[0].id, mbid.release.RacineCarree[2]);
        });

        it('find releases by artist use query API', async () => {
          const artist_mbid = 'eeb41a1e-4326-4d04-8c47-0f564ceecd68';
          const result = await mbApi.search('release', {query: {arid: artist_mbid}});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.releases.length, 1);
        });

        it('find releases by artist use browse API', async () => {
          const artist_mbid = 'eeb41a1e-4326-4d04-8c47-0f564ceecd68';
          const result = await mbApi.search('release', {artist: artist_mbid});
          assert.isAtLeast(result['release-count'], 1);
          assert.isAtLeast(result.releases.length, 1);
        });

        it('find releases with inc', async () => {
          const artist_mbid = '024a7074-dcef-4851-8f9c-090a9746a75a';
          const result = await mbApi.search('release', {
            query: `arid:${artist_mbid}`,
            inc: ['release-groups', 'media', 'label-rels'],
            offset: 0,
            limit: 25
          });
          assert.isAtLeast(result.count, 1);
        });

      });

      describe('release-group', () => {

        it('find release-group: Racine carrée', async () => {
          const result = await mbApi.search('release-group', {query: 'Racine carrée'});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result['release-groups'].length, 1);
          assert.strictEqual(result['release-groups'][0].id, mbid.releaseGroup.RacineCarree);
        });

        it('find release-group: Racine carrée, by artist and group name', async () => {
          const result = await mbApi.search('release-group', {query: {release: 'Racine carrée', artist: 'Stromae'}});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result['release-groups'].length, 1);
          assert.strictEqual(result['release-groups'][0].id, mbid.releaseGroup.RacineCarree);
        });
      });

      describe('searchUrl', () => {

        const spotifyUrl = `https://open.spotify.com/album/${spotify.album.RacineCarree.id}`;

        it('find url by url', async () => {
          const result = await mbApi.search('url', {query: {url: spotifyUrl}});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.urls.length, 1);
          assert.strictEqual(result.urls[0].resource, spotifyUrl);
        });
      });
    });

  });

  describe('Submit API', () => {

    it('Post ISRC Formidable', async () => {
      const isrc_Formidable = 'BET671300161';
      const xmlMetadata = new XmlMetadata();
      const xmlRecording = xmlMetadata.pushRecording(mbid.recording.Formidable);
      xmlRecording.isrcList.pushIsrc(isrc_Formidable);

      await mbTestApi.post('recording', xmlMetadata);
    });

  });

  /**
   * https://wiki.musicbrainz.org/Development/Release_Editor_Seeding
   */
  describe.skip('User (bot) post form-data API', () => {

    it('login & logout', async () => {
      for (let n = 1; n <= 2; ++n) {
        assert.isTrue(await mbTestApi.login(), `Login ${n}`);
        assert.isTrue(await mbTestApi.logout(), `Logout ${n}`);
      }
    });

    describe('Recording', () => {

      it('add link', async () => {
        const recording = await mbTestApi.lookup('recording', mbid.recording.Formidable);
        assert.strictEqual(recording.id, mbid.recording.Formidable);
        assert.strictEqual(recording.title, 'Formidable');

        await mbTestApi.addUrlToRecording(recording, {
          linkTypeId: LinkType.stream_for_free,
          text: `https://open.spotify.com/track/${spotify.track.Formidable.id}`
        });
      });

      it('add Spotify-ID', async () => {
        const recording = await mbTestApi.lookup('recording', mbid.recording.Formidable);

        const editNote = `Unit-test musicbrainz-api (${appUrl}), test augment recording with Spotify URL & ISRC`;
        await mbTestApi.addSpotifyIdToRecording(recording, spotify.track.Formidable.id, editNote);
      });

      it('add Spotify-ID to recording with ISRC', async () => {
        // https://test.musicbrainz.org/recording/a75b85bf-63dd-4fe1-8008-d15541b93bac
        const recording_id = 'a75b85bf-63dd-4fe1-8008-d15541b93bac';

        const recording = await mbTestApi.lookup('recording', recording_id);
        const editNote = `Unit-test musicbrainz-api (${appUrl}), test augment recording with Spotify URL & ISRC`;
        await mbTestApi.addSpotifyIdToRecording(recording, '3ZDO5YINwfoifRQ3ElshPM', editNote);
      });

    });

    describe('ISRC', () => {

      it('add ISRC', async () => {
        const recording = await mbTestApi.lookup('recording', mbid.recording.Formidable, ['isrcs']);
        assert.strictEqual(recording.id, mbid.recording.Formidable);
        assert.strictEqual(recording.title, 'Formidable');

        await mbTestApi.addIsrc(recording, 'BET671300161');
      });

    });

    /**
     * https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#ISRC_submission
     */
    describe('ISRC submission', () => {

      it('add ISRC', async () => {
        const xmlMedata = new XmlMetadata();
        const xmlRec = xmlMedata.pushRecording('94fb868b-9233-4f9e-966b-e8036bf7461e');
        xmlRec.isrcList.pushIsrc('GB5EM1801762');
        await mbTestApi.post('recording', xmlMedata);
      });

    });

  });

});

describe('Cover Art Archive API', function() {

  // Base URL used by cover-art-archive to refer back to MusicBrainz release
  // The addresses are normalized to https by `CoverArtArchiveApi`
  const releaseMusicBrainzBaseUrl = 'https://musicbrainz.org/release/';

  this.timeout(10000);

  it('Get all cover-art for release Formidable', async () => {
    const coverArtArchiveApiClient = new CoverArtArchiveApi();
    const releaseCoverInfo = await coverArtArchiveApiClient.getReleaseCovers(mbid.release.Formidable);
    assert.isDefined(releaseCoverInfo);
    assert.strictEqual(releaseCoverInfo.release, releaseMusicBrainzBaseUrl + mbid.release.Formidable, 'releaseCoverInfo.release');
    assert.isDefined(releaseCoverInfo.images, 'releaseCoverInfo.images');
    assert.ok(releaseCoverInfo.images.length > 0, 'releaseCoverInfo.images.length > 0');
  });

  it('Get best back cover for release Dire Straits', async () => {
    const coverArtArchiveApiClient = new CoverArtArchiveApi();
    const releaseCoverInfo = await coverArtArchiveApiClient.getReleaseCovers(mbid.release.DireStraits);
    assert.isDefined(releaseCoverInfo);
    assert.strictEqual(releaseCoverInfo.release, releaseMusicBrainzBaseUrl + mbid.release.DireStraits, 'releaseCoverInfo.release');
    assert.isDefined(releaseCoverInfo.images, 'releaseCoverInfo.images');
    assert.ok(releaseCoverInfo.images.length > 0, 'releaseCoverInfo.images.length > 0');
  });

  it('Get front cover for release group Formidable', async () => {
    const coverArtArchiveApiClient = new CoverArtArchiveApi();
    const releaseCoverInfo = await coverArtArchiveApiClient.getReleaseGroupCovers(mbid.releaseGroup.Formidable);
    assert.isDefined(releaseCoverInfo);
    assert.isDefined(releaseCoverInfo.images, 'releaseCoverInfo.images');
    assert.ok(releaseCoverInfo.images.length > 0, 'releaseCoverInfo.images.length > 0');
  });

});
