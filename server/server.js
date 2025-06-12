const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const Tesseract = require("tesseract.js");
const XLSX = require("xlsx");
const sharp = require("sharp");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Ensure directories exist
const uploadsDir = path.join(__dirname, "uploads");
const exportsDir = path.join(__dirname, "exports");
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(exportsDir);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|bmp|tiff/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// In-memory storage for processed records
let billingRecords = [];

// Helper function to preprocess image
async function preprocessImage(imagePath) {
  const outputPath = imagePath.replace(
    path.extname(imagePath),
    "_processed.png",
  );

  await sharp(imagePath)
    .greyscale()
    .normalize()
    .sharpen()
    .png()
    .toFile(outputPath);

  return outputPath;
}

// Helper function to extract billing data from OCR text
function extractBillingData(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);

  // Initialize data structure
  const billingData = {
    invoiceNumber: "",
    vendor: "",
    date: "",
    totalAmount: 0,
    currency: "USD",
    items: [],
    rawText: text,
    confidence: 0.8,
  };

  // Extract invoice number
  const invoiceMatch = text.match(/(?:invoice|inv|bill)[\s#:]*([a-z0-9\-]+)/i);
  if (invoiceMatch) {
    billingData.invoiceNumber = invoiceMatch[1];
  }

  // Extract date
  const dateMatch = text.match(
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
  );
  if (dateMatch) {
    billingData.date = dateMatch[0];
  }

  // Extract total amount
  const amountMatch = text.match(/(?:total|amount|sum)[\s:$]*(\d+\.?\d*)/i);
  if (amountMatch) {
    billingData.totalAmount = parseFloat(amountMatch[1]);
  }

  // Extract vendor (usually first meaningful line)
  const meaningfulLines = lines.filter(
    (line) =>
      line.length > 3 && !line.match(/^\d+$/) && !line.match(/^[\/\-\s]+$/),
  );

  if (meaningfulLines.length > 0) {
    billingData.vendor = meaningfulLines[0];
  }

  // Extract line items (simple pattern matching)
  const itemPattern = /(.+?)\s+(\d+)\s*x?\s*\$?(\d+\.?\d*)\s*\$?(\d+\.?\d*)/g;
  let match;
  while ((match = itemPattern.exec(text)) !== null) {
    billingData.items.push({
      description: match[1].trim(),
      quantity: parseInt(match[2]),
      unitPrice: parseFloat(match[3]),
      totalPrice: parseFloat(match[4]),
    });
  }

  return billingData;
}

// Helper function to generate Excel file
function generateExcelFile(records) {
  const workbook = XLSX.utils.book_new();

  // Create summary sheet
  const summaryData = records.map((record) => ({
    "Invoice Number": record.invoiceNumber || "N/A",
    Vendor: record.vendor || "N/A",
    Date: record.date || "N/A",
    "Total Amount": record.totalAmount || 0,
    Currency: record.currency || "USD",
    Status: record.status || "completed",
    "Processed Date": new Date(record.extractedAt).toLocaleDateString(),
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Create detailed sheet with line items
  const detailedData = [];
  records.forEach((record) => {
    if (record.items && record.items.length > 0) {
      record.items.forEach((item) => {
        detailedData.push({
          "Invoice Number": record.invoiceNumber || "N/A",
          Vendor: record.vendor || "N/A",
          "Item Description": item.description || "N/A",
          Quantity: item.quantity || 0,
          "Unit Price": item.unitPrice || 0,
          "Total Price": item.totalPrice || 0,
          "Invoice Date": record.date || "N/A",
        });
      });
    } else {
      // Add invoice without line items
      detailedData.push({
        "Invoice Number": record.invoiceNumber || "N/A",
        Vendor: record.vendor || "N/A",
        "Item Description": "No items extracted",
        Quantity: 0,
        "Unit Price": 0,
        "Total Price": record.totalAmount || 0,
        "Invoice Date": record.date || "N/A",
      });
    }
  });

  const detailedSheet = XLSX.utils.json_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(workbook, detailedSheet, "Line Items");

  // Generate filename and save
  const filename = `billing_export_${new Date().toISOString().split("T")[0]}_${Date.now()}.xlsx`;
  const filepath = path.join(exportsDir, filename);

  XLSX.writeFile(workbook, filepath);

  return { filename, filepath };
}

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "BillScan Pro Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Upload and process image
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const imageId = uuidv4();
    const imagePath = req.file.path;

    // Create initial record
    const record = {
      id: imageId,
      originalFilename: req.file.originalname,
      imagePath: imagePath,
      status: "processing",
      uploadedAt: new Date().toISOString(),
      extractedAt: null,
      rawText: null,
      invoiceNumber: null,
      vendor: null,
      date: null,
      totalAmount: null,
      currency: "USD",
      items: [],
      confidence: 0,
    };

    billingRecords.push(record);

    // Send immediate response
    res.json({
      id: imageId,
      status: "processing",
      message: "Image uploaded successfully. Processing started.",
    });

    // Process image asynchronously
    processImageAsync(imageId, imagePath);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Async image processing function
async function processImageAsync(recordId, imagePath) {
  try {
    console.log(`Processing image for record ${recordId}`);

    // Preprocess image
    const processedImagePath = await preprocessImage(imagePath);

    // Perform OCR
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(processedImagePath, "eng", {
      logger: (m) => console.log(`OCR Progress for ${recordId}:`, m),
    });

    // Extract billing data
    const billingData = extractBillingData(text);
    billingData.confidence = confidence / 100; // Convert to decimal

    // Update record
    const recordIndex = billingRecords.findIndex((r) => r.id === recordId);
    if (recordIndex !== -1) {
      billingRecords[recordIndex] = {
        ...billingRecords[recordIndex],
        ...billingData,
        status: "completed",
        extractedAt: new Date().toISOString(),
        rawText: text,
      };
    }

    console.log(`Processing completed for record ${recordId}`);

    // Clean up processed image
    if (fs.existsSync(processedImagePath)) {
      fs.removeSync(processedImagePath);
    }
  } catch (error) {
    console.error(`Processing error for record ${recordId}:`, error);

    // Update record with error status
    const recordIndex = billingRecords.findIndex((r) => r.id === recordId);
    if (recordIndex !== -1) {
      billingRecords[recordIndex].status = "error";
      billingRecords[recordIndex].extractedAt = new Date().toISOString();
    }
  }
}

// Get all records
app.get("/api/records", (req, res) => {
  try {
    const records = billingRecords.map((record) => ({
      id: record.id,
      invoiceNumber: record.invoiceNumber,
      vendor: record.vendor,
      date: record.date,
      totalAmount: record.totalAmount,
      currency: record.currency,
      status: record.status,
      extractedAt: record.extractedAt,
      confidence: record.confidence,
      items: record.items || [],
    }));

    res.json(records);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// Get single record
app.get("/api/records/:id", (req, res) => {
  try {
    const record = billingRecords.find((r) => r.id === req.params.id);

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(record);
  } catch (error) {
    console.error("Error fetching record:", error);
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

// Update record
app.put("/api/records/:id", (req, res) => {
  try {
    const recordIndex = billingRecords.findIndex((r) => r.id === req.params.id);

    if (recordIndex === -1) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Update record with provided data
    billingRecords[recordIndex] = {
      ...billingRecords[recordIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json(billingRecords[recordIndex]);
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ error: "Failed to update record" });
  }
});

// Export to Excel
app.post("/api/export", (req, res) => {
  try {
    const completedRecords = billingRecords.filter(
      (r) => r.status === "completed",
    );

    if (completedRecords.length === 0) {
      return res.status(400).json({ error: "No completed records to export" });
    }

    const { filename, filepath } = generateExcelFile(completedRecords);

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "Failed to download file" });
      }

      // Clean up file after download
      setTimeout(() => {
        if (fs.existsSync(filepath)) {
          fs.removeSync(filepath);
        }
      }, 60000); // Delete after 1 minute
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

// Get export status
app.get("/api/export/status", (req, res) => {
  try {
    const totalRecords = billingRecords.length;
    const completedRecords = billingRecords.filter(
      (r) => r.status === "completed",
    ).length;
    const processingRecords = billingRecords.filter(
      (r) => r.status === "processing",
    ).length;
    const errorRecords = billingRecords.filter(
      (r) => r.status === "error",
    ).length;

    res.json({
      total: totalRecords,
      completed: completedRecords,
      processing: processingRecords,
      error: errorRecords,
      canExport: completedRecords > 0,
    });
  } catch (error) {
    console.error("Error getting export status:", error);
    res.status(500).json({ error: "Failed to get export status" });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File size too large. Maximum size is 10MB." });
    }
  }

  console.error("Server error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BillScan Pro Backend running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`📊 Exports directory: ${exportsDir}`);
  console.log(`🔍 OCR Engine: Tesseract.js`);
  console.log(`📋 Excel Export: XLSX`);
});
