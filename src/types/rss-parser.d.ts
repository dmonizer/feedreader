declare module 'rss-parser' {
  interface Item {
    title?: string;
    link?: string;
    description?: string;
    content?: string;
    author?: string;
    pubDate?: string;
    guid?: string;
    categories?: string[];
    [key: string]: any;
  }

  interface Output {
    title?: string;
    description?: string;
    link?: string;
    items: Item[];
    [key: string]: any;
  }

  class Parser {
    constructor(options?: {
      timeout?: number;
      maxRedirects?: number;
      [key: string]: any;
    });

    parseString(xml: string): Promise<Output>;
    parseURL(url: string): Promise<Output>;
  }

  export = Parser;
}