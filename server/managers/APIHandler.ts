import { IncomingMessage, ServerResponse } from "http";
import internal from "stream";
import { parse } from "url";
import WebSocket from "ws";
import { parseCookies } from "../components/utils/utils";
import Endpoint from "./Endpoint";
import UsersCache from "./Users";

export default class APIHandler {
  private _paths: Map<string, Endpoint> = new Map();

  register(url: string, endpoint: Endpoint) {
    if (!this._paths.has(url)) {
      this._paths.set(url, endpoint);
    } else {
      throw Error("Endpoint already registered on the handler");
    }
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
