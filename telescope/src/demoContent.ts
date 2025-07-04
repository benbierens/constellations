const api = 'http://localhost:3000';

export class DemoContent {
  private _owners: any;
  private _id: any;
  private _content: any;

  constructor(id: any, owners: any) {
    this._id = id;
    this._owners = owners;

    this._content = {
      pictures: {
        drawings: {
          untitled: "MSPAINT BMP file here one",
          untitled_2: "MSPAINT BMP file here two",
          untitled_2_final: "MSPAINT BMP file here three"
        },
        memes: {
          image_a: "JPG file here one",
          image_b: "JPG file here two"
        }
      },
      documents: {
        important: "Very important document",
        report: "Very important report",
        invoices: {
          jan: "january",
          feb: "february",
          mar: "march"
        }
      },
      music: {
      }
    }
  }

  create = async () => {
    await this.doCreate(this._content, []);
    await this.doPost(`${this._id}/deactivate`, JSON.stringify({
      path: []
    }));
  }

  doCreate = async (here: any, basePath: any) => {
    const keys = Object.keys(here);
    for (const key of keys) {
      const value = here[key];
      const path = [...basePath, key];
      if (value) {
        if (typeof value === 'string') {
          await this.createFile(path, "file", value);
        } else {
          await this.createFolder(path);
          await this.doCreate(value, path);
        }
      }
    }
  }

  doPost = async (url: string, body: string) => {
    await fetch(`${api}/${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });
  }

  createFile = async (path: any, type: any, content: any) => {
    await this.doPost(`${this._id}/newfile`, JSON.stringify({
      path: path,
      type: type,
      owners: this._owners
    }));

    let byteArray = new Uint8Array(content.length);
    for (let i = 0; i < content.length; i++) {
      byteArray[i] = content.codePointAt(i);
    }
    const arrayBuffer = byteArray.buffer;
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, i + chunkSize) as any
      );
    }
    const base64String = btoa(binary);
    await this.doPost(`${this._id}/setdata`, JSON.stringify({
      path: path,
      data: base64String
    }));
  }

  createFolder = async (path: any) => {
    await this.doPost(`${this._id}/newfolder`, JSON.stringify({
      path: path,
      owners: this._owners
    }));
  }
}
