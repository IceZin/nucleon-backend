import { IncomingMessage, ServerResponse } from "http";
import User from "../components/User";
import { parseCookies } from "../components/utils/utils";
import UsersCache from "./Users";

type SignedInMethodHandler = (req: IncomingMessage, res: ServerResponse, user: User) => void;
type NoVerificationMethodHandler = (req: IncomingMessage, res: ServerResponse) => void;
type Args = [req: IncomingMessage, res: ServerResponse];

export namespace Views {
  export function SignedIn(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<SignedInMethodHandler>) {
    let method = descriptor.value!;

    descriptor.value = function () {
      let args: Args = Object.values(arguments) as Args;
      const cookies = parseCookies(args[0].headers.cookie || "");
      let user = UsersCache.get(cookies.utoken);

      if (user) {
        if (user.checkSession(cookies.sessionID)) {
          return method.apply(this, [...args, user]);
        }
      }

      args[1].statusCode = 401;
      args[1].end();
    };
  }

  export function Admin(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<SignedInMethodHandler>) {
    return true;
  }

  export function NoVerification(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<NoVerificationMethodHandler>) {
    let method = descriptor.value!;

    descriptor.value = function () {
      let args: Args = Object.values(arguments) as Args;
      return method.apply(this, args);
    };
  }
}