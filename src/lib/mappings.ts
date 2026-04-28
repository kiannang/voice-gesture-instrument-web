import { HandLandmark } from './handTracking'

export class GestureMapper {
  private smoothedPinch = 0
  private smoothedHeight = 0
  private smoothingFactor = 0.15

  updateGestures(landmarks: HandLandmark[]): {
    pinch: number
    handHeight: number
    handDetected: boolean
  } {
    if (!landmarks || landmarks.length < 21) {
      return {
        pinch: 0,
        handHeight: 0,
        handDetected: false,
      }
    }

    // Calculate pinch distance (thumb tip to index tip)
    const thumbTip = landmarks[4] // Thumb tip
    const indexTip = landmarks[8] // Index finger tip

    const pinchDistance = this.calculateDistance(thumbTip, indexTip)
    const normalizedPinch = Math.min(1, Math.max(0, 1 - pinchDistance * 5)) // Invert: pinching closer = higher value

    // Smooth pinch
    this.smoothedPinch +=
      (normalizedPinch - this.smoothedPinch) * this.smoothingFactor

    // Calculate hand height (wrist position)
    const wrist = landmarks[0] // Wrist/palm center
    const normalizedHeight = Math.min(1, Math.max(0, 1 - wrist.y)) // Invert: higher hand = higher value

    // Smooth height
    this.smoothedHeight +=
      (normalizedHeight - this.smoothedHeight) * this.smoothingFactor

    return {
      pinch: this.smoothedPinch,
      handHeight: this.smoothedHeight,
      handDetected: true,
    }
  }

  private calculateDistance(
    point1: HandLandmark,
    point2: HandLandmark
  ): number {
    const dx = point1.x - point2.x
    const dy = point1.y - point2.y
    const dz = (point1.z ?? 0) - (point2.z ?? 0)

    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  reset() {
    this.smoothedPinch = 0
    this.smoothedHeight = 0
  }
}
