
export class XmlIsrc {

  public constructor(public isrc: string) {
  }

  public toXml() {
    return {
      name: 'isrc',
      attrs: {
        id: this.isrc
      }
    };
  }
}
