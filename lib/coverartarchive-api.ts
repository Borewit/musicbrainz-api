/* eslint-disable-next-line */
import {HttpClient} from "./http-client.js";

export type CovertType = 'Front' | 'Back' | 'Booklet' | 'Medium' | 'Obi' | 'Spine' | 'Track' | 'Tray' | 'Sticker' |
'Poster' | 'Liner' | 'Watermark' | 'Raw/Unedited' | 'Matrix/Runout' | 'Top' | 'Bottom' | 'Other';

export interface IImage {
  types: CovertType[],
  front: boolean,
  back: boolean,
  edit: number,
  image: string,
  comment: string,
  approved: boolean,
  id: string,
  thumbnails: {
    large: string;
    small: string;
    '250': string;
    '500'?: string;
    '1200'?: string;
  }
}

export type CoverType = 'front' | 'back';

export interface ICoversInfo {
  images: IImage[];
  release: string;
}

export interface ICoverInfo {
  url: string | null;
}

export class CoverArtArchiveApi {

  private httpClient = new HttpClient({baseUrl: 'https://coverartarchive.org', userAgent: 'Node.js musicbrains-api', timeout: 20000, followRedirects: false});

  private async getJson(path: string) {
    const response = await this.httpClient.get(path, {
      headers: {
        Accept: "application/json"
      }
    });

    const contentType = response.headers.get("Content-Type");
    if (response.status === 404 && contentType?.toLowerCase() !== "application/json") {
      return {
        "error": "Not Found",
        "help": "For usage, please see: https://musicbrainz.org/development/mmd"
      }
    }

    return response.json();
  }

  private async getCoverRedirect(path: string): Promise<string|null> {
    const response = await this.httpClient.get(path, {
      followRedirects: false
    });
    switch(response.status) {
      case 307:
        return response.headers.get('LOCATION') as string;
      case 400:
        throw new Error('Invalid UUID');
      case 404:
        // No release with this MBID
        return null;
      case 405:
        throw new Error('Invalid HTTP method');
      case 503:
        return null;
      default:
        throw new Error(`Unexpected HTTP-status response: ${response.status}`);
    }
  }

  /**
   * Fetch release
   * @releaseId Release MBID
   * @param releaseId MusicBrainz Release MBID
   */
  public getReleaseCovers(releaseId: string): Promise<ICoversInfo> {
    return this.getCovers(releaseId, 'release');
  }

  /**
   * Fetch release-group
   * @releaseGroupId Release-group MBID
   * @param releaseGroupId MusicBrainz Release Group MBID
   */
  public getReleaseGroupCovers(releaseGroupId: string): Promise<ICoversInfo> {
    return this.getCovers(releaseGroupId, 'release-group');
  }

  /**
   * Fetch release cover
   * @releaseId Release MBID
   * @param releaseId MusicBrainz Release MBID
   * @param coverType Front or back cover
   */
  public getReleaseCover(releaseId: string, coverType: CoverType): Promise<ICoverInfo> {
    return this.getCover(releaseId, 'release', coverType);
  }

  /**
   * Fetch release-group cover
   * @releaseId Release-group MBID
   * @param releaseGroupId MusicBrainz Release-group MBID
   * @param coverType Front or back cover
   */
  public getReleaseGroupCover(releaseGroupId: string, coverType: CoverType): Promise<ICoverInfo> {
    return this.getCover(releaseGroupId, 'release-group', coverType);
  }

  private static makePath(releaseId: string, releaseType: 'release' | 'release-group' = 'release', coverType?: CoverType): string {
    const path = [releaseType, releaseId];
    if (coverType) {
      path.push(coverType);
    }
    return`/${path.join('/')}`;
  }

  /**
   * Fetch covers
   * @releaseId MBID
   * @param releaseId MusicBrainz Release Group MBID
   * @param releaseType Fetch covers for specific release or release-group
   * @param coverType Cover type
   */
  private async getCovers(releaseId: string, releaseType: 'release' | 'release-group' = 'release'): Promise<ICoversInfo> {
    const info = await this.getJson(CoverArtArchiveApi.makePath(releaseId, releaseType)) as ICoversInfo;
    // Hack to correct http addresses into https
    if (info.release?.startsWith('http:')) {
      info.release = `https${info.release.substring(4)}`;
    }
    return info;
  }

  /**
   * Fetch covers
   * @releaseId MBID
   * @param releaseId MusicBrainz Release Group MBID
   * @param releaseType Fetch covers for specific release or release-group
   * @param coverType Cover type
   */
  private async getCover(releaseId: string, releaseType: 'release' | 'release-group' = 'release', coverType?: CoverType): Promise<ICoverInfo> {
    const url= await this.getCoverRedirect(CoverArtArchiveApi.makePath(releaseId, releaseType, coverType));
    return {url: url};
  }

}
