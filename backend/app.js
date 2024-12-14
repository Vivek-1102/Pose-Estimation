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

// Configure multer with no restrictions
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'ankle', maxCount: 1 },
  { name: 'knee', maxCount: 1 },
  { name: 'hipFlexion', maxCount: 1 },
  { name: 'hipRotation', maxCount: 1 },
  { name: 'popliteal', maxCount: 1 },
  { name: 'footProgression', maxCount: 1 }
]);

// Load the MoveNet model
// Load the BlazePose model
let model;
(async () => {
  try {
    console.log('Starting to load TensorFlow...');
    await tf.ready();
    console.log('TensorFlow ready, loading BlazePose model...');
    
    model = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
      runtime: 'tfjs', // Specifies TensorFlow.js runtime
      modelType: 'heavy', // Options: 'lite', 'full', 'heavy' (choose based on your requirements)
      enableSmoothing: true, // Smooths pose keypoints over time for stability
    });
    
    console.log('BlazePose model loaded successfully');
  } catch (error) {
    console.error('Error loading BlazePose model:', error);
  }
})();


// Helper Functions
const calculateAngle = (p1, p2, p3) => {
  const radian = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radian * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
};

const calculateMetricAngles = (metric, keypoints) => {
  const getPoint = (name) => keypoints.find((kp) => kp.name === name);

  switch (metric) {
    case 'ankle': {
      const knee = getPoint('right_knee');
      const ankle = getPoint('right_ankle');
      const toe = getPoint('right_foot_index');
      return knee && ankle && toe ? calculateAngle(knee, ankle, toe) : null;
    }
    case 'knee': {
      const hip = getPoint('right_hip');
      const knee = getPoint('right_knee');
      const ankle = getPoint('right_ankle');
      return hip && knee && ankle ? calculateAngle(hip, knee, ankle) : null;
    }
    case 'hipFlexion': {
      const knee = getPoint('right_knee');
      const hip = getPoint('right_hip');
      const imaginaryPoint = { x: hip.x +100, y: hip.y  };
      return hip && knee ? calculateAngle(knee, hip, imaginaryPoint) : null;
    }
    case 'hipRotation': {
      const knee = getPoint('right_knee');
      const ankle = getPoint('right_ankle');
      const imaginaryPoint = { x: knee.x, y: knee.y - 100 };
      return ankle && knee ? calculateAngle(ankle, knee, imaginaryPoint) : null;
    }
    case 'popliteal': {
      const ankle = getPoint('right_ankle');
      const knee = getPoint('right_knee');
      const imaginaryPoint = { x: knee.x, y: knee.y - 100 };
      return ankle && knee ? calculateAngle(ankle, knee, imaginaryPoint) : null;
    }
    case 'footProgression': {
      const toe = getPoint('right_foot_index');
      const ankle = getPoint('right_ankle');
      const imaginaryPoint = { x: ankle.x , y: ankle.y - 100 };
      return ankle && toe ? calculateAngle(toe, ankle, imaginaryPoint) : null;
    }
    default:
      return null;
  }
};

const drawAnnotations = (keypoints, canvas, metric, angle) => {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.font = '20px Arial';

  keypoints.forEach((kp) => {
    if (kp.score > 0.5) {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText(kp.name, kp.x + 15, kp.y);
    }
  });

  if (angle !== null) {
    ctx.fillStyle = 'blue';
    ctx.fillText(`${metric}: ${angle.toFixed(2)}°`, 10, 50);
  }
};

const preprocessImage = (img, targetSize = 256) => {
  const scale = Math.min(targetSize / img.width, targetSize / img.height); // Calculate scale
  const newWidth = Math.round(img.width * scale);
  const newHeight = Math.round(img.height * scale);

  const canvas = createCanvas(targetSize, targetSize);
  const ctx = canvas.getContext('2d');

  // Fill the canvas with black (or another padding color)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Center the resized image
  const offsetX = (targetSize - newWidth) / 2;
  const offsetY = (targetSize - newHeight) / 2;
  ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

  // Convert the canvas to a Tensor
  const imgTensor = tf.browser.fromPixels(canvas).div(255.0).expandDims(0);
  return imgTensor;
};


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
    
    const requiredMetrics = ['ankle', 'knee', 'hipFlexion', 'hipRotation', 'popliteal', 'footProgression'];
    const results = {};

    try {
      for (const metric of requiredMetrics) {
        console.log(`Processing ${metric} image...`);
        if (!images || !images[metric] || !images[metric][0]) {
          console.log(`Skipping ${metric} - no image provided`);
          continue;
        }

        const targetWidth = 256; // Example size
        const targetHeight = 256;
        const file = images[metric][0];
        const img = await loadImage(file.buffer);
        console.log(`Processing ${metric}: Image dimensions - Width: ${img.width}, Height: ${img.height}`);
        const canvas = createCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        let imgTensor = tf.browser.fromPixels(canvas).div(255.0);
        console.log("Shape:",imgTensor.shape); 
        

        console.log(`Estimating poses for ${metric}...`);
        const poses = await model.estimatePoses(canvas, {
          flipHorizontal: false,
          maxPoses: 1,
          scoreThreshold: 0.8, // Lower threshold for detecting poses
        });


        if (!poses.length) {
          console.log(`No poses detected for ${metric}`);
          results[metric] = { error: 'No pose detected', angle: null, image: null };
          continue;
        }

        const keypoints = poses[0].keypoints.map((kp) => ({
          name: kp.name,
          x: kp.x,
          y: kp.y,
          score: kp.score,
        }));

        const angle = calculateMetricAngles(metric, keypoints);
        drawAnnotations(keypoints, canvas, metric, angle);

        const annotatedImage = canvas.toBuffer();

        results[metric] = {
          angle,
          image: `data:image/png;base64,${annotatedImage.toString('base64')}`,
        };
        console.log(`Completed processing ${metric}`);
      }

      //  

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