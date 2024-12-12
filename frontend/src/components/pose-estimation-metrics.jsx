import React, { useState, useCallback } from 'react';
import { Upload, Info, ChevronDown, ChevronUp, Check, Send, Loader2, RefreshCw, UploadCloud, FileText } from 'lucide-react';
import axios from 'axios';

const metrics = [
  {
    name: "Ankle Dorsiflexion",
    term: "ankle",
    description: "Measure the upward bending motion of the foot at the ankle joint.",
    instructions: "Stand sideways next to a wall. Bend your knee towards the wall without lifting your heel. Capture a side view of your lower leg and foot.",
    image: "/placeholder.svg?height=200&width=300"
  },
  {
    name: "Knee Flexion Extension",
    term: "knee",
    description: "Assess the bending and straightening motion of the knee joint.",
    instructions: "Stand sideways. Perform a partial squat, then fully extend your leg. Capture a side view of your entire leg during this motion.",
    image: "/placeholder.svg?height=200&width=300"
  },
  {
    name: "Hip Flexion",
    term: "hipFlexion",
    description: "Evaluate the forward and upward movement of the thigh at the hip joint.",
    instructions: "Stand sideways. Lift your knee towards your chest as high as comfortable. Capture a side view of your hip and thigh.",
    image: "/placeholder.svg?height=200&width=300"
  },
  {
    name: "Hip Internal/External Rotation",
    term: "hipRotation",
    description: "Measure the inward and outward rotation of the thigh at the hip joint.",
    instructions: "Sit on a chair with your knee bent at 90 degrees. Rotate your thigh inward, then outward. Capture a front view of your legs during this motion.",
    image: "/placeholder.svg?height=200&width=300"
  },
  {
    name: "Thigh Foot Angle",
    term: "popliteal",
    description: "Assess the angle between the thigh and foot during standing or walking.",
    instructions: "Stand naturally or walk a few steps. Capture a front view of your legs and feet while standing or mid-stride.",
    image: "/placeholder.svg?height=200&width=300"
  },
  {
    name: "Foot Progression",
    term :"footProgression",
    description: "Evaluate the angle of the foot relative to the direction of movement during walking.",
    instructions: "Walk naturally for a few steps. Capture a top-down view of your feet during mid-stride.",
    image: "/placeholder.svg?height=200&width=300"
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

const PoseEstimationMetrics = () => {
  const [uploadedMetrics, setUploadedMetrics] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [cachedFormData, setCachedFormData] = useState(null);

  const handleUpload = useCallback(async (formData) => {
    try {
      const metricName = formData.get('metricName');
      setUploadedMetrics((prev) => ({ ...prev, [metricName]: true }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  }, []);

  const handleSendToBackend = async () => {
    if (!metrics.every((metric) => uploadedMetrics[metric.name])) {
      alert('Please upload all images before processing.');
      return;
    }
  
    setIsProcessing(true);
    const formData = new FormData();
  
    metrics.forEach((metric) => {
      const fieldName = fieldNameMapping[metric.name];
      const fileInput = document.querySelector(`input[name="${metric.name}"]`);
      if (fileInput && fileInput.files[0]) {
        formData.append(fieldName, fileInput.files[0]);
      }
    });
  
    // Cache the formData for later reuse
    setCachedFormData(formData);
  
    try {
      const response = await axios.post('http://localhost:5000/analyze-metrics', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(response.data);
      if (response.status === 200 && response.data) {
        setResult(response.data);
      } else {
        alert('Unexpected response from the backend.');
      }
    } catch (error) {
      console.error('Error sending images to backend:', error);
      alert('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRecalculate = async () => {
    if (!cachedFormData) {
      alert('No data available to recalculate. Please upload and process images first.');
      return;
    }
  
    setIsProcessing(true);
  
    try {
      const response = await axios.post('http://localhost:5000/analyze-metrics', cachedFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(response.data);
      if (response.status === 200 && response.data) {
        setResult(response.data);
      } else {
        alert('Unexpected response from the backend.');
      }
    } catch (error) {
      console.error('Error recalculating metrics:', error);
      alert('Failed to recalculate metrics. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleShowDetailedResults = () => {
    alert('Detailed results would be shown here. This could include more in-depth analysis, charts, or comparisons.');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Pose Estimation</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {!result ? (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload Images for Pose Estimation</h2>
              <p className="text-gray-600">
                Please upload an image for each of the following metrics. Ensure that your images follow the provided instructions for accurate results.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.name}
                  metric={metric}
                  onUpload={handleUpload}
                  isUploaded={uploadedMetrics[metric.name]}
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <button
                className={`bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center mx-auto ${
                  !metrics.every((metric) => uploadedMetrics[metric.name]) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleSendToBackend}
                disabled={!metrics.every((metric) => uploadedMetrics[metric.name])}
              >
                <Send className="w-5 h-5 mr-2" />
                Send Images to Backend
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 sm:px-0">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pose Estimation Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {metrics.map((metric) => (
                <ResultCard key={metric.name} metric={metric} result={result[metric.term]} />
              ))}
            </div>
            <div className="flex justify-center space-x-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                onClick={handleRecalculate}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Recalculate Angles
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                onClick={handleUpload}
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
          </div>
        )}
      </main>
      {isProcessing && <LoadingSpinner />}
    </div>
  );
};

const MetricCard = ({ metric, onUpload, isUploaded }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('metricName', metric.name);
      await onUpload(formData);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
      {isUploaded && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
          <Check className="w-4 h-4" />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{metric.name}</h3>
        <img src={metric.image} alt={metric.name} className="w-full h-40 object-cover rounded-md mb-4" />
        <p className="text-gray-600 mb-4">{metric.description}</p>
        <button
          className="text-blue-600 hover:text-blue-800 flex items-center focus:outline-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide Instructions
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show Instructions
            </>
          )}
        </button>
        {isExpanded && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-2">How to capture this metric:</h4>
            <p className="text-gray-700">{metric.instructions}</p>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          {isUploaded ? 'Replace Image' : 'Upload Image'}
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" name={metric.name} />
        </label>
      </div>
    </div>
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

const ResultCard = ({ metric, result }) => {
  if (!result) {
    return <div>Loading or no result available for {metric.name}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{metric.name}</h3>
        {result.image ? (
          <img
            src={result.image}
            alt={`Processed ${metric.name}`}
            className="w-full h-40 object-cover rounded-md mb-4"
          />
        ) : (
          <p>No image available</p>
        )}
        <div className="bg-blue-50 rounded-md p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Estimated Angle:</h4>
          <p className="text-3xl font-bold text-blue-600">
            {result.angle !== null ? `${result.angle}°` : 'Angle not defined'}
          </p>
        </div>
      </div>
    </div>
  );
};









export default PoseEstimationMetrics;