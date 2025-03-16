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
                // const heel = getPoint('heel');
                // const toe = getPoint('foot_index');
                // const ankle = getPoint('ankle');
                // if (!heel || !toe || !ankle) return null;

                // const imaginaryVertical = { x: heel.x, y: heel.y + 100 };
                // const angle = this.calculateAngle(toe, heel, imaginaryVertical);

                // return side === 'left' ? 360 - angle :  angle;
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


// Enhanced annotation drawing
const drawAnnotations = (keypoints, canvas, metric, angle) => {
    const ctx = canvas.getContext("2d");

    // Draw keypoints with adaptive visibility
    keypoints.forEach((kp) => {
        if (kp.score > 0.5) {
            ctx.beginPath();
            ctx.fillStyle = "red";
            ctx.arc(kp.x, kp.y, 2.5, 0, 2 * Math.PI); // ✅ Slightly larger dots for better visibility
            ctx.fill();

            ctx.fillStyle = "yellow";
            ctx.font = "bold 12px Arial";
            ctx.fillText(kp.name, kp.x + 5, kp.y - 5); // ✅ Adjusted text position
        }
    });

    // Display metric and angle on top
    if (angle !== null) {
        ctx.fillStyle = "white";
        ctx.font = "bold 16px Arial";
        ctx.fillText(`${metric}: ${angle.toFixed(1)}°`, 10, 30);
    }

    // Display confidence scores at the bottom
    // ctx.fillStyle = "green";
    // ctx.font = "14px Arial";
    // keypoints.forEach((kp, i) => {
    //     if (kp.score > 0.5) {
    //         ctx.fillText(`${kp.name}: ${(kp.score * 100).toFixed(1)}%`, 10, canvas.height - (keypoints.length - i) * 20);
    //     }
    // });
};

// Load BlazePose model
let model;
(async () => {
    await tf.ready();
    model = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
        runtime: 'tfjs',
        modelType: 'full',
        enableSmoothing: true,
    });
    console.log('BlazePose model loaded');
})();

// let model;
// (async () => {
//     await tf.ready();
//     model = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
//         runtime: 'mediapipe',  // ✅ Faster runtime
//         modelType: 'heavy',
//         enableSmoothing: true,
//         solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose' // Load MediaPipe library
//     });
//     console.log('BlazePose model loaded (MediaPipe)');
// })();

// Main analyze-metrics endpoint
app.post('/analyze-metrics', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!model) {
            return res.status(503).json({ error: 'Model is still loading' });
        }

        const images = req.files;
        const side = req.body.side || 'right';  // Default to right side if not provided
        const requiredMetrics = ['ankle', 'knee', 'hipFlexion', 'R1', 'popliteal', 'R2'];

        // Process all images in parallel
        try {
            const results = await Promise.all(requiredMetrics.map(async (metric) => {
                if (!images || !images[metric] || !images[metric][0]) {
                    return { [metric]: { error: 'No image provided' } };
                }

                const file = images[metric][0];
                const processedCanvas = await preprocessImage(file.buffer);

                const poses = await model.estimatePoses(processedCanvas, {
                    flipHorizontal: true,
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

                const angle = ClinicalAngleCalculator.calculateMetricAngles(metric, keypoints, side);
                drawAnnotations(keypoints, processedCanvas, metric, angle);

                return {
                    [metric]: {
                        angle,
                        confidence: poses[0].score,
                        keypoints: keypoints.filter(kp => kp.score > 0.5),
                        image: `data:image/png;base64,${processedCanvas.toBuffer().toString('base64')}`
                    }
                };
            }));

            // Merge all results into a single object
            res.json(Object.assign({}, ...results));
        } catch (error) {
            res.status(500).json({ error: 'Processing error', details: error.message });
        }
    });
});



// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));