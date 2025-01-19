export * from './coverartarchive-api.js';
export * from './musicbrainz-api.js';

/**
 * CommonJS (only) function to load `musicbrainz-api` ESM module
 */
export declare function loadMusicBrainzApi(): Promise<typeof import('musicbrainz-api')>;
