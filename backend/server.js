const express = require('express');
const cors = require('cors');
const multer = require('multer');
const tf = require('@tensorflow/tfjs');
const poseDetection = require('@tensorflow-models/pose-detection');
const { createCanvas, loadImage } = require('canvas');

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
    { name: 'hipRotation', maxCount: 1 },
    { name: 'popliteal', maxCount: 1 },
    { name: 'footProgression', maxCount: 1 }
]);

// Enhanced angle calculation class
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
                const imaginaryPoint = { x: hip.x + 100, y: hip.y };
                return this.calculateAngle(knee, hip, imaginaryPoint);
            },

            hipRotation: () => {
                const knee = getPoint('knee');
                const ankle = getPoint('ankle');
                if (!knee || !ankle) return null;
                const imaginaryPoint = { x: knee.x, y: knee.y - 100 };
                return this.calculateAngle(ankle, knee, imaginaryPoint);
            },

            popliteal: () => {
                const ankle = getPoint('ankle');
                const knee = getPoint('knee');
                if (!knee || !ankle) return null;
                const imaginaryPoint = { x: knee.x, y: knee.y - 100 };
                return this.calculateAngle(ankle, knee, imaginaryPoint);
            },

            footProgression: () => {
                const toe = getPoint('foot_index');
                const ankle = getPoint('ankle');
                if (!ankle || !toe) return null;
                const imaginaryPoint = { x: ankle.x, y: ankle.y - 100 };
                return this.calculateAngle(toe, ankle, imaginaryPoint);
            }
        };

        return calculations[metric] ? calculations[metric]() : null;
    }

    static validateAndCalculate(points, calculationFn) {
        if (points.some(p => !p || p.score < 0.5)) return null;
        return calculationFn();
    }
}

// Enhanced image preprocessing
const preprocessImage = async (imageBuffer, targetSize = 256) => {
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(targetSize, targetSize);
    const ctx = canvas.getContext('2d');

    // Calculate scaling while maintaining aspect ratio
    const scale = Math.min(targetSize / img.width, targetSize / img.height);
    const newWidth = Math.round(img.width * scale);
    const newHeight = Math.round(img.height * scale);

    // Center the image with padding
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, targetSize, targetSize);
    const offsetX = (targetSize - newWidth) / 2;
    const offsetY = (targetSize - newHeight) / 2;
    ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

    return canvas;
};

// Enhanced annotation drawing
const drawAnnotations = (keypoints, canvas, metric, angle) => {
    const ctx = canvas.getContext('2d');
    
    // Draw keypoints
    keypoints.forEach((kp) => {
        if (kp.score > 0.5) {
            ctx.beginPath();
            ctx.fillStyle = 'red';
            ctx.arc(kp.x, kp.y, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw keypoint names
            ctx.fillStyle = 'yellow';
            ctx.font = '12px Arial';
            ctx.fillText(kp.name, kp.x + 5, kp.y + 5);
        }
    });

    // Draw angle measurement
    if (angle !== null) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${metric}: ${angle.toFixed(1)}°`, 10, 30);
    }

    // Draw confidence scores
    ctx.fillStyle = 'green';
    ctx.font = '14px Arial';
    keypoints.forEach((kp, i) => {
        if (kp.score > 0.5) {
            ctx.fillText(`${kp.name}: ${(kp.score * 100).toFixed(1)}%`, 10, 50 + i * 20);
        }
    });
};

// Initialize BlazePose model
let model;
(async () => {
    try {
        console.log('Starting to load TensorFlow...');
        await tf.ready();
        console.log('TensorFlow ready, loading BlazePose model...');
        
        model = await poseDetection.createDetector(
            poseDetection.SupportedModels.BlazePose,
            {
                runtime: 'tfjs',
                modelType: 'heavy',
                enableSmoothing: true,
            }
        );
        
        console.log('BlazePose model loaded successfully');
    } catch (error) {
        console.error('Error loading BlazePose model:', error);
    }
})();

// Main endpoint for analyzing metrics
app.post('/analyze-metrics', (req, res) => {
    console.log('Received analyze-metrics request');
    
    upload(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(500).json({ error: err.message });
        }

        if (!model) {
            console.error('Model not loaded');
            return res.status(503).json({
                error: 'Model is still loading, please try again'
            });
        }

        const images = req.files;
        console.log('Received files:', Object.keys(images || {}));
        
        const requiredMetrics = [
            'ankle', 'knee', 'hipFlexion', 
            'hipRotation', 'popliteal', 'footProgression'
        ];
        const results = {};

        try {
            for (const metric of requiredMetrics) {
                if (!images || !images[metric] || !images[metric][0]) {
                    console.log(`Skipping ${metric} - no image provided`);
                    continue;
                }

                const file = images[metric][0];
                const processedCanvas = await preprocessImage(file.buffer);
                
                const poses = await model.estimatePoses(processedCanvas, {
                    flipHorizontal: true,
                    maxPoses: 1,
                    scoreThreshold: 0.5
                });

                if (!poses.length) {
                    console.log(`No poses detected for ${metric}`);
                    results[metric] = { 
                        error: 'No pose detected', 
                        angle: null, 
                        image: null 
                    };
                    continue;
                }

                const keypoints = poses[0].keypoints.map(kp => ({
                    name: kp.name,
                    x: kp.x,
                    y: kp.y,
                    score: kp.score,
                }));

                const angle = ClinicalAngleCalculator.calculateMetricAngles(
                    metric, 
                    keypoints
                );

                drawAnnotations(keypoints, processedCanvas, metric, angle);

                results[metric] = {
                    angle,
                    confidence: poses[0].score,
                    keypoints: keypoints.filter(kp => kp.score > 0.5),
                    image: `data:image/png;base64,${processedCanvas.toBuffer().toString('base64')}`
                };

                console.log(`Completed processing ${metric}`);
            }

            console.log('Sending response...');
            res.json(results);
        } catch (error) {
            console.error('Error processing images:', error);
            res.status(500).json({
                error: 'Error processing the images',
                details: error.message
            });
        }
    });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));