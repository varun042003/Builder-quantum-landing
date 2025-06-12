export interface BillingRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  currency: string;
  vendor: string;
  items: BillingItem[];
  imageUrl: string;
  extractedAt: string;
  status: "processing" | "completed" | "error";
  confidence: number;
}

export interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UploadStatus {
  uploading: boolean;
  progress: number;
  error?: string;
}
