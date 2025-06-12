import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Download,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Server,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { BillingRecord } from "@/types/billing";
import { cn } from "@/lib/utils";

interface BillingDataTableBackendProps {
  maxResults?: number;
  showPagination?: boolean;
}

export function BillingDataTableBackend({
  maxResults,
  showPagination = true,
}: BillingDataTableBackendProps) {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check backend health first
      const healthResponse = await apiClient.healthCheck();
      if (healthResponse.error) {
        setBackendConnected(false);
        setError("Backend server is not responding");
        setLoading(false);
        return;
      }

      setBackendConnected(true);

      // Fetch records
      const response = await apiClient.getRecords();
      if (response.error) {
        setError(response.error);
      } else {
        let fetchedRecords = response.data || [];
        if (maxResults) {
          fetchedRecords = fetchedRecords.slice(0, maxResults);
        }
        setRecords(fetchedRecords);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch records");
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();

    // Set up polling for real-time updates
    const interval = setInterval(fetchRecords, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [maxResults]);

  const getStatusIcon = (status: BillingRecord["status"]) => {
    switch (status) {
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: BillingRecord["status"]) => {
    switch (status) {
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading records from backend...</span>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Server className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Backend Connection Error
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-3">
                <button
                  onClick={fetchRecords}
                  className="text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition-colors"
                >
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Backend Server Required
          </h3>
          <p className="text-gray-500 mb-4">
            The backend server needs to be running to view and process billing
            records.
          </p>
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">To start the backend server:</p>
            <ol className="list-decimal text-left max-w-md mx-auto space-y-1">
              <li>Open a new terminal</li>
              <li>
                Navigate to server directory:{" "}
                <code className="bg-gray-200 px-1 rounded">cd server</code>
              </li>
              <li>
                Install dependencies:{" "}
                <code className="bg-gray-200 px-1 rounded">npm install</code>
              </li>
              <li>
                Start the server:{" "}
                <code className="bg-gray-200 px-1 rounded">npm start</code>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="text-sm text-green-800">
              Backend Server Connected
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No billing records found
          </h3>
          <p className="text-gray-500 mb-4">
            Start by uploading your first billing document for OCR processing.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Document
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-700">
            Backend Connected - Auto-refreshing every 5 seconds
          </span>
        </div>
        <button
          onClick={fetchRecords}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.invoiceNumber || "Processing..."}
                    </div>
                    {record.confidence && record.confidence < 0.8 && (
                      <div className="text-xs text-yellow-600">
                        Low confidence ({Math.round(record.confidence * 100)}%)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.vendor || "Processing..."}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.date ? formatDate(record.date) : "Processing..."}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {record.totalAmount
                        ? formatCurrency(record.totalAmount, record.currency)
                        : "Processing..."}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(record.status)}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          record.status === "completed" && "text-green-700",
                          record.status === "processing" && "text-yellow-700",
                          record.status === "error" && "text-red-700",
                        )}
                      >
                        {getStatusText(record.status)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/records/${record.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {record.status === "completed" && (
                        <button
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Export individual record"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
