"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import type { RepairEntry as OriginalRepairEntry } from "@/lib/storage";
import { SetupCompanyDetails } from "@/components/SetupCompanyDetails";
import PDFButton from "@/components/PDFButton";

// Extend RepairEntry to include userId
type RepairEntry = OriginalRepairEntry & { userId: string };

import {
  addRepairEntry,
  updateRepairEntry,
  deleteRepairEntry,
  subscribeToRepairEntries,
  getStorageType,
} from "@/lib/storage";

import {
  uploadImageToServer,
  validateImageFile,
} from "@/lib/clientImageStorage";

// Firebase imports for company details
import {
  saveCompanyDetailsToFirebase,
  getCompanyDetailsFromFirebase,
  updateCompanyDetailsInFirebase
} from "@/lib/firebaseStorage";

// Firebase is used only for data storage, not images

// Clerk imports
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Define Part and CompanyDetails interfaces
interface Part {
  description: string;
  quantity: number;
  price: number;
}

interface CompanyDetails {
  companyName: string;
  address: string;
  owner1Name: string;
  owner1Phone: string;
  owner2Name?: string;
  owner2Phone?: string;
  vehicleType?: string; // Made optional since we removed it from setup
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

type RepairEntryUpdate = Partial<RepairEntry> & { parts?: Part[]; finalAmount?: string };

import {
  Bike,
  Car,
  Truck,
  Clock,
  CheckCircle,
  Plus,
  Calendar,
  User,
  Phone,
  MapPin,
  Settings,
  CreditCard,
  Search,
  Eye,
  Edit,
  Trash2,
  Linkedin,
  Instagram,
  PhoneIcon,
  Mail,
  Loader2,
  Camera,
  X,
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

// Helper function to get vehicle icon with color
const getVehicleIcon = (vehicleType: string, size: string = "h-4 w-4", colorClass: string = "text-blue-600") => {
  const iconClass = `${size} ${colorClass}`;

  switch (vehicleType?.toLowerCase()) {
    case 'car':
      return <Car className={iconClass} />;
    case 'truck':
      return <Truck className={iconClass} />;
    case 'bike':
    case 'motorcycle':
    case 'bullet':
    case 'scooter':
    case 'auto':
    default:
      return <Bike className={iconClass} />;
  }
};

// Helper function to get vehicle type options
const getVehicleTypeOptions = (vehicleType: string) => {
  switch (vehicleType.toLowerCase()) {
    case 'car':
      return [
        { value: 'petrol', label: 'Petrol' },
        { value: 'diesel', label: 'Diesel' },
        { value: 'cng', label: 'CNG' },
        { value: 'electric', label: 'Electric' }
      ];
    case 'bike':
      return [
        { value: 'petrol', label: 'Petrol' },
        { value: 'electric', label: 'Electric' },
      ];
    case 'bullet':
      return [
        { value: 'petrol', label: 'Petrol' },
        { value: 'classic-350', label: 'Classic 350' },
        { value: 'classic-500', label: 'Classic 500' },
        { value: 'standard-350', label: 'Standard 350' },
        { value: 'diesel', label: 'Diesel' }
      ];
    case 'auto':
      return [
        { value: 'petrol', label: 'Petrol' },
        { value: 'cng', label: 'CNG' },
        { value: 'electric', label: 'Electric' }
      ];
    case 'truck':
      return [
        { value: 'diesel', label: 'Diesel' },
        { value: 'petrol', label: 'Petrol' },
        { value: 'cng', label: 'CNG' },
        { value: 'electric', label: 'Electric' },
      ];
    case 'scooter':
      return [
        { value: 'petrol', label: 'Petrol' },
        { value: 'electric', label: 'Electric' },
      ];
    default:
      return [
        { value: 'petrol', label: 'Petrol' },
        { value: 'diesel', label: 'Diesel' }
      ];
  }
};

export default function BikeRepairManagement() {
  // Clerk user management
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [repairEntries, setRepairEntries] = useState<RepairEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [storageType, setStorageType] = useState<string>("Loading...");
  const { toast } = useToast();

  // Company details state
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [hasSetupCompany, setHasSetupCompany] = useState(false);
  const [loadingCompanyDetails, setLoadingCompanyDetails] = useState(true);

  const [advanceCashOption, setAdvanceCashOption] = useState("no");

  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    customerName: "",
    contactNumber: "",
    address: "",
    vehicleCategory: "", // Main vehicle type (car, bike, bullet, etc.)
    bikeType: "", // Sub-type (petrol, diesel, etc.)
    bikeModel: "",
    numberPlate: "",
    repairType: "",
    expectedDeliveryDate: "",
    advancecash: "0",
  });

  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: boolean}>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  const [deliveryData, setDeliveryData] = useState({
    deliveryDate: "",
    parts: [
      { description: "", quantity: 1, price: 0 }
    ] as Part[],
  });

  const [editingEntry, setEditingEntry] = useState<RepairEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<RepairEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Latest First");
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [pendingEntryId, setPendingEntryId] = useState("");

  // Pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [deliveredPage, setDeliveredPage] = useState(1);
  const INITIAL_ENTRIES = 3;
  const ADDITIONAL_ENTRIES = 5;

  // Check company setup on load from Firebase
  useEffect(() => {
    const loadCompanyDetails = async () => {
      if (user) {
        try {
          console.log('Loading company details from Firebase for user:', user.id);
          console.log('User created at:', user.createdAt);
          const details = await getCompanyDetailsFromFirebase(user.id);

          if (details) {
            console.log('Company details loaded from Firebase:', details);
            // Convert Firebase details to local interface
            const localDetails: CompanyDetails = {
              companyName: details.companyName,
              address: details.address,
              owner1Name: details.owner1Name,
              owner1Phone: details.owner1Phone,
              owner2Name: details.owner2Name,
              owner2Phone: details.owner2Phone,
              vehicleType: details.vehicleType,
              userId: details.userId,
              createdAt: details.createdAt?.toDate?.() ? details.createdAt.toDate().toISOString() : (typeof details.createdAt === 'string' ? details.createdAt : undefined),
              updatedAt: details.updatedAt?.toDate?.() ? details.updatedAt.toDate().toISOString() : (typeof details.updatedAt === 'string' ? details.updatedAt : undefined)
            };
            setCompanyDetails(localDetails);
            setHasSetupCompany(true);
          } else {
            console.log('No company details found in Firebase, showing setup');
            setHasSetupCompany(false);
          }
          setLoadingCompanyDetails(false);
        } catch (error) {
          console.error('Error loading company details from Firebase:', error);
          setHasSetupCompany(false);
          setLoadingCompanyDetails(false);
          toast({
            title: "Warning",
            description: "Could not load company details. Please check your connection.",
            variant: "destructive",
          });
        }
      }
    };

    loadCompanyDetails();
  }, [user, toast]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize storage type and subscribe to user-specific data
  useEffect(() => {
    if (!isSignedIn || !user || !hasSetupCompany) {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const initializeApp = async () => {
      try {
        setStorageType(getStorageType());

        unsubscribe = subscribeToRepairEntries(
          user.id,
          (entries: RepairEntry[]) => {
            // Filter entries for current user
            const userEntries = entries.filter(entry => entry.userId === user.id);
            setRepairEntries(userEntries);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error initializing app:", error);
        setLoading(false);
        toast({
          title: "Warning",
          description: "Using local storage as fallback. Data will be saved locally.",
          variant: "destructive",
        });
      }
    };

    initializeApp();

    return () => {
      if (unsubscribe && typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [isSignedIn, user, toast, hasSetupCompany]);

  // Reset pagination when search or sort changes
  useEffect(() => {
    setPendingPage(1);
    setDeliveredPage(1);
  }, [searchTerm, sortBy]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditInputChange = (field: string, value: string) => {
    if (editingEntry) {
      setEditingEntry((prev) =>
        prev
          ? {
              ...prev,
              [field]: value,
            }
          : null
      );
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Image selected:', file);
    if (!file) return;

    const validation = validateImageFile(file);
    console.log('Validation result:', validation);
    if (!validation.isValid) {
      toast({
        title: "Invalid Image",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    console.log('Selected image set:', file.name);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log('Image preview created:', result ? 'Success' : 'Failed');
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
    // Also clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Function to completely reset form
  const resetFormCompletely = () => {
    setFormData({
      entryDate: new Date().toISOString().split("T")[0],
      customerName: "",
      contactNumber: "",
      address: "",
      vehicleCategory: "",
      bikeType: "",
      bikeModel: "",
      numberPlate: "",
      repairType: "",
      expectedDeliveryDate: "",
      advancecash: "0",
    });
    setAdvanceCashOption("no");
    handleRemoveImage();

    // Force clear all form inputs
    setTimeout(() => {
      const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], textarea, select');
      inputs.forEach((input: any) => {
        if (input.name !== 'entryDate') {
          input.value = '';
        }
      });
    }, 100);
  };

  const handleSaveEntry = async () => {
    if (!user) return;

    // Check all required fields including image
    const errors: {[key: string]: boolean} = {};

    if (!formData.customerName) errors.customerName = true;
    if (!formData.contactNumber) errors.contactNumber = true;
    if (!formData.address) errors.address = true;
    if (!formData.vehicleCategory) errors.vehicleCategory = true;
    if (!formData.bikeType) errors.bikeType = true;
    if (!formData.bikeModel) errors.bikeModel = true;
    if (!formData.numberPlate) errors.numberPlate = true;
    if (!formData.repairType) errors.repairType = true;
    if (!selectedImage) errors.image = true;

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast({
        title: "⚠️ Validation Error",
        description: "Please fill all required fields (highlighted in yellow)",
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    const advanceCashAmount = advanceCashOption === "yes" ? formData.advancecash : "0";

    setSaving(true);
    setUploadingImage(true);

    try {
      let imageUrl = "";

      // Upload image if selected - Always use MongoDB for images
      if (selectedImage) {
        try {
          console.log('Uploading image to MongoDB...');
          const result = await uploadImageToServer(selectedImage, user.id);
          imageUrl = result.imageUrl;
          console.log('Image uploaded successfully to MongoDB:', imageUrl);
        } catch (error) {
          console.error('MongoDB image upload error:', error);
          toast({
            title: "Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          });
          return; // Don't proceed without image since it's required
        }
      }

      console.log('Saving entry data to Firebase with MongoDB image URL:', imageUrl);

      await addRepairEntry({
        ...formData,
        advancecash: advanceCashAmount,
        status: "pending",
        deliveryDate: "",
        paymentMethod: "",
        totalAmount: "0",
        createdAt: new Date().toISOString(),
        userId: user.id,
        parts: [], // Initialize parts as empty array
        imageUrl: imageUrl || undefined
      });

      console.log('Entry data saved to Firebase successfully');

      // Show success toast immediately
      toast({
        title: "✅ Success!",
        description: "Repair entry saved successfully!",
        duration: 3000,
      });

      // Auto clear form after successful submission
      setFormData({
        entryDate: new Date().toISOString().split("T")[0],
        customerName: "",
        contactNumber: "",
        address: "",
        vehicleCategory: "",
        bikeType: "",
        bikeModel: "",
        numberPlate: "",
        repairType: "",
        expectedDeliveryDate: "",
        advancecash: "0",
      });
      setAdvanceCashOption("no");
      handleRemoveImage();

      // Force refresh the entries list
      console.log('Form submitted successfully, form cleared automatically');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add repair entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleSaveDelivery = async () => {
    console.log('=== DELIVERY SAVE STARTED ===');
    console.log('Delivery Data:', deliveryData);
    console.log('Pending Entry ID:', pendingEntryId);

    if (!deliveryData.deliveryDate || deliveryData.parts.some(part => !part.description || part.price <= 0)) {
      console.log('Validation failed:', {
        deliveryDate: deliveryData.deliveryDate,
        parts: deliveryData.parts
      });
      toast({
        title: "Error",
        description: "Please fill delivery date and ensure all parts have description and valid price",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Calculate total amount from parts
      const totalAmount = deliveryData.parts.reduce(
        (sum, part) => sum + (part.quantity * part.price),
        0
      );

      // Get advance cash from the original entry
      const entry = repairEntries.find(e => e.id === pendingEntryId);
      const advanceCash = parseFloat(entry?.advancecash || "0");
      const finalAmount = totalAmount - advanceCash;

      console.log('Calculated amounts:', {
        totalAmount,
        advanceCash,
        finalAmount
      });

      const updateData = {
        status: "delivered" as const,
        deliveryDate: deliveryData.deliveryDate,
        parts: deliveryData.parts,
        totalAmount: totalAmount.toString(),
        advancecash: entry?.advancecash || "0",
        finalAmount: finalAmount.toString(),
      };

      console.log('Updating entry with data:', updateData);

      await updateRepairEntry(pendingEntryId, updateData);

      console.log('Entry updated successfully');

      // Show success toast immediately
      toast({
        title: "Success",
        description: `${companyDetails?.vehicleType ?
          companyDetails.vehicleType.charAt(0).toUpperCase() + companyDetails.vehicleType.slice(1) :
          'Vehicle'
        } marked as delivered successfully!`,
      });

      // Reset data after toast
      setDeliveryData({
        deliveryDate: "",
        parts: [{ description: "", quantity: 1, price: 0 }]
      });
      setShowDeliveryDialog(false);
      setPendingEntryId("");

      console.log('=== DELIVERY SAVE COMPLETED ===');
    } catch (error) {
      console.error('Error in handleSaveDelivery:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle parts changes in delivery form
  const handlePartChange = (index: number, field: string, value: string | number) => {
    setDeliveryData(prev => {
      const newParts = [...prev.parts];
      newParts[index] = { 
        ...newParts[index], 
        [field]: value 
      };
      return { ...prev, parts: newParts };
    });
  };

  const addPartRow = () => {
    setDeliveryData(prev => ({
      ...prev,
      parts: [...prev.parts, { description: "", quantity: 1, price: 0 }]
    }));
  };

  const removePartRow = (index: number) => {
    if (deliveryData.parts.length <= 1) return;
    setDeliveryData(prev => {
      const newParts = [...prev.parts];
      newParts.splice(index, 1);
      return { ...prev, parts: newParts };
    });
  };

  const handleMarkAsDone = (entryId: string) => {
    setPendingEntryId(entryId);
    setShowDeliveryDialog(true);
  };

  const handleViewDetails = (entry: RepairEntry) => {
    setSelectedEntry(entry);
    setShowDetailsDialog(true);
  };

  const handleEditEntry = (entry: RepairEntry) => {
    setEditingEntry(entry);
    setShowEditDialog(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setSaving(true);
    try {
      // Find the entry to get image info before deleting
      const entryToDelete = repairEntries.find(entry => entry.id === entryId);

      console.log('Deleting entry:', entryId);
      console.log('Entry has image:', !!entryToDelete?.imageUrl);

      // Delete the repair entry from Firebase
      await deleteRepairEntry(entryId, user?.id!);

      // If entry had an image stored in MongoDB, delete it
      if (entryToDelete?.imageUrl && entryToDelete.imageUrl.includes('/api/images/')) {
        try {
          const imageId = entryToDelete.imageUrl.split('/api/images/')[1];
          console.log('Deleting image from MongoDB:', imageId);

          const response = await fetch(`/api/images/${imageId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            console.log('Image deleted successfully from MongoDB');
          } else {
            console.log('Failed to delete image from MongoDB');
          }
        } catch (imageError) {
          console.error('Error deleting image:', imageError);
          // Don't fail the whole operation if image deletion fails
        }
      }

      toast({
        title: "Success",
        description: "Repair entry deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete repair entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    if (!editingEntry.customerName || !editingEntry.contactNumber || !editingEntry.bikeType || !editingEntry.repairType) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await updateRepairEntry(editingEntry.id!, {
        ...editingEntry,
      });
      
      toast({
        title: "Success",
        description: "Repair entry updated successfully!",
      });
      
      setShowEditDialog(false);
      setEditingEntry(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update repair entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Function to reset company setup (for testing/development)
  const resetCompanySetup = async () => {
    if (user && process.env.NODE_ENV === 'development') {
      try {
        // Note: In production, you might want to delete from Firebase too
        setCompanyDetails(null);
        setHasSetupCompany(false);
        setLoadingCompanyDetails(false);

        console.log('Company setup reset for testing');
        toast({
          title: "Reset Complete",
          description: "Company setup has been reset for testing",
        });
      } catch (error) {
        console.error('Error resetting company setup:', error);
      }
    }
  };

  const handleCompanySetupComplete = async (details: CompanyDetails) => {
    if (user) {
      try {
        console.log('Saving company details to Firebase:', details);

        // Add userId to company details
        const companyData = {
          ...details,
          userId: user.id,
          vehicleType: details.vehicleType || 'vehicle' // Ensure vehicleType is always provided
        };

        await saveCompanyDetailsToFirebase(companyData);
        setCompanyDetails(details);
        setHasSetupCompany(true);
        setLoadingCompanyDetails(false);

        console.log('Company setup completed successfully, vehicleType:', details.vehicleType);

        toast({
          title: "Success",
          description: "Company details saved successfully!",
        });

      } catch (error) {
        console.error('Error saving company details:', error);
        toast({
          title: "Error",
          description: "Failed to save company details. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const filteredEntries = repairEntries.filter(
    (entry) =>
      entry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.contactNumber.includes(searchTerm) ||
      (entry.numberPlate && entry.numberPlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.bikeModel && entry.bikeModel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedPendingEntries = [...filteredEntries.filter((e) => e.status === "pending")].sort((a, b) => {
    if (sortBy === "Latest First") {
      return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
    } else {
      return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
    }
  });

  const sortedDeliveredEntries = [...filteredEntries.filter((e) => e.status === "delivered")].sort((a, b) => {
    if (sortBy === "Latest First") {
      return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
    } else {
      return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
    }
  });

  // Pagination logic for pending entries
  const pendingStartIndex = 0;
  const pendingEndIndex = INITIAL_ENTRIES + (pendingPage - 1) * ADDITIONAL_ENTRIES;
  const pendingEntriesToShow = sortedPendingEntries.slice(pendingStartIndex, pendingEndIndex);
  
  // Pagination logic for delivered entries
  const deliveredStartIndex = 0;
  const deliveredEndIndex = INITIAL_ENTRIES + (deliveredPage - 1) * ADDITIONAL_ENTRIES;
  const deliveredEntriesToShow = sortedDeliveredEntries.slice(deliveredStartIndex, deliveredEndIndex);

  const totalBikes = repairEntries.length;
  const pendingRepairs = repairEntries.filter((entry) => entry.status === "pending").length;
  const deliveredBikes = repairEntries.filter((entry) => entry.status === "delivered").length;

  // Handle authentication redirect after all hooks are called
  if (!isLoaded || !isSignedIn) {
    return null; // Don't show anything, just redirect
  }

  // Show loading while checking company details
  if (loadingCompanyDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <p className="text-lg font-medium text-gray-700">Loading your workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show company setup form if not completed
  if (!hasSetupCompany) {
    return <SetupCompanyDetails onSetupComplete={handleCompanySetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-2 sm:p-4">
      <Toaster />
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-blue-800">
                    Smart Vehicle Management
                  </h1>

                  <p className="text-xs sm:text-sm text-gray-600">
                    Welcome, {user?.fullName || user?.firstName ||
                      (user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]
                        ?.split('.')
                        ?.map(part => part.charAt(0).toUpperCase() + part.slice(1))
                        ?.join(' ')) || "User"}!
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Development reset button */}
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    onClick={resetCompanySetup}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Reset Setup
                  </Button>
                )}
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-md">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-6 h-6 sm:w-8 sm:h-8",
                        userButtonPopoverCard: "shadow-xl border border-gray-200",
                        userButtonPopoverActionButton: "hover:bg-blue-50"
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2">{totalBikes}</div>
              <div className="flex items-center justify-center gap-2 text-blue-100">
                <Car className="h-5 w-5 sm:h-6 sm:w-6 text-white drop-shadow-md" />
                <span className="text-sm sm:text-lg">
                  Total Vehicles
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2">{pendingRepairs}</div>
              <div className="flex items-center justify-center gap-2 text-blue-100">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-lg">Pending Repairs</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-2">{deliveredBikes}</div>
              <div className="flex items-center justify-center gap-2 text-blue-100">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-lg">
                  Delivered Vehicles
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Repair Entry Form */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Plus className="h-5 w-5" />
              Add New Repair Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="entryDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Entry Date *
                </Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => handleInputChange("entryDate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Name *
                </Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={formData.customerName}
                  onChange={(e) => {
                    handleInputChange("customerName", e.target.value);
                    if (validationErrors.customerName) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.customerName;
                        return newErrors;
                      });
                    }
                  }}
                  className={validationErrors.customerName ? "border-yellow-500 border-2" : ""}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Number *
                </Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  placeholder="Enter contact number (numbers only)"
                  value={formData.contactNumber}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 10) { // Limit to 10 digits
                      handleInputChange("contactNumber", value);
                      if (validationErrors.contactNumber) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.contactNumber;
                          return newErrors;
                        });
                      }
                    }
                  }}
                  className={validationErrors.contactNumber ? "border-yellow-500 border-2" : ""}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Vehicle Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="vehicleCategory" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicle Category *
                </Label>
                <Select value={formData.vehicleCategory} onValueChange={(value) => {
                  handleInputChange("vehicleCategory", value);
                  // Reset sub-type when category changes
                  handleInputChange("bikeType", "");
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                    <SelectItem value="bullet">Bullet</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Sub-Type */}
              <div className="space-y-2">
                <Label htmlFor="bikeType" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {formData.vehicleCategory ?
                    `${formData.vehicleCategory.charAt(0).toUpperCase() + formData.vehicleCategory.slice(1)} Type *` :
                    'Vehicle Type *'
                  }
                </Label>
                <Select
                  value={formData.bikeType}
                  onValueChange={(value) => handleInputChange("bikeType", value)}
                  disabled={!formData.vehicleCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.vehicleCategory ? `Select ${formData.vehicleCategory} type` : 'Select category first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.vehicleCategory && getVehicleTypeOptions(formData.vehicleCategory).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vehicle Model */}
              <div className="space-y-2">
                <Label htmlFor="bulletModel" className="flex items-center gap-2">
                  {getVehicleIcon(formData.vehicleCategory || '', "h-4 w-4", "text-gray-600")}
                  {formData.vehicleCategory ?
                    `${formData.vehicleCategory.charAt(0).toUpperCase() + formData.vehicleCategory.slice(1)} Model *` :
                    'Vehicle Model *'
                  }
                </Label>
                <Input
                  id="bulletModel"
                  placeholder={formData.vehicleCategory ? `Enter ${formData.vehicleCategory} model` : 'Select category first'}
                  value={formData.bikeModel}
                  onChange={(e) => handleInputChange("bikeModel", e.target.value)}
                  disabled={!formData.vehicleCategory}
                  required
                />
              </div>

              {/* Number Plate */}
              <div className="space-y-2">
                <Label htmlFor="numberPlate" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Number Plate *
                </Label>
                <Input
                  id="numberPlate"
                  placeholder="Enter number plate"
                  value={formData.numberPlate}
                  onChange={(e) => handleInputChange("numberPlate", e.target.value)}
                  required
                />
              </div>

              {/* Repair Type */}
              <div className="space-y-2">
                <Label htmlFor="repairType" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Repair Type *
                </Label>
                <Select value={formData.repairType} onValueChange={(value) => handleInputChange("repairType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select repair type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="modified">Modified</SelectItem>
                    <SelectItem value="repair part">Repair Part</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ADVANCE CASH SECTION */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Advance Cash
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="advance-yes"
                      value="yes"
                      checked={advanceCashOption === "yes"}
                      onChange={(e) => {
                        setAdvanceCashOption("yes");
                        setFormData((prev) => ({ ...prev, advancecash: "" }));
                      }}
                    />
                    <Label htmlFor="advance-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="advance-no"
                      value="no"
                      checked={advanceCashOption === "no"}
                      onChange={(e) => {
                        setAdvanceCashOption("no");
                        setFormData((prev) => ({ ...prev, advancecash: "0" }));
                      }}
                    />
                    <Label htmlFor="advance-no">No</Label>
                  </div>
                </div>
                {advanceCashOption === "yes" && (
                  <Input
                    placeholder="Enter advance cash amount (₹)"
                    value={formData.advancecash}
                    onChange={(e) => {
                      // Only allow numbers and decimal point
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      // Ensure only one decimal point
                      const parts = value.split('.');
                      if (parts.length <= 2) {
                        handleInputChange("advancecash", value);
                      }
                    }}
                    type="text"
                    min="0"
                  />
                )}
              </div>
            </div>

            {/* Address and Image Upload Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address *
                </Label>
                <Input
                  id="address"
                  placeholder="Enter customer address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Upload Image *
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="cursor-pointer"
                  required
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded border cursor-pointer"
                      onClick={() => window.open(imagePreview, '_blank')}
                    />
                  </div>
                )}
              </div>

              {/* Empty div for consistent 3-column layout */}
              <div className="hidden lg:block"></div>
            </div>


            {/* Save Entry Button */}
            <Button
              onClick={handleSaveEntry}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Entry"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Repair Entries Section with Tabs */}
        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Settings className="h-5 w-5" />
              Repair Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, number plate, or contact"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Latest First">Latest First</SelectItem>
                    <SelectItem value="Oldest First">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs for Pending and Delivered */}
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending Repairs ({sortedPendingEntries.length})</TabsTrigger>
                <TabsTrigger value="delivered">
                  Delivered Vehicles ({sortedDeliveredEntries.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4">
                {pendingEntriesToShow.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending repairs found</p>
                  </div>
                ) : (
                  <>
                    {pendingEntriesToShow.map((entry) => (
                      <Card key={entry.id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                            <div className="flex gap-3 sm:gap-4 flex-1">
                              {/* Image Section */}
                              {entry.imageUrl && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={entry.imageUrl}
                                    alt="Repair"
                                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => {
                                      setSelectedEntry(entry);
                                      setShowDetailsDialog(true);
                                    }}
                                    onError={(e) => {
                                      // Hide broken images
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}

                              {/* Details Section */}
                              <div className="space-y-2 flex-1">
                                <h3 className="font-semibold text-lg">{entry.customerName}</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {entry.contactNumber}
                                  </div>
                                {entry.numberPlate && (
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    {entry.numberPlate}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-blue-100 rounded-md">
                                    {getVehicleIcon(entry.vehicleCategory || entry.bikeType || '', "h-4 w-4", "text-blue-600")}
                                  </div>
                                  {entry.vehicleCategory && (
                                    <span className="font-medium text-blue-700">
                                      {entry.vehicleCategory.charAt(0).toUpperCase() + entry.vehicleCategory.slice(1)}
                                    </span>
                                  )}
                                  {entry.bikeModel} ({entry.bikeType})
                                </div>
                                <div className="flex items-center gap-2">
                                  <Settings className="h-4 w-4" />
                                  {entry.repairType}
                                </div>
                                {entry.advancecash && entry.advancecash !== "0" && (
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Advance: ₹{entry.advancecash}
                                  </div>
                                )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                              <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                                  onClick={() => handleMarkAsDone(entry.id!)}
                                  disabled={saving}
                                >
                                  Done
                                </Button>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditEntry(entry)}
                                  disabled={saving}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="ml-1 sm:hidden">Edit</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 flex-1 sm:flex-none"
                                  onClick={() => handleDeleteEntry(entry.id!)}
                                  disabled={saving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="ml-1 sm:hidden">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* View More Button */}
                    {sortedPendingEntries.length > pendingEntriesToShow.length && (
                      <div className="flex justify-center mt-4">
                        <Button 
                          onClick={() => setPendingPage(pendingPage + 1)}
                          variant="outline"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          View More ({(sortedPendingEntries.length - pendingEntriesToShow.length) > ADDITIONAL_ENTRIES 
                            ? ADDITIONAL_ENTRIES 
                            : sortedPendingEntries.length - pendingEntriesToShow.length} more)
                        </Button>
                      </div>
                    )}

                    {/* Show Less Button */}
                    {pendingPage > 1 && (
                      <div className="flex justify-center mt-2">
                        <Button 
                          onClick={() => setPendingPage(1)}
                          variant="ghost"
                          className="text-blue-600 hover:bg-blue-100"
                        >
                          Show Less
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="delivered" className="space-y-4">
                {deliveredEntriesToShow.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No delivered bullet found</p>
                  </div>
                ) : (
                  <>
                    {deliveredEntriesToShow.map((entry) => (
                      <Card key={entry.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                            <div className="flex gap-3 sm:gap-4 flex-1">
                              {/* Image Section */}
                              {entry.imageUrl && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={entry.imageUrl}
                                    alt="Repair"
                                    className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => {
                                      setSelectedEntry(entry);
                                      setShowDetailsDialog(true);
                                    }}
                                    onError={(e) => {
                                      // Hide broken images
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}

                              {/* Details Section */}
                              <div className="space-y-2 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <h3 className="font-semibold text-base sm:text-lg">{entry.customerName}</h3>
                                  <Badge className="bg-green-500 w-fit px-2 py-1 text-xs">Delivered</Badge>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 flex-shrink-0" />
                                  <span className="break-all">{entry.contactNumber}</span>
                                </div>
                                {entry.numberPlate && (
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 flex-shrink-0" />
                                    <span>{entry.numberPlate}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-green-100 rounded-md">
                                    {getVehicleIcon(entry.vehicleCategory || entry.bikeType || '', "h-4 w-4", "text-green-600")}
                                  </div>
                                  {entry.vehicleCategory && (
                                    <span className="font-medium text-green-700">
                                      {entry.vehicleCategory.charAt(0).toUpperCase() + entry.vehicleCategory.slice(1)}
                                    </span>
                                  )}
                                  <span>{entry.bikeModel} ({entry.bikeType})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                                  <span>Delivered on {entry.deliveryDate}</span>
                                </div>
                                {entry.advancecash && entry.advancecash !== "0" && (
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 flex-shrink-0" />
                                    <span>Advance: ₹{entry.advancecash}</span>
                                  </div>
                                )}
                                </div>
                              </div>
                            </div>

                            {/* Mobile Button Layout */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 flex-1 sm:flex-none text-xs sm:text-sm"
                                  onClick={() => handleViewDetails(entry)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  <span className="hidden xs:inline">View Details</span>
                                  <span className="xs:hidden">Details</span>
                                </Button>
                                {companyDetails && (
                                  <div className="flex-1 sm:flex-none">
                                    <PDFButton entry={entry} companyDetails={companyDetails} />
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 text-xs sm:text-sm"
                                onClick={() => handleDeleteEntry(entry.id!)}
                                disabled={saving}
                              >
                                <Trash2 className="h-4 w-4 mr-1 sm:mr-0" />
                                <span className="sm:hidden">Delete</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* View More Button */}
                    {sortedDeliveredEntries.length > deliveredEntriesToShow.length && (
                      <div className="flex justify-center mt-4">
                        <Button 
                          onClick={() => setDeliveredPage(deliveredPage + 1)}
                          variant="outline"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          View More ({(sortedDeliveredEntries.length - deliveredEntriesToShow.length) > ADDITIONAL_ENTRIES 
                            ? ADDITIONAL_ENTRIES 
                            : sortedDeliveredEntries.length - deliveredEntriesToShow.length} more)
                        </Button>
                      </div>
                    )}

                    {/* Show Less Button */}
                    {deliveredPage > 1 && (
                      <div className="flex justify-center mt-2">
                        <Button 
                          onClick={() => setDeliveredPage(1)}
                          variant="ghost"
                          className="text-blue-600 hover:bg-blue-100"
                        >
                          Show Less
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Developer Information Footer */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold flex items-center justify-center gap-2">
                <code className="bg-blue-700/50 px-2 py-1 rounded text-sm sm:text-base">&lt;/&gt;</code>
                Developer Information
              </h3>
            </div>

            <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-1 md:grid-cols-3 sm:gap-6">
              {/* Developer Column */}
              <div className="space-y-3 border-b sm:border-b md:border-b-0 md:border-r border-blue-400/30 pb-4 sm:pb-6 md:pb-0 md:pr-4">
                <h4 className="font-semibold text-base sm:text-lg text-blue-100">Developer</h4>
                <div className="space-y-2">
                  <p className="text-sm sm:text-base">
                    <span className="font-medium">Name:</span> Chetan Suthar
                  </p>
                  <p className="text-sm sm:text-base">
                    <span className="font-medium">Role:</span> Full Stack Developer
                  </p>
                </div>
              </div>

              {/* Contact Column */}
              <div className="space-y-3 border-b sm:border-b md:border-b-0 md:border-r border-blue-400/30 pb-4 sm:pb-6 md:pb-0 md:px-4">
                <h4 className="font-semibold text-base sm:text-lg text-blue-100">Contact</h4>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm sm:text-base">
                    <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Phone:</span>
                    <span className="break-all">9772348371</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm sm:text-base">
                    <Mail className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Email:</span>
                    <span className="break-all">chetansuthar1546@gmail.com</span>
                  </p>
                  <p className="flex items-start gap-2 text-sm sm:text-base">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">Location:</span>
                    <span>Vadodara, Gujarat, India</span>
                  </p>
                </div>
              </div>

              {/* Social Media Column */}
              <div className="space-y-3 md:pl-4">
                <h4 className="font-semibold text-base sm:text-lg text-blue-100">Follow Us</h4>
                <div className="space-y-2">
                  <a
                    href="https://www.linkedin.com/in/chetan-suthar-b0aa70286/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-100 hover:text-white hover:underline transition-colors text-sm sm:text-base"
                  >
                    <Linkedin className="h-4 w-4 flex-shrink-0" />
                    LinkedIn
                  </a>
                  <a
                    href="https://www.instagram.com/chetan._.4/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-100 hover:text-white hover:underline transition-colors text-sm sm:text-base"
                  >
                    <Instagram className="h-4 w-4 flex-shrink-0" />
                    Instagram
                  </a>
                </div>
              </div>
            </div>

            {/* Support Text */}
            <div className="text-center mt-6 pt-4 border-t border-blue-400/30">
              <p className="text-xs sm:text-sm text-blue-200">
                <strong>Need Help?</strong> Feel free to reach out for any technical support, customizations, or new
                feature requests.
              </p>
              <p className="text-xs text-blue-200 mt-2">
                Available 24/7 for support ❤️ Crafted with passion for efficient business management
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Details Dialog */}
        <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Create Delivery Bill</DialogTitle>
              <DialogDescription className="text-sm">Fill in the parts details for the repair</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate" className="text-sm font-medium">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryData.deliveryDate}
                  onChange={(e) => setDeliveryData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="w-full"
                />
              </div>

              {/* Parts Table - Mobile Responsive */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Parts Details</Label>

                {/* Mobile View - Card Layout */}
                <div className="block sm:hidden space-y-3">
                  {deliveryData.parts.map((part, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-600">Description</Label>
                          <Input
                            value={part.description}
                            onChange={(e) => handlePartChange(index, "description", e.target.value)}
                            placeholder="Part description"
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={part.quantity}
                              onChange={(e) => handlePartChange(index, "quantity", parseInt(e.target.value) || 1)}
                              className="mt-1 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">Price (₹)</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              value={part.price}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  handlePartChange(index, "price", parseFloat(value) || 0);
                                }
                              }}
                              className="mt-1 text-center"
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="text-sm font-medium">
                            Amount: ₹{(part.quantity * part.price).toFixed(2)}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removePartRow(index)}
                            disabled={deliveryData.parts.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="text-center py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addPartRow}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Part
                    </Button>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-center">
                      Subtotal: ₹{deliveryData.parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Desktop View - Table Layout */}
                <div className="hidden sm:block border rounded-lg overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left text-sm">Description</th>
                        <th className="border p-2 text-center w-24 text-sm">Quantity</th>
                        <th className="border p-2 text-center w-32 text-sm">Price (₹)</th>
                        <th className="border p-2 text-center w-32 text-sm">Amount (₹)</th>
                        <th className="border p-2 text-center w-12 text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveryData.parts.map((part, index) => (
                        <tr key={index}>
                          <td className="border p-1">
                            <Input
                              value={part.description}
                              onChange={(e) => handlePartChange(index, "description", e.target.value)}
                              placeholder="Part description"
                              className="text-sm"
                            />
                          </td>
                          <td className="border p-1">
                            <Input
                              type="number"
                              min="1"
                              value={part.quantity}
                              onChange={(e) => handlePartChange(index, "quantity", parseInt(e.target.value) || 1)}
                              className="text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="border p-1">
                            <Input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              value={part.price}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  handlePartChange(index, "price", parseFloat(value) || 0);
                                }
                              }}
                              className="text-center text-sm"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="border p-2 text-center text-sm">
                            ₹{(part.quantity * part.price).toFixed(2)}
                          </td>
                          <td className="border p-1 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removePartRow(index)}
                              disabled={deliveryData.parts.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="border p-2 text-right text-sm" colSpan={3}>Subtotal</td>
                        <td className="border p-2 text-center text-sm">
                          ₹{deliveryData.parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addPartRow}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add Part
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Amount Summary */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-bold text-lg text-blue-800 mb-3">Amount Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label>Total Amount</Label>
                    <div className="text-xl font-semibold">
                      ₹{deliveryData.parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Advance Cash</Label>
                    <div className="text-xl font-semibold">
                      ₹{repairEntries.find(e => e.id === pendingEntryId)?.advancecash || "0.00"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Final Amount</Label>
                    <div className="text-xl font-semibold text-green-600">
                      ₹{(
                        deliveryData.parts.reduce((sum, part) => sum + (part.quantity * part.price), 0) - 
                        parseFloat(repairEntries.find(e => e.id === pendingEntryId)?.advancecash || "0")
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSaveDelivery}
                className="w-full bg-green-600 hover:bg-green-700 mt-4 py-3 text-lg"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save & Mark as Delivered"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-2xl font-bold text-blue-800 text-center">
                Repair Bill Details
              </DialogTitle>
            </DialogHeader>
  
            {selectedEntry && (
              <div className="space-y-6">
                {/* Image Display */}
                {selectedEntry.imageUrl && (
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                      Repair Image
                    </h3>
                    <div className="flex justify-center bg-gray-50 p-2 sm:p-4 rounded-lg">
                      <div className="relative group">
                        <img
                          src={selectedEntry.imageUrl}
                          alt="Repair Image"
                          className="max-w-full max-h-32 sm:max-h-48 object-contain rounded-lg border shadow-lg hover:shadow-xl transition-shadow cursor-zoom-in"
                          onClick={() => {
                            // Open image in new tab for full view
                            window.open(selectedEntry.imageUrl, '_blank');
                          }}
                          onError={(e) => {
                            // Hide broken images
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                            Click to enlarge
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Customer and Bike Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  <div className="border rounded-lg p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-blue-800 mb-2 sm:mb-3">Customer Information</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Name:</span>
                        <span className="break-words">{selectedEntry.customerName}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Contact:</span>
                        <span className="break-all">{selectedEntry.contactNumber}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Address:</span>
                        <span className="break-words">{selectedEntry.address || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-blue-800 mb-2 sm:mb-3">
                      {companyDetails?.vehicleType ?
                        `${companyDetails.vehicleType.charAt(0).toUpperCase() + companyDetails.vehicleType.slice(1)} Information` :
                        'Vehicle Information'
                      }
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Type:</span>
                        <span className="break-words">{selectedEntry.bikeType}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Model:</span>
                        <span className="break-words">{selectedEntry.bikeModel || "N/A"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Number Plate:</span>
                        <span className="break-words">{selectedEntry.numberPlate || "N/A"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Repair Type:</span>
                        <span className="break-words">{selectedEntry.repairType}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Delivery and Repair Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                  <div className="border rounded-lg p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-blue-800 mb-2 sm:mb-3">Repair Information</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Entry Date:</span>
                        <span className="break-words">{selectedEntry.entryDate}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Delivery Date:</span>
                        <span className="break-words">{selectedEntry.deliveryDate || "N/A"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium sm:w-32 text-gray-600">Advance Cash:</span>
                        <span className="break-words">
                          {selectedEntry.advancecash && selectedEntry.advancecash !== "0"
                            ? `₹${selectedEntry.advancecash}`
                            : "No"}
                        </span>
                      </div>

                    </div>
                  </div>

                  <div className="border rounded-lg p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-blue-800 mb-2 sm:mb-3">Amount Summary</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Total Amount:</span>
                        <span className="font-semibold">₹{selectedEntry.totalAmount || "0.00"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-600">Advance Cash:</span>
                        <span className="font-semibold">₹{selectedEntry.advancecash || "0.00"}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2 mt-2">
                        <span className="font-bold text-gray-800">Final Amount:</span>
                        <span className="font-bold text-green-600 text-sm sm:text-base">
                          ₹{selectedEntry.finalAmount || "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Parts Table */}
                {selectedEntry.parts && selectedEntry.parts.length > 0 && (
                  <div className="border rounded-lg p-3 sm:p-4">
                    <h3 className="font-bold text-base sm:text-lg text-blue-800 mb-2 sm:mb-3">Parts Details</h3>

                    {/* Mobile View - Card Layout */}
                    <div className="block sm:hidden space-y-3">
                      {selectedEntry.parts.map((part, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50">
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-gray-600">Description:</span>
                              <div className="font-semibold text-sm">{part.description}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">Qty:</span>
                                <div className="font-semibold">{part.quantity}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Price:</span>
                                <div className="font-semibold">₹{part.price.toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Amount:</span>
                                <div className="font-semibold text-green-600">₹{(part.quantity * part.price).toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm">Total Amount:</span>
                          <span className="font-bold text-green-600 text-base">
                            ₹{selectedEntry.parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop View - Table Layout */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border p-2 text-left text-sm">Description</th>
                            <th className="border p-2 text-center text-sm">Quantity</th>
                            <th className="border p-2 text-center text-sm">Price (₹)</th>
                            <th className="border p-2 text-center text-sm">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedEntry.parts.map((part, index) => (
                            <tr key={index}>
                              <td className="border p-2 text-sm">{part.description}</td>
                              <td className="border p-2 text-center text-sm">{part.quantity}</td>
                              <td className="border p-2 text-center text-sm">{part.price.toFixed(2)}</td>
                              <td className="border p-2 text-center text-sm">{(part.quantity * part.price).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-semibold">
                            <td className="border p-2 text-right text-sm" colSpan={3}>Total</td>
                            <td className="border p-2 text-center font-bold text-sm">
                              ₹{selectedEntry.parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
    
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Entry Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Repair Entry</DialogTitle>
            </DialogHeader>
            {editingEntry && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input
                      value={editingEntry.customerName}
                      onChange={(e) => handleEditInputChange("customerName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input
                      value={editingEntry.contactNumber}
                      onChange={(e) => handleEditInputChange("contactNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {companyDetails?.vehicleType ?
                        `${companyDetails.vehicleType.charAt(0).toUpperCase() + companyDetails.vehicleType.slice(1)} Type` :
                        'Vehicle Type'
                      }
                    </Label>
                    <Select
                      value={editingEntry.bikeType}
                      onValueChange={(value) => handleEditInputChange("bikeType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getVehicleTypeOptions(companyDetails?.vehicleType || '').map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {companyDetails?.vehicleType ?
                        `${companyDetails.vehicleType.charAt(0).toUpperCase() + companyDetails.vehicleType.slice(1)} Model` :
                        'Vehicle Model'
                      }
                    </Label>
                    <Input
                      value={editingEntry.bikeModel}
                      onChange={(e) => handleEditInputChange("bikeModel", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number Plate</Label>
                    <Input
                      value={editingEntry.numberPlate}
                      onChange={(e) => handleEditInputChange("numberPlate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Repair Type</Label>
                    <Select
                      value={editingEntry.repairType}
                      onValueChange={(value) => handleEditInputChange("repairType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="modifier">Modifier</SelectItem>
                        <SelectItem value="repairing">Repairing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={editingEntry.address}
                    onChange={(e) => handleEditInputChange("address", e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Advance Cash</Label>
                    <Input
                      value={editingEntry.advancecash}
                      onChange={(e) => handleEditInputChange("advancecash", e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveEdit} className="w-full bg-blue-600 hover:bg-blue-700" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
