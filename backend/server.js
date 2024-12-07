// server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const tf = require('@tensorflow/tfjs');
const poseDetection = require('@tensorflow-models/pose-detection');
const { createCanvas, loadImage } = require('canvas');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*', // Adjust according to your frontend origin
}));
app.use(express.json());

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Load the MoveNet model
let model;
(async () => {
    await tf.ready();
    try {
         model = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        });
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
    }
})();
// Route to handle image uploads and pose detection
// Inside your /upload route
app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
      console.log("1st");
    // Ensure the file is in a supported format
    const mimeType = req.file.mimetype;
    if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
        return res.status(400).send('Unsupported image format. Please upload a JPEG or PNG image.');
    }
    console.log("2st");
    // Check if the model is loaded
    if (!model) {
        return res.status(503).send('Model is still loading. Try again later.');
    }

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        console.log("1st try");
        // Load the image and process as before
        const img = await loadImage(req.file.buffer);
        const canvas = createCanvas(img.width, img.height);
        const context = canvas.getContext('2d');

        context.drawImage(img, 0, 0);
        const poses = await model.estimatePoses(canvas);
        console.log("2nd try");
        poses.forEach(pose => {
            pose.keypoints.forEach(keypoint => {
                if (keypoint.score > 0.5) {
                    const { x, y, name } = keypoint;
                    context.fillStyle = 'red';
                    context.beginPath();
                    context.arc(x, y, 5, 0, 2 * Math.PI);
                    context.fill();
                    context.fillStyle = 'white';
                    context.fillText(name, x + 10, y);
                }
            });
        });

        const annotatedImage = canvas.toBuffer();
        res.set('Content-Type', 'image/png');
        res.send(annotatedImage);

    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing the image.');
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
