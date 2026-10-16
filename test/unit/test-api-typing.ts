import { assert } from 'chai';
import sinon from 'sinon';
import { MusicBrainzApi } from '../../lib/musicbrainz-api.js';
import {
  cdStubLookup,
  discLookup,
  genreCollection,
  genres,
  isrcLookup,
  iswcLookup,
  tocLookup
} from '../response-types.js';

// Offline regressions based on the API documentation and upstream JSON controller tests:
// https://github.com/metabrainz/musicbrainz-server/tree/master/t/lib/t/MusicBrainz/Server/Controller/WS/2/JSON
function makeClient() {
  return new MusicBrainzApi({ disableRateLimiting: true, accessToken: 'test-token' });
}

describe('MusicBrainz request and response coverage', () => {
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch');
  });

  afterEach(() => sinon.restore());

  const cases: {
    name: string;
    request: (api: MusicBrainzApi) => Promise<unknown>;
    path: string;
    query: Record<string, string>;
    response: object;
  }[] = [
    {
      name: 'genre lookup',
      request: api => api.lookup('genre', 'genre-id'),
      path: '/genre/genre-id',
      query: { inc: '' },
      response: genres.genres[0]
    },
    {
      name: 'genre list pagination',
      request: api => api.getGenres({ offset: 25, limit: 10 }),
      path: '/genre/all',
      query: { offset: '25', limit: '10' },
      response: { ...genres, 'genre-offset': 25 }
    },
    {
      name: 'genre/all lookup overload',
      request: api => api.lookup('genre', 'all', [], { offset: 25, limit: 10 }),
      path: '/genre/all',
      query: { offset: '25', limit: '10', inc: '' },
      response: { ...genres, 'genre-offset': 25 }
    },
    {
      name: 'genre browsing via collection',
      request: api => api.browse('genre', { collection: 'collection-id', limit: 10 }),
      path: '/genre',
      query: { collection: 'collection-id', limit: '10' },
      response: genres
    },
    {
      name: 'genre collections',
      request: api => api.browse('collection', { genre: 'genre-id' }),
      path: '/collection',
      query: { genre: 'genre-id' },
      response: { 'collection-count': 1, 'collection-offset': 0, collections: [genreCollection] }
    },
    {
      name: 'ISRC lookup',
      request: api => api.lookup('isrc', isrcLookup.isrc, ['releases', 'artist-credits']),
      path: `/isrc/${isrcLookup.isrc}`,
      query: { inc: 'releases artist-credits' },
      response: isrcLookup
    },
    {
      name: 'ISWC work-list response',
      request: api => api.lookup('iswc', 'T-000.000.001-0', ['artist-rels']),
      path: '/iswc/T-000.000.001-0',
      query: { inc: 'artist-rels' },
      response: iswcLookup
    },
    {
      name: 'disc lookup response',
      request: api => api.lookup('discid', 'disc-id', ['recordings'], { cdstubs: 'no' }),
      path: '/discid/disc-id',
      query: { inc: 'recordings', cdstubs: 'no' },
      response: discLookup
    },
    {
      name: 'disc lookup CD-stub fallback',
      request: api => api.lookup('discid', 'disc-id'),
      path: '/discid/disc-id',
      query: { inc: '' },
      response: cdStubLookup
    },
    {
      name: 'fuzzy TOC lookup release-list response',
      request: api =>
        api.lookup('discid', '-', [], {
          toc: '1 1 12000 150',
          cdstubs: 'no',
          'media-format': 'all',
          limit: 5,
          offset: 0
        }),
      path: '/discid/-',
      query: { toc: '1 1 12000 150', cdstubs: 'no', 'media-format': 'all', limit: '5', offset: '0', inc: '' },
      response: tocLookup
    },
    {
      name: 'release browsing by collection',
      request: api => api.browse('release', { collection: 'collection-id' }),
      path: '/release',
      query: { collection: 'collection-id' },
      response: tocLookup
    },
    {
      name: 'release browsing by track',
      request: api => api.browse('release', { track: 'track-id' }),
      path: '/release',
      query: { track: 'track-id' },
      response: tocLookup
    },
    {
      name: 'event browsing by event',
      request: api => api.browse('event', { event: 'event-id' }),
      path: '/event',
      query: { event: 'event-id' },
      response: { 'event-count': 0, 'event-offset': 0, events: [] }
    },
    {
      name: 'event browsing by series',
      request: api => api.browse('event', { series: 'series-id' }),
      path: '/event',
      query: { series: 'series-id' },
      response: { 'event-count': 0, 'event-offset': 0, events: [] }
    },
    {
      name: 'release-group status filter',
      request: api =>
        api.browse('release-group', {
          artist: 'artist-id',
          'release-group-status': 'website-default',
          type: ['album', 'audio drama']
        }),
      path: '/release-group',
      query: { artist: 'artist-id', 'release-group-status': 'website-default', type: 'album|audio drama' },
      response: { 'release-group-count': 0, 'release-group-offset': 0, 'release-groups': [] }
    },
    {
      name: 'lookup type and status filters',
      request: api =>
        api.lookup('artist', 'artist-id', ['releases', 'discids', 'artist-credits'], {
          type: ['album', 'audio drama'],
          status: ['official', 'bootleg']
        }),
      path: '/artist/artist-id',
      query: { inc: 'releases discids artist-credits', type: 'album|audio drama', status: 'official|bootleg' },
      response: { id: 'artist-id', name: 'Artist', releases: [] }
    },
    {
      name: 'nested relationship and user data includes',
      request: api =>
        api.lookup('release', 'release-id', [
          'recording-level-rels',
          'release-group-level-rels',
          'work-level-rels',
          'work-rels',
          'user-tags',
          'user-genres',
          'user-ratings',
          'user-collections'
        ]),
      path: '/release/release-id',
      query: {
        inc: 'recording-level-rels release-group-level-rels work-level-rels work-rels user-tags user-genres user-ratings user-collections'
      },
      response: { id: 'release-id', title: 'Release' }
    },
    {
      name: 'legacy search-as-browse response and filter encoding',
      request: api => api.search('release', { artist: 'artist-id', status: ['official'], inc: ['media'] }),
      path: '/release/',
      query: { artist: 'artist-id', status: 'official', inc: 'media' },
      response: tocLookup
    },
    {
      name: 'Lucene search response',
      request: api => api.search('release', { query: { artist: 'Artist', release: 'Album' }, limit: 1, dismax: true }),
      path: '/release/',
      query: { query: 'artist:"Artist" AND release:"Album"', limit: '1', dismax: 'true' },
      response: {
        created: '2026-10-16T00:00:00Z',
        count: 1,
        offset: 0,
        releases: [{ id: 'release-id', title: 'Album', score: 100 }]
      }
    },
    {
      name: 'user tags endpoint',
      request: api => api.getUserTags({ entity: 'release', id: 'release-id' }),
      path: '/tag',
      query: { entity: 'release', id: 'release-id' },
      response: { 'user-tags': [{ name: 'rock' }] }
    },
    {
      name: 'user rating endpoint',
      request: api => api.getUserRating({ entity: 'place', id: 'place-id' }),
      path: '/rating',
      query: { entity: 'place', id: 'place-id' },
      response: { 'user-rating': { value: null } }
    }
  ];

  for (const testCase of cases) {
    it(testCase.name, async () => {
      fetchStub.resolves(new Response(JSON.stringify(testCase.response)));
      const result = await testCase.request(makeClient());
      assert.deepEqual(result, testCase.response);
      assert.isTrue(fetchStub.calledOnce);
      const [requestUrl, options] = fetchStub.firstCall.args;
      const url = new URL(String(requestUrl));
      assert.strictEqual(url.pathname, `/ws/2${testCase.path}`);
      assert.deepEqual(Object.fromEntries(url.searchParams), { ...testCase.query, fmt: 'json' });
      assert.strictEqual(new Headers(options.headers).get('Authorization'), 'Bearer test-token');
    });
  }

  it('normalizes the legacy URL search relationship field', async () => {
    const relation = { type: 'streaming', 'type-id': 'relation-id', direction: 'forward' };
    fetchStub.resolves(
      new Response(
        JSON.stringify({
          created: '2026-10-16T00:00:00Z',
          count: 1,
          offset: 0,
          urls: [{ id: 'url-id', resource: 'https://example.test', score: 100, 'relation-list': [relation] }]
        })
      )
    );
    const result = await makeClient().search('url', { query: 'url:example.test' });
    assert.deepEqual(result.urls[0].relations, [relation]);
  });

  it('handles URL resource requests through search without applying search response normalization', async () => {
    const response = { id: 'url-id', resource: 'https://example.test' };
    fetchStub.resolves(new Response(JSON.stringify(response)));
    const result = await makeClient().search('url', { resource: response.resource });
    assert.deepEqual(result, response);
  });

  it('wraps a single URL in a list when given a one-element array', async () => {
    const url = { id: 'url-id', resource: 'https://example.test/?a=1&b=two' };
    fetchStub.resolves(new Response(JSON.stringify(url)));
    assert.deepEqual(await makeClient().lookupUrl([url.resource]), { 'url-count': 1, 'url-offset': 0, urls: [url] });
    assert.strictEqual(new URL(String(fetchStub.firstCall.args[0])).searchParams.get('resource'), url.resource);
  });

  it('preserves repeated URL resources', async () => {
    const urls = ['https://one.example.test/?a=1', 'https://two.example.test/?b=2'];
    const response = { 'url-count': 0, 'url-offset': 0, urls: [] };
    fetchStub.resolves(new Response(JSON.stringify(response)));
    assert.deepEqual(await makeClient().lookupUrl(urls), response);
    assert.deepEqual(new URL(String(fetchStub.firstCall.args[0])).searchParams.getAll('resource'), urls);
  });
});
