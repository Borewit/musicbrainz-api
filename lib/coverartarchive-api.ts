/* eslint-disable-next-line */
import got from 'got';

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

  private host = 'coverartarchive.org';

  private async getJson(path: string) {
    const response = await got.get('https://' + this.host + path, {
      headers: {
        Accept: `application/json`
      },
      responseType: 'json'
    });
    return response.body;
  }

  /**
   *
   * @param releaseId MusicBrainz Release MBID
   */
  public async getReleaseCovers(releaseId: string, coverType?: 'front' | 'back'): Promise<ICoverInfo> {
    const path = ['release', releaseId];
    if (coverType) {
      path.push(coverType);
    }
    const info = await this.getJson('/' + path.join('/')) as ICoverInfo;
    // Hack to correct http addresses into https
    if (info.release && info.release.startsWith('http:')) {
      info.release = 'https' + info.release.substring(4);
    }
    return info;
  }

  /**
   *
   * @param releaseId MusicBrainz Release Group MBID
   */
  public async getReleaseCovers(releaseGroupId: string, coverType?: 'front' | 'back'): Promise<ICoverInfo> {
    const path = ['release-group', releaseId];
    if (coverType) {
      path.push(coverType);
    }
    const info = await this.getJson('/' + path.join('/')) as ICoverInfo;
    // Hack to correct http addresses into https
    if (info.release && info.release.startsWith('http:')) {
      info.release = 'https' + info.release.substring(4);
    }
    return info;
  }

}
