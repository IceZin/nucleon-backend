"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const utils_1 = require("../components/utils/utils");
const Users_1 = __importDefault(require("./Users"));
class APIHandler {
    constructor() {
        this._paths = new Map();
        this._upgraders = new Map();
    }
    register(url, endpoint) {
        if (!this._paths.has(url)) {
            this._paths.set(url, endpoint);
        }
        else {
            throw Error("Endpoint already registered on the handler");
        }
    }
    parseCookies(cookiesRaw) {
        let cookies = cookiesRaw.split(';');
        let arr = {};
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
    handleRequest(req, res) {
        if (req.url == undefined) {
            return false;
        }
        const parsedUrl = (0, url_1.parse)(req.url, true);
        let { pathname, query } = parsedUrl;
        if (pathname) {
            let endpoint = this._paths.get(pathname);
            endpoint === null || endpoint === void 0 ? void 0 : endpoint.handle(req, res);
        }
    }
    handleUpgrade(wss, req, sock, head) {
        if (req.headers['upgrade'] !== 'websocket') {
            sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            return;
        }
        let cookies = (0, utils_1.parseCookies)(req.headers.cookie || "");
        if (!cookies) {
            sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            return;
        }
        let user = Users_1.default.get(cookies.utoken);
        if (user) {
            if (req.url == "/WsClient") {
                user.handleWebUpgrade(wss, req, sock, head, cookies);
            }
            else {
                user.handleDeviceUpgrade(req, sock, head, cookies);
            }
        }
        else {
            sock.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
    }
}
exports.default = APIHandler;
