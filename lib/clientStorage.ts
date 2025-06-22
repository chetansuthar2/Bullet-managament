// Client-side storage functions that call API routes for MongoDB operations

export interface RepairEntry {
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
  createdAt: string;
  parts?: {
    description: string;
    quantity: number;
    price: number;
  }[];
  finalAmount?: string;
  imageUrl?: string;
}

// Add new repair entry
export const addRepairEntryToServer = async (entry: Omit<RepairEntry, "id">): Promise<string> => {
  try {
    const response = await fetch('/api/repair-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add repair entry');
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error("Error adding repair entry:", error);
    throw error;
  }
};

// Get repair entries for a user
export const getRepairEntriesFromServer = async (userId: string): Promise<RepairEntry[]> => {
  try {
    const response = await fetch(`/api/repair-entries?userId=${userId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get repair entries');
    }

    const entries = await response.json();
    return entries;
  } catch (error) {
    console.error("Error getting repair entries:", error);
    throw error;
  }
};

// Update repair entry
export const updateRepairEntryOnServer = async (id: string, updates: Partial<RepairEntry>): Promise<void> => {
  try {
    const response = await fetch('/api/repair-entries', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update repair entry');
    }
  } catch (error) {
    console.error("Error updating repair entry:", error);
    throw error;
  }
};

// Delete repair entry
export const deleteRepairEntryFromServer = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/repair-entries?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete repair entry');
    }
  } catch (error) {
    console.error("Error deleting repair entry:", error);
    throw error;
  }
};
