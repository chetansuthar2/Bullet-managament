import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

export interface RepairEntry {
  id?: string;
  entryDate: string;
  customerName: string;
  contactNumber: string;
  address: string;
  vehicleCategory?: string; // Main vehicle type (car, bike, bullet, etc.)
  bikeType: string;
  bikeModel: string;
  numberPlate: string;
  repairType: string;
  expectedDeliveryDate: string;
  advancecash: string;
  status: 'pending' | 'delivered';
  userId: string;
  imageUrl?: string;
  deliveryDate?: string;
  parts?: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CompanyDetails {
  companyName: string;
  address: string;
  owner1Name: string;
  owner1Phone: string;
  owner2Name?: string;
  owner2Phone?: string;
  vehicleType: string;
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Add repair entry to Firebase
export const addRepairEntryToFirebase = async (entryData: Omit<RepairEntry, 'id'>): Promise<string> => {
  try {
    console.log('=== FIREBASE: Adding repair entry ===');
    console.log('Entry data:', entryData);
    
    const docData = {
      ...entryData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'repairEntries'), docData);
    console.log('Firebase: Document written with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Firebase: Error adding document:', error);
    throw error;
  }
};

// Get repair entries from Firebase
export const getRepairEntriesFromFirebase = async (userId: string): Promise<RepairEntry[]> => {
  try {
    console.log('=== FIREBASE: Getting repair entries for user:', userId);
    
    const q = query(
      collection(db, 'repairEntries'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries: RepairEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to strings for JSON serialization
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      } as RepairEntry);
    });
    
    console.log(`Firebase: Retrieved ${entries.length} entries`);
    return entries;
  } catch (error) {
    console.error('Firebase: Error getting documents:', error);
    throw error;
  }
};

// Update repair entry in Firebase
export const updateRepairEntryInFirebase = async (entryId: string, updates: Partial<RepairEntry>): Promise<void> => {
  try {
    console.log('=== FIREBASE: Updating repair entry ===');
    console.log('Entry ID:', entryId);
    console.log('Updates:', updates);
    
    const docRef = doc(db, 'repairEntries', entryId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(docRef, updateData);
    console.log('Firebase: Document updated successfully');
  } catch (error) {
    console.error('Firebase: Error updating document:', error);
    throw error;
  }
};

// Delete repair entry from Firebase
export const deleteRepairEntryFromFirebase = async (entryId: string): Promise<void> => {
  try {
    console.log('=== FIREBASE: Deleting repair entry ===');
    console.log('Entry ID:', entryId);
    
    const docRef = doc(db, 'repairEntries', entryId);
    await deleteDoc(docRef);
    
    console.log('Firebase: Document deleted successfully');
  } catch (error) {
    console.error('Firebase: Error deleting document:', error);
    throw error;
  }
};

// Company Details Functions

// Save company details to Firebase
export const saveCompanyDetailsToFirebase = async (companyData: Omit<CompanyDetails, 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    console.log('=== FIREBASE: Saving company details ===');
    console.log('Company data:', companyData);

    const docData = {
      ...companyData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Use userId as document ID for easy retrieval
    await setDoc(doc(db, 'companyDetails', companyData.userId), docData);
    console.log('Firebase: Company details saved successfully');

  } catch (error) {
    console.error('Firebase: Error saving company details:', error);
    throw error;
  }
};

// Get company details from Firebase
export const getCompanyDetailsFromFirebase = async (userId: string): Promise<CompanyDetails | null> => {
  try {
    console.log('=== FIREBASE: Getting company details for user:', userId);

    const docRef = doc(db, 'companyDetails', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const companyDetails = {
        ...data,
        // Convert Firestore Timestamps to strings for JSON serialization
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      } as CompanyDetails;

      console.log('Firebase: Company details retrieved successfully');
      return companyDetails;
    } else {
      console.log('Firebase: No company details found for user');
      return null;
    }
  } catch (error) {
    console.error('Firebase: Error getting company details:', error);
    throw error;
  }
};

// Update company details in Firebase
export const updateCompanyDetailsInFirebase = async (userId: string, updates: Partial<CompanyDetails>): Promise<void> => {
  try {
    console.log('=== FIREBASE: Updating company details ===');
    console.log('User ID:', userId);
    console.log('Updates:', updates);

    const docRef = doc(db, 'companyDetails', userId);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    await updateDoc(docRef, updateData);
    console.log('Firebase: Company details updated successfully');
  } catch (error) {
    console.error('Firebase: Error updating company details:', error);
    throw error;
  }
};
