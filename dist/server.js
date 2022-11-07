"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const ws_1 = require("ws");
const Device_1 = require("./api/device/Device");
const Login_1 = require("./api/login/Login");
const User_1 = __importDefault(require("./components/User"));
const APIHandler_1 = __importDefault(require("./managers/APIHandler"));
const Endpoint_1 = __importDefault(require("./managers/Endpoint"));
const Users_1 = __importDefault(require("./managers/Users"));
const Views_1 = require("./managers/Views");
const port = 3000;
const wss = new ws_1.WebSocket.Server({ noServer: true });
const user = new User_1.default("IceZin", "123", "3f66092318698232381ab122efab14a5410a29a92ab7e1fdd52f58fb922869b26460bec7aade4440c9d87aa8f653e77e38de8957bdec2f952eeb0bd44dbaa62b");
Users_1.default.register(user);
class TesteEndpoint extends Endpoint_1.default {
    GET(req, res, user) {
        res.statusCode = 200;
        res.end("You are authenticated nice!!");
    }
}
__decorate([
    Views_1.Views.SignedIn
], TesteEndpoint.prototype, "GET", null);
let apiHandler = new APIHandler_1.default();
apiHandler.register("/teste", new TesteEndpoint());
apiHandler.register("/login", new Login_1.Login());
apiHandler.register("/device", new Device_1.Device());
const httpserver = (0, http_1.createServer)((req, res) => {
    apiHandler.handleRequest(req, res);
});
httpserver.on('upgrade', (req, sock, head) => {
    apiHandler.handleUpgrade(wss, req, sock, head);
});
httpserver.listen(port, () => {
    console.log('> Ready on http://localhost:' + port);
});
