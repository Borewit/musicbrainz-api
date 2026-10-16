import { assert } from 'chai';
import sinon from 'sinon';
import { MusicBrainzApi, MusicBrainzApiError, XmlMetadata } from '../../lib/entry-default.js';

const recordingId = '16afa384-174e-435e-bfa3-5591accda31c';

describe('MusicBrainz request and response contracts', () => {
  let fetchStub: sinon.SinonStub;
  let api: MusicBrainzApi;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch');
    api = new MusicBrainzApi({
      baseUrl: 'https://example.test',
      appName: 'test-app',
      appVersion: '1.0.0',
      appContactInfo: 'https://example.test/contact',
      disableRateLimiting: true
    });
  });

  afterEach(() => sinon.restore());

  function requestUrl(): URL {
    return new URL(String(fetchStub.firstCall.args[0]));
  }

  it('returns a lookup response and encodes includes with the application user agent', async () => {
    const recording = { id: recordingId, title: 'Formidable', isrcs: ['BET671300161'] };
    fetchStub.resolves(new Response(JSON.stringify(recording)));

    assert.deepEqual((await api.lookup('recording', recordingId, ['isrcs', 'artist-credits'])) as unknown, recording);
    assert.strictEqual(requestUrl().pathname, `/ws/2/recording/${recordingId}`);
    assert.strictEqual(requestUrl().searchParams.get('inc'), 'isrcs artist-credits');
    assert.strictEqual(requestUrl().searchParams.get('fmt'), 'json');
    assert.strictEqual(
      new Headers(fetchStub.firstCall.args[1].headers).get('User-Agent'),
      'test-app/1.0.0 ( https://example.test/contact )'
    );
  });

  it('allows a lookup without includes', async () => {
    fetchStub.resolves(new Response(JSON.stringify({ id: recordingId })));
    await api.lookup('recording', recordingId);
    assert.strictEqual(requestUrl().searchParams.get('inc'), '');
  });

  it('preserves the single URL lookup response', async () => {
    const url = { id: 'url-id', resource: 'https://example.test/song' };
    fetchStub.resolves(new Response(JSON.stringify(url)));
    assert.deepEqual((await api.lookupUrl(url.resource, ['artist-rels'])) as unknown, url);
    assert.strictEqual(requestUrl().pathname, '/ws/2/url');
    assert.deepEqual(requestUrl().searchParams.getAll('resource'), [url.resource]);
    assert.strictEqual(requestUrl().searchParams.get('inc'), 'artist-rels');
  });

  it('wraps a one-element URL array lookup response in a result list', async () => {
    const url = { id: 'url-id', resource: 'https://example.test/song' };
    fetchStub.resolves(new Response(JSON.stringify(url)));
    assert.deepEqual((await api.lookupUrl([url.resource], ['artist-rels'])) as unknown, {
      'url-count': 1,
      'url-offset': 0,
      urls: [url]
    });
    assert.strictEqual(requestUrl().pathname, '/ws/2/url');
    assert.deepEqual(requestUrl().searchParams.getAll('resource'), [url.resource]);
    assert.strictEqual(requestUrl().searchParams.get('inc'), 'artist-rels');
  });

  it('returns multi-URL lookup results and encodes repeated resource parameters', async () => {
    const resources = ['https://example.test/a', 'https://example.test/b'];
    const result = { 'url-count': 2, 'url-offset': 0, urls: resources.map(resource => ({ resource })) };
    fetchStub.resolves(new Response(JSON.stringify(result)));
    assert.deepEqual(await api.lookupUrl(resources), result);
    assert.deepEqual(requestUrl().searchParams.getAll('resource'), resources);
  });

  it('allows browsing without query options', async () => {
    const result = { 'area-count': 0, 'area-offset': 0, areas: [] };
    fetchStub.resolves(new Response(JSON.stringify(result)));
    assert.deepEqual((await api.browse('area')) as unknown, result);
    assert.strictEqual(requestUrl().pathname, '/ws/2/area');
    assert.deepEqual(Object.fromEntries(requestUrl().searchParams), { fmt: 'json' });
  });

  it('serializes structured searches, includes and pagination without modifying caller options', async () => {
    const result = { count: 1, offset: 5, recordings: [{ id: recordingId, title: 'Formidable' }] };
    fetchStub.resolves(new Response(JSON.stringify(result)));
    const query = Object.freeze({
      query: Object.freeze({ artist: 'Stromae', recording: 'Formidable' }),
      inc: ['artist-credits'] as 'artist-credits'[],
      limit: 10,
      offset: 5
    });
    assert.deepEqual(await api.search('recording', query), result);
    assert.strictEqual(requestUrl().pathname, '/ws/2/recording/');
    assert.deepEqual(Object.fromEntries(requestUrl().searchParams), {
      query: 'artist:"Stromae" AND recording:"Formidable"',
      inc: 'artist-credits',
      limit: '10',
      offset: '5',
      fmt: 'json'
    });
    assert.deepEqual(query.inc, ['artist-credits']);
  });

  it('preserves raw Lucene queries', async () => {
    fetchStub.resolves(new Response(JSON.stringify({ count: 0, offset: 0, artists: [] })));
    await api.search('artist', { query: 'artist:"Stromae" AND country:BE' });
    assert.strictEqual(requestUrl().searchParams.get('query'), 'artist:"Stromae" AND country:BE');
  });

  it('normalizes legacy URL search relations without overwriting current relations', async () => {
    const legacyRelations = [{ type: 'streaming', target: recordingId }];
    const currentRelations = [{ type: 'download', target: recordingId }];
    fetchStub.resolves(
      new Response(
        JSON.stringify({
          count: 3,
          offset: 0,
          urls: [
            { id: 'legacy', 'relation-list': legacyRelations },
            { id: 'current', relations: currentRelations, 'relation-list': legacyRelations },
            { id: 'plain' }
          ]
        })
      )
    );
    const result = await api.search('url', { query: 'url:example.test' });
    assert.deepEqual(result.urls[0].relations as unknown, legacyRelations);
    assert.deepEqual(result.urls[1].relations as unknown, currentRelations);
    assert.notProperty(result.urls[2], 'relations');
  });

  for (const { body, headers, detail } of [
    { body: '{"error":"Invalid query"}', headers: { 'Content-Type': 'application/json' }, detail: 'Invalid query' },
    { body: '<html>Bad request</html>', headers: { 'Content-Type': 'text/html' }, detail: 'Bad Request' }
  ]) {
    it(`reports failed GET responses with ${headers['Content-Type']} bodies`, async () => {
      fetchStub.resolves(new Response(body, { status: 400, statusText: 'Bad Request', headers }));
      const error = await api.restGet('/recording/test').then(
        () => undefined,
        error => error
      );
      assert.instanceOf(error, MusicBrainzApiError);
      assert.strictEqual(error.status, 400);
      assert.strictEqual(error.message, `MusicBrainz request failed (400): ${detail}`);
      assert.deepEqual(error.body, headers['Content-Type'] === 'application/json' ? { error: detail } : undefined);
      assert.strictEqual(fetchStub.callCount, 1);
    });
  }

  it('submits recording XML with its ISRC and encoded client identifier', async () => {
    api.config.accessToken = 'test-token';
    fetchStub.resolves(new Response('<metadata/>'));
    const metadata = new XmlMetadata();
    metadata.pushRecording(recordingId).isrcList.pushIsrc('BET671300161');
    await api.postRecording(metadata);
    assert.strictEqual(requestUrl().pathname, '/ws/2/recording/');
    assert.strictEqual(requestUrl().searchParams.get('client'), 'test.app-1.0.0');
    const options = fetchStub.firstCall.args[1];
    assert.strictEqual(options.method, 'post');
    assert.include(options.body, `id="${recordingId}"`);
    assert.include(options.body, 'id="BET671300161"');
    assert.include(options.body, 'xmlns="http://musicbrainz.org/ns/mmd-2.0#"');
  });

  it('rejects submissions missing application identity before making a request', async () => {
    const client = new MusicBrainzApi({ accessToken: 'test-token', disableRateLimiting: true });
    const error = await client.postRecording(new XmlMetadata()).then(
      () => undefined,
      error => error
    );
    assert.match(error.message, /appName.*appVersion/);
    assert.isFalse(fetchStub.called);
  });
});
