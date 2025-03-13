import React, { useState, useCallback, useRef } from 'react';
import { Upload, ChevronLeft, ChevronRight, Check, Send, Loader2, RefreshCw, UploadCloud, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const metrics = [
  {
    name: "Ankle Dorsiflexion",
    description: "Measure the upward bending motion of the foot at the ankle joint.",
    instructions: "Stand sideways next to a wall. Bend your knee towards the wall without lifting your heel. Capture a side view of your lower leg and foot.",
  },
  {
    name: "Knee Flexion Extension",
    description: "Assess the bending and straightening motion of the knee joint.",
    instructions: "Stand sideways. Perform a partial squat, then fully extend your leg. Capture a side view of your entire leg during this motion.",
  },
  {
    name: "Hip Flexion",
    description: "Evaluate the forward and upward movement of the thigh at the hip joint.",
    instructions: "Stand sideways. Lift your knee towards your chest as high as comfortable. Capture a side view of your hip and thigh.",
  },
  {
    name: "Hip Internal/External Rotation",
    description: "Measure the inward and outward rotation of the thigh at the hip joint.",
    instructions: "Sit on a chair with your knee bent at 90 degrees. Rotate your thigh inward, then outward. Capture a front view of your legs during this motion.",
  },
  {
    name: "Thigh Foot Angle",
    description: "Assess the angle between the thigh and foot during standing or walking.",
    instructions: "Stand naturally or walk a few steps. Capture a front view of your legs and feet while standing or mid-stride.",
  },
  {
    name: "Foot Progression",
    description: "Evaluate the angle of the foot relative to the direction of movement during walking.",
    instructions: "Walk naturally for a few steps. Capture a top-down view of your feet during mid-stride.",
  }
];

const fieldNameMapping = {
  'Ankle Dorsiflexion': 'ankle',
  'Knee Flexion Extension': 'knee',
  'Hip Flexion': 'hipFlexion',
  'Hip Internal/External Rotation': 'hipRotation',
  'Thigh Foot Angle': 'popliteal',
  'Foot Progression': 'footProgression',
};

const MetricCard = ({ metric, onUpload, uploadedImage, isActive, estimatedAngle = null }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      onUpload(metric.name, file);
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-lg overflow-hidden relative ${isActive ? 'ring-2 ring-blue-500' : ''}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{metric.name}</h3>
        <p className="text-gray-600 mb-4">{metric.description}</p>
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">How to capture this metric:</h4>
          <p className="text-gray-700">{metric.instructions}</p>
        </div>
        {uploadedImage ? (
          <div className="relative mb-4">
            <img src={uploadedImage || "/placeholder.svg"} alt={metric.name} className="w-full object-contain rounded-md" />
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
            {estimatedAngle !== null && (
              <div className="absolute bottom-2 left-2 bg-blue-600 text-white rounded-md px-2 py-1">
                Estimated Angle: {estimatedAngle}°
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-gray-200 flex items-center justify-center rounded-md mb-4">
            <p className="text-gray-500">No image uploaded</p>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
          onClick={() => fileInputRef.current.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploadedImage ? 'Replace Image' : 'Upload Image'}
        </button>
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
        />
      </div>
    </motion.div>
  );
};

const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
    <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-t-4 border-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-bounce" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-2">Processing Your Images</h2>
      <p className="text-gray-600 text-center mb-4">Please wait while we analyze your pose estimation data...</p>
      <div className="w-64 bg-gray-200 rounded-full h-2 dark:bg-gray-700 overflow-hidden">
        <div className="bg-blue-600 h-2 rounded-full animate-progress"></div>
      </div>
    </div>
  </div>
);

export default function PoseEstimationMetrics() {
  const [uploadedImages, setUploadedImages] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleUpload = useCallback((metricName, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImages(prev => ({...prev, [metricName]: e.target.result}));
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : metrics.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < metrics.length - 1 ? prevIndex + 1 : 0));
  };

  const handleSendToBackend = async () => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      Object.entries(uploadedImages).forEach(([metricName, imageData]) => {
        const fieldName = fieldNameMapping[metricName];
        if (fieldName) {
          // Convert base64 to blob
          const byteString = atob(imageData.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: 'image/jpeg' });
          formData.append(fieldName, blob, `${fieldName}.jpg`);
        }
      });

      const response = await axios.post('http://localhost:5000/analyze-metrics', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResults(response.data);
    } catch (error) {
      console.error('Error processing images:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecalculate = () => {
    handleSendToBackend();
  };

  const handleReupload = () => {
    setResults(null);
    setUploadedImages({});
    setCurrentIndex(0);
  };

  const handleShowDetailedResults = () => {
    alert('Detailed results would be shown here. This could include more in-depth analysis, charts, or comparisons.');
  };

  const allImagesUploaded = metrics.every(metric => uploadedImages[metric.name]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Pose Estimation</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {results ? "Pose Estimation Results" : "Upload Images for Pose Estimation"}
            </h2>
            <p className="text-gray-600">
              {results
                ? "Review your pose estimation results below. You can recalculate or reupload images if needed."
                : "Please upload an image for each of the following metrics. You can upload them in any order."}
            </p>
          </div>
          <div className="relative">
            <AnimatePresence mode="wait">
              <MetricCard
                key={metrics[currentIndex].name}
                metric={metrics[currentIndex]}
                onUpload={handleUpload}
                uploadedImage={uploadedImages[metrics[currentIndex].name]}
                isActive={true}
                estimatedAngle={results ? results[fieldNameMapping[metrics[currentIndex].name]]?.angle : null}
              />
            </AnimatePresence>
            <button
              className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-lg"
              onClick={handleNext}
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
          <div className="mt-8 flex justify-between items-center">
            <div className="flex space-x-2">
              {metrics.map((metric, index) => (
                <div
                  key={metric.name}
                  className={`w-3 h-3 rounded-full ${
                    uploadedImages[metric.name]
                      ? 'bg-green-500'
                      : index === currentIndex
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            {!results ? (
              <button 
                className={`bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center ${!allImagesUploaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleSendToBackend}
                disabled={!allImagesUploaded}
              >
                <Send className="w-5 h-5 mr-2" />
                Send Images to Backend
              </button>
            ) : (
              <div className="flex space-x-4">
                <button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                  onClick={handleRecalculate}
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Recalculate Angles
                </button>
                <button 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                  onClick={handleReupload}
                >
                  <UploadCloud className="w-5 h-5 mr-2" />
                  Reupload Images
                </button>
                <button 
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                  onClick={handleShowDetailedResults}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Show Detailed Results
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      {isProcessing && <LoadingSpinner />}
    </div>
  );
}