# BillScan Pro Backend

A Node.js backend server that provides OCR processing and Excel export functionality for the BillScan Pro application.

## Features

- **Image Upload & Processing**: Accept billing document images
- **OCR Text Extraction**: Use Tesseract.js for optical character recognition
- **Data Extraction**: Parse billing information (invoice numbers, amounts, vendors, etc.)
- **Excel Export**: Generate formatted Excel files with extracted data
- **Real-time Processing**: Asynchronous image processing with status updates
- **REST API**: Complete API for frontend integration

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **OCR Engine**: Tesseract.js
- **Image Processing**: Sharp
- **Excel Generation**: XLSX
- **File Upload**: Multer

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 3. Verify Installation

The server will start on `http://localhost:3001`. You can verify it's running by visiting:

```
http://localhost:3001/api/health
```

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and configuration.

### Upload Image

```
POST /api/upload
Content-Type: multipart/form-data
Body: { image: File }
```

Uploads an image for OCR processing.

### Get All Records

```
GET /api/records
```

Returns all processed billing records.

### Get Single Record

```
GET /api/records/:id
```

Returns a specific billing record by ID.

### Update Record

```
PUT /api/records/:id
Content-Type: application/json
Body: { field: value, ... }
```

Updates a billing record with new data.

### Export Status

```
GET /api/export/status
```

Returns export statistics and status.

### Export to Excel

```
POST /api/export
```

Generates and downloads an Excel file with all completed records.

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
UPLOAD_LIMIT=10mb
OCR_LANGUAGE=eng
```

### File Limits

- **Maximum file size**: 10MB per image
- **Supported formats**: JPG, PNG, WEBP, BMP, TIFF
- **Processing time**: 30-60 seconds per image

## Directory Structure

```
server/
├── package.json          # Dependencies and scripts
├── server.js             # Main server file
├── uploads/              # Temporary image storage
├── exports/              # Generated Excel files
└── README.md            # This file
```

## Data Processing

### OCR Processing

1. **Image Preprocessing**:

   - Convert to grayscale
   - Normalize brightness
   - Sharpen for better OCR accuracy

2. **Text Extraction**:

   - Use Tesseract.js with English language model
   - Extract raw text with confidence scores

3. **Data Parsing**:
   - Extract invoice numbers using regex patterns
   - Parse dates in common formats
   - Identify total amounts and currencies
   - Extract vendor information
   - Parse line items where possible

### Excel Export

Generated Excel files contain:

1. **Summary Sheet**:

   - Invoice Number
   - Vendor
   - Date
   - Total Amount
   - Currency
   - Status
   - Processed Date

2. **Line Items Sheet**:
   - Detailed breakdown of individual items
   - Quantities and unit prices
   - Associated invoice information

## Error Handling

The server includes comprehensive error handling for:

- Invalid file formats
- File size limits
- OCR processing failures
- Excel generation errors
- Network connectivity issues

## Performance

- **Asynchronous Processing**: Images are processed in the background
- **Real-time Updates**: Frontend can poll for processing status
- **Memory Management**: Automatic cleanup of temporary files
- **Concurrent Uploads**: Multiple images can be processed simultaneously

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for automatic server restart when files change.

### Testing the API

You can test the API using curl:

```bash
# Health check
curl http://localhost:3001/api/health

# Upload image
curl -X POST -F "image=@test-invoice.jpg" http://localhost:3001/api/upload

# Get records
curl http://localhost:3001/api/records
```

## Production Deployment

For production deployment:

1. Set NODE_ENV=production
2. Use a process manager like PM2
3. Configure reverse proxy (nginx)
4. Set up proper logging
5. Configure file cleanup schedules

## Troubleshooting

### Common Issues

1. **Port Already in Use**:

   ```
   Error: listen EADDRINUSE :::3001
   ```

   Solution: Change port in `.env` or kill process using port 3001

2. **OCR Processing Slow**:

   - OCR can take 30-60 seconds per image
   - Consider upgrading server hardware for faster processing

3. **File Upload Errors**:
   - Check file size (max 10MB)
   - Verify supported image format
   - Ensure sufficient disk space

### Logs

Server logs include:

- Upload status
- OCR processing progress
- Error messages
- Performance metrics

## License

MIT License - see main project LICENSE file for details.
