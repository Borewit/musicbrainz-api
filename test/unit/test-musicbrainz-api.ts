import { assert } from 'chai';
import { RateLimitThreshold } from 'rate-limit-threshold';
import sinon from 'sinon';
import {
  type IArtist,
  type IMusicBrainzConfig,
  type IRecording,
  MusicBrainzApi,
  XmlMetadata
} from '../../lib/entry-default.js';
import { HttpClient } from '../../lib/http-client.js';
import { MusicBrainzApiError } from '../../lib/musicbrainz-api.js';
import { MusicBrainzApi as MusicBrainzApiNode } from '../../lib/musicbrainz-api-node.js';

function makeSearchApiConfig(customConfig?: Partial<IMusicBrainzConfig>): IMusicBrainzConfig {
  return {
    baseUrl: 'https://example.test',
    appName: 'musicbrainz-api-test',
    appVersion: '1.0.0',
    appContactInfo: 'https://example.test',
    ...customConfig
  };
}

function makeTestApiConfig(customConfig?: Partial<IMusicBrainzConfig>): IMusicBrainzConfig {
  return makeSearchApiConfig({
    botAccount: { username: 'test-user', password: 'test-password' },
    ...customConfig
  });
}

const mbid = {
  recording: { Formidable: '16afa384-174e-435e-bfa3-5591accda31c' },
  artist: { Stromae: '10ad95f6-7f9f-4f6b-888a-697694cb2c8f' }
};

describe('MusicBrainz API mocked requests', () => {
  const mbApi = new MusicBrainzApi(makeSearchApiConfig());
  const mbTestApi = new MusicBrainzApi(makeTestApiConfig());
  describe('OAuth Bearer token', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('sends configured accessToken as Authorization Bearer header (default entrypoint)', async () => {
      const accessToken = 'test-access-token';
      const mbApi = new MusicBrainzApi(
        makeSearchApiConfig({
          accessToken,
          disableRateLimiting: true
        })
      );
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));

      await mbApi.restGet<IArtist>(`/artist/${mbid.artist.Stromae}`);

      assert.isTrue(fetchStub.calledOnce);
      const requestInit = fetchStub.firstCall.args[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      assert.strictEqual(headers.get('Authorization'), `Bearer ${accessToken}`);
    });

    it('sends configured accessToken as Authorization Bearer header (node entrypoint)', async () => {
      const accessToken = 'test-access-token';
      const mbApi = new MusicBrainzApiNode(
        makeSearchApiConfig({
          accessToken,
          disableRateLimiting: true
        })
      );
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));
      await mbApi.restGet<IArtist>(`/artist/${mbid.artist.Stromae}`);
      assert.isTrue(fetchStub.calledOnce);
      const requestInit = fetchStub.firstCall.args[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      assert.strictEqual(headers.get('Authorization'), `Bearer ${accessToken}`);
    });

    it('does not send Authorization header when accessToken is not configured', async () => {
      const mbApi = new MusicBrainzApi(
        makeSearchApiConfig({
          disableRateLimiting: true
        })
      );
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));

      await mbApi.restGet<IArtist>(`/artist/${mbid.artist.Stromae}`);

      assert.isTrue(fetchStub.calledOnce);
      const requestInit = fetchStub.firstCall.args[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      assert.isFalse(headers.has('Authorization'));
    });
    it('does not overwrite a caller-provided non-empty Authorization header', async () => {
      const accessToken = 'configured-token';
      const mbApi = new MusicBrainzApi(
        makeSearchApiConfig({
          accessToken,
          disableRateLimiting: true
        })
      );
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));

      // Exercise override behavior via the underlying httpClient so we can
      // pass a custom Authorization header directly.
      const httpClient = (mbApi as unknown as { httpClient: HttpClient }).httpClient;
      await httpClient.get(`/ws/2/artist/${mbid.artist.Stromae}`, {
        headers: { Authorization: 'Bearer caller-supplied-token' }
      });

      assert.isTrue(fetchStub.calledOnce);
      const requestInit = fetchStub.firstCall.args[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      assert.strictEqual(
        headers.get('Authorization'),
        'Bearer caller-supplied-token',
        'caller-provided Authorization header must not be overwritten by the configured accessToken'
      );
    });

    it('overrides an empty Authorization header with the configured Bearer token', async () => {
      const accessToken = 'configured-token';
      const mbApi = new MusicBrainzApi(
        makeSearchApiConfig({
          accessToken,
          disableRateLimiting: true
        })
      );
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));

      const httpClient = (mbApi as unknown as { httpClient: HttpClient }).httpClient;
      await httpClient.get(`/ws/2/artist/${mbid.artist.Stromae}`, {
        headers: { Authorization: '   ' } // whitespace-only counts as empty
      });

      assert.isTrue(fetchStub.calledOnce);
      const requestInit = fetchStub.firstCall.args[1] as RequestInit;
      const headers = requestInit.headers as Headers;
      assert.strictEqual(headers.get('Authorization'), `Bearer ${accessToken}`);
    });

    it('throws if accessToken is configured but baseUrl is not HTTPS', () => {
      const base = makeSearchApiConfig({
        accessToken: 'test-access-token',
        baseUrl: 'http://musicbrainz.org', // intentionally non-HTTPS
        disableRateLimiting: true
      });
      assert.throws(() => new MusicBrainzApi(base), /HTTPS baseUrl/);
    });

    it('uses Bearer token for XML web-service post() and skips Digest challenge', async () => {
      const accessToken = 'submit-isrc-token';
      const mbApi = new MusicBrainzApi(
        makeTestApiConfig({
          accessToken,
          disableRateLimiting: true,
          // No botAccount required when accessToken is configured
          botAccount: undefined
        })
      );
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('', { status: 200 }));

      const xmlMetadata = new XmlMetadata();
      const xmlRecording = xmlMetadata.pushRecording(mbid.recording.Formidable);
      xmlRecording.isrcList.pushIsrc('BET671300161');

      await mbApi.post('recording', xmlMetadata);

      assert.isTrue(fetchStub.calledOnce, 'fetch should be called exactly once (no Digest retry)');
      const [, requestInit] = fetchStub.firstCall.args;
      const headers = (requestInit as RequestInit).headers as Headers;
      assert.strictEqual(headers.get('Authorization'), `Bearer ${accessToken}`);
      assert.strictEqual(headers.get('Content-Type'), 'application/xml');
    });

    for (const [entrypoint, Api] of [
      ['default', MusicBrainzApi],
      ['node', MusicBrainzApiNode]
    ] as const) {
      it(`uses updated tokens for reads and XML submissions (${entrypoint} entrypoint)`, async () => {
        const mbApi = new Api(
          makeSearchApiConfig({
            accessToken: 'original-token',
            disableRateLimiting: true
          })
        );
        const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(async () => new Response('{}'));

        await mbApi.restGet(`/artist/${mbid.artist.Stromae}`);
        mbApi.config.accessToken = 'replacement-token';
        await mbApi.restGet(`/artist/${mbid.artist.Stromae}`);
        await mbApi.post('recording', new XmlMetadata());
        mbApi.config.accessToken = undefined;
        await mbApi.restGet(`/artist/${mbid.artist.Stromae}`);
        mbApi.config.botAccount = { username: 'test-user', password: 'test-password' };
        await mbApi.post('recording', new XmlMetadata());

        assert.deepEqual(
          fetchStub.args.map(([, init]) => new Headers(init?.headers).get('Authorization')),
          [
            'Bearer original-token',
            'Bearer replacement-token',
            'Bearer replacement-token',
            null,
            null // The initial Digest request must not use the removed Bearer token.
          ]
        );
      });

      it(`rejects tokens added to an HTTP client (${entrypoint} entrypoint)`, async () => {
        const mbApi = new Api(
          makeSearchApiConfig({
            baseUrl: 'http://musicbrainz.org',
            disableRateLimiting: true
          })
        );
        const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('{}'));
        mbApi.config.accessToken = 'new-token';

        let caughtError: unknown;
        try {
          await mbApi.restGet(`/artist/${mbid.artist.Stromae}`);
        } catch (error) {
          caughtError = error;
        }

        assert.instanceOf(caughtError, Error);
        assert.match((caughtError as Error).message, /HTTPS baseUrl/);
        assert.isFalse(fetchStub.called);
      });

      for (const status of [400, 401, 403, 503]) {
        it(`rejects OAuth XML submissions with HTTP ${status} (${entrypoint} entrypoint)`, async () => {
          const mbApi = new Api(
            makeTestApiConfig({
              accessToken: 'test-access-token',
              disableRateLimiting: true,
              botAccount: undefined
            })
          );
          const body = '<error>Submission rejected</error>';
          const fetchStub = sinon
            .stub(globalThis, 'fetch')
            .resolves(new Response(body, { status, statusText: 'Submission rejected' }));

          let thrown: unknown;
          try {
            await mbApi.post('recording', new XmlMetadata());
          } catch (err) {
            thrown = err;
          }

          if (!(thrown instanceof MusicBrainzApiError)) {
            throw new Error('Expected the submission to reject with MusicBrainzApiError');
          }
          const error = thrown;
          assert.strictEqual(error.status, status);
          assert.strictEqual(error.statusText, 'Submission rejected');
          assert.strictEqual(error.body, body);
          assert.include(error.message, String(status));
          assert.include(error.message, body);
          assert.isTrue(fetchStub.calledOnce, 'failed submissions must not be retried');
        });
      }
    }

    it('post() throws when neither accessToken nor botAccount credentials are configured', async () => {
      const mbApi = new MusicBrainzApi(
        makeTestApiConfig({
          disableRateLimiting: true,
          botAccount: undefined
        })
      );

      const xmlMetadata = new XmlMetadata();
      xmlMetadata.pushRecording(mbid.recording.Formidable);

      // Stub fetch so an accidental network call would surface as a test failure
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('', { status: 200 }));

      let thrown: Error | undefined;
      try {
        await mbApi.post('recording', xmlMetadata);
      } catch (err) {
        thrown = err as Error;
      }
      assert.isDefined(thrown, 'post() should have thrown');
      assert.match((thrown as Error).message, /accessToken.*botAccount|botAccount.*accessToken/i);
      assert.isFalse(fetchStub.called, 'no HTTP request should be made without credentials');
    });
  });

  describe('Rate limiting', () => {
    let mbTestApiNoLimit: MusicBrainzApi;
    let mbTestApiLimit: MusicBrainzApi;
    let mbApiNoLimit: MusicBrainzApi;
    let mbApiLimit: MusicBrainzApi;
    let rateLimiterSpy: sinon.SinonSpy;

    before(() => {
      mbApiNoLimit = new MusicBrainzApi(
        makeSearchApiConfig({
          disableRateLimiting: true
        })
      );
      mbApiLimit = new MusicBrainzApi(
        makeSearchApiConfig({
          disableRateLimiting: false
        })
      );
      mbTestApiNoLimit = new MusicBrainzApi(
        makeTestApiConfig({
          disableRateLimiting: true
        })
      );
      mbTestApiLimit = new MusicBrainzApi(
        makeTestApiConfig({
          disableRateLimiting: false
        })
      );
    });

    beforeEach(() => {
      rateLimiterSpy = sinon.spy(RateLimitThreshold.prototype, 'limit');
    });

    afterEach(() => {
      rateLimiterSpy.restore();
    });

    describe('restGet', () => {
      beforeEach(() => {
        // Stub to avoid unnecessary HTTP requests in the context of these tests
        sinon.stub(HttpClient.prototype, 'get').resolves(new Response('{}'));
      });

      it('rate limits by default', async () => {
        await mbApi.restGet<IRecording>(`/recording/${mbid.recording.Formidable}`);
        assert.isTrue(rateLimiterSpy.calledOnce);
      });

      it('rate limits when disableRateLimiting is false', async () => {
        await mbApiLimit.restGet<IRecording>(`/recording/${mbid.recording.Formidable}`);
        assert.isTrue(rateLimiterSpy.calledOnce);
      });

      it('does not rate limit when disableRateLimiting is true', async () => {
        await mbApiNoLimit.restGet<IRecording>(`/recording/${mbid.recording.Formidable}`);
        assert.isFalse(rateLimiterSpy.called);
      });

      afterEach(() => {
        sinon.restore();
      });
    });

    describe('post', () => {
      beforeEach(() => {
        // Stub every client used by these rate-limiter tests.
        sinon.stub(HttpClient.prototype, 'post').resolves(new Response('{}'));
      });

      it('rate limits by default', async () => {
        await mbTestApi.post('recording', new XmlMetadata());
        assert.isTrue(rateLimiterSpy.calledOnce);
      });

      it('rate limits when disableRateLimiting is false', async () => {
        await mbTestApiLimit.post('recording', new XmlMetadata());
        assert.isTrue(rateLimiterSpy.calledOnce);
      });

      it('does not rate limit when disableRateLimiting is true', async () => {
        await mbTestApiNoLimit.post('recording', new XmlMetadata());
        assert.isFalse(rateLimiterSpy.called);
      });

      afterEach(() => {
        sinon.restore();
      });
    });
  });
});

/**
 * OAuth-authenticated submissions via the XML web service through the Node
 * entrypoint.
 *
 * The endpoints under `/ws/2/...` accept `Authorization: Bearer <token>`
 */
describe('Node specific API (OAuth)', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('ISRC submission via XML web service', () => {
    it('uses Bearer token for post() (no botAccount required)', async () => {
      const accessToken = 'submit-isrc-token';
      const mbTestApi = new MusicBrainzApiNode(
        makeTestApiConfig({
          accessToken,
          disableRateLimiting: true,
          botAccount: undefined
        })
      );
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('', { status: 200 }));

      const xmlMetadata = new XmlMetadata();
      const xmlRecording = xmlMetadata.pushRecording('94fb868b-9233-4f9e-966b-e8036bf7461e');
      xmlRecording.isrcList.pushIsrc('GB5EM1801762');

      await mbTestApi.post('recording', xmlMetadata);

      assert.isTrue(fetchStub.calledOnce, 'fetch should be called exactly once (no Digest retry)');
      const [, requestInit] = fetchStub.firstCall.args;
      const headers = (requestInit as RequestInit).headers as Headers;
      assert.strictEqual(headers.get('Authorization'), `Bearer ${accessToken}`);
      assert.strictEqual(headers.get('Content-Type'), 'application/xml');
    });
  });
});
