import { getDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export interface RepairEntry {
  _id?: ObjectId;
  id?: string;
  userId: string;
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
  deliveryDate: string;
  paymentMethod: string;
  totalAmount: string;
  createdAt: Date;
  parts?: {
    description: string;
    quantity: number;
    price: number;
  }[];
  finalAmount?: string;
  imageId?: string;
  imageUrl?: string;
}

const COLLECTION_NAME = "repairEntries";

// Add new repair entry to MongoDB
export const addRepairEntryToMongoDB = async (entry: Omit<RepairEntry, "_id" | "id">): Promise<string> => {
  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.insertOne({
      ...entry,
      createdAt: new Date(),
    });
    
    return result.insertedId.toString();
  } catch (error) {
    console.error("Error adding repair entry to MongoDB:", error);
    throw new Error("Failed to add repair entry");
  }
};

// Get user-specific repair entries from MongoDB
export const getRepairEntriesFromMongoDB = async (userId: string): Promise<RepairEntry[]> => {
  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    const entries = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return entries.map(entry => ({
      ...entry,
      id: entry._id.toString(),
    })) as RepairEntry[];
  } catch (error) {
    console.error("Error getting repair entries from MongoDB:", error);
    throw new Error("Failed to get repair entries");
  }
};

// Update repair entry in MongoDB
export const updateRepairEntryInMongoDB = async (
  id: string, 
  updates: Partial<RepairEntry>
): Promise<void> => {
  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    // Remove id and _id from updates to avoid conflicts
    const { id: _, _id, ...updateData } = updates;
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
  } catch (error) {
    console.error("Error updating repair entry in MongoDB:", error);
    throw new Error("Failed to update repair entry");
  }
};

// Delete repair entry from MongoDB
export const deleteRepairEntryFromMongoDB = async (id: string): Promise<void> => {
  try {
    const db = await getDatabase();
    const collection = db.collection(COLLECTION_NAME);
    
    await collection.deleteOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("Error deleting repair entry from MongoDB:", error);
    throw new Error("Failed to delete repair entry");
  }
};

// Subscribe to changes (polling-based since MongoDB doesn't have real-time subscriptions like Firebase)
export const subscribeToRepairEntriesFromMongoDB = (
  userId: string,
  callback: (entries: RepairEntry[]) => void
): (() => void) => {
  let intervalId: NodeJS.Timeout;
  
  const fetchData = async () => {
    try {
      const entries = await getRepairEntriesFromMongoDB(userId);
      callback(entries);
    } catch (error) {
      console.error("Error in subscription:", error);
    }
  };
  
  // Initial fetch
  fetchData();
  
  // Poll every 5 seconds for updates
  intervalId = setInterval(fetchData, 5000);
  
  // Return unsubscribe function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};
