
// Use namespace import to resolve environment-specific module resolution issues with Firebase exports
import * as firebaseApp from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAdr5J_-sf3Q486Wzmri3gYdOJLC-pMZEE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "workout-app-20752.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "workout-app-20752",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "workout-app-20752.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "649579159803",
  appId: process.env.FIREBASE_APP_ID || "1:649579159803:web:886b8bb1e56a0c2dda505e",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-GXX10CEYPK"
};

// Destructure from the namespace to bypass potential missing type exports in certain environments
const { initializeApp, getApps, getApp } = firebaseApp as any;

// Use any for types to resolve environment-specific module resolution issues with Firebase exports
let app: any;
let db: any;

// Initialize Firebase modularly
try {
  const apps = getApps();
  app = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase Initialization Failed", e);
}

export { db };

export const syncToCloud = async (collectionName: string, data: any, userId: string) => {
  if (!db || !userId) return;
  try {
    const docRef = doc(db, collectionName, userId);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString(), authorizedBy: userId });
    
    // 修正：當更新 profile 時，將 name 與 role 一併寫入註冊表，以便 Admin Panel 讀取
    if (collectionName === 'profiles') {
      const registryRef = doc(db, 'system_metadata', 'user_registry');
      await setDoc(registryRef, { [userId]: { 
        memberId: userId, 
        name: data.name, // 新增同步欄位
        role: data.role, // 新增同步欄位
        lastActive: new Date().toISOString(), 
        status: 'ACTIVE' 
      } }, { merge: true });
    }
  } catch (error) {
    console.error(`[Cloud Error] ${collectionName} 同步失敗:`, error);
  }
};

export const fetchFromCloud = async (collectionName: string, userId: string) => {
  if (!db || !userId) return null;
  try {
    const docRef = doc(db, collectionName, userId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data().data : null;
  } catch (error) {
    console.error(`[Cloud Error] ${collectionName} 讀取失敗:`, error);
    return null;
  }
};

export const recordLoginEvent = async (userId: string) => {
  if (!db) return;
  try {
    const logId = `log_${Date.now()}`;
    await setDoc(doc(db, 'auth_logs', logId), { memberId: userId, timestamp: new Date().toISOString(), userAgent: navigator.userAgent });
    await setDoc(doc(db, 'system_metadata', 'user_registry'), { [userId]: { lastActive: new Date().toISOString() } }, { merge: true });
  } catch (e) {}
};

export const getAllUsers = async () => {
  if (!db) return {};
  try {
    const snap = await getDoc(doc(db, 'system_metadata', 'user_registry'));
    return snap.exists() ? snap.data() : {};
  } catch (e) { return {}; }
};

export const getAllAuthLogs = async () => {
  if (!db) return [];
  try {
    const querySnapshot = await getDocs(collection(db, "auth_logs"));
    return querySnapshot.docs.map(doc => doc.data()).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) { return []; }
};

export const purgeUser = async (userId: string) => {
  if (!db) return;
  const collections = ['profiles', 'metrics', 'logs', 'physique'];
  for (const col of collections) {
    try { await deleteDoc(doc(db, col, userId)); } catch(e) {}
  }
};
