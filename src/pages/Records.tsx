import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { Search, Filter, Download, Upload, FileText } from "lucide-react";
import { db } from "@/lib/firebase";
import { BillingRecord } from "@/types/billing";
import { BillingDataTable } from "@/components/BillingDataTable";
import { useFirebaseStatus, mockBillingRecords } from "@/hooks/useFirebase";

export default function Records() {
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const { isConfigured, isLoading: firebaseLoading } = useFirebaseStatus();

  useEffect(() => {
    if (firebaseLoading) return;

    if (!isConfigured || !db) {
      // Use mock data when Firebase is not configured
      setRecords(mockBillingRecords);
      setLoading(false);
      return;
    }

    // Use real Firebase data when configured
    const unsubscribe = onSnapshot(
      query(collection(db, "billing-records"), orderBy("extractedAt", "desc")),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BillingRecord[];

        setRecords(data);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isConfigured, firebaseLoading]);

  useEffect(() => {
    let filtered = records;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.invoiceNumber
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          record.vendor?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          filterDate.setFullYear(1970);
      }

      filtered = filtered.filter(
        (record) => new Date(record.extractedAt || 0) >= filterDate,
      );
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter, dateFilter]);

  const exportToCSV = () => {
    const completedRecords = filteredRecords.filter(
      (r) => r.status === "completed",
    );

    if (completedRecords.length === 0) {
      alert("No completed records to export");
      return;
    }

    const headers = [
      "Invoice Number",
      "Vendor",
      "Date",
      "Amount",
      "Currency",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...completedRecords.map((record) =>
        [
          record.invoiceNumber || "",
          record.vendor || "",
          record.date || "",
          record.totalAmount || "",
          record.currency || "USD",
          record.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `billing-records-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTotalAmount = () => {
    return filteredRecords
      .filter((r) => r.status === "completed")
      .reduce((sum, record) => sum + (record.totalAmount || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Billing Records
            </h1>
            <p className="text-gray-600">
              Manage and view all your processed billing documents
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">Total Records</div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredRecords.length}
            </div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredRecords.filter((r) => r.status === "completed").length}
            </div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">Processing</div>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredRecords.filter((r) => r.status === "processing").length}
            </div>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">Total Amount</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(getTotalAmount())}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoices or vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="error">Error</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setDateFilter("all");
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      {loading || firebaseLoading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
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
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No records found
          </h3>
          <p className="text-gray-500 mb-4">
            {records.length === 0
              ? "Start by uploading your first billing document."
              : "Try adjusting your search or filter criteria."}
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Document
          </Link>
        </div>
      ) : (
        <BillingDataTable />
      )}
    </div>
  );
}
