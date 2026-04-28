class HandTracker {
    constructor(onResultsCallback) {
        this.hands = null;
        this.camera = null;
        this.isInitialized = false;
        this.isTracking = false;
        this.onResults = onResultsCallback;

        // Hand tracking state
        this.currentHand = null;
        this.lastHandTime = 0;
        this.handTimeout = 2000; // 2 seconds

        // Gesture smoothing
        this.pinchSmoother = new ExponentialSmoother(0.8, 0.0);
        this.heightSmoother = new ExponentialSmoother(0.8, 0.0);
    }

    async initialize() {
        try {
            // Initialize MediaPipe Hands
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 0,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results) => this.onResultsCallback(results));

            // Initialize camera
            this.camera = new Camera(document.getElementById('preview-canvas'), {
                onFrame: async () => {
                    if (this.hands && this.isTracking) {
                        await this.hands.send({image: document.getElementById('preview-canvas')});
                    }
                },
                width: 640,
                height: 360
            });

            this.isInitialized = true;
            console.log('Hand tracker initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize hand tracker:', error);
            return false;
        }
    }

    async start() {
        if (!this.isInitialized) return false;

        try {
            await this.camera.start();
            this.isTracking = true;
            console.log('Hand tracking started');
            return true;
        } catch (error) {
            console.error('Failed to start hand tracking:', error);
            return false;
        }
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
        }
        this.isTracking = false;
        this.currentHand = null;
        console.log('Hand tracking stopped');
    }

    onResultsCallback(results) {
        const now = Date.now();

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const handedness = results.multiHandedness[0].label;

            // Calculate hand metrics
            const metrics = this.calculateHandMetrics(landmarks);

            this.currentHand = {
                landmarks: landmarks,
                handedness: handedness,
                pinchDistance: metrics.pinchDistance,
                handHeight: metrics.handHeight,
                handCenterX: metrics.handCenterX,
                timestamp: now
            };

            this.lastHandTime = now;
        } else {
            // Check if hand has been lost
            if (now - this.lastHandTime > this.handTimeout) {
                this.currentHand = null;
            }
        }

        // Call the results callback
        if (this.onResults) {
            this.onResults(this.getObservation());
        }
    }

    calculateHandMetrics(landmarks) {
        const thumbTip = landmarks[4]; // THUMB_TIP
        const indexTip = landmarks[8]; // INDEX_FINGER_TIP

        // Calculate pinch distance
        const pinchDistance = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) +
            Math.pow(indexTip.y - thumbTip.y, 2)
        );

        // Calculate hand center and height
        let sumX = 0, sumY = 0;
        for (const landmark of landmarks) {
            sumX += landmark.x;
            sumY += landmark.y;
        }
        const handCenterX = sumX / landmarks.length;
        const avgY = sumY / landmarks.length;
        const handHeight = 1.0 - avgY; // Flip Y coordinate

        return {
            pinchDistance: pinchDistance,
            handHeight: handHeight,
            handCenterX: handCenterX
        };
    }

    getObservation() {
        const hasHand = this.currentHand !== null;

        return {
            hasHand: hasHand,
            hand: this.currentHand,
            pinchDistance: hasHand ? this.currentHand.pinchDistance : 0.0,
            handHeight: hasHand ? this.currentHand.handHeight : 0.0,
            handedness: hasHand ? this.currentHand.handedness : null
        };
    }

    resetSmoothing() {
        this.pinchSmoother.reset(0.0);
        this.heightSmoother.reset(0.0);
    }

    getSmoothedGestures() {
        const observation = this.getObservation();

        const smoothPinch = this.pinchSmoother.update(observation.pinchDistance);
        const smoothHeight = this.heightSmoother.update(observation.handHeight);

        return {
            pinch: smoothPinch,
            height: smoothHeight,
            rawPinch: observation.pinchDistance,
            rawHeight: observation.handHeight
        };
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