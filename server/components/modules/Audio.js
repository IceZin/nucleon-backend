const Module = require("./Module");

class Audio extends Module {
    #modes;

    constructor() {
        super();

        this.mode = "audio";

        this.#modes = {
            audio: {
                code: 0x3,
                parameters: {
                    cutoff: {
                        code: 0x0,
                        value: 0
                    },
                    decay: {
                        code: 0x1,
                        value: 50
                    },
                    maxIntensity: {
                        code: 0x2,
                        value: 100
                    },
                    minFrequency: {
                        code: 0x3,
                        value: 3
                    },
                    maxFrequency: {
                        code: 0x4,
                        value: 5
                    },
                    broadcastData: {
                        code: 0x5,
                        value: 0
                    }
                }
            }
        }

        this.actions = {
            setParameter: this.setParameter.bind(this)
        }
    }

    syncParameter(socket, param) {
        let parameter = this.#modes[this.mode].parameters[param];
        if (parameter == undefined) return;

        socket.sendBuffer([
            0x2, 0x3, parameter.code, parameter.value
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
            type: "setParameters",
            data: {
                value: this.#modes[this.mode].parameters
            }
        })
    }

    syncDevice(socket) {
        Object.keys(this.#modes[this.mode].parameters).forEach(parameter => {
            this.syncParameter(socket, parameter);
        })
    }
}

module.exports = Audio;