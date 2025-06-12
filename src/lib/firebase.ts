import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Check if all required Firebase environment variables are present
const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !import.meta.env[envVar],
);

if (missingEnvVars.length > 0) {
  console.warn("Missing Firebase environment variables:", missingEnvVars);
  console.warn(
    "Please create a .env file with your Firebase configuration. See .env.example for reference.",
  );
}

// Use fallback values for development/demo purposes
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:demo",
};

// Only initialize Firebase if we have real configuration
let app: any = null;
let db: any = null;
let storage: any = null;
let auth: any = null;

try {
  if (missingEnvVars.length === 0) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
  } else {
    // Create mock objects for development
    console.warn(
      "Firebase not initialized due to missing environment variables. Using mock objects.",
    );
    db = null;
    storage = null;
    auth = null;
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  console.warn("Using mock Firebase objects for development.");
  db = null;
  storage = null;
  auth = null;
}

export { db, storage, auth };
export default app;
