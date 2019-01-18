import { XmlIsrcList } from './xml-isrc-list';

export class XmlRecording {

  public isrcList: XmlIsrcList = new XmlIsrcList();

  public constructor(public id: string) {
  }

  public toXml() {
    return {
      name: 'recording',
      attrs: {
        id: this.id
      },
      children: [this.isrcList.toXml()]
    };
  }
}
