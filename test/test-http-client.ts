import { assert } from 'chai';
import sinon from 'sinon';
import { HttpClient } from '../lib/http-client.js';
import { MusicBrainzApi, MusicBrainzApiError, XmlIsrcList } from '../lib/musicbrainz-api.js';

function makeClient(): HttpClient {
  return new HttpClient({
    baseUrl: 'https://example.test',
    timeout: 1,
    userAgent: 'musicbrainz-api/test'
  });
}

function makeConnectionReset(): TypeError {
  return Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNRESET' } });
}

describe('HttpClient OAuth transport', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('rejects bearer tokens over HTTP before sending a request', async () => {
    const client = new HttpClient({
      baseUrl: 'http://example.test',
      timeout: 1,
      userAgent: 'musicbrainz-api/test',
      accessToken: 'test-access-token'
    });
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));

    let caughtError: unknown;
    try {
      await client.get('/resource');
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, Error);
    assert.match((caughtError as Error).message, /HTTPS baseUrl/);
    assert.isFalse(fetchStub.called);
  });
});

describe('HttpClient retry loop', () => {
  let fetchStub: sinon.SinonStub;
  let delayStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, 'fetch');
    delayStub = sinon
      .stub(HttpClient.prototype as unknown as { _delay(ms: number): Promise<void> }, '_delay')
      .resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('retries a connection reset', async () => {
    fetchStub.onFirstCall().rejects(makeConnectionReset());
    fetchStub.onSecondCall().resolves(new Response('{}'));

    const response = await makeClient().get('/resource', { retryLimit: 2 });

    assert.strictEqual(response.status, 200);
    assert.strictEqual(fetchStub.callCount, 2);
    assert.isTrue(delayStub.calledOnceWithExactly(1));
  });

  const connectionErrors = [
    { name: 'Node timeout', error: Object.assign(new Error('connect timed out'), { code: 'ETIMEDOUT' }) },
    {
      name: 'Undici timeout',
      error: Object.assign(new Error('connect timed out'), { code: 'UND_ERR_CONNECT_TIMEOUT' })
    },
    { name: 'unreachable network', error: Object.assign(new Error('network unreachable'), { code: 'ENETUNREACH' }) },
    {
      name: 'mixed IPv4 timeout and unreachable IPv6 network',
      error: Object.assign(new Error('All connection attempts failed'), {
        errors: [
          Object.assign(new Error('connect timed out'), { code: 'ETIMEDOUT' }),
          Object.assign(new Error('IPv6 network unreachable'), { code: 'ENETUNREACH' })
        ],
        code: 'ETIMEDOUT'
      })
    },
    {
      name: 'aggregate Node timeout',
      error: Object.assign(new Error('All connection attempts failed'), {
        errors: [
          Object.assign(new Error('connect timed out'), { code: 'ETIMEDOUT' }),
          Object.assign(new Error('connect timed out'), { code: 'ETIMEDOUT' })
        ],
        code: 'ETIMEDOUT'
      })
    },
    {
      name: 'aggregate timeout without a top-level code',
      error: Object.assign(new Error('All connection attempts failed'), {
        errors: [Object.assign(new Error('connect timed out'), { code: 'ETIMEDOUT' })]
      })
    }
  ];

  for (const { name, error } of connectionErrors) {
    for (const retryLimit of [undefined, 2]) {
      it(`requires opt-in to retry a submission after ${name} (retryLimit=${retryLimit})`, async () => {
        const fetchError = Object.assign(new TypeError('fetch failed'), { cause: error });
        fetchStub.onFirstCall().rejects(fetchError);
        fetchStub.onSecondCall().resolves(new Response('{}'));

        let caughtError: unknown;
        let response: Response | undefined;
        try {
          response = await makeClient().post('/resource', { body: '<metadata/>', retryLimit });
        } catch (error) {
          caughtError = error;
        }

        if (retryLimit === undefined) {
          assert.strictEqual(caughtError, fetchError);
          assert.strictEqual(fetchStub.callCount, 1);
          assert.isFalse(delayStub.called);
        } else {
          assert.isUndefined(caughtError);
          assert.strictEqual(response?.status, 200);
          assert.strictEqual(fetchStub.callCount, 2);
          assert.strictEqual(fetchStub.secondCall.args[1].body, '<metadata/>');
          assert.isTrue(delayStub.calledOnceWithExactly(1));
        }
      });
    }

    it(`retries a fetch failure caused by ${name}`, async () => {
      fetchStub.onFirstCall().rejects(Object.assign(new TypeError('fetch failed'), { cause: error }));
      fetchStub.onSecondCall().resolves(new Response('{}'));

      const response = await makeClient().get('/resource', { retryLimit: 2 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(fetchStub.callCount, 2);
      assert.isTrue(delayStub.calledOnceWithExactly(1));
    });

    it(`rethrows the final ${name} fetch failure`, async () => {
      const fetchError = Object.assign(new TypeError('fetch failed'), { cause: error });
      fetchStub.rejects(fetchError);

      let caughtError: unknown;
      try {
        await makeClient().get('/resource', { retryLimit: 3 });
      } catch (error) {
        caughtError = error;
      }

      assert.strictEqual(caughtError, fetchError);
      assert.strictEqual(fetchStub.callCount, 3);
      assert.deepEqual(delayStub.args, [[1], [2]]);
    });
  }

  it('does not retry GET connection timeouts by default', async () => {
    const fetchError = Object.assign(new TypeError('fetch failed'), { cause: { code: 'ETIMEDOUT' } });
    fetchStub.rejects(fetchError);

    let caughtError: unknown;
    try {
      await makeClient().get('/resource');
    } catch (error) {
      caughtError = error;
    }

    assert.strictEqual(caughtError, fetchError);
    assert.strictEqual(fetchStub.callCount, 1);
    assert.isFalse(delayStub.called);
  });

  it('does not retry connection resets by default', async () => {
    const fetchError = makeConnectionReset();
    fetchStub.rejects(fetchError);

    let caughtError: unknown;
    try {
      await makeClient().post('/resource');
    } catch (error) {
      caughtError = error;
    }

    assert.strictEqual(caughtError, fetchError);
    assert.strictEqual(fetchStub.callCount, 1);
    assert.isFalse(delayStub.called);
  });

  for (const status of [429, 503]) {
    it(`does not retry HTTP ${status} by default`, async () => {
      fetchStub.resolves(new Response('', { status }));

      const response = await makeClient().post('/resource');

      assert.strictEqual(response.status, status);
      assert.strictEqual(fetchStub.callCount, 1);
      assert.isFalse(delayStub.called);
    });
  }

  for (const cause of [
    undefined,
    { code: 'ENOTFOUND' },
    { code: 'CERT_HAS_EXPIRED' },
    { code: 'UND_ERR_HEADERS_TIMEOUT' },
    { errors: [] },
    { code: 'ETIMEDOUT', errors: [{ code: 'ETIMEDOUT' }, { code: 'CERT_HAS_EXPIRED' }] },
    { errors: [{ code: 'ETIMEDOUT' }, { code: 'ENOTFOUND' }] }
  ]) {
    it(`does not retry an unrelated fetch failure (${JSON.stringify(cause)})`, async () => {
      const fetchError = Object.assign(new TypeError('fetch failed'), { cause });
      fetchStub.rejects(fetchError);

      let caughtError: unknown;
      try {
        await makeClient().get('/resource', { retryLimit: 3 });
      } catch (error) {
        caughtError = error;
      }

      assert.strictEqual(caughtError, fetchError);
      assert.strictEqual(fetchStub.callCount, 1);
      assert.isFalse(delayStub.called);
    });
  }

  it('rethrows the final connection reset', async () => {
    const connectionReset = makeConnectionReset();
    fetchStub.rejects(connectionReset);

    let caughtError: unknown;
    try {
      await makeClient().get('/resource', { retryLimit: 3 });
    } catch (error) {
      caughtError = error;
    }

    assert.strictEqual(caughtError, connectionReset);
    assert.strictEqual(fetchStub.callCount, 3);
    assert.strictEqual(delayStub.callCount, 2);
  });

  for (const status of [429, 503]) {
    it(`returns the final HTTP ${status} response`, async () => {
      fetchStub.callsFake(async () => new Response('', { status }));

      const response = await makeClient().get('/resource', { retryLimit: 3 });

      assert.strictEqual(response.status, status);
      assert.strictEqual(fetchStub.callCount, 3);
      assert.strictEqual(delayStub.callCount, 2);
    });
  }

  it('increases the delay after each failed attempt', async () => {
    fetchStub.onCall(0).resolves(new Response('', { status: 503 }));
    fetchStub.onCall(1).resolves(new Response('', { status: 503 }));
    fetchStub.onCall(2).resolves(new Response('', { status: 503 }));
    fetchStub.onCall(3).resolves(new Response('{}'));

    await makeClient().get('/resource', { retryLimit: 4 });

    assert.deepEqual(delayStub.args, [[1], [2], [3]]);
  });

  it('cancels a response body before retrying', async () => {
    const retryResponse = new Response('', { status: 503 });
    const cancelSpy = sinon.spy(retryResponse.body as ReadableStream, 'cancel');
    fetchStub.onFirstCall().resolves(retryResponse);
    fetchStub.onSecondCall().resolves(new Response('{}'));

    await makeClient().get('/resource', { retryLimit: 2 });

    assert.isTrue(cancelSpy.calledOnce);
  });

  it('uses one attempt for a non-finite retry limit', async () => {
    fetchStub.resolves(new Response('', { status: 503 }));

    const response = await makeClient().get('/resource', { retryLimit: Number.POSITIVE_INFINITY });

    assert.strictEqual(response.status, 503);
    assert.strictEqual(fetchStub.callCount, 1);
    assert.isFalse(delayStub.called);
  });

  it('throws a MusicBrainz API error for the final HTTP response', async () => {
    const musicBrainzApi = new MusicBrainzApi({ disableRateLimiting: true });
    const { httpClient } = musicBrainzApi as unknown as { httpClient: HttpClient };
    sinon.stub(httpClient, 'get').resolves(
      new Response(JSON.stringify({ error: 'Service unavailable' }), {
        status: 503,
        statusText: 'Service Unavailable'
      })
    );

    let caughtError: unknown;
    try {
      await musicBrainzApi.restGet('/artist/test');
    } catch (error) {
      caughtError = error;
    }

    assert.instanceOf(caughtError, MusicBrainzApiError);
    assert.strictEqual((caughtError as MusicBrainzApiError).status, 503);
    assert.strictEqual(
      (caughtError as MusicBrainzApiError).message,
      'MusicBrainz request failed (503): Service unavailable'
    );
  });
});

describe('HttpClient request encoding', () => {
  afterEach(() => sinon.restore());

  it('encodes form values and preserves query parameters', async () => {
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));

    await makeClient().postForm('/resource', { title: 'a & b' }, { query: { client: 'test' } });

    const [url, options] = fetchStub.firstCall.args;
    assert.strictEqual(String(url), 'https://example.test/resource?client=test');
    assert.strictEqual(options?.method, 'post');
    assert.strictEqual(options?.body, 'title=a+%26+b');
    assert.strictEqual(new Headers(options?.headers).get('Content-Type'), 'application/x-www-form-urlencoded');
  });

  it('serializes a JSON request body', async () => {
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));
    const body = { title: 'a & b', count: 2 };

    await makeClient().postJson('/resource', body);

    assert.strictEqual(fetchStub.firstCall.args[1]?.method, 'post');
    assert.deepEqual(JSON.parse(fetchStub.firstCall.args[1]?.body as string), body);
  });
});

describe('MusicBrainzApi request edge cases', () => {
  afterEach(() => sinon.restore());

  it('browses without an explicit query', async () => {
    const body = { artists: [], 'artist-count': 0, 'artist-offset': 0 };
    const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response(JSON.stringify(body)));
    const api = new MusicBrainzApi({ disableRateLimiting: true });

    const result = await api.browse('artist');

    assert.deepEqual(result, body);
    const url = new URL(String(fetchStub.firstCall.args[0]));
    assert.strictEqual(url.pathname, '/ws/2/artist');
    assert.strictEqual(url.searchParams.get('fmt'), 'json');
  });

  it('reports an HTML error response using the HTTP status text', async () => {
    sinon.stub(globalThis, 'fetch').resolves(
      new Response('<html>Bad gateway</html>', {
        status: 502,
        statusText: 'Bad Gateway'
      })
    );
    const api = new MusicBrainzApi({ disableRateLimiting: true });
    let caught: unknown;

    try {
      await api.restGet('/artist/test');
    } catch (error) {
      caught = error;
    }

    assert.instanceOf(caught, MusicBrainzApiError);
    assert.strictEqual((caught as MusicBrainzApiError).status, 502);
    assert.strictEqual((caught as MusicBrainzApiError).message, 'MusicBrainz request failed (502): Bad Gateway');
  });

  it('omits an empty ISRC list from XML output', () => {
    assert.isNull(new XmlIsrcList().toXml());
  });
});
