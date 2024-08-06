import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'node:crypto';

interface IChallenge {
  algorithm?: string;
  realm?: string;
  nonce?: string;
  opaque?: string;
  qop?: string;
}

export interface ICredentials {
  username: string;
  password: string;
}

function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex'); // lgtm [js/insufficient-password-hash]
}

export class DigestAuth {

  /**
   * RFC 2617: handle both MD5 and MD5-sess algorithms.
   *
   * If the algorithm directive's value is "MD5" or unspecified, then HA1 is
   *   HA1=MD5(username:realm:password)
   * If the algorithm directive's value is "MD5-sess", then HA1 is
   *   HA1=MD5(MD5(username:realm:password):nonce:cnonce)
   */
  public static ha1Compute(algorithm: string, user: string, realm: string, pass: string, nonce: string, cnonce: string): string {
    const ha1 = md5(`${user}:${realm}:${pass}`); // lgtm [js/insufficient-password-hash]
    return algorithm && algorithm.toLowerCase() === 'md5-sess' ? md5(`${ha1}:${nonce}:${cnonce}`) : ha1;
  }

  public hasAuth: boolean;
  public sentAuth: boolean;
  public bearerToken: string | null;

  public constructor(private credentials: ICredentials) {
    this.hasAuth = false;
    this.sentAuth = false;
    this.bearerToken = null;
  }

  public digest(method: string, path: string, authHeader: string): string {
    // TODO: More complete implementation of RFC 2617.
    //   - support qop="auth-int" only
    //   - handle Authentication-Info (not necessarily?)
    //   - check challenge.stale (not necessarily?)
    //   - increase nc (not necessarily?)
    // For reference:
    // http://tools.ietf.org/html/rfc2617#section-3
    // https://github.com/bagder/curl/blob/master/lib/http_digest.c

    const challenge: IChallenge = {};
    const re = /([a-z0-9_-]+)=(?:"([^"]+)"|([a-z0-9_-]+))/gi;
    while (true) {
      const match = re.exec(authHeader);
      if (!match) {
        break;
      }
      (challenge as any)[match[1]] = match[2] || match[3];
    }

    const qop = /(^|,)\s*auth\s*($|,)/.test(challenge.qop as string) && 'auth';
    const nc = qop && '00000001';
    const cnonce = qop && uuidv4().replace(/-/g, '');
    const ha1 = DigestAuth.ha1Compute(challenge.algorithm as string, this.credentials.username, challenge.realm as string, this.credentials.password, challenge.nonce as string, cnonce as string);
    const ha2 = md5(`${method}:${path}`); // lgtm [js/insufficient-password-hash]
    const digestResponse = qop
      ? md5(`${ha1}:${challenge.nonce}:${nc}:${cnonce}:${qop}:${ha2}`) // lgtm [js/insufficient-password-hash]
      : md5(`${ha1}:${challenge.nonce}:${ha2}`); // lgtm [js/insufficient-password-hash]
    const authValues = {
      username: this.credentials.username,
      realm: challenge.realm,
      nonce: challenge.nonce,
      uri: path,
      qop,
      response: digestResponse,
      nc,
      cnonce,
      algorithm: challenge.algorithm,
      opaque: challenge.opaque
    };

    const parts: string[] = [];
    Object.entries(authValues).forEach(([key, value]) => {
      if (value) {
        if (key === 'qop' || key === 'nc' || key === 'algorithm') {
          parts.push(`${key}=${value}`);
        } else {
          parts.push(`${key}="${value}"`);
        }
      }
    });

    const digest = `Digest ${parts.join(', ')}`;
    this.sentAuth = true;
    return digest;
  }
}
