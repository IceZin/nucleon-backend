import { IncomingMessage, ServerResponse } from "http";
import internal from "stream";
import { parse } from "url";
import WebSocket from "ws";
import { parseCookies } from "../components/utils/utils";
import Endpoint from "./Endpoint";
import UsersCache from "./Users";

type Cookies = {
  [key: string]: string;
}

type Context = (req: IncomingMessage, res: ServerResponse) => boolean;

export default class APIHandler {
  private _paths: Map<string, Endpoint> = new Map();
  private _upgraders: Map<string, Endpoint> = new Map();

  register(url: string, endpoint: Endpoint) {
    if (!this._paths.has(url)) {
      this._paths.set(url, endpoint);
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

  handleRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.url == undefined) {
      return false;
    }

    const parsedUrl = parse(req.url, true);
    let { pathname, query } = parsedUrl;

    if (pathname) {
      let endpoint = this._paths.get(pathname);
      endpoint?.handle(req, res);
    }
  }

  handleUpgrade(wss: WebSocket.Server, req: IncomingMessage, sock: internal.Duplex, head: any) {
    if (req.headers['upgrade'] !== 'websocket') {
      sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }
  
    let cookies = parseCookies(req.headers.cookie || "");
  
    if (!cookies) {
      sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      return;
    }
  
    let user = UsersCache.get(cookies.utoken);
  
    if (user) {
      if (req.url == "/WsClient") {
        user.handleWebUpgrade(wss, req, sock, head, cookies);
      } else {
        user.handleDeviceUpgrade(req, sock, head, cookies);
      }
    } else {
      sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    }
  }
}
