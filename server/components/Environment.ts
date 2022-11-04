import Device from "./Device";

export default class Environment {
  #devices: Map<string, Device>;
  name: string;

  constructor(name: string) {
    this.name = name;
    this.#devices = new Map<string, Device>();
  }

  registerDevice(deviceAddress: string, device: Device) {
    if (!this.#devices.has(deviceAddress)) {
      this.#devices.set(deviceAddress, device);
    }
  }

  removeDevice(deviceAddress: string) {
    if (this.#devices.has(deviceAddress)) {
      this.#devices.delete(deviceAddress);
    }
  }

  getDevices() {
    let devices = new Map<string, string>();
    this.#devices.forEach((device) => {
      devices.set(device.address, device.name);
    })
    return devices;
  }
}