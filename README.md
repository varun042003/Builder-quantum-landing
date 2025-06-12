# BillScan Pro - Automated Billing Data Extraction

A modern React application for automated billing document processing using Firebase and OCR technology.

## Features

- **Automated Data Extraction**: Upload billing images and automatically extract invoice details
- **Real-time Processing**: Firebase Cloud Functions handle OCR processing in the background
- **Modern Dashboard**: Beautiful, responsive interface built with React and TailwindCSS
- **Data Management**: View, edit, and export extracted billing data
- **Cloud Storage**: Secure image storage and database management with Firebase

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, shadcn/ui components
- **Backend**: Firebase (Firestore, Storage, Cloud Functions)
- **Routing**: React Router 6
- **State Management**: React Query
- **File Upload**: React Dropzone

## Quick Start

1. **Clone and Install**

   ```bash
   git clone <repository-url>
   cd billscan-pro
   npm install
   ```

2. **Firebase Setup**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Cloud Storage
   - Enable Authentication (optional)
   - Download your Firebase config

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Add your Firebase configuration to .env
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Firebase Configuration

### Required Services

1. **Cloud Firestore**: For storing extracted billing data
2. **Cloud Storage**: For uploading and storing billing images
3. **Cloud Functions**: For OCR processing (requires separate deployment)

### Security Rules

**Firestore Rules** (allow read/write for now - customize for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /billing-records/{document} {
      allow read, write: if true;
    }
  }
}
```

**Storage Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /billing-images/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

## Cloud Function Setup

The OCR processing requires a Cloud Function that:

1. Listens for new image uploads to Cloud Storage
2. Processes images using OCR (Tesseract/Google Vision API)
3. Extracts billing data and stores it in Firestore

Example Cloud Function structure:

```
functions/
├── package.json
├── index.js
└── ocr-processor.py
```

## Data Structure

### BillingRecord

```typescript
interface BillingRecord {
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
```

### BillingItem

```typescript
interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run typecheck` - Run TypeScript type checking
- `npm run format.fix` - Format code with Prettier

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── Layout.tsx       # Main app layout
│   ├── Navigation.tsx   # Sidebar navigation
│   ├── ImageUpload.tsx  # File upload component
│   └── BillingDataTable.tsx
├── pages/               # Page components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Upload.tsx       # Upload page
│   ├── Records.tsx      # Records listing
│   ├── RecordDetail.tsx # Individual record view
│   └── Settings.tsx     # Settings page
├── lib/                 # Utilities and configuration
│   ├── firebase.ts      # Firebase configuration
│   └── utils.ts         # Utility functions
├── types/               # TypeScript type definitions
│   └── billing.ts       # Billing-related types
└── hooks/               # Custom React hooks
```

## Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting**

   ```bash
   firebase init hosting
   firebase deploy
   ```

3. **Deploy Cloud Functions**
   ```bash
   cd functions
   firebase deploy --only functions
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
