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

function makeConnectionReset(): TypeError {
  return Object.assign(new TypeError('fetch failed'), {cause: {code: 'ECONNRESET'}});
}

describe('HttpClient retry loop', () => {

  let fetchStub: sinon.SinonStub;
  let delayStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch');
    delayStub = sinon.stub(
      HttpClient.prototype as unknown as {_delay(ms: number): Promise<void>},
      '_delay'
    ).resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('retries a connection reset', async () => {
    fetchStub.onFirstCall().rejects(makeConnectionReset());
    fetchStub.onSecondCall().resolves(new Response('{}'));

    const response = await makeClient().get('/resource', {retryLimit: 2});

    assert.strictEqual(response.status, 200);
    assert.strictEqual(fetchStub.callCount, 2);
    assert.isTrue(delayStub.calledOnceWithExactly(1));
  });

  it('rethrows the final connection reset', async () => {
    const connectionReset = makeConnectionReset();
    fetchStub.rejects(connectionReset);

    let caughtError: unknown;
    try {
      await makeClient().get('/resource', {retryLimit: 3});
    } catch (error) {
      caughtError = error;
    }

    assert.strictEqual(caughtError, connectionReset);
    assert.strictEqual(fetchStub.callCount, 3);
    assert.strictEqual(delayStub.callCount, 2);
  });

  for (const status of [429, 503]) {
    it(`returns the final HTTP ${status} response`, async () => {
      fetchStub.callsFake(async () => new Response('', {status}));

      const response = await makeClient().get('/resource', {retryLimit: 3});

      assert.strictEqual(response.status, status);
      assert.strictEqual(fetchStub.callCount, 3);
      assert.strictEqual(delayStub.callCount, 2);
    });
  }

  it('increases the delay after each failed attempt', async () => {
    fetchStub.onCall(0).resolves(new Response('', {status: 503}));
    fetchStub.onCall(1).resolves(new Response('', {status: 503}));
    fetchStub.onCall(2).resolves(new Response('', {status: 503}));
    fetchStub.onCall(3).resolves(new Response('{}'));

    await makeClient().get('/resource', {retryLimit: 4});

    assert.deepEqual(delayStub.args, [[1], [2], [3]]);
  });

  it('cancels a response body before retrying', async () => {
    const retryResponse = new Response('', {status: 503});
    const cancelSpy = sinon.spy(retryResponse.body as ReadableStream, 'cancel');
    fetchStub.onFirstCall().resolves(retryResponse);
    fetchStub.onSecondCall().resolves(new Response('{}'));

    await makeClient().get('/resource', {retryLimit: 2});

    assert.isTrue(cancelSpy.calledOnce);
  });

  it('uses one attempt for a non-finite retry limit', async () => {
    fetchStub.resolves(new Response('', {status: 503}));

    const response = await makeClient().get('/resource', {retryLimit: Number.POSITIVE_INFINITY});

    assert.strictEqual(response.status, 503);
    assert.strictEqual(fetchStub.callCount, 1);
    assert.isFalse(delayStub.called);
  });

  it('throws a MusicBrainz API error for the final HTTP response', async () => {
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
