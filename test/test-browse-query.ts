import { assert } from 'chai';
import sinon from 'sinon';
import type { IBrowseReleasesQuery } from '../lib/musicbrainz.types.js';
import { MusicBrainzApi } from '../lib/musicbrainz-api.js';

describe('Browse query reuse', () => {
  afterEach(() => sinon.restore());

  for (const frozen of [false, true]) {
    it(`does not change ${frozen ? 'frozen' : 'mutable'} options when encoding includes and filters`, async () => {
      const response = { releases: [], 'release-count': 0, 'release-offset': 0 };
      const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async () => new Response(JSON.stringify(response)));
      const api = new MusicBrainzApi({ disableRateLimiting: true });
      const query: IBrowseReleasesQuery = {
        artist: 'artist-id',
        type: ['album', 'single'],
        status: ['official'],
        offset: 25,
        limit: 10
      };
      if (frozen) {
        Object.freeze(query.type);
        Object.freeze(query.status);
        Object.freeze(query);
      }

      await api.browse('release', query, ['media']);
      await api.browse('release', query, ['media']);

      assert.strictEqual(fetchStub.callCount, 2);
      assert.deepEqual(query.type, ['album', 'single']);
      assert.deepEqual(query.status, ['official']);
      assert.notProperty(query, 'inc');
      for (const call of fetchStub.getCalls()) {
        const url = new URL(String(call.args[0]));
        assert.deepEqual(Object.fromEntries(url.searchParams), {
          artist: 'artist-id',
          type: 'album|single',
          status: 'official',
          offset: '25',
          limit: '10',
          inc: 'media',
          fmt: 'json'
        });
      }
    });
  }
});
