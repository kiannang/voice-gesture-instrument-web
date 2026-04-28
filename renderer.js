class CyberRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Animation state
        this.frameCount = 0;
        this.trailPoints = [];
        this.maxTrailPoints = 15;

        // Colors
        this.colors = {
            neonBlue: '#00ffff',
            neonCyan: '#30ffff',
            neonGreen: '#30ff90',
            neonOrange: '#ff8c30',
            neonPink: '#ff30a0',
            darkBg: '#0a0e14',
            textPrimary: '#e0f0ff',
            textSecondary: '#a0c0d0'
        };
    }

    render(videoFrame, handObservation, audioLevels) {
        this.frameCount++;

        // Clear canvas
        this.ctx.fillStyle = this.colors.darkBg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw video frame with darkening effect
        if (videoFrame) {
            this.ctx.globalAlpha = 0.7;
            this.ctx.drawImage(videoFrame, 0, 0, this.width, this.height);
            this.ctx.globalAlpha = 1.0;
        }

        // Draw hand skeleton and trails
        if (handObservation.hasHand && handObservation.hand) {
            this.drawHandSkeleton(handObservation.hand.landmarks);
            this.updateTrails(handObservation.hand.landmarks);
        }

        this.drawTrails();

        // Draw HUD elements
        this.drawHUD(handObservation, audioLevels);

        // Draw scanlines effect
        this.drawScanlines();
    }

    drawHandSkeleton(landmarks) {
        if (!landmarks) return;

        // Define hand connections (same as Python version)
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
        ];

        // Draw connections with glow
        this.ctx.strokeStyle = this.colors.neonCyan;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = this.colors.neonCyan;
        this.ctx.shadowBlur = 5;

        connections.forEach(([start, end]) => {
            const startPoint = this.landmarkToCanvas(landmarks[start]);
            const endPoint = this.landmarkToCanvas(landmarks[end]);

            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x, startPoint.y);
            this.ctx.lineTo(endPoint.x, endPoint.y);
            this.ctx.stroke();
        });

        // Draw landmarks
        this.ctx.shadowBlur = 0;
        landmarks.forEach((landmark, index) => {
            const point = this.landmarkToCanvas(landmark);
            let color = this.colors.neonBlue;
            let radius = 4;

            if (index === 4) { // Thumb tip
                color = this.colors.neonPink;
                radius = 6;
            } else if (index === 8) { // Index tip
                color = this.colors.neonGreen;
                radius = 6;
            } else if (index === 0) { // Wrist
                color = this.colors.neonOrange;
                radius = 6;
            }

            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw pinch line
        if (landmarks[4] && landmarks[8]) {
            const thumb = this.landmarkToCanvas(landmarks[4]);
            const index = this.landmarkToCanvas(landmarks[8]);

            this.ctx.strokeStyle = this.colors.neonCyan;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(thumb.x, thumb.y);
            this.ctx.lineTo(index.x, index.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    updateTrails(landmarks) {
        if (!landmarks || !landmarks[8]) return; // Need index tip

        const indexTip = this.landmarkToCanvas(landmarks[8]);
        this.trailPoints.push({
            x: indexTip.x,
            y: indexTip.y,
            age: 0
        });

        // Remove old points
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.shift();
        }

        // Age existing points
        this.trailPoints.forEach(point => point.age++);
    }

    drawTrails() {
        if (this.trailPoints.length < 2) return;

        this.ctx.strokeStyle = this.colors.neonBlue;
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = this.colors.neonBlue;
        this.ctx.shadowBlur = 3;

        for (let i = 1; i < this.trailPoints.length; i++) {
            const current = this.trailPoints[i];
            const previous = this.trailPoints[i - 1];

            const alpha = 1 - (current.age / this.maxTrailPoints);
            this.ctx.globalAlpha = alpha * 0.6;

            this.ctx.beginPath();
            this.ctx.moveTo(previous.x, previous.y);
            this.ctx.lineTo(current.x, current.y);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
    }

    drawHUD(handObservation, audioLevels) {
        // Draw corner panels
        this.drawPanel(10, 10, 300, 120); // Top left
        this.drawPanel(this.width - 310, 10, 300, 120); // Top right

        // Draw meters
        this.drawMeter(30, 270, 260, 20, 'REVERB', audioLevels.reverb, this.colors.neonCyan);
        this.drawMeter(30, 310, 260, 20, 'HARMONY', audioLevels.harmony, this.colors.neonOrange);
    }

    drawPanel(x, y, width, height) {
        // Panel background
        this.ctx.fillStyle = 'rgba(10, 20, 30, 0.9)';
        this.ctx.fillRect(x, y, width, height);

        // Panel border
        this.ctx.strokeStyle = this.colors.neonBlue;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // Inner glow
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
    }

    drawMeter(x, y, width, height, label, value, color) {
        // Meter background
        this.ctx.fillStyle = 'rgba(10, 20, 30, 0.8)';
        this.ctx.fillRect(x, y, width, height);

        // Meter border
        this.ctx.strokeStyle = this.colors.neonBlue;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);

        // Meter fill
        const fillWidth = Math.max(0, Math.min(width - 4, (width - 4) * value));
        if (fillWidth > 0) {
            this.ctx.fillStyle = color;
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(x + 2, y + 2, fillWidth, height - 4);
            this.ctx.shadowBlur = 0;
        }

        // Label
        this.ctx.fillStyle = this.colors.textPrimary;
        this.ctx.font = '12px "Courier New", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(label, x, y - 5);
    }

    drawScanlines() {
        this.ctx.fillStyle = 'rgba(0, 255, 255, 0.02)';
        for (let y = 0; y < this.height; y += 4) {
            this.ctx.fillRect(0, y, this.width, 2);
        }
    }

    landmarkToCanvas(landmark) {
        return {
            x: landmark.x * this.width,
            y: landmark.y * this.height
        };
    }

    updateHUDText(handObservation, audioLevels, fps) {
        // This will be called from the main app to update DOM elements
        const elements = {
            'tracker-status': 'TRACKER: mediapipe.js',
            'hand-locked': `HAND: ${handObservation.hasHand ? 'LOCKED' : 'SEARCHING'}`,
            'audio-active': `AUDIO: ${audioLevels.isActive ? 'ACTIVE' : 'INACTIVE'}`,
            'pinch-value': `PINCH: ${handObservation.pinchDistance?.toFixed(3) || '0.000'} → ${audioLevels.reverb?.toFixed(3) || '0.000'}`,
            'height-value': `HEIGHT: ${handObservation.handHeight?.toFixed(3) || '0.000'} → ${audioLevels.harmony?.toFixed(3) || '0.000'}`,
            'reverb-level': `REVERB: ${audioLevels.reverb?.toFixed(3) || '0.000'}`,
            'harmony-level': `HARMONY: ${audioLevels.harmony?.toFixed(3) || '0.000'}`,
            'vision-rate': 'VISION: every 2 frame(s)',
            'fps-value': `FPS: ${fps || '--'}`
        };

        Object.entries(elements).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });

        // Update meters
        this.updateMeter('reverb-meter', audioLevels.reverb || 0);
        this.updateMeter('harmony-meter', audioLevels.harmony || 0);
    }

    updateMeter(meterId, value) {
        const meter = document.getElementById(meterId);
        if (meter) {
            meter.style.setProperty('--fill-width', `${value * 100}%`);
        }
    }
}