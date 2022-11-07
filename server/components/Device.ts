import { IncomingMessage } from "http";
import internal from "stream";
import Environment from "./Environment";
import AddressableStrip from "./modules/AddressableStrip";
import Audio from "./modules/Audio";
import Session from "./Session";
import Socket from "./Socket";
import User from "./User";

const modulesObj: {[key: string]: typeof AddressableStrip | typeof Audio} = {
    AddressableStrip,
    Audio
}

export default class Device {
    private connected: boolean = false;
    private user: User;
    private _address: string;
    private _name: string;
    private _environment: Environment | undefined;
    private _socket: Socket | undefined;
    private _modules: Map<string, AddressableStrip | Audio> = new Map();
    private _sessions: Map<string, Session> = new Map();

    constructor(address: string, name: string, environment: Environment | undefined, user: User) {
        this.user = user;
        this._address = address;
        this._name = name;
        this._environment = environment;
    }

    handleConnection(socket: internal.Duplex, req: IncomingMessage, cookies: {[key: string]: string}) {
        if (!this.connected) {
            socket.write('HTTP/1.1 101 Switching Protocols\r\n\r\n');

            this._socket = new Socket(socket, req, cookies);
            this.connected = true;
            
            if (Object.keys(this._modules).length == 0) {
                cookies.modules.split(',').forEach((dvcModule: string) => {
                    this._modules.set(dvcModule, new modulesObj[dvcModule]());
                })
            }

            this.user.broadcast({
                type: "deviceConnect",
                data: {
                    device: this._address,
                    name: this._name
                }
            })

            this._socket?.on("data", (packet: any) => {
                console.log(packet);

                if (packet[1] == 0x1) {
                    if (packet[2] == 0x0) {
                        let peak = packet.slice(2).reduce((a: number, b: number) => a + b);
                        this._modules.get("Audio")?.broadcast([], {
                            type: "setPeak",
                            data: {
                                value: peak
                            }
                        })
                    }
                }
            })

            this._socket?.on("error", (error: any) => {
                this.connected = false;
                this._socket?.clearCallbacks();
                this._socket = undefined;
            })

            this._socket?.on("end", () => {
                this.connected = false;
                this._socket?.clearCallbacks();
                this._socket = undefined;

                this.user.broadcast({
                    type: "deviceDisconnect",
                    data: {
                        device: this._address
                    }
                })
            })

            this.sync();
        } else {
            socket.write('HTTP/1.1 400 Not Authorized\r\n\r\n');
        }
    }

    get address() {
        return this._address;
    }

    get name() {
        return this._name;
    }

    get environment() {
        return this._environment;
    }

    get cookies() {
        if (!this.connected) return {};
        return this._socket?.cookies;
    }

    get modules() {
        return Object.keys(this._modules);
    }

    getModule(moduleAddress: string) {
        return this._modules.get(moduleAddress);
    }

    sync() {
        Object.values(this._modules).forEach(mod => {
            mod.syncDevice(this._socket);
        })
    }

    registerSession(session: Session) {
        if (this._sessions.has(session.address)) return;

        console.log(`[DEVICE] New session registered ${session.address}`);
        console.log(Object.keys(this._sessions));

        this._sessions.set(session.address, session);
    }

    deleteSession(session: Session) {
        if (!this._sessions.has(session.address)) return;

        if (this._sessions.get(session.address)?.module) {
            let _module = this._sessions.get(session.address)?.module;
            _module?.removeSession(session);
        }

        console.log(`[DEVICE] Removing session ${session.address}`);

        this._sessions.delete(session.address);
    }

    broadcast(data: any) {
        this._sessions.forEach(session => {
            session.send(data);
        })
    }

    handleData(session: Session, data: any) {
        if (!this.connected) return;
        if (!this._sessions.has(session.address)) return;

        let _module = session.module;

        console.log(`[DEVICE] Handling data from session ${session.address}`);
        console.log(`[DEVICE] Module: ${_module?.name}`);

        if (session.module && this._socket) {
            session.module.handleAction(session, this._socket, data.params);
        }
    }

    update() {
        console.log("Updating device first try")
        this._socket?.update("./server/arduino/Proton.ino.esp32.bin");
    }
}
