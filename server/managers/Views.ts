import { IncomingMessage, ServerResponse } from "http";

type MethodHandler = (req: IncomingMessage, res: ServerResponse) => void;
type Args = [req: IncomingMessage, res: ServerResponse];
type TestMethodHandler = (req: string, res: string) => void;

export namespace Views {
  export function SignedIn(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<MethodHandler>) {
    let method = descriptor.value!;

    descriptor.value = function () {
      let args: Args = Object.values(arguments) as Args;
      console.log(args[0].)
      return method.apply(this, args);
    };
  }

  export function SignedInTest(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<TestMethodHandler>) {
    console.log(target);
    console.log(propertyName);
    console.log(descriptor);
    console.log(descriptor.value!)

    let method = descriptor.value!;

    descriptor.value = function () {
      let args: [req: string, res: string] = Object.values(arguments) as [req: string, res: string];
      console.log(args);
      args.forEach((arg) => {
        if (arg == "Mascaico") console.log("Olha meus irmaunnsss");
        else console.log(arg);
      })
      return method.apply(this, args);
    };
  }

  export function Admin(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<MethodHandler>) {
    return true;
  }

  export function NoVerification(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<MethodHandler>) {
    return true;
  }
}