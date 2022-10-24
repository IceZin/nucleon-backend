import { IncomingMessage, ServerResponse } from "http";

type MethodHandler = (req: IncomingMessage, res: ServerResponse) => void;

export namespace Views {
  export function SignedIn(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<MethodHandler>) {
    console.log(target);
    console.log(propertyName);
    console.log(descriptor);
  }

  export function Admin(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<MethodHandler>) {
    return true;
  }

  export function NoVerification(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<MethodHandler>) {
    return true;
  }
}