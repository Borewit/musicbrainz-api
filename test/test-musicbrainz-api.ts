import {LinkType, MusicBrainzApi} from '../src/musicbrainz-api';
import {assert} from 'chai';
import {XmlMetadata} from "../src/xml/xml-metadata";
import * as mb from '../src/musicbrainz.types';

assert.isDefined(process.env.MBUSER, 'Set environment variable MBUSER');
assert.isDefined(process.env.MBPWD, 'Set environment variable MBPWD');
assert.isDefined(process.env.MBPWD, 'Set environment variable MBEMAIL');

const testBotAccount = {
  username: process.env.MBUSER,
  password: process.env.MBPWD
};

const config = {
  botAccount: testBotAccount,
  baseUrl: 'https://test.musicbrainz.org',

  /**
   * Enable proxy, like Fiddler
   */
  proxy: process.env.MBPROXY,

  appName: 'what-music',
  appVersion: '0.1.0',
  appMail: process.env.MBEMAIL
};

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
      Anomalie: '478aaba4-9425-4a67-8951-a77739462df4'
    },
    releaseGroup: {
      Formidable: '19099ea5-3600-4154-b482-2ec68815883e',
      RacineCarree: 'd079dc50-fa9b-4a88-90f4-5e8723accd75'
    },
    work: {
      Formidable: 'b2aa02f4-6c95-43be-a426-aedb9f9a3805'
    },
    area: {
      Belgium: '5b8a5ee5-0bb3-34cf-9a75-c27c44e341fc'
    },
    label: {
      Mosaert: '0550200c-22c1-4c62-b761-ef0b3665262b'
    }
  };

  const spotify = {
    track: {
      Formidable: {
        id: '2AMysGXOe0zzZJMtH3Nizb'
      }
    }
  };

  describe('Read metadata', () => {

    const mbApi = new MusicBrainzApi(config);

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
        const result = await mbApi.query<mb.IReleaseGroupList>('release-group', {query});
        assert.isAtLeast(result.count, 1);
      });

    });

    describe('Search', () => {

      it('find artist: Stromae', async () => {
        const result = await mbApi.searchArtist('Stromae');
        assert.isAtLeast(result.count, 1);
        assert.isAtLeast(result.artists.length, 1);
        assert.strictEqual(result.artists[0].id, mbid.artist.Stromae);
      });

      it('find release-group: Racine carrée', async () => {
        const result = await mbApi.searchReleaseGroup('Racine carrée');
        assert.isAtLeast(result.count, 1);
        assert.isAtLeast(result['release-groups'].length, 1);
        assert.strictEqual(result['release-groups'][0].id, mbid.releaseGroup.RacineCarree);
      });

      it('find release-group: Racine carrée, by artist and group name', async () => {
        const result = await mbApi.searchReleaseGroupByTitleAndArtist('Racine carrée', 'Stromae');
        assert.isAtLeast(result.count, 1);
        assert.isAtLeast(result['release-groups'].length, 1);
        assert.strictEqual(result['release-groups'][0].id, mbid.releaseGroup.RacineCarree);
      });

    });

  });

  describe('Submit API', () => {

    const mbApi = new MusicBrainzApi(config);

    it('Post ISRC Formidable', async () => {

      const isrc_Formidable = 'BET671300161';
      const xmlMetadata = new XmlMetadata();
      const xmlRecording = xmlMetadata.pushRecording(mbid.recording.Formidable);
      xmlRecording.isrcList.pushIsrc(isrc_Formidable);

      await mbApi.post('recording', xmlMetadata);
    });

  });

  /**
   * https://wiki.musicbrainz.org/Development/Release_Editor_Seeding
   */
  describe('User (bot) post form-data API', () => {

    const mbApi = new MusicBrainzApi(config);

    it('login', async () => {

      const succeed = await mbApi.login();
      assert.isTrue(succeed, 'Login successful');
    });

    describe('Recording', () => {

      it('add link', async () => {

        const recording = await mbApi.getRecording(mbid.recording.Formidable);
        assert.strictEqual(recording.id, mbid.recording.Formidable);
        assert.strictEqual(recording.title, 'Formidable');

        const succeed = await mbApi.login();
        assert.isTrue(succeed, 'Login successful');
        await mbApi.addUrlToRecording(recording, {
          linkTypeId: LinkType.stream_for_free,
          text: 'https://open.spotify.com/track/' + spotify.track.Formidable.id
        });
      });

      it('add Spotify-ID', async () => {

        const recording = await mbApi.getRecording(mbid.recording.Formidable);

        const succeed = await mbApi.login();
        assert.isTrue(succeed, 'Login successful');
        await mbApi.addSpotifyIdToRecording(recording, spotify.track.Formidable.id);
      });

    });

    describe('ISRC', () => {

      it('add ISRC', async () => {

        const recording = await mbApi.getRecording(mbid.recording.Formidable);
        assert.strictEqual(recording.id, mbid.recording.Formidable);
        assert.strictEqual(recording.title, 'Formidable');

        const succeed = await mbApi.login();
        assert.isTrue(succeed, 'Login successful');
        await mbApi.addIsrc(recording, 'BET671300161');
      });

    });

  });

});
