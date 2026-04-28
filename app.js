class VoiceGestureInstrument {
    constructor() {
        this.audioEngine = new AudioEngine();
        this.handTracker = null;
        this.renderer = null;

        this.isRunning = false;
        this.isDemoMode = false;
        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsTime = 0;

        this.canvas = document.getElementById('preview-canvas');
        this.videoElement = null;

        this.bindEvents();
        this.updateStatus('Ready to start');
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('demo-btn').addEventListener('click', () => this.toggleDemoMode());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetSmoothing());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' || e.key === 'R') {
                this.resetSmoothing();
            }
        });
    }

    async start() {
        try {
            this.updateStatus('Initializing...');

            // Initialize audio
            const audioReady = await this.audioEngine.initialize();
            if (!audioReady) {
                throw new Error('Failed to initialize audio');
            }

            // Create video element for camera feed
            this.videoElement = document.createElement('video');
            this.videoElement.style.display = 'none';
            document.body.appendChild(this.videoElement);

            // Initialize hand tracker
            this.handTracker = new HandTracker((results) => this.onHandResults(results));

            const handReady = await this.handTracker.initialize();
            if (!handReady) {
                throw new Error('Failed to initialize hand tracking');
            }

            // Initialize renderer
            this.renderer = new CyberRenderer(this.canvas);

            // Start hand tracking
            await this.handTracker.start();

            // Start audio
            this.audioEngine.start();

            this.isRunning = true;
            this.lastFpsTime = performance.now();
            this.updateStatus('Running');

            // Start render loop
            this.renderLoop();

        } catch (error) {
            console.error('Failed to start:', error);
            this.updateStatus(`Error: ${error.message}`);
        }
    }

    stop() {
        this.isRunning = false;

        if (this.handTracker) {
            this.handTracker.stop();
        }

        if (this.audioEngine) {
            this.audioEngine.stop();
        }

        this.updateStatus('Stopped');
    }

    toggleDemoMode() {
        this.isDemoMode = !this.isDemoMode;

        if (this.isDemoMode) {
            document.getElementById('demo-btn').textContent = 'NORMAL MODE';
            document.getElementById('demo-btn').style.background = 'var(--neon-pink)';
            this.updateStatus('Demo mode enabled - stronger smoothing');
        } else {
            document.getElementById('demo-btn').textContent = 'DEMO MODE';
            document.getElementById('demo-btn').style.background = 'var(--neon-orange)';
            this.updateStatus('Normal mode');
        }
    }

    resetSmoothing() {
        if (this.handTracker) {
            this.handTracker.resetSmoothing();
        }
        if (this.audioEngine) {
            this.audioEngine.resetSmoothing();
        }
        this.updateStatus('Smoothing reset');
    }

    onHandResults(results) {
        // This is called by MediaPipe when hand tracking results are available
        // The actual processing happens in the render loop
    }

    renderLoop() {
        if (!this.isRunning) return;

        this.frameCount++;

        // Get current hand observation
        const handObservation = this.handTracker ? this.handTracker.getObservation() : {
            hasHand: false,
            pinchDistance: 0,
            handHeight: 0
        };

        // Update audio based on hand gestures
        let audioLevels = { reverb: 0, harmony: 0, isActive: false };
        if (this.audioEngine) {
            if (handObservation.hasHand) {
                audioLevels = this.audioEngine.updateGestures(
                    handObservation.pinchDistance,
                    handObservation.handHeight
                );
            } else {
                // Fade to defaults when no hand
                audioLevels = this.audioEngine.updateGestures(0, 0);
            }
        }

        // Render frame
        if (this.renderer && this.videoElement) {
            this.renderer.render(this.videoElement, handObservation, audioLevels);
            this.renderer.updateHUDText(handObservation, audioLevels, Math.round(this.fps));
        }

        // Update FPS
        const now = performance.now();
        if (now - this.lastFpsTime >= 1000) {
            this.fps = (this.frameCount * 1000) / (now - this.lastFpsTime);
            this.frameCount = 0;
            this.lastFpsTime = now;
        }

        // Continue loop
        requestAnimationFrame(() => this.renderLoop());
    }

    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.innerHTML = `
                <span id="audio-status">AUDIO: ${this.audioEngine?.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                <span id="hand-status">HAND: ${this.handTracker?.isTracking ? 'TRACKING' : 'OFF'}</span>
                <span id="fps-display">FPS: ${Math.round(this.fps) || '--'}</span>
            `;
        }
        console.log('Status:', message);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const app = new VoiceGestureInstrument();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && app.isRunning) {
            app.stop();
        }
    });

    // Handle before unload
    window.addEventListener('beforeunload', () => {
        if (app.isRunning) {
            app.stop();
        }
    });
});