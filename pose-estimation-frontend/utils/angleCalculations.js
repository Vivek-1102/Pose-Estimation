export class AngleCalculator {
  static calculateAngle(pointA, pointB, pointC) {
    if (!pointA || !pointB || !pointC) return null

    // Calculate vectors
    const vectorAB = { x: pointB.x - pointA.x, y: pointB.y - pointA.y }
    const vectorCB = { x: pointB.x - pointC.x, y: pointB.y - pointC.y }

    // Calculate dot product
    const dotProduct = vectorAB.x * vectorCB.x + vectorAB.y * vectorCB.y

    // Calculate magnitudes
    const magnitudeAB = Math.sqrt(vectorAB.x * vectorAB.x + vectorAB.y * vectorAB.y)
    const magnitudeCB = Math.sqrt(vectorCB.x * vectorCB.x + vectorCB.y * vectorCB.y)

    // Calculate angle in radians
    const angleRadians = Math.acos(dotProduct / (magnitudeAB * magnitudeCB))

    // Convert to degrees
    const angleDegrees = angleRadians * (180 / Math.PI)

    return angleDegrees
  }

  static validateAndCalculate(points, calculationFn) {
    if (points.some((point) => !point)) return null
    return calculationFn()
  }

  static calculateMetricAngles(metric, keypoints, side = "right") {
    const prefix = side === "right" ? "right_" : "left_"
    const getPoint = (name) => keypoints.find((kp) => kp.name === `${prefix}${name}`)

    const calculations = {
      ankle: () => {
        const knee = getPoint("knee")
        const ankle = getPoint("ankle")
        const foot_index = getPoint("foot_index")
        return this.validateAndCalculate([knee, ankle, foot_index], () => this.calculateAngle(knee, ankle, foot_index))
      },

      knee: () => {
        const hip = getPoint("hip")
        const knee = getPoint("knee")
        const ankle = getPoint("ankle")
        return this.validateAndCalculate([hip, knee, ankle], () => this.calculateAngle(hip, knee, ankle))
      },

      hipFlexion: () => {
        const knee = getPoint("knee")
        const hip = getPoint("hip")
        if (!hip || !knee) return null

        const imaginaryPoint = { x: hip.x - (side === "right" ? 100 : -100), y: hip.y }
        return this.calculateAngle(knee, hip, imaginaryPoint)
      },

      hipRotation: () => {
        // R1
        const knee = getPoint("knee")
        const ankle = getPoint("ankle")
        const imaginaryVertical = { x: knee.x, y: knee.y - 100 }
        return this.validateAndCalculate([ankle, knee, imaginaryVertical], () =>
          this.calculateAngle(ankle, knee, imaginaryVertical),
        )
      },

      popliteal: () => {
        const knee = getPoint("knee")
        const ankle = getPoint("ankle")
        const imaginaryVertical = { x: knee.x, y: knee.y - 100 }
        return this.validateAndCalculate([ankle, knee, imaginaryVertical], () =>
          this.calculateAngle(ankle, knee, imaginaryVertical),
        )
      },

      footProgression: () => {
        // R2
        const knee = getPoint("knee")
        const ankle = getPoint("ankle")
        const imaginaryVertical = { x: knee.x, y: knee.y - 100 }
        return this.validateAndCalculate([ankle, knee, imaginaryVertical], () =>
          this.calculateAngle(ankle, knee, imaginaryVertical),
        )
      },
    }

    return calculations[metric] ? calculations[metric]() : null
  }

  static drawAngle(ctx, pointA, pointB, pointC, color = "#FF0000") {
    if (!pointA || !pointB || !pointC) return

    // Draw lines
    ctx.beginPath()
    ctx.moveTo(pointA.x, pointA.y)
    ctx.lineTo(pointB.x, pointB.y)
    ctx.lineTo(pointC.x, pointC.y)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw angle arc
    const angle = this.calculateAngle(pointA, pointB, pointC)
    if (angle !== null) {
      // Draw arc
      const radius = 30
      ctx.beginPath()

      // Calculate vectors
      const vectorBA = { x: pointA.x - pointB.x, y: pointA.y - pointB.y }
      const vectorBC = { x: pointC.x - pointB.x, y: pointC.y - pointB.y }

      // Normalize vectors
      const lengthBA = Math.sqrt(vectorBA.x * vectorBA.x + vectorBA.y * vectorBA.y)
      const lengthBC = Math.sqrt(vectorBC.x * vectorBC.x + vectorBC.y * vectorBC.y)

      const normalizedBA = { x: vectorBA.x / lengthBA, y: vectorBA.y / lengthBA }
      const normalizedBC = { x: vectorBC.x / lengthBC, y: vectorBC.y / lengthBC }

      // Calculate start and end angles
      const startAngle = Math.atan2(normalizedBA.y, normalizedBA.x)
      const endAngle = Math.atan2(normalizedBC.y, normalizedBC.x)

      // Draw arc
      ctx.arc(pointB.x, pointB.y, radius, startAngle, endAngle, false)
      ctx.stroke()

      // Draw angle text
      const midAngle = (startAngle + endAngle) / 2
      const textX = pointB.x + (radius + 10) * Math.cos(midAngle)
      const textY = pointB.y + (radius + 10) * Math.sin(midAngle)

      ctx.font = "16px Arial"
      ctx.fillStyle = color
      ctx.fillText(`${angle.toFixed(1)}°`, textX, textY)
    }
  }
}
