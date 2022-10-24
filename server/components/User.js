const { genAddress, genHex } = require("./utils/utils");

class User {
    #pass;
    #username;
    #devices;
    #environments;
    #environment;
    #channels;
    #sessions;

    constructor(username, pass, token) {
        this.#username = username;
        this.#pass = pass;
        this.token = token;

        this.#channels = {
            home: [],
            light: [],
            audio: []
        }
        this.#sessions = {};
        this.#devices = {};
        this.#environments = {
            "Desktop": {
                name: "Desktop",
                devices: 2,
                peoples: 12
            },
            "Marreco": {
                name: "Marreco",
                devices: 2,
                peoples: 12
            }
        };
    }

    checkLogin(username, pass) {
        return (this.#username == username && this.#pass == pass);
    }

    registerDevice(dvc) {
        let addr = dvc.address;

        console.log("Registering device");

        if (this.#devices[addr] == null)
            this.#devices[addr] = dvc;
            let environment = dvc.environment;

            console.log("Device null");

            if (environment != undefined) {
                console.log("Registered");
                this.#environments[environment][addr] = dvc;
            }
        else
            throw "A device with this address already exists";
    }

    unregisterDevice(addr) {
        if (this.#devices[addr] != null) {
            let env = this.#devices[addr].environment;

            if (env != null) {
                delete this.#environments[env][addr]
            }

            delete this.#devices[addr];
        }
    }

    getDevice(addr) {
        if (this.#devices[addr] != null)
            return this.#devices[addr];
    }

    getDevices() {
        return this.#devices
    }

    getEnvironmentDevices() {
        console.log(this.#environments);
        console.log(this.#environments[this.#environment]);
        let devices = {};
        Object.values(this.#devices).forEach((dvc) => {
            console.log(`\n\n DEVICE ${dvc.name} ${dvc.environment}\n\n`)
            if (dvc.environment == this.#environment) {
                devices[dvc.address] = {
                    name: dvc.name,
                    modules: dvc.modules
                };
            }
        });
        console.log(devices)
        return devices;
    }

    getEnvironments() {
        return this.#environments;
    }

    newSession() {
        let addr = genHex(16);
        while (this.#sessions[addr] != undefined) addr = genHex(16);

        this.#sessions[addr] = {
            ws: undefined,
            channel: undefined
        };

        return addr;
    }

    broadcast(data) {
        Object.values(this.#sessions).forEach(session => {
            session.ws.sendJSON(data);
        });
    }

    checkDevice(addr) {
        return this.#devices[addr] != undefined;
    }

    checkSession(id) {
        return this.#sessions[id] != undefined;
    }

    setSessionWs(id, ws) {
        if (this.#sessions[id] == undefined) return;
        //if (this.#sessions[id].ws != undefined) return;

        this.#sessions[id].ws = ws;

        let actions = {
            setChannel: (data) => {
                if (this.#channels[data.channel] == undefined) return;

                let oldChannel = this.#sessions[id].channel;

                if (oldChannel != undefined) {
                    let sessionIndex = this.#channels[oldChannel].indexOf(id);
                    this.#channels[oldChannel].splice(sessionIndex, 1);
                }

                this.#sessions[id].channel = data.channel;
                this.#channels[data.channel].push(id);
            },
            setEnvironment: (data) => {
                console.log("Setting environment");
                console.log(data);
                this.#environment = data.environment;
            },
            setDevice: (data) => {
                this.setSessionDevice(id, this.#devices[data.device])
            },
            setModule: (data) => {
                let device = this.#sessions[id].device;

                if (device != undefined) {
                    device.setSessionModule(id, data.module);
                }
            },
            deviceControl: (data) => {
                let device = this.#sessions[id].device;

                if (device != undefined) {
                    device.handleData(id, data);
                }
            }
        }

        ws.on("data", (data) => {
            console.log(data);
            actions[data.type]?.(data.data);
        })

        ws.on("end", () => {
            //this.endSession(id);
        })
    }

    setSessionDevice(addr, device) {
        let session = this.#sessions[addr];

        if (session.device != undefined) {
            session.device.deleteSession(addr);
        }

        if (device != undefined) {
            this.#sessions[addr].device = device;
            device.registerSession(addr, session.ws);
        } else {
            this.#sessions[addr].device = undefined;
        }
    }

    endSession(addr) {
        let session = this.#sessions[addr];
        if (session == undefined) return;

        let channel = session.channel;

        if (channel != undefined) {
            let sessionIndex = this.#channels[channel].indexOf(addr);
            this.#channels[channel].splice(sessionIndex, 1);
        }

        delete this.#sessions[addr];
    }
}

module.exports = User