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

export interface ICoverInfo {
  images: IImage[];
  release: string;
}

export class CoverArtArchiveApi {

  private httpClient = new HttpClient({baseUrl: 'https://coverartarchive.org', userAgent: 'Node.js musicbrains-api', timeout: 20000})

  private async getJson(path: string) {
    const response = await this.httpClient.get(path, {
      headers: {
        Accept: "application/json"
      }
    });
    return response.json();
  }

  /**
   * Fetch release
   * @releaseId Release MBID
   * @param releaseId MusicBrainz Release MBID
   * @param coverType Cover type
   */
  public getReleaseCovers(releaseId: string, coverType?: 'front' | 'back'): Promise<ICoverInfo> {
    return this.getCovers(releaseId, 'release', coverType);
  }

  /**
   * Fetch release-group
   * @releaseGroupId Release-group MBID
   * @param releaseGroupId MusicBrainz Release Group MBID
   * @param coverType Cover type
   */
  public getReleaseGroupCovers(releaseGroupId: string, coverType?: 'front' | 'back'): Promise<ICoverInfo> {
    return this.getCovers(releaseGroupId, 'release-group', coverType);
  }

  /**
   * Fetch covers
   * @releaseId MBID
   * @param releaseId MusicBrainz Release Group MBID
   * @param releaseType Fetch covers for specific release or release-group
   * @param coverType Cover type
   */
  private async getCovers(releaseId: string, releaseType: 'release' | 'release-group' = 'release', coverType?: 'front' | 'back'): Promise<ICoverInfo> {
    const path = [releaseType, releaseId];
    if (coverType) {
      path.push(coverType);
    }
    const info = await this.getJson(`/${path.join('/')}`) as ICoverInfo;
    // Hack to correct http addresses into https
    if (info.release?.startsWith('http:')) {
      info.release = `https${info.release.substring(4)}`;
    }
    return info;
  }

}
