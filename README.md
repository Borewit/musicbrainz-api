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

You can use the lookup function, to look up an entity, when you have the MBID for that entity.
MusicBrainz API documentation: [MusicBrainz API - Lookups](https://wiki.musicbrainz.org/MusicBrainz_API#Lookups)

### Lookup Function

```js
const artist = await mbApi.lookup('artist', 'ab2528d9-719f-4261-8098-21849222a0f2', ['recordings']);
```

Arguments:
- entity (`string`): `'area'` | `'artist'` | `'collection'` | `'instrument'` | `'label'` | `'place'` | `'release'` | `'release-group'` | `'recording'` | `'series'` | `'work'` | `'url'` | `'event'`
- MBID (`string`): [(MusicBrainz identifier)](https://wiki.musicbrainz.org/MusicBrainz_Identifier)
- include arguments (`string[]`), see [Include arguments](#include-arguments)

#### Lookup URLs

There is special method to lookup URL entity / entities by one, or an array of URLs 
([MusicBrainz API documentation: url (by text)](https://musicbrainz.org/doc/MusicBrainz_API#url_(by_text))):

```js
const urls = await mbApi.lookupUrl(['https://open.spotify.com/track/2AMysGXOe0zzZJMtH3Nizb', 'https://open.spotify.com/track/78Teboqh9lPIxWlIW5RMQL']);
```

or 

```js
const url = await mbApi.lookupUrl('https://open.spotify.com/track/2AMysGXOe0zzZJMtH3Nizb');
```

Arguments:
- url (`string` | `string[]`): URL or array of URLs
- include arguments (`string[]`), see [Include arguments](#include-arguments)

Note that the return type is different, depending on if a single URL or an array of URLs is provided.

## Browse requests
Browse requests are a direct lookup of all the entities directly linked to another entity ("directly linked" here meaning it does not include entities linked by a relationship).

For example, browse _releases_:
```js

const artist_mbid = 'ab2528d9-719f-4261-8098-21849222a0f2';

const releases = await mbApi.browse('release', {
    track_artist:  artist_mbid,
    limit: 0,
    offset: 0,
  }, ['url-rels', 'isrcs', 'recordings']);
```

For the optional include arguments (`string[]`), see [Include arguments](#include-arguments).

### Browse artist

```js
const artists = await mbApi.browse('artist', query);
const artists = await mbApi.browse('artist', query, ['area', 'collection']);
```

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
const collections = await mbApi.browse('collection', query, ['area', 'artist']);
```

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
const events = await mbApi.browse('instrument', query, ['area', 'artist']);
```

| Query argument        | Query value     | 
|-----------------------|-----------------|  
| `query.area`          | Area MBID       |
| `query.artist`        | Artist MBID     |
| `query.collection`    | Collection MBID |
| `query.place`         | Place MBID      |

### Browse instruments
```js
const instruments = await mbApi.browse('instrument', query);
const instruments = await mbApi.browse('instrument', query, ['collection']);
```

| Query argument        | Query value        | 
|-----------------------|--------------------|  
| `query.collection`    | Collection MBID    |

### Browse labels
```js
const labels = await mbApi.browse('label', query);
const places = await mbApi.browse('place', query, ['area', 'collection']);
```

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.area`       | Area MBID       |
| `query.collection` | Collection MBID |
| `query.release`    | Release MBID    |

### Browse places
```js
const places = await mbApi.browse('place', query);
const places = await mbApi.browse('place', query, ['area', 'collection']);
```

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.area`       | Area MBID       |
| `query.collection` | Collection MBID |

### Browse recordings
```js
const recordings = await mbApi.browse('recording', query, ['artist']);
```

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.artist`     | Area MBID       |
| `query.collection` | Collection MBID |
| `query.release`    | Release MBID    |
| `query.work`       | Work MBID       |

### Browse releases
```js
const releases = await mbApi.browse('release', query);
const releases = await mbApi.browse('release', query, ['artist', 'track']);
```

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
const releaseGroups = await mbApi.browse('release-group', query);
const releaseGroups = await mbApi.browse('release-group', query, ['artist', 'release']);
```

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.artist`     | Artist MBID     |
| `query.collection` | Collection MBID |
| `query.release`    | Release MBID    |

### Browse series
```js
const series = await mbApi.browse('series');
const series = await mbApi.browse('series', ['collection']);
```

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
const series = await mbApi.browse('series', ['artist', 'collection']);
```

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.artist`     | Artist MBID     |
| `query.xollection` | Collection MBID |

### Browse urls
```js
const urls = await mbApi.browse('url');
const series = await mbApi.browse('series', ['artist', 'collection', 'artist-rels']);
```

| Query argument     | Query value     | 
|--------------------|-----------------|  
| `query.artist`     | Artist MBID     |
| `query.xollection` | Collection MBID |

## Search (query)

Implements [MusicBrainz API: Search](https://wiki.musicbrainz.org/MusicBrainz_API/Search).

There are different search fields depending on the entity.

### Search function

Searches can be performed using the generic search function: `query(entity: mb.EntityType, query: string | IFormData, offset?: number, limit?: number): Promise<entity>`

Arguments:
- Entity type, which can be one of:
  - `annotation`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Annotation)
  - `area`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Area)
  - `artist`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Artist)
  - `cdstub`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#CDStubs)
  - `event`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Event)
  - `instrument`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Instrument)
  - `label`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Label)
  - `place`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Place)
  - `recording`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Recording)
  - `release`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Release)
  - `release-group`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Release_Group)
  - `series`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Series)
  - `tag`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Tag)
  - `url`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#URL)
  - `work`: [search fields](https://wiki.musicbrainz.org/MusicBrainz_API/Search#Work)
- `query {query: string, offset: number, limit: number}`
  - `query.query`: supports the full Lucene Search syntax; you can find a detailed guide at [Lucene Search Syntax](https://lucene.apache.org/core/4_3_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package_description). For example, you can set conditions while searching for a name with the AND operator.
  - `query.offset`: optional, return search results starting at a given offset. Used for paging through more than one page of results.
  - `limit.query`: optional, an integer value defining how many entries should be returned. Only values between 1 and 100 (both inclusive) are allowed. If not given, this defaults to 25.

For example, to search for _release-group_: _"We Will Rock You"_ by _Queen_:
```js
const query = 'query=artist:"Queen" AND release:"We Will Rock You"';
const result = await mbApi.search('release-group', {query});
```

##### Example: search Île-de-France

```js
 mbApi.search('area', 'Île-de-France');
```

##### Example: search release by barcode

Search a release with the barcode 602537479870:
```js
 mbApi.search('release', {query: {barcode: 602537479870}});
```

##### Example: search by object

Same as previous example, but automatically serialize parameters to search query
```js
 mbApi.search('release', 'barcode: 602537479870');
```

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

## Include arguments


### Subqueries

_Include Arguments_ which allow you to request more information to be included about the entity.

| entity           | supported _include arguments_                                              |
|------------------|----------------------------------------------------------------------------|
| `area`           |                                                                            |
| `artist`         | `recordings`, `releases`, `release-groups`, `works`                        |                             
| `collection`     | `user-collections` (includes private collections, requires authentication) |
| `event`          |                                                                            |
| `genre`          |                                                                            |
| `instrument`     |                                                                            |
| `label`          | `releases`                                                                 |
| `place`          |                                                                            |
| `recording`      | `artists`, `releases`, `release-groups`, `isrcs`, `url-rels`               |
| `release`        | `artists`, `collections`, `labels`, `recordings`, `release-groups`         |
| `release-group`  | `artists`, `releases`                                                      |
| `series`         |                                                                            | 
| `work`           |                                                                            | 
| `url`            |                                                                            |

### Arguments which affect subqueries

Some additional _include parameters_ are supported to specify how much of the data about the linked entities should be included:

| _include argument_ | Description                                                                                                                                                                                                           |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `discids`          | include discids for all media in the releases                                                                                                                                                                         |
| `media`            | include media for all releases, this includes the # of tracks on each medium and its format.                                                                                                                          |                             
| `isrcs`            | user-collections (includes private collections, requires authentication)include isrcs for all recordings                                                                                                              |
| `artist-credits`   | include artists credits for all releases and recordings                                                                                                                                                               |
| `various-artists`  | include only those releases where the artist appears on one of the tracks, but not in the artist credit for the release itself (this is only valid on entity `"artist"` and _include argument_ `"releases request"`). |

### Miscellaneous arguments

| _include argument_          | Description                                                                                                                            |
|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `aliases`                   | include artist, label, area or work aliases; treat these as a set, as they are not deliberately ordered                                |
| `annotation`                | include annotation                                                                                                                     |                             
| `tags`, `ratings`           | include tags and/or ratings for the entity                                                                                             |
| `user-tags`, `user-ratings` | same as above, but only return the tags and/or ratings submitted by the specified user                                                 |
| `genres`, `user-genres`     | include genres (tags in the [genres list](https://musicbrainz.org/genres)): either all or the ones submitted by the user, respectively |

### Relationships

You can request relationships with the appropriate includes:
- `area-rels`
- `artist-rels`
- `event-rels`
- `genre-rels`
- `instrument-rels`
- `label-rels`
- `place-rels`
- `recording-rels`
- `release-rels`
- `release-group-rels`
- `series-rels`
- `url-rels`
- `work-rels`

These will load relationships between the requested entity and the specific entity type. 
For example, if you request "work-rels" when looking up an artist, 
you'll get all the relationships between this artist and any works, 
and if you request "artist-rels" you'll get the relationships between this artist and any other artists. 
As such, keep in mind requesting "artist-rels" for an artist, "release-rels" for a release, etc. will not load all the relationships for the entity, just the ones to other entities of the same type.

In a release request, you might also be interested on relationships for the recordings linked to the release, or the release group linked to the release, or even for the works linked to those recordings that are linked to the release (for example, to find out who played guitar on a specific track, who wrote the lyrics for the song being performed, or whether the release group is part of a series). Similarly, for a recording request, you might want to get the relationships for any linked works. 
There are three additional includes for this:

- `recording-level-rels`
- `release-group-level-rels` (for releases only)
- `work-level-rels`

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

#### Fetch available cover art information

```js
import { CoverArtArchiveApi } from 'musicbrainz-api';

const coverArtArchiveApiClient = new CoverArtArchiveApi();

async function fetchCoverArt(releaseMbid, coverType = '') {
    const coverInfo = await coverArtArchiveApiClient.getReleaseCovers(releaseMbid);
    for(const image of coverInfo.images) {
        console.log(`Cover art front=${image.front} back=${image.back} url=${image.image}`);
    }
}

fetchCoverArt('976e0677-a480-4a5e-a177-6a86c1900bbf').catch(error => {
    console.error(`Failed to fetch cover art: ${error.message}`);
})
```

#### Fetch front or back cover for a release
```js
import { CoverArtArchiveApi } from 'musicbrainz-api';

const coverArtArchiveApiClient = new CoverArtArchiveApi();

async function fetchCoverArt(releaseMbid, coverType = '') {
    const coverInfo = await coverArtArchiveApiClient.getReleaseCover(releaseMbid, 'front');
    console.log(`Cover art url=${coverInfo.url}`);
}

fetchCoverArt('976e0677-a480-4a5e-a177-6a86c1900bbf').catch(error => {
    console.error(`Failed to fetch cover art: ${error.message}`);
})
```

### Release Group Cover Art
```js
import { CoverArtArchiveApi } from 'musicbrainz-api';

const coverArtArchiveApiClient = new CoverArtArchiveApi();

async function fetchCoverArt(releaseMbid, coverType = '') {
    const coverInfo = await coverArtArchiveApiClient.getReleaseGroupCovers(releaseMbid);
    for(const image of coverInfo.images) {
        console.log(`Cover art front=${image.front} back=${image.back} url=${image.image}`);
    }
}

fetchCoverArt('976e0677-a480-4a5e-a177-6a86c1900bbf').catch(error => {
    console.error(`Failed to fetch cover art: ${error.message}`);
})
```

#### Fetch front or back cover for a release-group
```js
import { CoverArtArchiveApi } from 'musicbrainz-api';

const coverArtArchiveApiClient = new CoverArtArchiveApi();

async function fetchCoverArt(releaseMbid, coverType = '') {
    const coverInfo = await coverArtArchiveApiClient.getReleaseGroupCover(releaseMbid, 'front');
    console.log(`Cover art url=${coverInfo.url}`);
}

fetchCoverArt('976e0677-a480-4a5e-a177-6a86c1900bbf').catch(error => {
    console.error(`Failed to fetch cover art: ${error.message}`);
})
```

## CommonJS backward compatibility

I recommend CommonJS projects to consider upgrading their project to ECMAScript Module (ESM).
Please continue reading how to use **musicbrainz-api** in a CommonJS project.

Using Node.js ≥ 22, which is support loading ESM module via require, you can use:
```js
const { MusicBrainzApi } = require('musicbrainz-api');
```

Other CommonJS projects have to use [dynamic import](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import) to load the **musicbrainz-api** pure ESM module:
```js
async function run() {
  // Dynamically loads the ESM module in a CommonJS project  
  const { MusicBrainzApi } = await import('musicbrainz-api');
};

run();
```

This is known not to work in TypeScript CommonJS projects, as the TypeScript compiler, in my opinion,
incorrectly converts the [dynamic import](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import) 
to `require()`. To perform the dynamic import in TypeScript, you can use [load-esm](https://github.com/Borewit/load-esm):

```js
import {loadEsm} from 'load-esm';

async function run() {
    // Dynamically loads the ESM module in a TypeScript CommonJS project  
  const { MusicBrainzApi } = await loadEsm<typeof import('musicbrainz-api')>('musicbrainz-api');
};

run();
```

## Licence

This project is licensed under the [MIT License](LICENSE.txt). Feel free to use, modify, and distribute as needed.
