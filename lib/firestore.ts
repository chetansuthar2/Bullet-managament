import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

export interface RepairEntry {
  id?: string;
  customerName: string;
  contactNumber: string;
  address: string;
  bikeType: string;
  bikeModel: string;
  numberPlate: string;
  repairType: string;
  entryDate: string;
 
  advancecash: string;
  status: "pending" | "delivered";
  deliveryDate?: string;
  paymentMethod?: string;
  totalAmount?: string;
  createdAt?: any;
}

const COLLECTION_NAME = "bikeRepairs";

// Add new repair entry
export const addRepairEntry = async (entry: Omit<RepairEntry, "id">) => {
  if (!db) throw new Error("Firestore not initialized");

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...entry,
    createdAt: new Date(),
  });
  return docRef.id;
};

// Get all repair entries
export const getRepairEntries = async () => {
  if (!db) throw new Error("Firestore not initialized");

  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  const entries: RepairEntry[] = [];

  querySnapshot.forEach((doc) => {
    entries.push({
      id: doc.id,
      ...doc.data(),
    } as RepairEntry);
  });

  return entries;
};

// Update repair entry
export const updateRepairEntry = async (id: string, updates: Partial<RepairEntry>) => {
  if (!db) throw new Error("Firestore not initialized");

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updates);
};

// Delete repair entry
export const deleteRepairEntry = async (id: string) => {
  if (!db) throw new Error("Firestore not initialized");

  await deleteDoc(doc(db, COLLECTION_NAME, id));
};

// Real-time listener
export const subscribeToRepairEntries = (
  callback: (entries: RepairEntry[]) => void
) => {
  if (!db) throw new Error("Firestore not initialized");

  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  return onSnapshot(q, (querySnapshot) => {
    const entries: RepairEntry[] = [];
    querySnapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data(),
      } as RepairEntry);
    });
    callback(entries);
  });
};
