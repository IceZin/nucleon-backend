"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Endpoint {
    handle(req, res) {
        var _a;
        if (req.method) {
            let methodHandler = (_a = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), req.method)) === null || _a === void 0 ? void 0 : _a.value.bind(this);
            if (methodHandler) {
                methodHandler(req, res);
                return;
            }
        }
        res.statusCode = 404;
        res.end();
    }
}
exports.default = Endpoint;
