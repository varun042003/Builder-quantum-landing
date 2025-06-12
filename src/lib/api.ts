const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  id: string;
  status: string;
  message: string;
}

export interface ExportStatus {
  total: number;
  completed: number;
  processing: number;
  error: number;
  canExport: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error:
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request("/health");
  }

  // Upload image for OCR processing
  async uploadImage(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append("image", file);

    return this.request("/upload", {
      method: "POST",
      headers: {}, // Remove Content-Type header to let browser set it with boundary
      body: formData,
    });
  }

  // Get all records
  async getRecords(): Promise<ApiResponse<any[]>> {
    return this.request("/records");
  }

  // Get single record
  async getRecord(id: string): Promise<ApiResponse<any>> {
    return this.request(`/records/${id}`);
  }

  // Update record
  async updateRecord(id: string, data: any): Promise<ApiResponse<any>> {
    return this.request(`/records/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Get export status
  async getExportStatus(): Promise<ApiResponse<ExportStatus>> {
    return this.request("/export/status");
  }

  // Export to Excel (returns blob for download)
  async exportToExcel(): Promise<Blob | null> {
    try {
      const url = `${this.baseUrl}/export`;
      const response = await fetch(url, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error("Export error:", error);
      return null;
    }
  }

  // Download exported file
  async downloadExport(): Promise<void> {
    const blob = await this.exportToExcel();
    if (!blob) {
      throw new Error("Failed to generate export file");
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `billing_export_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
