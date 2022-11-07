import { createServer, IncomingMessage, ServerResponse } from "http";
import { WebSocket } from "ws";
import { Device } from "./api/device/Device";
import { Login } from "./api/login/Login";
import User from "./components/User";
import APIHandler from "./managers/APIHandler";
import Endpoint from "./managers/Endpoint";
import UsersCache from "./managers/Users";
import { Views } from "./managers/Views";

const port = 3000;
const wss = new WebSocket.Server({noServer: true});

const user = new User("IceZin", "123", "3f66092318698232381ab122efab14a5410a29a92ab7e1fdd52f58fb922869b26460bec7aade4440c9d87aa8f653e77e38de8957bdec2f952eeb0bd44dbaa62b");
UsersCache.register(user);

class TesteEndpoint extends Endpoint {
  @Views.SignedIn
  GET(req: IncomingMessage, res: ServerResponse, user: User) {
    res.statusCode = 200;
    res.end("You are authenticated nice!!")
  }
}

let apiHandler = new APIHandler();
apiHandler.register("/teste", new TesteEndpoint());
apiHandler.register("/login", new Login());
apiHandler.register("/device", new Device());

const httpserver = createServer((req, res) => {
  apiHandler.handleRequest(req, res);
});

httpserver.on('upgrade', (req, sock, head) => {
  apiHandler.handleUpgrade(wss, req, sock, head);
});

httpserver.listen(port, () => {
  console.log('> Ready on http://localhost:' + port)
});