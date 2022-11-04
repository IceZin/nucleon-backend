import Device from "./Device";
import AddressableStrip from "./modules/AddressableStrip";
import Audio from "./modules/Audio";
import Module from "./modules/Module";
import WsManager from "./WsManager";

export default class Session {
  private _address: string;
  private _ws: WsManager | undefined;
  private _events: Map<string, (data: any | undefined) => void> = new Map();
  private _device: Device | undefined;
  private _module: AddressableStrip | Audio | undefined;

  constructor(address: string) {
    this._address = address;
  }

  send(data: any) {
    this._ws?.sendJSON(data);
  }

  on(event: string, fn: (data: any) => void) {
    if (!this._events.has(event)) {
      this._events.set(event, fn);
    }
  }

  setWs(ws: WsManager) {
    if (!this._ws) {
      this._ws = ws;

      ws.on("data", (data: any) => this._events.get("data")?.({
        ...data, sessionAddress: this._address
      }));
      ws.on("end", () => {
        this._events.get("end")?.(undefined);
        this._ws = undefined;
      });
    }
  }

  setDevice(device: Device | undefined) {
    if (this._device) {
      this._device.deleteSession(this);
    }
    
    if (device) {
      device.registerSession(this);
    }

    this._device = device;
  }

  get device() {
    return this._device;
  }

  get address() {
    return this._address;
  }

  setModule(_module: AddressableStrip | Audio | undefined) {
    if (_module) {
      _module.addSession(this);
      _module.syncSession(this);
    }

    this._module = _module;
  }

  get module() {
    return this._module;
  }
}