"use client"

import PageLayout from "@/components/PageLayout"

export default function TermsPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>

            <div className="prose prose-blue max-w-none">
              <p className="text-lg text-gray-700 mb-4">Last Updated: April 15, 2025</p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using the Clinical Pose Estimation application, you agree to be bound by these Terms of
                Service. If you do not agree to all the terms and conditions, you must not use our service.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Clinical Pose Estimation provides AI-powered pose estimation technology for clinical assessment,
                rehabilitation, and sports performance analysis. Our service allows users to upload images or use live
                camera feed for pose analysis and joint angle measurements.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Use of Service</h2>
              <p className="text-gray-700 mb-4">
                You agree to use the service only for lawful purposes and in accordance with these Terms. You are
                responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li className="mb-2">Ensuring you have appropriate rights to any images you upload</li>
                <li className="mb-2">Not using the service for any illegal or unauthorized purpose</li>
                <li className="mb-2">
                  Not attempting to interfere with or compromise the system integrity or security
                </li>
                <li className="mb-2">Not using the service to distribute unsolicited commercial content</li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Medical Disclaimer</h2>
              <p className="text-gray-700 mb-4">
                Clinical Pose Estimation is not a medical device and is not intended to diagnose, treat, cure, or
                prevent any disease or health condition. The information provided by our service is for informational
                purposes only and should not replace professional medical advice, diagnosis, or treatment.
              </p>
              <p className="text-gray-700 mb-4">
                Always seek the advice of your physician or other qualified health provider with any questions you may
                have regarding a medical condition.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                All content, features, and functionality of the Clinical Pose Estimation service, including but not
                limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, and
                software, are the exclusive property of Clinical Pose Estimation and are protected by copyright,
                trademark, and other intellectual property laws.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                In no event shall Clinical Pose Estimation, its directors, employees, partners, agents, suppliers, or
                affiliates be liable for any indirect, incidental, special, consequential, or punitive damages,
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses,
                resulting from your access to or use of or inability to access or use the service.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify these terms at any time. We will provide notice of any material changes
                by posting the new Terms on this page. Your continued use of the service after any such changes
                constitutes your acceptance of the new Terms.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Contact Us</h2>
              <p className="text-gray-700 mb-4">If you have any questions about these Terms, please contact us at:</p>
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
