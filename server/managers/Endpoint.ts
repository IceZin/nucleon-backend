import { IncomingMessage, ServerResponse } from "http";
import { Views } from "./Views";

type Method = (req: IncomingMessage, res: ServerResponse) => void;

export default class Endpoint {
  handle(req: IncomingMessage, res: ServerResponse) {
    if (req.method) {
      let methodHandler = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(this), req.method
      )?.value.bind(this);

      if (methodHandler) {
        methodHandler(req, res);
        return;
      }
    }

    res.statusCode = 404;
    res.end();
  }
}