
enum Token {
  Name,
  Value,
  InQuote
}

export class CssEntry {
  constructor(name: string, value: string) {
    this.name = name.trim();
    this.value = value.trim();
  }
  name: string;
  value: string;
}

export class CssAttributeParser {

  entries: CssEntry[] = [];

  public parse(text: string, quoteType: string = '\'') {
    this.entries = [];

    let name = '';
    let value = '';
    let token = Token.Name;

    for (let n = 0; n < text.length; n++) {
      let c = text[n];
      if (token === Token.Name) {
        if (c === ':')
          token = Token.Value;
        else if (c === ';') {
          name = '';
        } else
          name += c;
      } else if (token === Token.Value) {
        if (c === ';') {
          this.entries.push(new CssEntry(name, value));
          name = '';
          value = '';
          token = Token.Name;
        } else {
          if (c === quoteType) {
            token = Token.InQuote;
          }
          value += c;
        }
      } else if (token === Token.InQuote) {
        if (c === '\\') {
          value += c;
          n++;
          c = text[n];
          value += c;
        } else if (c === quoteType) {
          value += c;
          token = Token.Value;
        } else {
          value += c;
        }
      }
    }

    if (name.trim() !== '') {
      this.entries.push(new CssEntry(name, value));
    }
  }
}