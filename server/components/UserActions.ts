import Session from "./Session";
import User from "./User";

type EnvironmetData = { environment: string }

type Data = {
  session: Session;
  event: string;
  data: any;
}

export default class UserActions {
  #environment: string | undefined;
  #user: User;

  constructor(user: User) {
    this.#user = user;
  }

  throw(data: Data) {
    Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(this), data.event
    )?.value.bind(this)(data);
  }

  setEnvironment(data: EnvironmetData) {
    console.log("Setting environment");
    console.log(data);
    this.#environment = data.environment;
  }

  get environment() {
    return this.#environment;
  }

  setDevice(ctx: Data) {
    let session = ctx.session;
    if (!session) return;

    if (ctx.data.deviceAddress) {
      let device = this.#user.getDevice(ctx.data.deviceAddress);
      if (!device) return;

      session.setDevice(device);
    } else {
      session.setDevice(undefined);
    }
  }

  setModule(ctx: Data) {
    let device = this.#user.getSession(ctx.data.id)?.device;
    let _module = device?.getModule(ctx.data.module);

    if (_module) {
      ctx.session.setModule(_module);
    } else {
      ctx.session.setModule(undefined);
    }
  }

  deviceControl(ctx: Data) {
    let device = ctx.data.session.device;

    if (device) {
      device.handleData(ctx.data.session, ctx.data);
    }
  }
}