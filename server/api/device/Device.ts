import { IncomingMessage, ServerResponse } from "http";
import User from "../../components/User";
import { parseCookies } from "../../components/utils/utils";
import Endpoint from "../../managers/Endpoint";
import UsersCache from "../../managers/Users";
import { Views } from "../../managers/Views";

export class Device extends Endpoint {
  @Views.SignedIn
  GET(req: IncomingMessage, res: ServerResponse, user: User) {
    console.log("Getting devices");
    console.log(user.getDevices().size);

    res.statusCode = 200;
    res.end(`${user.getDevices().size} Devices`);
  }
}