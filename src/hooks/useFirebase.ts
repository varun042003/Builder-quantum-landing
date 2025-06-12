import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";

// Hook to check if Firebase is properly configured
export function useFirebaseStatus() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Firebase is properly initialized
    if (db !== null) {
      setIsConfigured(true);
    } else {
      setIsConfigured(false);
    }
    setIsLoading(false);
  }, []);

  return { isConfigured, isLoading };
}

// Mock data for development when Firebase is not configured
export const mockBillingRecords = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001",
    vendor: "Office Supplies Co.",
    date: "2024-01-15",
    totalAmount: 299.99,
    currency: "USD",
    status: "completed" as const,
    extractedAt: "2024-01-15T10:30:00Z",
    confidence: 0.95,
    imageUrl:
      "https://via.placeholder.com/400x600/f3f4f6/374151?text=Invoice+Sample",
    items: [
      {
        description: "Office Chair",
        quantity: 1,
        unitPrice: 199.99,
        totalPrice: 199.99,
      },
      {
        description: "Desk Lamp",
        quantity: 2,
        unitPrice: 50.0,
        totalPrice: 100.0,
      },
    ],
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-002",
    vendor: "Tech Solutions Inc.",
    date: "2024-01-16",
    totalAmount: 1250.0,
    currency: "USD",
    status: "processing" as const,
    extractedAt: "2024-01-16T14:20:00Z",
    confidence: 0.88,
    imageUrl:
      "https://via.placeholder.com/400x600/f3f4f6/374151?text=Processing+Invoice",
    items: [],
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-003",
    vendor: "Catering Services Ltd.",
    date: "2024-01-17",
    totalAmount: 450.75,
    currency: "USD",
    status: "completed" as const,
    extractedAt: "2024-01-17T09:15:00Z",
    confidence: 0.92,
    imageUrl:
      "https://via.placeholder.com/400x600/f3f4f6/374151?text=Catering+Invoice",
    items: [
      {
        description: "Business Lunch Catering",
        quantity: 1,
        unitPrice: 400.0,
        totalPrice: 400.0,
      },
      {
        description: "Service Fee",
        quantity: 1,
        unitPrice: 50.75,
        totalPrice: 50.75,
      },
    ],
  },
];
