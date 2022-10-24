const AddressableStrip = require('./modules/AddressableStrip.js');
const Audio = require('./modules/Audio.js');
const DeviceSocket = require('./SockManager.js');

const modulesObj = {
    AddressableStrip,
    Audio
}

class Device {
    #user;
    #address;
    #name;
    #environment;
    #socket;
    #modules;
    #sessions;

    constructor(addr, name, environment, user) {
        this.connected = false;
        this.#address = addr;
        this.#name = name;
        this.#environment = environment;
        this.#socket = undefined;
        this.#user = user;

        this.#sessions = {};
        this.#modules = {}
    }

    handleConnection(socket, req, cookies) {
        if (!this.connected) {
            socket.write('HTTP/1.1 101 Switching Protocols\r\n\r\n');

            this.#socket = new DeviceSocket(socket, req, cookies);
            this.connected = true;
            
            if (Object.keys(this.#modules).length == 0) {
                cookies.modules.split(',').forEach((dvcModule) => {
                    this.#modules[dvcModule] = new modulesObj[dvcModule](this.#socket, "Teste");
                })
            }

            this.#user.broadcast({
                type: "deviceConnect",
                data: {
                    device: this.#address,
                    name: this.#name
                }
            })

            this.#socket.on("data", (packet) => {
                console.log(packet);

                if (packet[1] == 0x1) {
                    if (packet[2] == 0x0) {
                        let peak = packet.slice(2).reduce((a, b) => a + b);
                        this.#modules["Audio"]?.broadcast([], {
                            type: "setPeak",
                            data: {
                                value: peak
                            }
                        })
                    }
                }
            })

            this.#socket.on("error", (error) => {
                this.connected = false;
                this.#socket.clearCallbacks();
                this.#socket = undefined;
            })

            this.#socket.on("end", () => {
                this.connected = false;
                this.#socket.clearCallbacks();
                this.#socket = undefined;

                this.#user.broadcast({
                    type: "deviceDisconnect",
                    data: {
                        device: this.#address
                    }
                })
            })

            this.sync();
        } else {
            socket.write('HTTP/1.1 400 Not Authorized\r\n\r\n');
        }
    }

    get address() {
        return this.#address;
    }

    get name() {
        return this.#name;
    }

    get environment() {
        return this.#environment;
    }

    get cookies() {
        if (!this.connected) return {};
        return this.#socket.cookies;
    }

    get modules() {
        return Object.keys(this.#modules);
    }

    sync() {
        Object.values(this.#modules).forEach(mod => {
            mod.syncDevice(this.#socket);
        })
    }

    registerSession(addr, ws) {
        if (this.#sessions[addr] != undefined) return;

        console.log(`[DEVICE] New session registered ${addr}`);
        console.log(Object.keys(this.#sessions));

        this.#sessions[addr] = {
            ws
        };
    }

    setSessionModule(addr, mod) {
        if (this.#sessions[addr].module != undefined) {
            let oldMod = this.#sessions[addr].module;
            this.#modules[oldMod].removeSession(addr);
        }

        let modObj = this.#modules[mod];

        console.log(`[DEVICE] Setting session ${addr} module to ${mod}`);

        if (modObj != undefined) {
            this.#sessions[addr].module = mod;

            modObj.addSession(addr, this.#sessions[addr].ws);
            modObj.syncSession(this.#sessions[addr].ws);

            console.log("Syncing session");
        }
    }

    deleteSession(addr) {
        if (this.#sessions[addr] == undefined) return;

        if (this.#sessions[addr].module != undefined) {
            let mod = this.#sessions[addr].module;
            this.#modules[mod].removeSession(addr);
        }

        console.log(`[DEVICE] Removing session ${addr}`);

        delete this.#sessions[addr];
    }

    broadcast(data) {
        Object.values(this.#sessions).forEach(session => {
            session.ws.sendJSON(data);
        })
    }

    handleData(sessionAddr, data) {
        if (!this.connected) return;

        let mod = this.#sessions[sessionAddr].module;

        console.log(`[DEVICE] Handling data from session ${sessionAddr}`);
        console.log(`[DEVICE] Module: ${mod}`);

        if (this.#modules[mod] != undefined) {
            this.#modules[mod].handleAction(sessionAddr, this.#socket, data.params);
        }
    }

    update() {
        console.log("Updating device first try")
        this.#socket?.update("./server/arduino/Proton.ino.esp32.bin");
    }
}

module.exports = Device;