import { IMusicBrainzConfig, LinkType, MusicBrainzApi } from '../src/musicbrainz-api';
import { assert } from 'chai';
import { XmlMetadata } from '../src/xml/xml-metadata';
import * as mb from '../src/musicbrainz.types';
import * as fs from 'fs';
import * as path from 'path';

const packageInfo = require('../package.json');

const appUrl = 'https://github.com/Borewit/musicbrainz-api';

const testBotAccount = {
  username: process.env.MBUSER,
  password: process.env.MBPWD
};

const testApiConfig: IMusicBrainzConfig = {
  botAccount: testBotAccount,
  baseUrl: 'https://test.musicbrainz.org',

  /**
   * Enable proxy, like Fiddler
   */
  proxy: process.env.MBPROXY,

  appName: packageInfo.name,
  appVersion: packageInfo.version,
  appContactInfo: appUrl
};

const searchApiConfig: IMusicBrainzConfig = {

  baseUrl: 'https://musicbrainz.org',

  /**
   * Enable proxy, like Fiddler
   */
  proxy: process.env.MBPROXY,

  appName: packageInfo.name,
  appVersion: packageInfo.version,
  appContactInfo: appUrl
};

const mbTestApi = new MusicBrainzApi(testApiConfig);
const mbApi = new MusicBrainzApi(searchApiConfig);

// Hack shared rate-limiter
(mbApi as any).rateLimiter = (mbTestApi as any).rateLimiter;

describe('MusicBrainz-api', function() {

  this.timeout(20000); // MusicBrainz has a rate limiter

  const mbid = {
    artist: {
      Stromae: 'ab2528d9-719f-4261-8098-21849222a0f2'
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
      ]
    },
    releaseGroup: {
      Formidable: '19099ea5-3600-4154-b482-2ec68815883e',
      RacineCarree: 'd079dc50-fa9b-4a88-90f4-5e8723accd75'
    },
    work: {
      Formidable: 'b2aa02f4-6c95-43be-a426-aedb9f9a3805'
    },
    area: {
      Belgium: '5b8a5ee5-0bb3-34cf-9a75-c27c44e341fc',
      IleDeFrance: 'd79e4501-8cba-431b-96e7-bb9976f0ae76'
    },
    label: {
      Mosaert: '0550200c-22c1-4c62-b761-ef0b3665262b'
    }
  };

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

  it('Extract CSRF', () => {
    const html = fs.readFileSync(path.join(__dirname, 'csrf.html'), 'utf8');
    const csrf = MusicBrainzApi.fetchCsrf(html);
    assert.deepStrictEqual(csrf, {
      sessionKey: 'csrf_token:x0VIlHob5nPcWKqJIwNPwE5Y3kE+nGQ9fccgTSYbuMU=',
      token: '6G9f/xJ6Y4fLVvfYGHrzBUM34j6hy4CJrBi3VkVwO9I='
    }, 'CSRF data');
  });

  describe('Read metadata', () => {

    describe('Lookup', () => {

      it('get area', async () => {
        const area = await mbApi.getArea(mbid.area.Belgium);
        assert.strictEqual(area.id, mbid.area.Belgium);
        assert.strictEqual(area.name, 'Belgium');
      });

      it('get artist', async () => {
        const artist = await mbApi.getArtist(mbid.artist.Stromae);
        assert.strictEqual(artist.id, mbid.artist.Stromae);
        assert.strictEqual(artist.name, 'Stromae');
      });

      describe('Release', () => {

        it('get release Formidable', async () => {
          const release = await mbApi.getRelease(mbid.release.Formidable);
          assert.strictEqual(release.id, mbid.release.Formidable);
          assert.strictEqual(release.title, 'Formidable');
        });

        it('check release Anomalie', async () => {
          const release = await mbApi.getRelease(mbid.release.Anomalie);
          assert.strictEqual(release.id, mbid.release.Anomalie);
          assert.strictEqual(release.title, 'Anomalie');
        });

        [
          {inc: 'artist-credits', key: 'artist-credit'},
          {inc: 'artists', key: 'artist-credit'},
          {inc: 'collections', key: 'collections'},
          {inc: 'labels', key: 'release-events'},
          {inc: 'media', key: 'media'},
          // {inc: 'recordings', key: 'recordings'},
          {inc: 'release-groups', key: 'release-group'}
        ].forEach(inc => {

          it(`get release, include: '${inc.inc}'`, async () => {
            const release = await mbApi.getRelease(mbid.release.Formidable, [inc.inc as any]);
            assert.strictEqual(release.id, mbid.release.Formidable);
            assert.strictEqual(release.title, 'Formidable');
            assert.isDefined(release[inc.key], `Should include '${inc.key}'`);
          });
        });

      });

      describe('Release-group', () => {

        it('get release-group', async () => {
          const releaseGroup = await mbApi.getReleaseGroup(mbid.releaseGroup.Formidable);
          assert.strictEqual(releaseGroup.id, mbid.releaseGroup.Formidable);
          assert.strictEqual(releaseGroup.title, 'Formidable');
        });

        [
          {inc: 'artist-credits', key: 'artist-credit'}
        ].forEach(inc => {

          it(`get release-group, include: '${inc.inc}'`, async () => {
            const group = await mbApi.getReleaseGroup(mbid.releaseGroup.Formidable, [inc.inc as any]);
            assert.strictEqual(group.id, mbid.releaseGroup.Formidable);
            assert.strictEqual(group.title, 'Formidable');
            assert.isDefined(group[inc.key], `Should include '${inc.key}'`);
          });
        });

      });

      it('get work', async () => {
        const work = await mbApi.getWork(mbid.work.Formidable);
        assert.strictEqual(work.id, mbid.work.Formidable);
        assert.strictEqual(work.title, 'Formidable');
      });

      it('get label', async () => {
        const label = await mbApi.getLabel(mbid.label.Mosaert);
        assert.strictEqual(label.id, mbid.label.Mosaert);
        assert.strictEqual(label.name, 'Mosaert');
      });

      describe('Recording', () => {

        it('get recording', async () => {
          const recording = await mbApi.getRecording(mbid.recording.Formidable);
          assert.strictEqual(recording.id, mbid.recording.Formidable);
          assert.strictEqual(recording.title, 'Formidable');
          assert.isUndefined(recording.isrcs);
          assert.isUndefined(recording['artist-credit']);
          assert.isUndefined(recording.releases);
        });

        [
          {inc: 'isrcs', key: 'isrcs'},
          {inc: 'artist-credits', key: 'artist-credit'},
          {inc: 'artists', key: 'artist-credit'},
          {inc: 'releases', key: 'releases'}
        ].forEach(inc => {

          it(`get recording, include: '${inc.inc}'`, async () => {
            const recording = await mbApi.getRecording(mbid.recording.Formidable, [inc.inc as any]);
            assert.strictEqual(recording.id, mbid.recording.Formidable);
            assert.strictEqual(recording.title, 'Formidable');
            assert.isDefined(recording[inc.key], `Should include '${inc.key}'`);
          });
        });

        it('get extended recording', async () => {
          const recording = await mbApi.getRecording(mbid.recording.Formidable, ['isrcs', 'artists', 'releases', 'url-rels']);
          assert.strictEqual(recording.id, mbid.recording.Formidable);
          assert.strictEqual(recording.title, 'Formidable');
          assert.isDefined(recording.isrcs);
          assert.isDefined(recording['artist-credit']);
          // assert.isDefined(recording.releases);
        });
      });

    });

    describe('Query', () => {

      it('query: Queen - We Will Rock You', async () => {
        const query = 'query="We Will Rock You" AND arid:0383dadf-2a4e-4d10-a46a-e9e041da8eb3';
        const result = await mbApi.search<mb.IReleaseGroupList>('release-group', {query});
        assert.isAtLeast(result.count, 1);
      });

    });

    describe('Search', () => {

      describe('generic search', () => {

        it('find artist: Stromae', async () => {
          const result = await mbApi.search('artist', {query: 'Stromae'});
          assert.isAtLeast(result.count, 1);
        });

      });

      describe('searchArtist', () => {

        it('find artist: Stromae', async () => {
          const result = await mbApi.searchArtist({query: 'Stromae'});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.artists.length, 1);
          assert.strictEqual(result.artists[0].id, mbid.artist.Stromae);
        });

      });

      describe('searchReleaseGroup', () => {

        it('find release-group: Racine carrée', async () => {
          const result = await mbApi.searchReleaseGroup({query: 'Racine carrée'});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result['release-groups'].length, 1);
          assert.strictEqual(result['release-groups'][0].id, mbid.releaseGroup.RacineCarree);
        });

        it('find release-group: Racine carrée, by artist and group name', async () => {
          const result = await mbApi.searchReleaseGroup({query: {release: 'Racine carrée', artist: 'Stromae'}});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result['release-groups'].length, 1);
          assert.strictEqual(result['release-groups'][0].id, mbid.releaseGroup.RacineCarree);
        });
      });

      describe('searchRelease', () => {

        it('find release-group: Racine carrée', async () => {
          const result = await mbApi.searchRelease({query: {release: 'Racine carrée'}});
          assert.isAtLeast(result.count, 2);
          assert.isAtLeast(result.releases.length, 2);
          assert.includeMembers(result.releases.map(release => release.id), mbid.release.RacineCarree);
        });

        it('find release by barcode', async () => {
          const result = await mbApi.searchRelease({query: {barcode: 602537479870}});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.releases.length, 1);
          assert.equal(result.releases[0].id, mbid.release.RacineCarree[2]);
        });

        it('find release by barcode', async () => {
          const result = await mbApi.searchRelease({query: {barcode: 602537479870}});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.releases.length, 1);
          assert.equal(result.releases[0].id, mbid.release.RacineCarree[2]);
        });

        it('find releases by artist use query API', async () => {
          const artist_mbid = 'eeb41a1e-4326-4d04-8c47-0f564ceecd68';
          const result = await mbApi.searchRelease({query: {arid: artist_mbid} });
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.releases.length, 1);
        });

        it('find releases by artist use browse API', async () => {
          const artist_mbid = 'eeb41a1e-4326-4d04-8c47-0f564ceecd68';
          const result = await mbApi.searchRelease({artist:  artist_mbid});
          assert.isAtLeast(result['release-count'], 1);
          assert.isAtLeast(result.releases.length, 1);
        });

      });

      describe('searchArea', () => {

        it('find area by name', async () => {
          const result = await mbApi.searchArea({query: 'Île-de-France'});
          assert.isAtLeast(result.count, 1);
          assert.isAtLeast(result.areas.length, 1);
          assert.strictEqual(result.areas[0].id, mbid.area.IleDeFrance);
        });
      });

      describe('searchUrl', () => {

        const spotifyUrl = 'https://open.spotify.com/album/' + spotify.album.RacineCarree.id;

        it('find url by url', async () => {
          const result = await mbApi.searchUrl({query: {url: spotifyUrl}});
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
        const recording = await mbTestApi.getRecording(mbid.recording.Formidable);
        assert.strictEqual(recording.id, mbid.recording.Formidable);
        assert.strictEqual(recording.title, 'Formidable');

        await mbTestApi.addUrlToRecording(recording, {
          linkTypeId: LinkType.stream_for_free,
          text: 'https://open.spotify.com/track/' + spotify.track.Formidable.id
        });
      });

      it('add Spotify-ID', async () => {
        const recording = await mbTestApi.getRecording(mbid.recording.Formidable);

        const editNote = `Unit-test musicbrainz-api (${appUrl}), test augment recording with Spotify URL & ISRC`;
        await mbTestApi.addSpotifyIdToRecording(recording, spotify.track.Formidable.id, editNote);
      });

      it('add Spotify-ID to recording with ISRC', async () => {
        // https://test.musicbrainz.org/recording/a75b85bf-63dd-4fe1-8008-d15541b93bac
        const recording_id = 'a75b85bf-63dd-4fe1-8008-d15541b93bac';

        const recording = await mbTestApi.getRecording(recording_id);
        const editNote = `Unit-test musicbrainz-api (${appUrl}), test augment recording with Spotify URL & ISRC`;
        await mbTestApi.addSpotifyIdToRecording(recording, '3ZDO5YINwfoifRQ3ElshPM', editNote);
      });

    });

    describe('ISRC', () => {

      it('add ISRC', async () => {
        const recording = await mbTestApi.getRecording(mbid.recording.Formidable, ['isrcs']);
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
