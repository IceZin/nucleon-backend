export type N_Spectrum = {
    LED: {
        byte: 1,
        parameters: {
            state: {
                byte: 0,
                value: boolean
            },
            mode: {
                byte: 1,
                value: number
            },
            color: {
                byte: 2,
                value: [number, number, number]
            },
            intensity: {
                byte: 3,
                value: number
            },
            spectrumDecay: {
                byte: 4,
                value: number
            },
            spectrumCutoff: {
                byte: 5,
                value: number
            },
            spectrumMaxIntensity: {
                byte: 6,
                value: number
            },
            spectrumAnimation: {
                byte: 7,
                value: number
            }
        }
    }
}