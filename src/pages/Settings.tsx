import {
  ArrowLeft,
  Settings as SettingsIcon,
  Database,
  Upload,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">
          Configure your billing extraction preferences
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Firebase Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Database className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">
                Firebase Setup
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Configure your Firebase project settings for data storage and
              image processing.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  placeholder="your-project-id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* OCR Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Upload className="w-6 h-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">
                OCR Settings
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Adjust optical character recognition and data extraction
              preferences.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Auto-process uploads
                </span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bell className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage how you receive updates about your billing document
              processing.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  Processing complete
                </span>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Setup Instructions
          </h3>
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">1. Firebase Configuration</h4>
              <p>
                Create a Firebase project and add your configuration to the .env
                file:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Enable Cloud Firestore for data storage</li>
                <li>Enable Cloud Storage for image uploads</li>
                <li>Set up Cloud Functions for OCR processing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Cloud Function Setup</h4>
              <p>
                Deploy the Python OCR processing function to handle image
                analysis and data extraction.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Security Rules</h4>
              <p>
                Configure Firebase Security Rules to protect your data and
                ensure proper access control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
