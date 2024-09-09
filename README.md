[![Node.js CI](https://github.com/Borewit/musicbrainz-api/actions/workflows/nodejs-ci.yml/badge.svg)](https://github.com/Borewit/musicbrainz-api/actions/workflows/nodejs-ci.yml)
[![CodeQL](https://github.com/Borewit/musicbrainz-api/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/Borewit/musicbrainz-api/actions/workflows/github-code-scanning/codeql)
[![NPM version](https://img.shields.io/npm/v/musicbrainz-api.svg)](https://npmjs.org/package/musicbrainz-api)
[![npm downloads](http://img.shields.io/npm/dm/musicbrainz-api.svg)](https://npmcharts.com/compare/musicbrainz-api?interval=30&start=365)
[![Coverage Status](https://coveralls.io/repos/github/Borewit/musicbrainz-api/badge.svg?branch=master)](https://coveralls.io/github/Borewit/musicbrainz-api?branch=master)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/2bc47b2006454bae8c737991f152e518)](https://app.codacy.com/gh/Borewit/musicbrainz-api/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Known Vulnerabilities](https://snyk.io/test/github/Borewit/musicbrainz-api/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Borewit/musicbrainz-api?targetFile=package.json)
[![DeepScan grade](https://deepscan.io/api/teams/5165/projects/6991/branches/63373/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5165&pid=6991&bid=63373)
[![Discord](https://img.shields.io/discord/460524735235883049.svg)](https://discord.gg/958xT5X)
[![bundlejs.com badge](https://deno.bundlejs.com/?q=musicbrainz-api&badge)](https://bundlejs.com/?q=musicbrainz-api)

# musicbrainz-api

A MusicBrainz-API-client for reading and submitting metadata.

<img src="doc/musicbrainz-api-logo.png" width="40%" style="center"></img>

## Features
- **Access Metadata**: Retrieve detailed metadata from the [MusicBrainz database](https://musicbrainz.org/).
- **Submit metadata**: Easily submit new metadata to [MusicBrainz](https://musicbrainz.org/). 
- **Smart throttling**: Implements intelligent throttling, allowing bursts of requests while adhering to [MusicBrainz rate limits](https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting).
- **TypeScript Definitions**: Fully typed with built-in [TypeScript](https://www.typescriptlang.org/) definitions for a seamless development experience.

## Compatibility

Module: version 8 migrated from [CommonJS](https://en.wikipedia.org/wiki/CommonJS) to [pure ECMAScript Module (ESM)](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).
The distributed JavaScript codebase is compliant with the [ECMAScript 2020 (11th Edition)](https://en.wikipedia.org/wiki/ECMAScript_version_history#11th_Edition_%E2%80%93_ECMAScript_2020) standard.

> [!NOTE]
> See also [CommonJS backward compatibility](#commonjs-backward-compatibility)

### Requirements
- Node.js: Requires [Node.js version 16](https://nodejs.org/en/about/previous-releases) or higher.
- Browser: Can be used in browser environments when bundled with a module bundler (not actively tested).

> [!NOTE]
> We are looking into making this package usable in the browser as well.

## Support the Project
If you find this project useful and would like to support its development, consider sponsoring or contributing:
 
- [Become a sponsor to Borewit](https://github.com/sponsors/Borewit)
 
- Buy me a coffee:
  
  <a href="https://www.buymeacoffee.com/borewit" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy me A coffee" height="41" width="174"></a>

## Getting Started

### Identifying Your Application

MusicBrainz requires all API clients to [identify their application](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#User%20Data).
Ensure you set the User-Agent header by providing `appName`, `appVersion`, and `appContactInfo` when configuring the client.
This library will automatically handle this for you.

### Submitting metadata

If you plan to use this module for submitting metadata, please ensure you comply with [the MusicBrainz Code of conduct/Bots](https://wiki.musicbrainz.org/Code_of_Conduct/Bots).

## Example Usage

### Importing the Library

```js
import { MusicBrainzApi } from 'musicbrainz-api';

const mbApi = new MusicBrainzApi({
    appName: 'my-app',
    appVersion: '0.1.0',
    appContactInfo: 'user@mail.org',
});
```

> [!NOTE]
> See also [CommonJS backward compatibility](#commonjs-backward-compatibility)

### Configuration Options

```js
const config = {
    // Optional: MusicBrainz bot account credentials
    botAccount: {
        username: 'myUserName_bot',
        password: 'myPassword',
    },

    // Optional: API base URL (default: 'https://musicbrainz.org')
    baseUrl: 'https://musicbrainz.org',

    // Required: Application details
    appName: 'my-app',
    appVersion: '0.1.0',
    appMail: 'user@mail.org',

    // Optional: Proxy settings (default: no proxy server)
    proxy: {
        host: 'localhost',
        port: 8888,
    },

    // Optional: Disable rate limiting (default: false)
    disableRateLimiting: false,
};

const mbApi = new MusicBrainzApi(config);
```

## Accessing MusicBrainz Data

The MusicBrainz API allows you to look up various entities. Here’s how to use the lookup function:

## Lookup MusicBrainz Entities

MusicBrainz API documentation: [XML Web Service/Version 2 Lookups](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#Lookups)

### Lookup Function

```js
const artist = await mbApi.lookup('artist', 'ab2528d9-719f-4261-8098-21849222a0f2');
```

Arguments:
- entity: `'area'` | `'artist'` | `'collection'` | `'instrument'` | `'label'` | `'place'` | `'release'` | `'release-group'` | `'recording'` | `'series'` | `'work'` | `'url'` | `'event'`
- MBID [(MusicBrainz identifier)](https://wiki.musicbrainz.org/MusicBrainz_Identifier)
- query


| Query argument        | Query value     | 
|-----------------------|-----------------|  
| `query.collection`    | Collection MBID |

### Browse artist

```js
const artists = await mbApi.browse('artist', query);
````

| Query argument        | Query value        | 
|-----------------------|--------------------|  
| `query.area`          | Area MBID          |
| `query.collection`    | Collection MBID    |
| `query.recording`     | Recording MBID     |
| `query.release`       | Release MBID       |
| `query.release-group` | Release-group MBID |
| `query.work`          | Work MBID          |

### Browse collection
```js
const collections = await mbApi.browse('collection', query);
````

| Query argument        | Query value        | 
|-----------------------|--------------------|  
| `query.area`          | Area MBID          |
| `query.artist`        | Artist MBID        |
| `query.editor`        | Editor MBID        |
| `query.event`         | Event MBID         |
| `query.label`         | Label MBID         |
| `query.place`         | Place MBID         |
| `query.recording`     | Recording MBID     |
| `query.release`       | Release MBID       |
| `query.release-group` | Release-group MBID |
| `query.work`          | Work MBID          |

### Browse events
```js
const events = await mbApi.browse('event', query);
````

| Query argument        | Query value     | 
|-----------------------|-----------------|  
| `query.area`          | Area MBID       |
| `query.artist`        | Artist MBID     |
| `query.collection`    | Collection MBID |
| `query.place`         | Place MBID      |

### Browse instruments
```js
const instruments = await mbApi.browse('event', query);
````

| Query argument        | Query value        | 
|-----------------------|--------------------|  
| `query.collection`    | Collection MBID    |

### Browse labels
```js
const labels = await mbApi.browse('label', query);
````

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.area`       | Area MBID       |
| `query.collection` | Collection MBID |
| `query.release`    | Release MBID    |

### Browse places
```js
const places = await mbApi.browse('place', query);
````

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.area`       | Area MBID       |
| `query.collection` | Collection MBID |

### Browse recordings
```js
const recordings = await mbApi.browse('recording', query);
````

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.artist`     | Area MBID       |
| `query.collection` | Collection MBID |
| `query.release`    | Release MBID    |
| `query.work`       | Work MBID       |

### Browse releases
```js
const releases = await mbApi.browse('release', query);
````

| Query argument        | Query value        | 
|-----------------------|--------------------|  
| `query.area`          | Area MBID          |
| `query.artist`        | Artist MBID        |
| `query.editor`        | Editor MBID        |
| `query.event`         | Event MBID         |
| `query.label`         | Label MBID         |
| `query.place`         | Place MBID         |
| `query.recording`     | Recording MBID     |
| `query.release`       | Release MBID       |
| `query.release-group` | Release-group MBID |
| `query.work`          | Work MBID          |

### Browse release-groups
```js
const releaseGroups = await mbApi.browse('release-group',query);
```

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.artist`     | Artist MBID     |
| `query.collection` | Collection MBID |
| `query.release`    | Release MBID    |

### Browse series
```js
const series = await mbApi.browse('series');
````

| Query argument        | Query value        | 
|-----------------------|--------------------|  
| `query.area`          | Area MBID          |
| `query.artist`        | Artist MBID        |
| `query.editor`        | Editor MBID        |
| `query.event`         | Event MBID         |
| `query.label`         | Label MBID         |
| `query.place`         | Place MBID         |
| `query.recording`     | Recording MBID     |
| `query.release`       | Release MBID       |
| `query.release-group` | Release-group MBID |
| `query.work`          | Work MBID          |

### Browse works
```js
const works = await mbApi.browse('work');
````

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.artist`     | Artist MBID     |
| `query.xollection` | Collection MBID |

### Browse urls
```js
const urls = await mbApi.browse('url');
````

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.artist`     | Artist MBID     |
| `query.xollection` | Collection MBID |

## Search (query)

Implements [XML Web Service/Version 2/Search](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search).

There are different search fields depending on the entity.

### Search function

Searches can be performed using the generic search function: `query(entity: mb.EntityType, query: string | IFormData, offset?: number, limit?: number): Promise<entity>`

Arguments:
- Entity type, which can be one of:
  - `artist`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Artist)
  - `label`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Label)
  - `recording`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Recording)
  - `release`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Release)
  - `release-group`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Release_Group)
  - `work`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Work)
  - `area`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Area)
  - `url`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#URL)
- `query {query: string, offset: number, limit: number}`
  - `query.query`: supports the full Lucene Search syntax; you can find a detailed guide at [Lucene Search Syntax](https://lucene.apache.org/core/4_3_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package_description). For example, you can set conditions while searching for a name with the AND operator.
  - `query.offset`: optional, return search results starting at a given offset. Used for paging through more than one page of results.
  - `limit.query`: optional, an integer value defining how many entries should be returned. Only values between 1 and 100 (both inclusive) are allowed. If not given, this defaults to 25.

For example, to find any recordings of _'We Will Rock You'_ by Queen:
```js
const query = 'query="We Will Rock You" AND arid:0383dadf-2a4e-4d10-a46a-e9e041da8eb3';
const result = await mbApi.search('release-group', {query});
```

##### Example: search Île-de-France

```js
 mbApi.search('area', 'Île-de-France');
````

##### Example: search release by barcode

Search a release with the barcode 602537479870:
```js
 mbApi.search('release', {query: {barcode: 602537479870}});
````

##### Example: search by object

Same as previous example, but automatically serialize parameters to search query
```js
 mbApi.search('release', 'barcode: 602537479870');
````

##### Example: search artist by artist name

Search artist:
```js
const result = await mbApi.search('artist', {query: 'Stromae'});
```

##### Example: search release-group by artist name

Search release-group:
```js
const result = await mbApi.search('release-group', {query: 'Racine carrée'});
```

##### Example: search release-group by release-group and an artist

Search a combination of a release-group and an artist.
```js
const result = await mbApi.search('release-group', {artist: 'Racine carrée', releasegroup: 'Stromae'});
```

# Submitting data via XML POST

[Submitting data via XML POST](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#Submitting_data) may be done using personal MusicBrainz credentials. 

## Submit ISRC code using XML POST

Using the [XML ISRC submission](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#ISRC_submission) API.

```js
const mbid_Formidable = '16afa384-174e-435e-bfa3-5591accda31c';
const isrc_Formidable = 'BET671300161';

const xmlMetadata = new XmlMetadata();
const xmlRecording = xmlMetadata.pushRecording(mbid_Formidable);
xmlRecording.isrcList.pushIsrc(isrc_Formidable);
await mbApi.post('recording', xmlMetadata);
```    
    
# Submitting data via user form-data

For all of the following function you need to use a dedicated bot account. 

## Submitting ISRC via post user form-data

Use with caution, and only on a test server, it may clear existing metadata has side effect.
      
```js

const mbid_Formidable = '16afa384-174e-435e-bfa3-5591accda31c';
const isrc_Formidable = 'BET671300161';

    
const recording = await mbApi.lookup('recording', mbid_Formidable);

// Authentication the http-session against MusicBrainz (as defined in config.baseUrl)
const succeed = await mbApi.login();
assert.isTrue(succeed, 'Login successful');

// To submit the ISRC, the `recording.id` and `recording.title` are required
await mbApi.addIsrc(recording, isrc_Formidable);
```

### Submit recording URL

```js
const recording = await mbApi.lookup('recording', '16afa384-174e-435e-bfa3-5591accda31c');

const succeed = await mbApi.login();
assert.isTrue(succeed, 'Login successful');

await mbApi.addUrlToRecording(recording, {
  linkTypeId: LinkType.stream_for_free,
  text: 'https://open.spotify.com/track/2AMysGXOe0zzZJMtH3Nizb'
});
```

Actually a Spotify-track-ID can be submitted easier: 
```js
const recording = await mbApi.lookup('recording', '16afa384-174e-435e-bfa3-5591accda31c');

const succeed = await mbApi.login();
assert.isTrue(succeed, 'Login successful');
await mbApi.addSpotifyIdToRecording(recording, '2AMysGXOe0zzZJMtH3Nizb');
```

## Cover Art Archive API

This library also supports the [Cover Art Archive API](https://musicbrainz.org/doc/Cover_Art_Archive/API).

### Fetch Release Cover Art
```js
import { CoverArtArchiveApi } from 'musicbrainz-api';

const coverArtArchiveApiClient = new CoverArtArchiveApi();

async function getReleaseCoverArt(releaseMbid, coverType = '') {
    try {
        const coverInfo = await coverArtArchiveApiClient.getReleaseCovers(releaseMbid, coverType);
        console.log(`Cover info for ${coverType || 'all covers'}`, coverInfo);
    } catch (error) {
        console.error(`Failed to fetch ${coverType || 'all covers'}:`, error);
    }
}

(async () => {
    const releaseMbid = 'your-release-mbid-here';  // Replace with actual MBID
    await getReleaseCoverArt(releaseMbid); // Get all covers
    await getReleaseCoverArt(releaseMbid, 'front'); // Get best front cover
    await getReleaseCoverArt(releaseMbid, 'back'); // Get best back cover
})();
```

### Release Group Cover Art
```js
import { CoverArtArchiveApi } from 'musicbrainz-api';

const coverArtArchiveApiClient = new CoverArtArchiveApi();

async function getCoverArt(releaseGroupMbid, coverType = '') {
    try {
        const coverInfo = await coverArtArchiveApiClient.getReleaseGroupCovers(releaseGroupMbid, coverType);
        console.log(`Cover info for ${coverType || 'all covers'}`, coverInfo);
    } catch (error) {
        console.error(`Failed to fetch ${coverType || 'all covers'}:`, error);
    }
}

(async () => {
    const releaseGroupMbid = 'your-release-group-mbid-here';  // Replace with actual MBID
    await getCoverArt(releaseGroupMbid); // Get all covers
    await getCoverArt(releaseGroupMbid, 'front'); // Get best front cover
    await getCoverArt(releaseGroupMbid, 'back'); // Get best back cover
})();

```

## CommonJS backward compatibility

For legacy CommonJS projects needing to load the `music-metadata` ESM module, you can use the `loadMusicMetadata` function:
```js
const { loadMusicBrainzApi } = require('musicbrainz-api');

(async () => {

    // Dynamically loads the ESM module in a CommonJS project
    const  {MusicBrainzApi} = await loadMusicBrainzApi();

    const mbApi = new MusicBrainzApi({
        appName: 'my-app',
        appVersion: '0.1.0',
        appContactInfo: 'user@mail.org',
    });

    const releaseList = await mbApi.search('release', {query: {barcode: 602537479870}});
    for(const release of releaseList.releases) {
        console.log(release.title);
    }
})();
```

> [!NOTE]
> The `loadMusicMetadata` function is experimental.
