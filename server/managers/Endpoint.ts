import { IncomingMessage, ServerResponse } from "http";
import { Views } from "./Views";

type Method = (req: IncomingMessage, res: ServerResponse) => void;

export default class Endpoint {
  handle(req: IncomingMessage, res: ServerResponse) {
    res.statusCode = 404;
    res.end();
  }

  @Views.SignedIn
  GET(req: IncomingMessage, res: ServerResponse) {
    return;
  }

  @Views.SignedInTest
  POST(req: string, res: string) {
    
  }
}