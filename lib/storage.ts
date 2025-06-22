// Unified storage layer that works with Firebase, MongoDB, and localStorage
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
  Timestamp,
  where
} from "firebase/firestore"
import { db, isFirebaseAvailable } from "./firebase"

// Client-side MongoDB functions
import {
  addRepairEntryToServer,
  getRepairEntriesFromServer,
  updateRepairEntryOnServer,
  deleteRepairEntryFromServer,
} from "./clientStorage"

export interface RepairEntry {
  id?: string
  userId: string
  customerName: string
  contactNumber: string
  address: string
  bikeType: string
  bikeModel: string;
  numberPlate: string
  repairType: string
  entryDate: string
  advancecash: string
  status: "pending" | "delivered"
  deliveryDate: string
  paymentMethod: string
  totalAmount: string
  createdAt: any
  parts?: {
    description: string
    quantity: number
    price: number
  }[]
  finalAmount?: string
  imageUrl?: string
}

const COLLECTION_NAME = "bikeRepairs"
const LOCAL_STORAGE_KEY = "bikeRepairEntries"

const getUserLocalStorageKey = (userId: string) => `${LOCAL_STORAGE_KEY}_${userId}`

// Storage type configuration
const getStoragePreference = (): 'mongodb' | 'firebase' | 'localStorage' => {
  // Check environment variable for storage preference
  const envStorage = process.env.NEXT_PUBLIC_STORAGE_TYPE;
  console.log('Environment storage type:', envStorage);

  if (envStorage === 'mongodb') {
    return 'mongodb';
  }
  if (envStorage === 'firebase') {
    return 'firebase';
  }
  if (envStorage === 'localStorage') {
    return 'localStorage';
  }

  // Default fallback: localStorage (most reliable)
  console.log('No storage type specified, defaulting to localStorage');
  return 'localStorage';
}

const getFromLocalStorage = (userId: string): RepairEntry[] => {
  if (typeof window === "undefined") return []

  try {
    const key = getUserLocalStorageKey(userId)
    console.log('Reading from localStorage with key:', key);
    const data = localStorage.getItem(key)
    const entries = data ? JSON.parse(data) : []
    console.log('Retrieved data from localStorage:', entries.length, 'entries');
    return entries
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return []
  }
}

const saveToLocalStorage = (userId: string, entries: RepairEntry[]) => {
  if (typeof window === "undefined") return

  try {
    const key = getUserLocalStorageKey(userId)
    console.log('Saving to localStorage with key:', key, 'entries:', entries.length);
    localStorage.setItem(key, JSON.stringify(entries))
    console.log('Successfully saved to localStorage');
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

// Firebase functions
const addToFirebase = async (entry: Omit<RepairEntry, "id">) => {
  if (!isFirebaseAvailable || !db) throw new Error("Firebase not available")

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...entry,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

// MODIFIED: Get user-specific entries from Firebase
const getFromFirebase = async (userId: string): Promise<RepairEntry[]> => {
  if (!isFirebaseAvailable || !db) throw new Error("Firebase not available")

  const q = query(
    collection(db, COLLECTION_NAME),
    where("userId", "==", userId)
  )
  
  const querySnapshot = await getDocs(q)
  const entries: RepairEntry[] = []

  querySnapshot.forEach((doc) => {
    entries.push({
      id: doc.id,
      ...doc.data(),
    } as RepairEntry)
  })

  // Sort client-side to avoid index requirement
  return entries.sort((a, b) => {
    const aTime = a.createdAt instanceof Timestamp 
      ? a.createdAt.toMillis() 
      : new Date(a.createdAt).getTime()
      
    const bTime = b.createdAt instanceof Timestamp 
      ? b.createdAt.toMillis() 
      : new Date(b.createdAt).getTime()
      
    return bTime - aTime // Descending order
  })
}

const updateInFirebase = async (id: string, updates: Partial<RepairEntry>) => {
  if (!isFirebaseAvailable || !db) throw new Error("Firebase not available")

  const docRef = doc(db, COLLECTION_NAME, id)
  await updateDoc(docRef, updates)
}

const deleteFromFirebase = async (id: string) => {
  if (!isFirebaseAvailable || !db) throw new Error("Firebase not available")

  await deleteDoc(doc(db, COLLECTION_NAME, id))
}

// Unified API
export const addRepairEntry = async (entry: Omit<RepairEntry, "id">): Promise<string> => {
  if (!entry.userId) throw new Error("User ID is required")

  const storageType = getStoragePreference();
  console.log('Using storage type:', storageType);

  try {
    // Always use Firebase for data storage (primary)
    if (storageType === 'firebase' && isFirebaseAvailable) {
      console.log('Saving data to Firebase (primary storage)...');
      return await addToFirebase(entry)
    } else if (storageType === 'mongodb') {
      console.log('Attempting MongoDB save...');
      return await addRepairEntryToServer(entry);
    } else {
      console.log('Using localStorage...');
      const entries = getFromLocalStorage(entry.userId)
      const newEntry: RepairEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }
      console.log('Creating new entry:', newEntry);
      entries.unshift(newEntry)
      saveToLocalStorage(entry.userId, entries)
      console.log('Entry saved successfully with ID:', newEntry.id);
      return newEntry.id!
    }
  } catch (error) {
    console.error("Error adding entry with", storageType, ":", error)

    // Try Firebase as fallback if MongoDB failed
    if (storageType === 'mongodb' && isFirebaseAvailable) {
      try {
        console.log('MongoDB failed, trying Firebase fallback...');
        return await addToFirebase(entry);
      } catch (firebaseError) {
        console.error("Firebase fallback also failed:", firebaseError);
      }
    }

    // Final fallback to localStorage
    console.log('Using localStorage as final fallback...');
    const entries = getFromLocalStorage(entry.userId)
    const newEntry: RepairEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    console.log('Creating fallback entry:', newEntry);
    entries.unshift(newEntry)
    saveToLocalStorage(entry.userId, entries)
    console.log('Fallback entry saved successfully with ID:', newEntry.id);
    return newEntry.id!
  }
}

export const getRepairEntries = async (userId: string): Promise<RepairEntry[]> => {
  if (!userId) return []

  const storageType = getStoragePreference();

  try {
    // Always use Firebase for data retrieval (primary)
    if (storageType === 'firebase' && isFirebaseAvailable) {
      console.log('Getting data from Firebase (primary storage)...');
      return await getFromFirebase(userId)
    } else if (storageType === 'mongodb') {
      return await getRepairEntriesFromServer(userId);
    } else {
      return getFromLocalStorage(userId)
    }
  } catch (error) {
    console.error("Error getting entries:", error)
    return getFromLocalStorage(userId)
  }
}

export const updateRepairEntry = async (id: string, updates: Partial<RepairEntry>) => {
  console.log('=== UPDATE REPAIR ENTRY ===');
  console.log('Entry ID:', id);
  console.log('Updates:', updates);

  const storageType = getStoragePreference();
  console.log('Using storage type for update:', storageType);

  try {
    if (storageType === 'mongodb') {
      console.log('Attempting MongoDB update...');
      await updateRepairEntryOnServer(id, updates);
    } else if (storageType === 'firebase' && isFirebaseAvailable) {
      console.log('Attempting Firebase update...');
      await updateInFirebase(id, updates)
    } else {
      console.log('Using localStorage for update...');
      if (!updates.userId) {
        // Try to find userId from existing entries
        const allUsers = Object.keys(localStorage).filter(key => key.startsWith('bikeRepairEntries_'));
        let foundUserId = null;

        for (const key of allUsers) {
          const userId = key.replace('bikeRepairEntries_', '');
          const entries = getFromLocalStorage(userId);
          if (entries.find(entry => entry.id === id)) {
            foundUserId = userId;
            break;
          }
        }

        if (!foundUserId) {
          throw new Error("User ID required for local update and entry not found");
        }
        updates.userId = foundUserId;
      }

      const entries = getFromLocalStorage(updates.userId)
      console.log('Found entries for update:', entries.length);
      const index = entries.findIndex((entry) => entry.id === id)
      console.log('Entry index found:', index);

      if (index !== -1) {
        const oldEntry = entries[index];
        entries[index] = { ...oldEntry, ...updates }
        console.log('Updated entry:', entries[index]);
        saveToLocalStorage(updates.userId, entries)
        console.log('Entry updated successfully in localStorage');
      } else {
        console.log('Entry not found with ID:', id);
        throw new Error("Entry not found");
      }
    }
  } catch (error) {
    console.error("Error updating entry:", error)
    // Fallback to localStorage
    if (updates.userId) {
      console.log('Trying localStorage fallback...');
      const entries = getFromLocalStorage(updates.userId)
      const index = entries.findIndex((entry) => entry.id === id)
      if (index !== -1) {
        entries[index] = { ...entries[index], ...updates }
        saveToLocalStorage(updates.userId, entries)
        console.log('Fallback update successful');
      } else {
        console.log('Fallback failed: Entry not found');
      }
    }
  }
}

export const deleteRepairEntry = async (id: string, userId: string) => {
  if (!userId) throw new Error("User ID required for deletion")

  const storageType = getStoragePreference();
  console.log('Deleting entry from storage type:', storageType);

  try {
    // Always use Firebase for data deletion (primary)
    if (storageType === 'firebase' && isFirebaseAvailable) {
      console.log('Deleting data from Firebase (primary storage)...');
      await deleteFromFirebase(id)
    } else if (storageType === 'mongodb') {
      await deleteRepairEntryFromServer(id);
    } else {
      const entries = getFromLocalStorage(userId)
      const filteredEntries = entries.filter((entry) => entry.id !== id)
      saveToLocalStorage(userId, filteredEntries)
    }
    console.log('Entry deleted successfully from storage');
  } catch (error) {
    console.error("Error deleting entry:", error)
    // Fallback to localStorage
    console.log('Using localStorage fallback for deletion...');
    const entries = getFromLocalStorage(userId)
    const filteredEntries = entries.filter((entry) => entry.id !== id)
    saveToLocalStorage(userId, filteredEntries)
  }
}

// MODIFIED: Real-time listener with client-side sorting
export const subscribeToRepairEntries = (userId: string, callback: (entries: RepairEntry[]) => void) => {
  if (!userId) return () => {}

  const storageType = getStoragePreference();

  // Always use Firebase for real-time subscriptions (primary)
  if (storageType === 'firebase' && isFirebaseAvailable && db) {
    console.log('Setting up Firebase real-time subscription (primary)...');
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    )

    return onSnapshot(q, (querySnapshot) => {
      const entries: RepairEntry[] = []
      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data(),
        } as RepairEntry)
      })

      // Sort client-side to avoid index requirement
      const sortedEntries = entries.sort((a, b) => {
        const aTime = a.createdAt instanceof Timestamp
          ? a.createdAt.toMillis()
          : new Date(a.createdAt).getTime()

        const bTime = b.createdAt instanceof Timestamp
          ? b.createdAt.toMillis()
          : new Date(b.createdAt).getTime()

        return bTime - aTime // Descending order
      });

      callback(sortedEntries);
    })
  } else if (storageType === 'mongodb') {
    // For MongoDB via API, use polling since we can't have real-time subscriptions from client
    const pollInterval = setInterval(async () => {
      try {
        const entries = await getRepairEntriesFromServer(userId);
        callback(entries);
      } catch (error) {
        console.error("Error in MongoDB subscription:", error);
      }
    }, 2000); // Poll every 2 seconds

    // Initial call
    getRepairEntriesFromServer(userId).then(callback).catch(console.error);

    return () => clearInterval(pollInterval);
  } else {
    // For localStorage, use polling with shorter interval for better responsiveness
    const loadData = () => {
      const entries = getFromLocalStorage(userId)
      console.log('Polling localStorage, found entries:', entries.length);
      callback(entries)
    }

    // Initial load
    loadData()

    // Poll every 1 second for localStorage updates
    const interval = setInterval(loadData, 1000)
    return () => clearInterval(interval)
  }
}

export const getStorageType = () => {
  const storageType = getStoragePreference();

  if (storageType === 'mongodb') {
    return "MongoDB (Database)"
  } else if (storageType === 'firebase' && isFirebaseAvailable) {
    return "Firebase (Cloud)"
  } else {
    return "Local Storage"
  }
}