import { XmlIsrc } from './xml-isrc';

export class XmlIsrcList {

  public items: XmlIsrc[] = [];

  public pushIsrc(isrc: string) {
    this.items.push(new XmlIsrc(isrc));
  }

  public toXml() {
    return this.items.length === 0 ? null : {
      name: 'isrc-list',
      attrs: {
        count: this.items.length
      },
      children: this.items.map(isrc => isrc.toXml())
    };
  }
}
