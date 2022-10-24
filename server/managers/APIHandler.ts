import { IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import Endpoint from "./Endpoint";

type Cookies = {
  [key: string]: string;
}

type Context = (req: IncomingMessage, res: ServerResponse) => boolean;

export default class APIHandler {
  #paths: Map<string, {
    endpoint: Endpoint,
    context: Context
  }>;

  constructor() {
    this.#paths = new Map();
  }

  register(url: string, endpoint: Endpoint, context: Context) {
    if (this.#paths.get(url) != undefined) {
      this.#paths.set(url, {
        endpoint,
        context
      });
    } else {
      throw Error("Endpoint already registered on the handler");
    }
  }

  parseCookies(cookiesRaw: string): Cookies {
    let cookies = cookiesRaw.split(';');
    let arr = {} as Cookies;

    cookies.forEach(cookie => {
      while (cookie.charAt(0) == ' ') {
          cookie = cookie.substring(1);
      }

      let ck = cookie.substring(0, cookie.indexOf('='));
      let ck_val = cookie.substring(cookie.indexOf('=') + 1, cookie.length);
      
      arr[ck] = ck_val;
    });

    return arr;
  }

  handleRequest(req: IncomingMessage, res: ServerResponse): boolean {
    if (req.url == undefined) {
      return false;
    }

    const parsedUrl = parse(req.url, true);
    let { pathname, query } = parsedUrl;

    if (pathname) {
      let Path = this.#paths.get(pathname);
      if (Path?.context(req, res)) {
        Path.endpoint.handle(req, res);
        return true;
      } else {
        res.statusCode = 401;
        res.end();
        return false
      }
    }

    return false;
  }
}
