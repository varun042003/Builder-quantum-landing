import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileImage, X, CheckCircle, AlertCircle } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import { UploadStatus } from "@/types/billing";
import { useFirebaseStatus } from "@/hooks/useFirebase";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUploadComplete?: (url: string, fileName: string) => void;
  className?: string;
}

export function ImageUpload({ onUploadComplete, className }: ImageUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    uploading: false,
    progress: 0,
  });
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; status: string; url?: string }>
  >([]);
  const { isConfigured } = useFirebaseStatus();

  const uploadFile = async (file: File) => {
    const storageRef = ref(
      storage,
      `billing-images/${Date.now()}-${file.name}`,
    );
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadStatus((prev) => ({ ...prev, progress }));
        },
        (error) => {
          setUploadStatus((prev) => ({ ...prev, error: error.message }));
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Create a pending record in Firestore
            await addDoc(collection(db, "billing-records"), {
              imageUrl: downloadURL,
              fileName: file.name,
              status: "processing",
              uploadedAt: new Date().toISOString(),
              // OCR processing will update this record with extracted data
            });

            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        },
      );
    });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!isConfigured || !storage || !db) {
        // In demo mode, simulate upload
        setUploadStatus({ uploading: true, progress: 0 });

        for (const file of acceptedFiles) {
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, status: "uploading" },
          ]);

          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 20) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            setUploadStatus({ uploading: true, progress });
          }

          const mockUrl = `https://via.placeholder.com/400x600/f3f4f6/374151?text=${encodeURIComponent(file.name)}`;

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, status: "completed", url: mockUrl }
                : f,
            ),
          );

          onUploadComplete?.(mockUrl, file.name);
        }

        setUploadStatus({ uploading: false, progress: 0 });
        return;
      }

      // Real Firebase upload
      setUploadStatus({ uploading: true, progress: 0 });

      for (const file of acceptedFiles) {
        try {
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, status: "uploading" },
          ]);

          const url = await uploadFile(file);

          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, status: "completed", url } : f,
            ),
          );

          onUploadComplete?.(url, file.name);
        } catch (error) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name ? { ...f, status: "error" } : f,
            ),
          );
        }
      }

      setUploadStatus({ uploading: false, progress: 0 });
    },
    [onUploadComplete, isConfigured],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    multiple: true,
  });

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          uploadStatus.uploading && "pointer-events-none opacity-50",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload billing images
        </h3>
        <p className="text-gray-500 mb-4">
          Drag and drop your billing documents here, or click to browse
        </p>
        <p className="text-sm text-gray-400">
          Supports PNG, JPG, JPEG, WEBP files
        </p>
      </div>

      {uploadStatus.uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              Uploading...
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
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <FileImage className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {file.name}
                </span>
                {file.status === "completed" && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <button
                onClick={() => removeFile(file.name)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadStatus.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-sm text-red-800">{uploadStatus.error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
