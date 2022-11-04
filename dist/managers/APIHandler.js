"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _APIHandler_paths;
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
class APIHandler {
    constructor() {
        _APIHandler_paths.set(this, void 0);
        __classPrivateFieldSet(this, _APIHandler_paths, new Map(), "f");
    }
    register(url, endpoint, context) {
        if (__classPrivateFieldGet(this, _APIHandler_paths, "f").get(url) != undefined) {
            __classPrivateFieldGet(this, _APIHandler_paths, "f").set(url, {
                endpoint,
                context
            });
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
            let Path = __classPrivateFieldGet(this, _APIHandler_paths, "f").get(pathname);
            if (Path === null || Path === void 0 ? void 0 : Path.context(req, res)) {
                Path.endpoint.handle(req, res);
                return true;
            }
            else {
                res.statusCode = 401;
                res.end();
                return false;
            }
        }
        return false;
    }
}
exports.default = APIHandler;
_APIHandler_paths = new WeakMap();
