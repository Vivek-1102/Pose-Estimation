"use client"

import PageLayout from "@/components/PageLayout"

export default function PrivacyPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

            <div className="prose prose-blue max-w-none">
              <p className="text-lg text-gray-700 mb-4">Last Updated: April 15, 2025</p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Welcome to Clinical Pose Estimation. We respect your privacy and are committed to protecting your
                personal data. This privacy policy will inform you about how we look after your personal data when you
                visit our website and tell you about your privacy rights and how the law protects you.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Data We Collect</h2>
              <p className="text-gray-700 mb-4">
                When you use our Clinical Pose Estimation application, we may collect the following types of
                information:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li className="mb-2">Images and videos you upload for pose estimation analysis</li>
                <li className="mb-2">Measurement data generated from your uploads</li>
                <li className="mb-2">Device information (browser type, operating system, etc.)</li>
                <li className="mb-2">Usage data (how you interact with our application)</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Data</h2>
              <p className="text-gray-700 mb-4">We use your data for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li className="mb-2">To provide and maintain our service</li>
                <li className="mb-2">To perform pose estimation analysis on your uploaded images</li>
                <li className="mb-2">To generate reports and measurements</li>
                <li className="mb-2">To improve our algorithms and service quality</li>
                <li className="mb-2">To respond to your inquiries and provide support</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate security measures to protect your personal data against unauthorized access,
                alteration, disclosure, or destruction. Your data is processed locally in your browser whenever
                possible, and we use encryption for any data transmitted to our servers.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have the following rights regarding your data:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li className="mb-2">Right to access your personal data</li>
                <li className="mb-2">Right to rectification of inaccurate data</li>
                <li className="mb-2">Right to erasure of your data</li>
                <li className="mb-2">Right to restrict processing</li>
                <li className="mb-2">Right to data portability</li>
                <li className="mb-2">Right to object to processing</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us at:
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Email:</strong>{" "}
                <a href="mailto:vveksngh1102@gmail.com" className="text-blue-600 hover:underline">
                  vveksngh1102@gmail.com
                </a>
                <br />
                <strong>Address:</strong> Xavier Institute Of Engineering, Mahim - West
                <br />
                <strong>Phone:</strong> +91 8090291382
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
