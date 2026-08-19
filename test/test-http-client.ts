import {assert} from 'chai';
import sinon from 'sinon';
import {HttpClient} from '../lib/http-client.js';
import {MusicBrainzApi, MusicBrainzApiError} from '../lib/musicbrainz-api.js';

function makeClient(): HttpClient {
  return new HttpClient({
    baseUrl: 'https://example.test',
    timeout: 1,
    userAgent: 'musicbrainz-api/test'
  });
}

function makeFetchError(code: string): TypeError {
  const cause = Object.assign(new Error(code), {code});
  return Object.assign(new TypeError('fetch failed'), {cause});
}

describe('HttpClient retries', () => {

  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch');
  });

  afterEach(() => {
    sinon.restore();
  });

  for (const code of [
    'ECONNRESET',
    'UND_ERR_SOCKET',
    'ETIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT'
  ]) {
    it(`retries ${code}`, async () => {
      fetchStub.onFirstCall().rejects(makeFetchError(code));
      fetchStub.onSecondCall().resolves(new Response('{}'));

      const response = await makeClient().get('/resource', {retryLimit: 2});

      assert.strictEqual(response.status, 200);
      assert.strictEqual(fetchStub.callCount, 2);
    });
  }

  it('retries TimeoutError', async () => {
    const timeoutError = Object.assign(new Error('The operation timed out'), {name: 'TimeoutError'});
    fetchStub.onFirstCall().rejects(timeoutError);
    fetchStub.onSecondCall().resolves(new Response('{}'));

    const response = await makeClient().get('/resource', {retryLimit: 2});

    assert.strictEqual(response.status, 200);
    assert.strictEqual(fetchStub.callCount, 2);
  });

  for (const status of [429, 502, 503, 504]) {
    it(`retries HTTP ${status}`, async () => {
      fetchStub.onFirstCall().resolves(new Response('', {status}));
      fetchStub.onSecondCall().resolves(new Response('{}'));

      const response = await makeClient().get('/resource', {retryLimit: 2});

      assert.strictEqual(response.status, 200);
      assert.strictEqual(fetchStub.callCount, 2);
    });
  }

  it('stops retrying network failures at the configured limit', async () => {
    const fetchError = makeFetchError('ECONNRESET');
    fetchStub.rejects(fetchError);

    let caughtError: unknown;
    try {
      await makeClient().get('/resource', {retryLimit: 3});
    } catch (error) {
      caughtError = error;
    }

    assert.strictEqual(caughtError, fetchError);
    assert.strictEqual(fetchStub.callCount, 3);
  });

  it('stops retrying HTTP failures at the configured limit', async () => {
    fetchStub.callsFake(async () => new Response('', {status: 503}));

    const response = await makeClient().get('/resource', {retryLimit: 3});

    assert.strictEqual(response.status, 503);
    assert.strictEqual(fetchStub.callCount, 3);
  });

  it('does not retry non-transient errors', async () => {
    const fetchError = makeFetchError('ENOTFOUND');
    fetchStub.rejects(fetchError);

    let caughtError: unknown;
    try {
      await makeClient().get('/resource', {retryLimit: 3});
    } catch (error) {
      caughtError = error;
    }

    assert.strictEqual(caughtError, fetchError);
    assert.strictEqual(fetchStub.callCount, 1);
  });

  it('throws after MusicBrainz HTTP retries are exhausted', async () => {
    const musicBrainzApi = new MusicBrainzApi({disableRateLimiting: true});
    const {httpClient} = musicBrainzApi as unknown as {httpClient: HttpClient};
    sinon.stub(httpClient, 'get').resolves(new Response(
      JSON.stringify({error: 'Service unavailable'}),
      {status: 503, statusText: 'Service Unavailable'}
    ));

    let caughtError: unknown;
    try {
      await musicBrainzApi.restGet('/artist/test');
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, MusicBrainzApiError);
    assert.strictEqual((caughtError as MusicBrainzApiError).status, 503);
    assert.strictEqual((caughtError as MusicBrainzApiError).message, 'MusicBrainz request failed (503): Service unavailable');
  });
});
