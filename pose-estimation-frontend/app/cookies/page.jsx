"use client"

import PageLayout from "@/components/PageLayout"

export default function CookiesPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Cookie Policy</h1>

            <div className="prose prose-blue max-w-none">
              <p className="text-lg text-gray-700 mb-4">Last Updated: April 15, 2025</p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. What Are Cookies</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you visit a website.
                They are widely used to make websites work more efficiently and provide information to the website
                owners.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Cookies</h2>
              <p className="text-gray-700 mb-4">Clinical Pose Estimation uses cookies for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li className="mb-2">
                  <strong>Essential cookies:</strong> These are necessary for the website to function properly and
                  cannot be switched off in our systems.
                </li>
                <li className="mb-2">
                  <strong>Performance cookies:</strong> These help us understand how visitors interact with our website
                  by collecting and reporting information anonymously.
                </li>
                <li className="mb-2">
                  <strong>Functional cookies:</strong> These enable the website to provide enhanced functionality and
                  personalization.
                </li>
                <li className="mb-2">
                  <strong>Targeting cookies:</strong> These may be set through our site by our advertising partners to
                  build a profile of your interests.
                </li>
              </ul>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Types of Cookies We Use</h2>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.1 Session Cookies</h3>
              <p className="text-gray-700 mb-4">
                Session cookies are temporary and are deleted when you close your browser. They help our website
                remember what you've done on previous pages so you can navigate more efficiently.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.2 Persistent Cookies</h3>
              <p className="text-gray-700 mb-4">
                Persistent cookies remain on your device after you close your browser. They help our website remember
                your preferences and settings for future visits.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.3 First-Party Cookies</h3>
              <p className="text-gray-700 mb-4">
                First-party cookies are set by our website directly and are used to improve your experience on our site.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">3.4 Third-Party Cookies</h3>
              <p className="text-gray-700 mb-4">
                Third-party cookies are set by other domains than our website. These cookies may be used for analytics,
                advertising, or social media integration.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Managing Cookies</h2>
              <p className="text-gray-700 mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700">
                <li className="mb-2">Delete all cookies from your browser</li>
                <li className="mb-2">Block all cookies by activating the setting on your browser</li>
                <li className="mb-2">Block or allow specific types of cookies</li>
                <li className="mb-2">Set your browser to notify you when you receive a cookie</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Please note that restricting cookies may impact your experience on our website and limit the
                functionality we can provide.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Changes to Our Cookie Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update our Cookie Policy from time to time. Any changes will be posted on this page with an
                updated revision date.
              </p>

              <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about our Cookie Policy, please contact us at:
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
