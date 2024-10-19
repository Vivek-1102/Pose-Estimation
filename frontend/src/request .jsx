import React, { useState, useRef } from 'react';
import axios from 'axios';

const PoseEstimation = () => {
    const [videoStream, setVideoStream] = useState(null);
    const [result, setResult] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing the webcam:', error);
        }
    };

    const capturePhoto = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // // Draw the video frame to the canvas
        if (context && videoRef.current) {
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(async (blob) => {
                if (blob) {
                    await uploadPhoto(blob);
                }
            }, 'image/jpeg');
        }

        // Stop the webcam stream
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null; // Stop showing the video feed
            }
        }
    };

    const uploadPhoto = async (blob) => {
        const formData = new FormData();
        formData.append('image', blob, 'captured.jpg');

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
            });

            const imageUrl = URL.createObjectURL(new Blob([response.data]));
            setResult(imageUrl);
        } catch (error) {
            console.error('Error uploading the file:', error);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const blob = new Blob([reader.result], { type: file.type });
                await uploadPhoto(blob);
            };
            reader.readAsArrayBuffer(file);
        }
    };

    return (
        <div>
            <h2>Pose Estimation with Webcam and File Upload</h2>
            <video ref={videoRef} autoPlay style={{ width: '100%', height: 'auto' }}></video>
            <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }}></canvas>
            <button onClick={startWebcam}>Start Webcam</button>
            <button onClick={capturePhoto}>Capture Photo</button>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                ref={fileInputRef}
            />
            {result && <img src={result} alt="Annotated Pose" style={{ maxWidth: '100%', maxHeight: '500px' }} />}
        </div>
    );
};

export default PoseEstimation;

// this my logic for sending the upload image and webcam image to my backend from where i get the pose estimation results now just take the logic from here and include it in main PoseEstimationFrontPage.jsx