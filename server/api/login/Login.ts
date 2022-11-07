import { IncomingMessage, ServerResponse } from "http";
import { parseCookies } from "../../components/utils/utils";
import Endpoint from "../../managers/Endpoint";
import UsersCache from "../../managers/Users";
import { Views } from "../../managers/Views";

export class Login extends Endpoint {
  @Views.NoVerification
  POST(req: IncomingMessage, res: ServerResponse) {
    console.log(req.headers);

    if (req.headers.authorization) {
      let [username, password] = Buffer.from(req.headers.authorization.split(" ")[1], "base64")
        .toString()
        .split(":");
      
      let user = UsersCache.getByUsername(username);

      if (user) {
        if (user.checkLogin(username, password)) {
          res.statusCode = 200;
          res.setHeader("Set-Cookie", [
              `utoken=${user.token}; path=/;`,
              `sessionID=${user.newSession()}; path=/`
          ]);
          res.end();
  
          return;
        }
      }
    }

    res.statusCode = 401;
    res.end();
  }
}