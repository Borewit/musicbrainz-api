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
      spanishAcousticGuitar: '117dacfc-0ad0-4e90-81a4-a28b4c03929b'
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
      ]
    },
    releaseGroup: {
      Formidable: '19099ea5-3600-4154-b482-2ec68815883e',
      RacineCarree: 'd079dc50-fa9b-4a88-90f4-5e8723accd75'
    },
    work: {
      Formidable: 'b2aa02f4-6c95-43be-a426-aedb9f9a3805'
    },
    url: {
      SpotifyLisboaMulata: 'c69556a6-7ded-4c54-809c-afb45a1abe7d'
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

      it('area', async () => {
        const area = await mbApi.lookupArea(mbid.area.Belgium);
        assert.strictEqual(area.id, mbid.area.Belgium);
        assert.strictEqual(area.name, 'Belgium');
      });

      it('artist', async () => {
        const artist = await mbApi.lookupArtist(mbid.artist.Stromae);
        assert.strictEqual(artist.id, mbid.artist.Stromae);
        assert.strictEqual(artist.name, 'Stromae');
      });

      [
        {inc: 'works', key: 'works'},
        {inc: 'genres', key: 'genres'},
        {inc: 'ratings', key: 'rating'}
      ].forEach(inc => {
        it(`artist-include: '${inc.inc}'`, async () => {
          const artist = await mbApi.lookupArtist(mbid.artist.Stromae, [inc.inc as any]);
          assert.strictEqual(artist.id, mbid.artist.Stromae);
          assert.strictEqual(artist.name, 'Stromae');
          assert.isDefined(artist[inc.key], `Should include '${inc.key}'`);
        });
      });

      it('instrument', async () => {
        const instrument = await mbApi.lookupInstrument(mbid.instrument.spanishAcousticGuitar);
        assert.strictEqual(instrument.id, mbid.instrument.spanishAcousticGuitar);
        assert.strictEqual(instrument.type, 'String instrument');
      });

      it('label', async () => {
        const label = await mbApi.lookupLabel(mbid.label.Mosaert);
        assert.strictEqual(label.id, mbid.label.Mosaert);
        assert.strictEqual(label.name, 'Mosaert');
      });

      describe('release', () => {

        it('release Formidable', async () => {
          const release = await mbApi.lookupRelease(mbid.release.Formidable);
          assert.strictEqual(release.id, mbid.release.Formidable);
          assert.strictEqual(release.title, 'Formidable');
        });

        it('check release Anomalie', async () => {
          const release = await mbApi.lookupRelease(mbid.release.Anomalie);
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
            const release = await mbApi.lookupRelease(mbid.release.Formidable, [inc.inc as any]);
            assert.strictEqual(release.id, mbid.release.Formidable);
            assert.strictEqual(release.title, 'Formidable');
            assert.isDefined(release[inc.key], `Should include '${inc.key}'`);
          });
        });

      });

      describe('recording', () => {

        it('recording', async () => {
          const recording = await mbApi.lookupRecording(mbid.recording.Formidable);
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

          it(`recording, include: '${inc.inc}'`, async () => {
            const recording = await mbApi.lookupRecording(mbid.recording.Formidable, [inc.inc as any]);
            assert.strictEqual(recording.id, mbid.recording.Formidable);
            assert.strictEqual(recording.title, 'Formidable');
            assert.isDefined(recording[inc.key], `Should include '${inc.key}'`);
          });
        });

        it('extended recording', async () => {
          const recording = await mbApi.lookupRecording(mbid.recording.Formidable, ['isrcs', 'artists', 'releases', 'url-rels']);
          assert.strictEqual(recording.id, mbid.recording.Formidable);
          assert.strictEqual(recording.title, 'Formidable');
          assert.isDefined(recording.isrcs);
          assert.isDefined(recording['artist-credit']);
          // assert.isDefined(recording.releases);
        });
      });

      describe('release-group', () => {

        it('release-group', async () => {
          const releaseGroup = await mbApi.lookupReleaseGroup(mbid.releaseGroup.Formidable);
          assert.strictEqual(releaseGroup.id, mbid.releaseGroup.Formidable);
          assert.strictEqual(releaseGroup.title, 'Formidable');
        });

        [
          {inc: 'artist-credits', key: 'artist-credit'}
        ].forEach(inc => {

          it(`get release-group, include: '${inc.inc}'`, async () => {
            const group = await mbApi.lookupReleaseGroup(mbid.releaseGroup.Formidable, [inc.inc as any]);
            assert.strictEqual(group.id, mbid.releaseGroup.Formidable);
            assert.strictEqual(group.title, 'Formidable');
            assert.isDefined(group[inc.key], `Should include '${inc.key}'`);
          });
        });

      });

      it('work', async () => {
        const work = await mbApi.lookupWork(mbid.work.Formidable);
        assert.strictEqual(work.id, mbid.work.Formidable);
        assert.strictEqual(work.title, 'Formidable');
      });

      it('url', async () => {
        const url = await mbApi.lookupUrl(mbid.url.SpotifyLisboaMulata);
        assert.strictEqual(url.id, mbid.url.SpotifyLisboaMulata);
        assert.strictEqual(url.resource, 'https://open.spotify.com/album/5PCfptvsmuFcxsMt86L6wn');
      });


      describe('event', () => {
        it('event', async () => {
          const event = await mbApi.lookupEvent(mbid.event.DireStraitsAlchemyLoveOverGold);
          assert.strictEqual(event.id, mbid.event.DireStraitsAlchemyLoveOverGold);
          assert.strictEqual(event.name, "Dire Straits - Love Over Gold");
          assert.strictEqual(event.type, "Concert");
        });

        [
          {inc: 'tags', key: 'tags'},
          {inc: 'artist-rels', key: 'relations'},
          {inc: 'ratings', key: 'rating'}
        ].forEach(inc => {

          it(`event, include: '${inc.inc}'`, async () => {
            const event = await mbApi.lookupEvent(mbid.event.DireStraitsAlchemyLoveOverGold, [inc.inc as any]);
            assert.strictEqual(event.id, mbid.event.DireStraitsAlchemyLoveOverGold);
            assert.strictEqual(event.name, "Dire Straits - Love Over Gold");
            assert.isDefined(event[inc.key], `Should include '${inc.key}'`);
          });
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

        it('find releases with inc', async () => {
          const artist_mbid = '024a7074-dcef-4851-8f9c-090a9746a75a';
          const result = await mbApi.searchRelease({
            query: `arid:${artist_mbid}`,
            inc: ['release-groups', 'media', 'label-rels'],
            offset: 0,
            limit: 25
          });
          assert.isAtLeast(result.count, 1);
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
        const recording = await mbTestApi.lookupRecording(mbid.recording.Formidable);
        assert.strictEqual(recording.id, mbid.recording.Formidable);
        assert.strictEqual(recording.title, 'Formidable');

        await mbTestApi.addUrlToRecording(recording, {
          linkTypeId: LinkType.stream_for_free,
          text: 'https://open.spotify.com/track/' + spotify.track.Formidable.id
        });
      });

      it('add Spotify-ID', async () => {
        const recording = await mbTestApi.lookupRecording(mbid.recording.Formidable);

        const editNote = `Unit-test musicbrainz-api (${appUrl}), test augment recording with Spotify URL & ISRC`;
        await mbTestApi.addSpotifyIdToRecording(recording, spotify.track.Formidable.id, editNote);
      });

      it('add Spotify-ID to recording with ISRC', async () => {
        // https://test.musicbrainz.org/recording/a75b85bf-63dd-4fe1-8008-d15541b93bac
        const recording_id = 'a75b85bf-63dd-4fe1-8008-d15541b93bac';

        const recording = await mbTestApi.lookupRecording(recording_id);
        const editNote = `Unit-test musicbrainz-api (${appUrl}), test augment recording with Spotify URL & ISRC`;
        await mbTestApi.addSpotifyIdToRecording(recording, '3ZDO5YINwfoifRQ3ElshPM', editNote);
      });

    });

    describe('ISRC', () => {

      it('add ISRC', async () => {
        const recording = await mbTestApi.lookupRecording(mbid.recording.Formidable, ['isrcs']);
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
