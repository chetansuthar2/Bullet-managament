// lib/types.ts
export type Part = {
  description: string;
  quantity: number;
  price: number;
};

export type RepairEntry = {
  id?: string;
  userId: string;
  entryDate: string;
  customerName: string;
  contactNumber: string;
  address: string;
  bikeType: string;
  bikeModel: string;
  numberPlate: string;
  repairType: string;
  expectedDeliveryDate: string;
  advancecash: string;
  status: 'pending' | 'delivered';
  deliveryDate?: string;
  paymentMethod?: string;
  totalAmount?: string;
  createdAt: string;
  parts?: Part[];
  finalAmount?: string;
  imageUrl?: string;
};

export type RepairEntryUpdate = Partial<RepairEntry> & {
  parts?: Part[];
  finalAmount?: string
};

export type CompanyDetails = {
  companyName: string;
  address: string;
  owner1Name: string;
  owner1Phone: string;
  owner2Name?: string;
  owner2Phone?: string;
  vehicleType: string;
};