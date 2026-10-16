import { createHash } from 'node:crypto';
import { assert } from 'chai';
import sinon from 'sinon';
import { MusicBrainzApi as DefaultApi, MusicBrainzApiError, XmlMetadata } from '../lib/entry-default.js';
import { MusicBrainzApi as NodeApi } from '../lib/entry-node.js';

function makeMetadata(): XmlMetadata {
  const metadata = new XmlMetadata();
  metadata.pushRecording('16afa384-174e-435e-bfa3-5591accda31c').isrcList.pushIsrc('BET671300161');
  return metadata;
}

function makeConfig() {
  return {
    baseUrl: 'https://example.test',
    appName: 'musicbrainz-api-test',
    appVersion: '1.0.0',
    disableRateLimiting: true,
    botAccount: { username: 'test-user', password: 'test-password' }
  };
}

describe('Stateless web-service authentication', () => {
  afterEach(() => sinon.restore());

  for (const [name, Api] of [
    ['default', DefaultApi],
    ['node', NodeApi]
  ] as const) {
    it(`does not replay website session cookies (${name} entrypoint)`, async () => {
      const api = new Api({ ...makeConfig(), accessToken: 'test-token' });
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.onFirstCall().resolves(
        new Response('{}', {
          headers: { 'Set-Cookie': 'musicbrainz_server_session=website-session; Path=/; Secure' }
        })
      );
      fetchStub.onSecondCall().resolves(new Response('{}'));

      await api.restGet('/recording/test');
      await api.post('recording', makeMetadata());

      for (const call of fetchStub.getCalls()) {
        const headers = new Headers(call.args[1]?.headers);
        assert.isFalse(headers.has('Cookie'));
        assert.strictEqual(headers.get('Authorization'), 'Bearer test-token');
        assert.strictEqual(new URL(String(call.args[0])).pathname.startsWith('/ws/2/'), true);
      }
    });

    it(`authenticates an XML submission with a real Digest challenge (${name} entrypoint)`, async () => {
      const api = new Api(makeConfig());
      const fetchStub = sinon.stub(globalThis, 'fetch');
      fetchStub.onFirstCall().resolves(
        new Response('', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Digest realm="musicbrainz", nonce="test-nonce", qop="auth", algorithm=MD5' }
        })
      );
      fetchStub.onSecondCall().resolves(new Response('<metadata/>'));

      await api.post('recording', makeMetadata());

      assert.strictEqual(fetchStub.callCount, 2);
      const [url, options] = fetchStub.secondCall.args;
      const authorization = new Headers(options?.headers).get('Authorization') ?? '';
      assert.match(authorization, /^Digest /);
      const fields = Object.fromEntries(
        [...authorization.matchAll(/(\w+)=(?:"([^"]*)"|([^,\s]+))/g)].map(match => [match[1], match[2] ?? match[3]])
      );
      const requestUrl = new URL(String(url));
      assert.strictEqual(fields.uri, requestUrl.pathname + requestUrl.search);
      assert.strictEqual(fields.username, 'test-user');
      assert.strictEqual(fields.qop, 'auth');
      const md5 = (value: string) => createHash('md5').update(value).digest('hex');
      const ha1 = md5('test-user:musicbrainz:test-password');
      const ha2 = md5(`POST:${fields.uri}`);
      assert.strictEqual(fields.response, md5(`${ha1}:test-nonce:${fields.nc}:${fields.cnonce}:auth:${ha2}`));
      assert.strictEqual(options?.body, fetchStub.firstCall.args[1]?.body);
      assert.strictEqual(new Headers(options?.headers).get('Content-Type'), 'application/xml');
    });
  }

  for (const status of [400, 401, 403, 503]) {
    it(`rejects a failed Digest submission with HTTP ${status}`, async () => {
      const api = new DefaultApi(makeConfig());
      const fetchStub = sinon.stub(globalThis, 'fetch').resolves(new Response('Submission rejected', { status }));
      let caught: unknown;
      try {
        await api.post('recording', makeMetadata());
      } catch (error) {
        caught = error;
      }
      assert.instanceOf(caught, MusicBrainzApiError);
      assert.strictEqual((caught as MusicBrainzApiError).status, status);
      assert.strictEqual(fetchStub.callCount, 1, 'do not retry without a Digest challenge');
    });
  }

  it('stops after repeated Digest challenges and reports authentication failure', async () => {
    const api = new DefaultApi(makeConfig());
    const fetchStub = sinon.stub(globalThis, 'fetch').callsFake(
      async () =>
        new Response('', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Digest realm="musicbrainz", nonce="rejected", qop="auth"' }
        })
    );
    let caught: unknown;
    try {
      await api.post('recording', makeMetadata());
    } catch (error) {
      caught = error;
    }
    assert.instanceOf(caught, MusicBrainzApiError);
    assert.strictEqual((caught as MusicBrainzApiError).status, 401);
    assert.strictEqual(fetchStub.callCount, 5);
  });
});
