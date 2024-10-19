import React, { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Dumbbell, Flower, Activity, Microscope } from 'lucide-react';
import Webcam from "react-webcam";
import axios from "axios";

// Shadcn UI components
const Button = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${className}`}
      ref={ref}
      {...props}
    />
  );
});

const Card = ({ className, ...props }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
);

const CardHeader = ({ className, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
));

const CardContent = ({ className, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props} />
));

export default function PoseEstimationFrontPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [result, setResult] = useState(null);
  const webcamRef = useRef(null);

  const uploadPhoto = async (blob) => {
    const formData = new FormData();
    formData.append('image', blob, 'captured.jpg');

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Important to set this for binary response
      });

      if (response.status === 200 && response.data) {
        // Create an object URL for the image
        const imageUrl = URL.createObjectURL(response.data);
        // Set the image URL as the result
        setResult(imageUrl);
      } else {
        console.error('No image returned from the server');
      }

    } catch (error) {
      console.error('Error uploading the file:', error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = () => {
        const blob = new Blob([reader.result], { type: file.type });
        uploadPhoto(blob);
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error('Unsupported file type. Please upload a JPEG or PNG image.');
    }
  };

  const handleWebcam = () => {
    setIsWebcamOpen(prev => !prev);
    if (isWebcamOpen) {
      // Reset states when closing the webcam
      setSelectedImage(null);
      setResult(null);
    } else {
      // Reset states when opening the webcam
      setSelectedImage(null);
      setResult(null);
    }
  };

  const captureImage = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setSelectedImage(imageSrc);
      setIsWebcamOpen(false);
      // Simulating pose estimation result
      setResult("Pose estimation results for captured image will be displayed here.");
    }
  }, [webcamRef]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">PoseWithAI</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Unlock the Power of Pose Estimation</h2>
          <p className="text-xl text-gray-600 mb-8">Analyze and improve your form with cutting-edge AI technology</p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Button className="bg-black text-white text-lg px-6 py-3 hover:bg-black/90" onClick={() => document.getElementById('fileInput').click()}>
                <Upload className="mr-2 h-5 w-5" /> Upload Photo
              </Button>
              <input
                id="fileInput"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button className="text-lg px-6 py-3" onClick={handleWebcam}>
                <Camera className="mr-2 h-5 w-5" /> {isWebcamOpen ? 'Close Webcam' : 'Open Webcam'}
              </Button>
            </div>
            {isWebcamOpen && (
              <div className="mt-4 w-full max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="rounded-lg shadow-lg w-full"
                    />
                    <Button className="mt-4 text-lg px-6 py-3" onClick={captureImage}>
                      Capture Image
                    </Button>
                  </div>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Live Pose Estimation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                      <img src={result} alt="Annotated Pose" style={{ maxWidth: '100%', maxHeight: '500px' }} />  
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            {result && (
              <div className="mt-8 w-full max-w-4xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Analysis Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <img src={result} alt="Processed Pose" className="w-full rounded-lg shadow-lg" />
                  </div>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle><img src={result} alt="Annotated Pose" style={{ maxWidth: '100%', maxHeight: '500px' }} /></CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Pose estimation result will be shown here based on the processed image.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className='pl-12'>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">What is Pose Estimation?</h3>
            <p className="text-lg text-gray-600 mb-4">
             Pose estimation is an AI-powered computer vision technique that detects human figures in images and videos,
             determining precise body part locations and configurations.
           </p>
           <p className="text-lg text-gray-600">
              By leveraging advanced machine learning algorithms, pose estimation enables accurate analysis of human
              movement and posture, opening up a world of applications across various fields.
           </p>
           </div>
            <div className="flex items-center justify-center w-full max-w-md h-64 rounded-lg overflow-hidden shadow-xl mx-auto">
              <img
                src="./pose2-image.jpg"
                alt="Pose Estimation Visualization"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Applications of Pose Estimation</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dumbbell className="mr-2 h-5 w-5" /> Fitness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Analyze movements for exercise form and injury prevention.</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Flower className="mr-2 h-5 w-5" /> Healthcare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Track rehabilitation progress and assess physical therapy effectiveness.</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" /> Sports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Enhance athletic performance through detailed movement analysis.</CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Microscope className="mr-2 h-5 w-5" /> Research
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Utilize pose estimation in behavioral studies and movement science.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="bg-white mt-16 py-8 shadow-inner">
        <div className="container mx-auto text-center">
          <p className="text-gray-500">&copy; 2024 PoseWithAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
