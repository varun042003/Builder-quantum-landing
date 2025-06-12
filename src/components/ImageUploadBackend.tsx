import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileImage,
  X,
  CheckCircle,
  AlertCircle,
  Server,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { UploadStatus } from "@/types/billing";
import { cn } from "@/lib/utils";

interface ImageUploadBackendProps {
  onUploadComplete?: (id: string, fileName: string) => void;
  className?: string;
}

interface UploadedFile {
  name: string;
  status: "uploading" | "completed" | "error";
  id?: string;
  message?: string;
}

export function ImageUploadBackend({
  onUploadComplete,
  className,
}: ImageUploadBackendProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    uploading: false,
    progress: 0,
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(
    null,
  );

  // Check backend connectivity
  const checkBackendConnection = useCallback(async () => {
    try {
      const response = await apiClient.healthCheck();
      setBackendConnected(!response.error);
      return !response.error;
    } catch (error) {
      setBackendConnected(false);
      return false;
    }
  }, []);

  const uploadFile = async (file: File): Promise<string> => {
    setUploadStatus((prev) => ({ ...prev, uploading: true, progress: 20 }));

    try {
      const response = await apiClient.uploadImage(file);

      if (response.error) {
        throw new Error(response.error);
      }

      setUploadStatus((prev) => ({ ...prev, progress: 100 }));
      return response.data?.id || "";
    } catch (error) {
      throw error;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check backend connection first
      const isConnected = await checkBackendConnection();
      if (!isConnected) {
        setUploadStatus({
          uploading: false,
          progress: 0,
          error:
            "Cannot connect to backend server. Please ensure the backend is running on port 3001.",
        });
        return;
      }

      setUploadStatus({ uploading: true, progress: 0 });

      for (const file of acceptedFiles) {
        try {
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, status: "uploading" },
          ]);

          const recordId = await uploadFile(file);

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, status: "completed", id: recordId }
                : f,
            ),
          );

          onUploadComplete?.(recordId, file.name);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, status: "error", message: errorMessage }
                : f,
            ),
          );
        }
      }

      setUploadStatus({ uploading: false, progress: 0 });
    },
    [onUploadComplete, checkBackendConnection],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"],
    },
    multiple: true,
  });

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Backend Status */}
      {backendConnected !== null && (
        <div
          className={cn(
            "flex items-center p-3 rounded-lg text-sm",
            backendConnected
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800",
          )}
        >
          <Server className="w-4 h-4 mr-2" />
          <span>
            Backend Server: {backendConnected ? "Connected" : "Disconnected"}
          </span>
          {!backendConnected && (
            <button
              onClick={checkBackendConnection}
              className="ml-auto text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          uploadStatus.uploading && "pointer-events-none opacity-50",
          backendConnected === false && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload billing images for OCR processing
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your billing documents here, or click to browse
        </p>
        <p className="text-sm text-gray-400">
          Supports PNG, JPG, JPEG, WEBP, BMP, TIFF files (Max 10MB each)
        </p>
      </div>

      {uploadStatus.uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Processing with OCR...
            </span>
            <span className="text-sm text-blue-700">
              {Math.round(uploadStatus.progress)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadStatus.progress}%` }}
            />
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Images are being processed with Tesseract OCR. This may take 30-60
            seconds per image.
          </p>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Upload Results:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <FileImage className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {file.name}
                  </span>
                  {file.id && (
                    <p className="text-xs text-gray-500">ID: {file.id}</p>
                  )}
                  {file.message && file.status === "error" && (
                    <p className="text-xs text-red-600">{file.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {file.status === "completed" && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                {file.status === "uploading" && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                <button
                  onClick={() => removeFile(file.name)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadStatus.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Upload Error</h4>
              <p className="text-sm text-red-700 mt-1">{uploadStatus.error}</p>
              {!backendConnected && (
                <div className="mt-3 text-xs text-red-600">
                  <p>To start the backend server:</p>
                  <ol className="list-decimal ml-4 mt-1">
                    <li>
                      Navigate to the server directory: <code>cd server</code>
                    </li>
                    <li>
                      Install dependencies: <code>npm install</code>
                    </li>
                    <li>
                      Start the server: <code>npm start</code>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
