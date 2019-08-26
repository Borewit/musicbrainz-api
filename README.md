[![Build Status](https://travis-ci.org/Borewit/musicbrainz-api.svg?branch=master)](https://travis-ci.org/Borewit/musicbrainz-api)
[![NPM version](https://img.shields.io/npm/v/musicbrainz-api.svg)](https://npmjs.org/package/musicbrainz-api)
[![npm downloads](http://img.shields.io/npm/dm/musicbrainz-api.svg)](https://npmcharts.com/compare/musicbrainz-api)
[![Coverage Status](https://coveralls.io/repos/github/Borewit/musicbrainz-api/badge.svg?branch=master)](https://coveralls.io/github/Borewit/musicbrainz-api?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/5289de6ccf224ca8a94f430f8a9f1784)](https://www.codacy.com/app/Borewit/musicbrainz-augmentation?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Borewit/musicbrainz-augmentation&amp;utm_campaign=Badge_Grade)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/Borewit/musicbrainz-api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Borewit/musicbrainz-api/context:javascript)
[![Dependencies](https://david-dm.org/Borewit/musicbrainz-api.svg)](https://david-dm.org/Borewit/musicbrainz-api)
[![Known Vulnerabilities](https://snyk.io/test/github/Borewit/musicbrainz-api/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Borewit/musicbrainz-api?targetFile=package.json)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/Borewit/musicbrainz-api.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/Borewit/musicbrainz-api/alerts/)
[![DeepScan grade](https://deepscan.io/api/teams/5165/projects/6991/branches/63373/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=5165&pid=6991&bid=63373)
[![Discord](https://img.shields.io/discord/460524735235883049.svg)](https://discord.gg/958xT5X)

# musicbrainz-api

A MusicBrainz-API-client for reading and submitting metadata

## Features
*   Access metadata from MusicBrainz
*   Submit metadata 
*   Smart and adjustable throttling, like MusicBrainz, it allows a bursts of requests
*   Build in TypeScript definitions

## Before using this library

MusicBrainz asks that you [identifying your application](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#User%20Data) by filling in the ['User-Agent' Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent).
By passing `appName`, `appVersion`, `appMail` musicbrainz-api takes care of that.

## Submitting metadata

If you plan to use this module for submitting metadata, please ensure you comply with [the MusicBrainz Code of conduct/Bots](https://wiki.musicbrainz.org/Code_of_Conduct/Bots).

## Example

Import the module
JavaScript example, how to import 'musicbrainz-api:
```javascript
const MusicbrainzApi = require('musicbrainz-api').MusicbrainzApi;

const mbApi = new MusicbrainzApi({
  appName: 'my-app',
  appVersion: '0.1.0',
  appContactInfo: 'user@mail.org'
});
```

In TypeScript you it would look like this:
```javascript
import {MusicBrainzApi} from '../src/musicbrainz-api';

const mbApi = new MusicbrainzApi({
  appName: 'my-app',
  appVersion: '0.1.0',
  appContactInfo: 'user@mail.org' // Or URL to application home page
});
```

The following configuration settings can be passed 
```javascript
import {MusicBrainzApi} from '../src/musicbrainz-api';

const config = {
  // MusicBrainz bot account username & password (optional)
  botAccount: { 
    username: 'myUserName_bot',
    password: 'myPassword' 
  },
  
  // API base URL, default: 'https://musicbrainz.org' (optional)
  baseUrl: 'https://musicbrainz.org',

  appName: 'my-app',
  appVersion: '0.1.0',

  // Optional, default: no proxy server
  proxy: {
    host: 'localhost',
    port: 8888
   },

  // Your e-mail address, required for submitting ISRCs
  appMail: string
}

const mbApi = new MusicbrainzApi(config);
```

## Lookup MusicBrainz Entities

MusicBrainz API documentation: [XML Web Service/Version 2 Lookups](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/#Lookups)

### Generic lookup function

Arguments:
*   entity: `'artist'` | `'label'` | `'recording'` | `'release'` | `'release-group'` | `'work'` | `'area'` | `'url'`
*   MBID [(MusicBrainz identifier)](https://wiki.musicbrainz.org/MusicBrainz_Identifier)

```javascript
const artist = await mbApi.getEntity('artist', 'ab2528d9-719f-4261-8098-21849222a0f2');
```

### Lookup area

```javascript
const area = await mbApi.getArea('ab2528d9-719f-4261-8098-21849222a0f2');
```

### Lookup artist

Lookup an `artist` and include their `releases`, `release-groups` and `aliases`

```javascript
const artist = await mbApi.getArtist('ab2528d9-719f-4261-8098-21849222a0f2');
```

The second argument can be used to pass [subqueries](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#Subqueries), which will return more (nested) information:
```javascript
const artist = await mbApi.getArtist('ab2528d9-719f-4261-8098-21849222a0f2', ['releases', 'recordings', 'url-rels']);
```

### Lookup recording

The second argument can be used to pass [subqueries](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#Subqueries):
```javascript
const artist = await mbApi.getRecording('16afa384-174e-435e-bfa3-5591accda31c', ['artists', 'url-rels']);
```

### Lookup release
```javascript
const release = await mbApi.getRelease('976e0677-a480-4a5e-a177-6a86c1900bbf', ['artists', 'url-rels']);
```

### Lookup release-group
```javascript
const releaseGroup = await mbApi.getReleaseGroup('19099ea5-3600-4154-b482-2ec68815883e');
```

### Lookup work
```javascript
const work = await mbApi.getWork('b2aa02f4-6c95-43be-a426-aedb9f9a3805');
```

## Search (query)

Implements [XML Web Service/Version 2/Search](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search).

There are different search fields depending on the entity.

### Generic search function

Searches can be performed using the generic search function: `query(entity: mb.EntityType, query: string | IFormData, offset?: number, limit?: number)`:

##### Example: search Île-de-France

```javascript
 mbApi.search('area', 'Île-de-France');
````

##### Example: search release by barcode

Search a release with the barcode 602537479870:
```javascript
 mbApi.search('release', {barcode: 602537479870});
````

##### Example: search by object

Same as previous example, but automatically serialize parameters to search query
```javascript
 mbApi.search('release', 'barcode: 602537479870');
````

### Entity specific search functions

The following entity specific search functions are available:
```TypeScript
searchArtist(query: string | IFormData, offset?: number, limit?: number): Promise<mb.IArtistList>
searchReleaseGroup(query: string | IFormData, offset?: number, limit?: number): Promise<mb.IReleaseGroupList>`
```

Arguments:
*   Entity type, which can be one of:
    *   `artist`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Artist)
    *   `label`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Label)
    *   `recording`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Recording)
    *   `release`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Release)
    *   `release-group`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Release_Group)
    *   `work`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Work)
    *   `area`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#Area)
    *   `url`: [search fields](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2/Search#URL)
*   `query {query: string, offset: number, limit: number}`
    *   `query.query`: supports the full Lucene Search syntax; you can find a detailed guide at [Lucene Search Syntax](https://lucene.apache.org/core/4_3_0/queryparser/org/apache/lucene/queryparser/classic/package-summary.html#package_description). For example, you can set conditions while searching for a name with the AND operator.
    *   `query.offset`: optional, return search results starting at a given offset. Used for paging through more than one page of results.
    *   `limit.query`: optional, an integer value defining how many entries should be returned. Only values between 1 and 100 (both inclusive) are allowed. If not given, this defaults to 25.

For example, to find any recordings of _'We Will Rock You'_ by Queen:
```javascript
const query = 'query="We Will Rock You" AND arid:0383dadf-2a4e-4d10-a46a-e9e041da8eb3';
const result = await mbApi.query<mb.IReleaseGroupList>('release-group', {query});
```

## Specialized search functions

Search artist:
````javascript
const result = await mbApi.searchArtist('Stromae');
```

Search release-group:
```javascript
const result = await mbApi.searchReleaseGroup('Racine carrée');
```

Search a combination of a release-group and an artist.
```javascript
const result = await mbApi.searchReleaseGroupByTitleAndArtist('Racine carrée', 'Stromae');
```

# Submitting data via XML POST

[Submitting data via XML POST](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#Submitting_data) may be done using personal MusicBrainz credentials. 

## Submit ISRC code using XML POST

Using the [XML ISRC submission](https://wiki.musicbrainz.org/Development/XML_Web_Service/Version_2#ISRC_submission) API.

```javascript
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

<img width="150" src="http://www.clker.com/cliparts/i/w/L/q/u/1/work-in-progress.svg"/>
Use with caution, and only on a test server, it may clear existing metadata as side effect.
      
```javascript

const mbid_Formidable = '16afa384-174e-435e-bfa3-5591accda31c';
const isrc_Formidable = 'BET671300161';

    
const recording = await mbApi.getRecording(mbid_Formidable);

// Authentication the http-session against MusicBrainz (as defined in config.baseUrl)
const succeed = await mbApi.login();
assert.isTrue(succeed, 'Login successful');

// To submit the ISRC, the `recording.id` and `recording.title` are required
await mbApi.addIsrc(recording, isrc_Formidable);
```

### Submit recording URL

```javascript
const recording = await mbApi.getRecording('16afa384-174e-435e-bfa3-5591accda31c');

const succeed = await mbApi.login();
assert.isTrue(succeed, 'Login successful');

await mbApi.addUrlToRecording(recording, {
  linkTypeId: LinkType.stream_for_free,
  text: 'https://open.spotify.com/track/2AMysGXOe0zzZJMtH3Nizb'
});
```

Actually a Spotify-track-ID can be submitted easier: 
```javascript
const recording = await mbApi.getRecording('16afa384-174e-435e-bfa3-5591accda31c');

const succeed = await mbApi.login();
assert.isTrue(succeed, 'Login successful');
await mbApi.addSpotifyIdToRecording(recording, '2AMysGXOe0zzZJMtH3Nizb');
```

## Compatibility

The JavaScript in runtime is compliant with [ECMAScript 2017 (ES8)](https://en.wikipedia.org/wiki/ECMAScript#8th_Edition_-_ECMAScript_2017).
Requires [Node.js®](https://nodejs.org/) version 6 or higher.
