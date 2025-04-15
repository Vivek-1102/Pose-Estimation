import Link from "next/link"
import { Activity, Upload, Video, ArrowRight, CheckCircle, Users, Brain, Zap } from "lucide-react"
import PageLayout from "../components/PageLayout"

export default function Dashboard() {
  return (
    <PageLayout>
      {/* Hero Section - Add a subtle pattern background */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200 animate-pulse">
                  Advanced Pose Estimation
                </span>
                <br />
                <span className="text-3xl md:text-4xl lg:text-5xl">for Clinical Assessment</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Accurately measure joint angles and analyze movement patterns with AI-powered pose estimation
                technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/metrics"
                  className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors"
                >
                  <Upload className="w-5 h-5 min-w-[20px] mr-2" />
                  <span>Upload Images</span>
                </Link>
                <Link
                  href="/live-estimation"
                  className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors"
                >
                  <Video className="w-5 h-5 min-w-[20px] mr-2" />
                  <span>Live Estimation</span>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img
                src="https://img.freepik.com/free-vector/motion-capture-abstract-concept-illustration_335657-3823.jpg"
                alt="Pose Estimation Visualization"
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What is Pose Estimation Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What is <span className="text-blue-600">Pose Estimation</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pose estimation is a computer vision technique that detects human figures in images and videos,
              determining precise joint locations to create a skeletal representation of the body.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://miro.medium.com/v2/resize:fit:1400/1*JyPqG4TNUXJxEXGfRnNpbQ.png"
                alt="Pose Estimation Diagram"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h3>
              <p className="text-gray-600 mb-6">
                Our clinical pose estimation system uses advanced AI models to identify key points on the human body.
                These points are then connected to form a skeletal structure, allowing for precise measurement of joint
                angles and movement patterns.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="ml-3 text-gray-600">
                    <span className="font-medium text-gray-900">Accurate Joint Detection:</span> Identifies up to 33 key
                    points on the human body
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="ml-3 text-gray-600">
                    <span className="font-medium text-gray-900">Precise Angle Measurement:</span> Calculates joint
                    angles with high accuracy
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="ml-3 text-gray-600">
                    <span className="font-medium text-gray-900">Real-time Analysis:</span> Process images or perform
                    live estimation
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Importance Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why <span className="text-blue-600">Pose Estimation</span> Matters
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pose estimation technology is revolutionizing clinical assessment, rehabilitation, and sports performance
              analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Clinical Assessment</h3>
              <p className="text-gray-600">
                Provides objective measurements for physical therapy, orthopedic evaluation, and rehabilitation progress
                tracking.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sports Performance</h3>
              <p className="text-gray-600">
                Analyzes athletic movements to optimize technique, prevent injuries, and enhance performance.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Research & Education</h3>
              <p className="text-gray-600">
                Enables detailed movement analysis for research studies and educational purposes in biomechanics and
                kinesiology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Key <span className="text-blue-600">Features</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our pose estimation system offers comprehensive tools for movement analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Upload className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Image Upload Analysis</h3>
                <p className="mt-2 text-gray-600">
                  Upload images for detailed analysis of specific movements and postures. Ideal for clinical
                  documentation and precise measurements.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Video className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Live Estimation</h3>
                <p className="mt-2 text-gray-600">
                  Real-time pose estimation using your webcam. Perfect for immediate feedback during exercises or
                  movement assessments.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Accurate Measurements</h3>
                <p className="mt-2 text-gray-600">
                  Precise joint angle measurements with comparison to normal ranges for comprehensive assessment.
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <ArrowRight className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Detailed Reports</h3>
                <p className="mt-2 text-gray-600">
                  Generate comprehensive PDF reports with measurements, visualizations, and clinical insights.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/metrics"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Movement Analysis?</h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Experience the power of advanced pose estimation technology in your clinical practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/metrics"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors"
            >
              <Upload className="w-5 h-5 min-w-[20px] mr-2" />
              <span>Upload Images</span>
            </Link>
            <Link
              href="/live-estimation"
              className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center justify-center transition-colors"
            >
              <Video className="w-5 h-5 min-w-[20px] mr-2" />
              <span>Try Live Estimation</span>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
