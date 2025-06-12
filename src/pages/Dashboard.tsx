import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  Upload,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { BillingRecord } from "@/types/billing";
import { BillingDataTable } from "@/components/BillingDataTable";
import { ImageUpload } from "@/components/ImageUpload";
import { useFirebaseStatus, mockBillingRecords } from "@/hooks/useFirebase";

interface DashboardStats {
  totalRecords: number;
  completedRecords: number;
  processingRecords: number;
  totalAmount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    completedRecords: 0,
    processingRecords: 0,
    totalAmount: 0,
  });
  const [recentRecords, setRecentRecords] = useState<BillingRecord[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const { isConfigured, isLoading: firebaseLoading } = useFirebaseStatus();

  useEffect(() => {
    if (firebaseLoading) return;

    if (!isConfigured || !db) {
      // Use mock data when Firebase is not configured
      const mockStats = mockBillingRecords.reduce(
        (acc, record) => {
          acc.totalRecords++;
          if (record.status === "completed") {
            acc.completedRecords++;
            acc.totalAmount += record.totalAmount || 0;
          } else if (record.status === "processing") {
            acc.processingRecords++;
          }
          return acc;
        },
        {
          totalRecords: 0,
          completedRecords: 0,
          processingRecords: 0,
          totalAmount: 0,
        },
      );
      setStats(mockStats);
      setRecentRecords(mockBillingRecords.slice(0, 5));
      return;
    }

    // Listen to all records for stats
    const unsubscribeAll = onSnapshot(
      collection(db, "billing-records"),
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BillingRecord[];

        const newStats = records.reduce(
          (acc, record) => {
            acc.totalRecords++;
            if (record.status === "completed") {
              acc.completedRecords++;
              acc.totalAmount += record.totalAmount || 0;
            } else if (record.status === "processing") {
              acc.processingRecords++;
            }
            return acc;
          },
          {
            totalRecords: 0,
            completedRecords: 0,
            processingRecords: 0,
            totalAmount: 0,
          },
        );

        setStats(newStats);
      },
    );

    // Listen to recent records
    const unsubscribeRecent = onSnapshot(
      query(
        collection(db, "billing-records"),
        orderBy("extractedAt", "desc"),
        limit(5),
      ),
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BillingRecord[];
        setRecentRecords(records);
      },
    );

    return () => {
      unsubscribeAll();
      unsubscribeRecent();
    };
  }, [isConfigured, firebaseLoading]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Monitor your billing document processing and manage records
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalRecords}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.completedRecords}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.processingRecords}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Quick Upload
              </h2>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showUpload ? "Hide" : "Show"} Upload
              </button>
            </div>

            {showUpload ? (
              <ImageUpload onUploadComplete={handleUploadComplete} />
            ) : (
              <div className="text-center py-8">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Billing Documents
                </h3>
                <p className="text-gray-500 mb-4">
                  Drag and drop or click to upload your billing images for
                  automatic data extraction
                </p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Start Upload
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentRecords.slice(0, 3).map((record) => (
              <div
                key={record.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {record.status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {record.status === "processing" && (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                  {record.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {record.invoiceNumber || "Processing..."}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.vendor || "Unknown vendor"}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {record.totalAmount
                    ? formatCurrency(record.totalAmount)
                    : "--"}
                </div>
              </div>
            ))}
            {recentRecords.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
          <div className="mt-4">
            <Link
              to="/records"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all records →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Records Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Records
          </h2>
          <Link
            to="/records"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all →
          </Link>
        </div>
        <BillingDataTable maxResults={10} showPagination={false} />
      </div>
    </div>
  );
}
