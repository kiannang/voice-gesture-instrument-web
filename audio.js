class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.gainNode = null;
        this.reverbNode = null;
        this.harmonyNode = null;
        this.isInitialized = false;
        this.isActive = false;

        // Audio parameters
        this.reverbLevel = 0.0;
        this.harmonyMix = 0.0;
        this.safeGain = 0.8;

        // Smoothing
        this.reverbSmoother = new ExponentialSmoother(0.9, 0.0);
        this.harmonySmoother = new ExponentialSmoother(0.9, 0.0);
    }

    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 48000
                }
            });

            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(stream);

            // Create analyser for monitoring
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            // Create gain node for master volume
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = this.safeGain;

            // Create reverb effect
            this.reverbNode = this.createReverb();

            // Create harmony effect (simple delay-based chorus)
            this.harmonyNode = this.createHarmony();

            // Connect the audio graph
            this.microphone.connect(this.analyser);
            this.analyser.connect(this.reverbNode.input);
            this.reverbNode.connect(this.harmonyNode.input);
            this.harmonyNode.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);

            this.isInitialized = true;
            console.log('Audio engine initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            return false;
        }
    }

    createReverb() {
        const reverb = {
            input: this.audioContext.createGain(),
            output: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain(),
            dryGain: this.audioContext.createGain(),
            convolver: this.audioContext.createConvolver()
        };

        // Create impulse response for reverb
        const length = this.audioContext.sampleRate * 2; // 2 seconds
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Simple reverb impulse
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.1;
            }
        }

        reverb.convolver.buffer = impulse;

        // Connect reverb graph
        reverb.input.connect(reverb.dryGain);
        reverb.input.connect(reverb.convolver);
        reverb.convolver.connect(reverb.wetGain);
        reverb.dryGain.connect(reverb.output);
        reverb.wetGain.connect(reverb.output);

        reverb.wetGain.gain.value = 0;

        return reverb;
    }

    createHarmony() {
        const harmony = {
            input: this.audioContext.createGain(),
            output: this.audioContext.createGain(),
            wetGain: this.audioContext.createGain(),
            dryGain: this.audioContext.createGain(),
            delay1: this.audioContext.createDelay(),
            delay2: this.audioContext.createDelay()
        };

        // Simple chorus effect for harmony simulation
        harmony.delay1.delayTime.value = 0.015; // 15ms
        harmony.delay2.delayTime.value = 0.020; // 20ms

        // Connect harmony graph
        harmony.input.connect(harmony.dryGain);
        harmony.input.connect(harmony.delay1);
        harmony.input.connect(harmony.delay2);
        harmony.delay1.connect(harmony.wetGain);
        harmony.delay2.connect(harmony.wetGain);
        harmony.dryGain.connect(harmony.output);
        harmony.wetGain.connect(harmony.output);

        harmony.wetGain.gain.value = 0;

        return harmony;
    }

    start() {
        if (!this.isInitialized || this.isActive) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isActive = true;
        console.log('Audio engine started');
    }

    stop() {
        if (!this.isActive) return;

        this.isActive = false;
        if (this.gainNode) {
            this.gainNode.gain.value = 0;
        }
        console.log('Audio engine stopped');
    }

    setReverbLevel(level) {
        this.reverbLevel = Math.max(0, Math.min(1, level));
        if (this.reverbNode) {
            this.reverbNode.wetGain.gain.value = this.reverbLevel * 0.3; // Scale down for safety
        }
    }

    setHarmonyMix(mix) {
        this.harmonyMix = Math.max(0, Math.min(1, mix));
        if (this.harmonyNode) {
            this.harmonyNode.wetGain.gain.value = this.harmonyMix * 0.2; // Scale down for safety
        }
    }

    updateGestures(pinchDistance, handHeight) {
        // Normalize pinch distance (0.03 to 0.25 range)
        const pinchNorm = Math.max(0, Math.min(1, (pinchDistance - 0.03) / (0.25 - 0.03)));
        const smoothReverb = this.reverbSmoother.update(pinchNorm);
        this.setReverbLevel(smoothReverb);

        // Normalize hand height (0.35 to 0.8 range)
        const heightNorm = Math.max(0, Math.min(1, (handHeight - 0.35) / (0.45)));
        const smoothHarmony = this.harmonySmoother.update(heightNorm);
        this.setHarmonyMix(smoothHarmony);

        return {
            reverb: smoothReverb,
            harmony: smoothHarmony,
            rawPinch: pinchDistance,
            rawHeight: handHeight
        };
    }

    resetSmoothing() {
        this.reverbSmoother.reset(0.0);
        this.harmonySmoother.reset(0.0);
        this.setReverbLevel(0.0);
        this.setHarmonyMix(0.0);
    }

    getLevels() {
        return {
            reverb: this.reverbLevel,
            harmony: this.harmonyMix,
            isActive: this.isActive
        };
    }

    getFrequencyData() {
        if (!this.analyser) return new Uint8Array(0);
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }
}

class ExponentialSmoother {
    constructor(alpha, initialValue = 0) {
        this.alpha = alpha;
        this.value = initialValue;
    }

    update(currentValue) {
        if (this.value === null) {
            this.value = currentValue;
        } else {
            this.value = this.alpha * this.value + (1 - this.alpha) * currentValue;
        }
        return this.value;
    }

    reset(value = null) {
        this.value = value;
    }
}