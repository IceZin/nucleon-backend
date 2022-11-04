import Device from "./Device";
import Environment from "./Environment";
import Environments from "./Environments";
import Session from "./Session";
import UserActions from "./UserActions";
import WsManager from "./WsManager";

const { genAddress, genHex } = require("./utils/utils");

export default class User {
    private _password: string;
    private _username: string;
    private _devices: Map<string, Device> = new Map();
    private _environments: Environments = new Environments();
    private _actions: UserActions = new UserActions(this);
    private _sessions: Map<string, Session> = new Map();
    private _token: string;

    constructor(username: string, password: string, token: string) {
        this._username = username;
        this._password = password;
        this._token = token;

        this._environments.create("Desktop", new Environment("Desktop"));
    }

    checkLogin(username: string, pass: string) {
        return (this._username == username && this._password == pass);
    }

    registerDevice(device: Device) {
        let address = device.address;

        console.log("Registering device");

        if (!this._devices.has(address)) {
            this._devices.set(address, device);
            this._environments.get(device.environment.name)?.registerDevice(address, device);
        } else
            throw "A device with this address already exists";
    }

    unregisterDevice(address: string) {
        if (this._devices.has(address)) {
            let env = this._devices.get(address)?.environment.name;

            if (env) {
                this._environments.get(env)?.removeDevice(address);
            }

            this._devices.delete(address);
        }
    }

    getDevice(addr: string) {
       return this._devices.get(addr);
    }

    getDevices() {
        return this._devices
    }

    getEnvironmentDevices() {
        return this._environments.active?.getDevices();
    }

    getEnvironments() {
        return this._environments.getAll();
    }

    newSession() {
        let address = genHex(16);
        while (this._sessions.has(address)) address = genHex(16);

        let session = new Session(address);
        this._sessions.set(address, session)

        session.on("data", (data: any) => {
            this._actions.throw({
                session,
                ...data
            });
        })

        return address;
    }

    getSession(sessionAddress: string) {
        return this._sessions.get(sessionAddress);
    }

    broadcast(data: any) {
        Object.values(this._sessions).forEach(session => {
            session.ws.sendJSON(data);
        });
    }

    checkDevice(addr: string) {
        return this._devices.has(addr);
    }

    checkSession(id: string) {
        return this._sessions.has(id);
    }

    setSessionWs(id: string, ws: WsManager) {
        const session = this._sessions.get(id);
        if (!session) return;
        session?.setWs(ws);
    }
}

module.exports = User