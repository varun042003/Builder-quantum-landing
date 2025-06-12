import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Download,
  FileText,
  Calendar,
  DollarSign,
  Building,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { BillingRecord } from "@/types/billing";
import { useFirebaseStatus, mockBillingRecords } from "@/hooks/useFirebase";

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<BillingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<BillingRecord>>({});
  const { isConfigured, isLoading: firebaseLoading } = useFirebaseStatus();

  useEffect(() => {
    if (!id || firebaseLoading) return;

    if (!isConfigured || !db) {
      // Use mock data when Firebase is not configured
      const mockRecord = mockBillingRecords.find((r) => r.id === id);
      if (mockRecord) {
        setRecord(mockRecord);
        setEditForm(mockRecord);
      }
      setLoading(false);
      return;
    }

    // Use real Firebase data when configured
    const fetchRecord = async () => {
      try {
        const docRef = doc(db, "billing-records", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as BillingRecord;
          setRecord(data);
          setEditForm(data);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id, isConfigured, firebaseLoading]);

  const handleSave = async () => {
    if (!id || !editForm) return;

    if (!isConfigured || !db) {
      // In demo mode, just update the local state
      setRecord({ ...record!, ...editForm });
      setEditing(false);
      console.log("Demo mode: Changes saved locally only");
      return;
    }

    try {
      const docRef = doc(db, "billing-records", id);
      await updateDoc(docRef, editForm);

      setRecord({ ...record!, ...editForm });
      setEditing(false);
    } catch (error) {
      console.error("Error updating document:", error);
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
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Record not found
          </h3>
          <p className="text-gray-500 mb-4">
            The requested billing record could not be found.
          </p>
          <Link
            to="/records"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Records
          </Link>
        </div>
      </div>
    );
  }

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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {record.invoiceNumber || "Billing Record"}
            </h1>
            <p className="text-gray-600">
              {record.status === "processing"
                ? "Currently processing..."
                : "View and edit billing details"}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditForm(record);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.invoiceNumber || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        invoiceNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {record.invoiceNumber || "Processing..."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.vendor || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, vendor: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {record.vendor || "Processing..."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                {editing ? (
                  <input
                    type="date"
                    value={editForm.date || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {record.date ? formatDate(record.date) : "Processing..."}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                {editing ? (
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.totalAmount || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        totalAmount: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 text-xl font-semibold">
                    {record.totalAmount
                      ? formatCurrency(record.totalAmount, record.currency)
                      : "Processing..."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          {record.items && record.items.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Line Items
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {record.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {formatCurrency(item.unitPrice, record.currency)}
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(item.totalPrice, record.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Image */}
          {record.imageUrl && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Original Document
              </h3>
              <img
                src={record.imageUrl}
                alt="Billing document"
                className="w-full rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Status & Metadata */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status & Metadata
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : record.status === "processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {record.status}
                </span>
              </div>

              {record.confidence && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidence</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(record.confidence * 100)}%
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Extracted At</span>
                <span className="text-sm text-gray-900">
                  {record.extractedAt
                    ? formatDate(record.extractedAt)
                    : "Processing..."}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Invoice Date</div>
                  <div className="font-medium text-gray-900">
                    {record.date ? formatDate(record.date) : "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="font-medium text-gray-900">
                    {record.totalAmount
                      ? formatCurrency(record.totalAmount, record.currency)
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-600">Vendor</div>
                  <div className="font-medium text-gray-900">
                    {record.vendor || "N/A"}
                  </div>
                </div>
              </div>

              {record.items && (
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-sm text-gray-600">Line Items</div>
                    <div className="font-medium text-gray-900">
                      {record.items.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
