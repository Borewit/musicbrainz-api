import {assert} from 'chai';
import sinon from 'sinon';
import {HttpClient} from '../lib/http-client.js';
import {MusicBrainzApi} from '../lib/musicbrainz-api.js';

const defaultOptions = {
  baseUrl: 'https://example.test',
  timeout: 1,
  userAgent: 'musicbrainz-api-test'
};

describe('HttpClient request timeout', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('aborts a fetch that does not respond', async () => {
    const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), {once: true});
      });
    });
    const client = new HttpClient({...defaultOptions, requestTimeout: 10});

    const error = await client.get('/stalled').then(() => undefined, reason => reason as Error);

    assert.strictEqual(error?.name, 'TimeoutError');
    assert.isTrue(fetchStub.firstCall.args[1]?.signal?.aborted);
  });

  it('applies the configured timeout to the response body', async () => {
    const abortController = new AbortController();
    const timeoutStub = sinon.stub(AbortSignal, 'timeout').returns(abortController.signal);
    const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async (_input, init) => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          init?.signal?.addEventListener('abort', () => controller.error(new Error('request aborted')), {once: true});
        }
      });
      return new Response(body);
    });
    const client = new HttpClient({...defaultOptions, requestTimeout: 50});

    const response = await client.get('/stalled');
    const bodyPromise = response.text();
    abortController.abort();
    const error = await bodyPromise.then(() => undefined, reason => reason as Error);

    assert.isTrue(timeoutStub.calledOnceWithExactly(50));
    assert.strictEqual(fetchStub.firstCall.args[1]?.signal, abortController.signal);
    assert.strictEqual(error?.message, 'request aborted');
  });

  it('does not set a signal when no timeout is configured', async () => {
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));

    await new HttpClient(defaultOptions).get('/resource');

    assert.isUndefined(fetchStub.firstCall.args[1]?.signal);
  });

  it('creates a fresh timeout signal for every retry', async () => {
    const firstSignal = new AbortController().signal;
    const secondSignal = new AbortController().signal;
    const timeoutStub = sinon.stub(AbortSignal, 'timeout');
    timeoutStub.onFirstCall().returns(firstSignal);
    timeoutStub.onSecondCall().returns(secondSignal);
    const fetchStub = sinon.stub(globalThis, 'fetch');
    fetchStub.onFirstCall().resolves(new Response('', {status: 503}));
    fetchStub.onSecondCall().resolves(new Response('{}'));
    const client = new HttpClient({...defaultOptions, requestTimeout: 50});

    const response = await client.get('/resource', {retryLimit: 2});

    assert.strictEqual(response.status, 200);
    assert.strictEqual(timeoutStub.callCount, 2);
    assert.strictEqual(fetchStub.firstCall.args[1]?.signal, firstSignal);
    assert.strictEqual(fetchStub.secondCall.args[1]?.signal, secondSignal);
  });

  it('uses a fifteen second timeout by default for MusicBrainz requests', async () => {
    const signal = new AbortController().signal;
    const timeoutStub = sinon.stub(AbortSignal, 'timeout').returns(signal);
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));
    const client = new MusicBrainzApi({disableRateLimiting: true});

    await client.restGet('/area/test');

    assert.isTrue(timeoutStub.calledOnceWithExactly(15000));
    assert.strictEqual(fetchStub.firstCall.args[1]?.signal, signal);
  });
});
