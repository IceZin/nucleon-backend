const Module = require("./Module");

class AddressableStrip extends Module {
    #color;
    #modes;

    constructor() {
        super();

        this.#color = [0, 0, 0];
        this.mode = "solid";

        this.#modes = {
            solid: {
                code: 0x0,
                parameters: {
                    intensity: {
                        code: 0x0,
                        value: 100,
                        min: 0,
                        max: 100
                    }
                }
            },
            fade: {
                code: 0x1,
                parameters: {
                    intensity: {
                        code: 0x0,
                        value: 100,
                        min: 0,
                        max: 100
                    }
                }
            },
            spectrum: {
                code: 0x2,
                parameters: {
                    animation: {
                        code: 0x0,
                        value: 0
                    },
                    colorType: {
                        code: 0x1,
                        value: 0
                    },
                    cometCutoff: {
                        code: 0x2,
                        value: 70,
                        min: 0,
                        max: 100
                    },
                    cometSize: {
                        code: 0x3,
                        value: 1,
                        min: 1,
                        max: 10
                    },
                    cometTailSize: {
                        code: 0x4,
                        value: 0,
                        min: 0,
                        max: 10
                    },
                    cometSpacing: {
                        code: 0x5,
                        value: 1,
                        min: 0,
                        max: 10
                    },
                    cometUpdateTime: {
                        code: 0x6,
                        value: 20,
                        min: 0,
                        max: 255
                    }
                }
            },
            chroma: {
                code: 0x3,
                parameters: {
                    intensity: {
                        code: 0x0,
                        value: 100,
                        min: 0,
                        max: 100
                    }
                }
            }
        }

        this.actions = {
            setColor: this.setColor.bind(this),
            setMode: this.setMode.bind(this),
            setParameter: this.setParameter.bind(this)
        }
    }

    syncColor(socket) {
        console.log("[ADDRESSABLE STRIP] Syncing Color");
        socket.sendBuffer([
            0x2, 0x0, ...this.#color
        ])
    }

    setColor(addr, socket, data) {
        if (data.color.length > 3) return;

        this.#color = data.color;

        this.syncColor(socket);

        this.broadcast([addr], {
            type: "setColor",
            data: {
                value: data.color
            }
        })
    }

    syncMode(socket) {
        console.log("[ADDRESSABLE STRIP] Syncing Mode");
        socket.sendBuffer([
            0x2, 0x1, this.#modes[this.mode].code
        ])
    }

    setMode(addr, socket, data) {
        let mode = data.mode;

        if (this.#modes[mode] == undefined) return;

        this.mode = mode;
        this.syncMode(socket);

        this.broadcast([addr], {
            type: "setMode",
            data: {
                value: mode
            }
        })
    }

    syncParameter(socket, param) {
        console.log("[ADDRESSABLE STRIP] Syncing Parameter");
        let parameter = this.#modes[this.mode].parameters[param];
        if (parameter == undefined) return;

        socket.sendBuffer([
            0x2, 0x2, parameter.code, parameter.value
        ])
    }

    setParameter(addr, socket, data) {
        let parameter = this.#modes[this.mode].parameters[data.parameter];
        if (parameter == undefined) return;

        this.#modes[this.mode].parameters[data.parameter].value = data.value;
        this.syncParameter(socket, data.parameter)

        this.broadcast([addr], {
            type: "setParameter",
            data: {
                parameter: data.parameter,
                value: data.value
            }
        })
    }

    syncSession(session) {
        session.sendJSON({
            type: "setColor",
            data: {
                value: this.#color
            }
        })

        session.sendJSON({
            type: "setMode",
            data: {
                value: this.mode
            }
        })

        session.sendJSON({
            type: "setParameters",
            data: {
                value: this.#modes[this.mode].parameters
            }
        })
    }

    syncDevice(socket) {
        console.log("[ADDRESSABLE STRIP] Syncing Device");

        this.syncColor(socket);
        this.syncMode(socket);

        Object.keys(this.#modes[this.mode].parameters).forEach(parameter => {
            this.syncParameter(socket, parameter);
        })
    }
}

module.exports = AddressableStrip;