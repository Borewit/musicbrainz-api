// https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#ISRC_submission

import * as jsontoxml from 'jsontoxml';
import { XmlRecording } from './xml-recording';

const ns_metadata = 'http://musicbrainz.org/ns/mmd-2.0#';

export class XmlMetadata {

  public recordings: XmlRecording[] = [];

  public pushRecording(id: string): XmlRecording {
    const rec = new XmlRecording(id);
    this.recordings.push(rec);
    return rec;
  }

  public toXml(): string {

    return jsontoxml([{
      name: 'metadata',
      attrs: {
        xmlns: ns_metadata
      },
      children: [{
        'recording-list': this.recordings.map(rec => rec.toXml())
      }]
    }], {prettyPrint: false, escape: true, xmlHeader: true});
  }
}
