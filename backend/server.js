const express = require('express');
const cors = require('cors');
const multer = require('multer');
const tf = require('@tensorflow/tfjs');
const poseDetection = require('@tensorflow-models/pose-detection');
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 5000;

// Extended timeout
app.timeout = 300000; // 5 minutes

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.headers);
    next();
});

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
    { name: 'ankle', maxCount: 1 },
    { name: 'knee', maxCount: 1 },
    { name: 'hipFlexion', maxCount: 1 },
    { name: 'R1', maxCount: 1 },
    { name: 'popliteal', maxCount: 1 },
    { name: 'R2', maxCount: 1 }
]);

// Function to dynamically get keypoints based on side
const getMetricKeypoints = (metric, side) => {
    const prefix = side === 'right' ? 'right' : 'left';

    const keypointsMap = {
        ankle: [`${prefix}_knee`, `${prefix}_ankle`, `${prefix}_foot_index`],
        knee: [`${prefix}_hip`, `${prefix}_knee`, `${prefix}_ankle`],
        hipFlexion: [`${prefix}_knee`, `${prefix}_hip`],
        R1: [`${prefix}_knee`, `${prefix}_ankle`, `${prefix}_hip`],
        popliteal: [`${prefix}_knee`, `${prefix}_ankle`],
        R2: [`${prefix}_knee`, `${prefix}_ankle`, `${prefix}_hip`],
    };

    return keypointsMap[metric] || [];
};

// Enhanced image preprocessing
const preprocessImage = async (imageBuffer, targetSize = 256) => {
    let image = await sharp(imageBuffer).rotate().resize(512, 512, { fit: 'inside' }).toBuffer();
    image = await sharp(image).modulate({ brightness: 1.2 }).toBuffer(); // Improve visibility

    const img = await loadImage(image);
    const canvas = createCanvas(targetSize, targetSize);
    const ctx = canvas.getContext('2d');

    const scale = Math.min(targetSize / img.width, targetSize / img.height);
    const newWidth = Math.round(img.width * scale);
    const newHeight = Math.round(img.height * scale);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, targetSize, targetSize);
    const offsetX = (targetSize - newWidth) / 2;
    const offsetY = (targetSize - newHeight) / 2;
    ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

    return canvas;
};

/// Enhanced angle calculation class
class ClinicalAngleCalculator {
    static calculateAngle(p1, p2, p3) {
        const radian = Math.atan2(p3.y - p2.y, p3.x - p2.x) -
                       Math.atan2(p1.y - p2.y, p1.x - p2.x);
        let angle = Math.abs((radian * 180) / Math.PI);
        if (angle > 180) angle = 360 - angle;
        return angle;
    }

    static calculateMetricAngles(metric, keypoints, side = 'right') {
        const prefix = side === 'right' ? 'right_' : 'left_';
        const getPoint = (name) => keypoints.find((kp) => kp.name === `${prefix}${name}`);

        const calculations = {
            ankle: () => {
                const knee = getPoint('knee');
                const ankle = getPoint('ankle');
                const toe = getPoint('foot_index');
                return this.validateAndCalculate([knee, ankle, toe], 
                    () => this.calculateAngle(knee, ankle, toe));
            },

            knee: () => {
                const hip = getPoint('hip');
                const knee = getPoint('knee');
                const ankle = getPoint('ankle');
                return this.validateAndCalculate([hip, knee, ankle], 
                    () => this.calculateAngle(hip, knee, ankle));
            },

            hipFlexion: () => {
                const knee = getPoint('knee');
                const hip = getPoint('hip');
                if (!hip || !knee) return null;

                const imaginaryPoint = { x: hip.x - (side === 'right' ? 100 : -100), y: hip.y };
                return this.calculateAngle(knee, hip, imaginaryPoint);
            },

            R1: () => {
                const knee = getPoint('knee');
                const ankle = getPoint('ankle');
                const hip = getPoint('hip');
                if (!knee || !ankle) return null;
                return this.calculateAngle(ankle, knee, hip);
            },

            popliteal: () => {
                const knee = getPoint('knee');
                const ankle = getPoint('ankle');
                const imaginaryVertical = { x: knee.x, y: knee.y - 100 };
                return this.validateAndCalculate([ankle, knee, imaginaryVertical], 
                    () => this.calculateAngle(ankle, knee, imaginaryVertical));
            },

            R2: () => {
                const knee = getPoint('knee');
                const ankle = getPoint('ankle');
                const hip = getPoint('hip');
                if (!knee || !ankle) return null;
                return this.calculateAngle(ankle, knee, hip);
            }
        };

        return calculations[metric] ? calculations[metric]() : null;
    }

    static validateAndCalculate(points, calculationFn) {
        if (points.some(p => !p || p.score < 0.5

        )) return null;
        return calculationFn();
    }
}


// Enhanced annotation drawing
const drawAnnotations = (keypoints, canvas, metric, angle, side) => {
    const ctx = canvas.getContext("2d");

    // Draw keypoints
    keypoints.forEach((kp) => {
        if (kp.score > 0.5) {
            ctx.beginPath();
            ctx.fillStyle = "red";
            ctx.arc(kp.x, kp.y, 3, 0, 2 * Math.PI); // Larger dots for better visibility
            ctx.fill();

            ctx.fillStyle = "grey";
            ctx.font = "bold 12px Arial";
            ctx.fillText(kp.name, kp.x + 5, kp.y - 5); // Adjust text position
        }
    });

    // Identify keypoints needed for the metric
    const hip = keypoints.find(kp => kp.name.includes("hip"));
    const knee = keypoints.find(kp => kp.name.includes("knee"));
    const ankle = keypoints.find(kp => kp.name.includes("ankle"));

    // Draw lines between metric keypoints
    if (hip && knee) drawLine(ctx, hip, knee, "cyan");  // Hip to knee
    if (knee && ankle) drawLine(ctx, knee, ankle, "lime");  // Knee to ankle

    // Draw imaginary points for metric calculations
    if (metric === "hipFlexion" && hip) {
        const imaginaryHipPoint = { 
            x: hip.x - (side === "right" ? 100 : -100), 
            y: hip.y 
        };
        drawLine(ctx, hip, imaginaryHipPoint, "orange", [5, 5]); // Dotted line
        drawPoint(ctx, imaginaryHipPoint, "orange", "Imaginary");
    }

    if (metric === "popliteal" && knee) {
        const imaginaryKneePoint = { x: knee.x, y: knee.y - 100 };
        drawLine(ctx, knee, imaginaryKneePoint, "purple", [5, 5]); // Dotted line
        drawPoint(ctx, imaginaryKneePoint, "purple", "Imaginary");
    }

   
};

// Helper function to draw a line between two points
const drawLine = (ctx, p1, p2, color, dash = []) => {
    ctx.beginPath();
    ctx.setLineDash(dash); // Dotted line if needed
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line style
};

// Helper function to draw imaginary points
const drawPoint = (ctx, point, color, label) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "grey";
    ctx.font = "bold 12px Arial";
    ctx.fillText(label, point.x + 5, point.y - 5);
};



// Load BlazePose model
let model;
(async () => {
    await tf.ready();
    model = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
        runtime: 'tfjs',
        modelType: 'heavy',
        enableSmoothing: true,
    });
    console.log('BlazePose model loaded');
})();


// Main analyze-metrics endpoint
// Updated analyze-metrics endpoint
app.post('/analyze-metrics', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!model) {
            return res.status(503).json({ error: 'Model is still loading' });
        }

        const images = req.files;
        const side = req.body.side || 'right';  // Default to right side
        const requiredMetrics = ['ankle', 'knee', 'hipFlexion', 'R1', 'popliteal', 'R2'];

        try {
            const results = await Promise.all(requiredMetrics.map(async (metric) => {
                if (!images || !images[metric] || !images[metric][0]) {
                    return { [metric]: { error: 'No image provided' } };
                }

                const file = images[metric][0];
                const processedCanvas = await preprocessImage(file.buffer);

                const poses = await model.estimatePoses(processedCanvas, {
                    flipHorizontal: side === 'left',  // Flip only if left side
                    maxPoses: 1,
                    scoreThreshold: 0.5
                });

                if (!poses.length) {
                    return { [metric]: { error: 'No pose detected', angle: null, image: null } };
                }

                const keypoints = poses[0].keypoints.map(kp => ({
                    name: kp.name,
                    x: kp.x,
                    y: kp.y,
                    score: kp.score,
                }));

                // Dynamically get keypoints for the given metric & side
                const metricKeypoints = getMetricKeypoints(metric, side);
                const filteredKeypoints = keypoints.filter(kp =>
                    metricKeypoints.includes(kp.name) && kp.score > 0.5
                );

                if (filteredKeypoints.length < metricKeypoints.length) {
                    return { [metric]: { error: 'Insufficient keypoints detected', angle: null, image: null } };
                }

                // Calculate angle using the filtered keypoints
                const angle = ClinicalAngleCalculator.calculateMetricAngles(metric, filteredKeypoints, side);

                // Draw keypoints, lines, and imaginary points
                drawAnnotations(filteredKeypoints, processedCanvas, metric, angle, side);

                return {
                    [metric]: {
                        angle,
                        confidence: poses[0].score,
                        keypoints: keypoints.filter(kp => kp.score > 0.5),
                        image: `data:image/png;base64,${processedCanvas.toBuffer().toString('base64')}`
                    }
                };
            }));

            res.json(Object.assign({}, ...results));
        } catch (error) {
            res.status(500).json({ error: 'Processing error', details: error.message });
        }
    });
});




// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));