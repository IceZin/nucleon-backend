import { IncomingMessage } from "http";
import User from "../components/User";
import { parseCookies } from "../components/utils/utils";

class Users {
  private _users: Map<string, User> = new Map();
  
  register(user: User) {
    if (!this._users.has(user.token)) {
      this._users.set(user.token, user);
    }
  }

  get(userToken: string) {
    return this._users.get(userToken);
  }

  getByUsername(username: string) {
    for (const [_, val] of this._users) {
      if (val.username === username) return val;
    }
  }

  getByReq(req: IncomingMessage) {
    if (req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      const userToken = cookies.utoken;

      if (userToken) {
        return this._users.get(userToken);
      }
    }
    
    return undefined;
  }
}

const UsersCache = new Users();
export default UsersCache;