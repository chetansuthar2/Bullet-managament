"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

interface CompanyDetails {
  companyName: string;
  address: string;
  owner1Name: string;
  owner1Phone: string;
  owner2Name?: string;
  owner2Phone?: string;
}

export function SetupCompanyDetails({ onSetupComplete }: { onSetupComplete: (details: CompanyDetails) => void }) {
  const { user } = useUser();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    companyName: "",
    address: "",
    owner1Name: "",
    owner1Phone: "",
    owner2Name: "",
    owner2Phone: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof CompanyDetails, value: string) => {
    setCompanyDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!companyDetails.companyName || !companyDetails.address || !companyDetails.owner1Name || !companyDetails.owner1Phone) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      onSetupComplete(companyDetails);
      toast({
        title: "Success",
        description: "Company details saved successfully!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-blue-800">
            Welcome {user?.fullName || user?.firstName ||
              (user?.emailAddresses?.[0]?.emailAddress?.split('@')[0]
                ?.split('.')
                ?.map(part => part.charAt(0).toUpperCase() + part.slice(1))
                ?.join(' ')) || 'User'}!
          </CardTitle>
          <p className="text-center text-lg text-blue-600 font-medium mb-2">
            Smart Vehicle Management
          </p>
          <p className="text-center text-gray-600">
            Please set up your company details to get started
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="font-medium">
                Company Name *
              </Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={companyDetails.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="font-medium">
                Company Address *
              </Label>
              <Textarea
                id="address"
                placeholder="Enter company address"
                value={companyDetails.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner1Name" className="font-medium">
                  Owner 1 Name *
                </Label>
                <Input
                  id="owner1Name"
                  placeholder="Enter owner name"
                  value={companyDetails.owner1Name}
                  onChange={(e) => handleInputChange("owner1Name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner1Phone" className="font-medium">
                  Owner 1 Phone *
                </Label>
                <Input
                  id="owner1Phone"
                  placeholder="Enter phone number"
                  value={companyDetails.owner1Phone}
                  onChange={(e) => handleInputChange("owner1Phone", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner2Name">
                  Owner 2 Name (Optional)
                </Label>
                <Input
                  id="owner2Name"
                  placeholder="Enter owner name"
                  value={companyDetails.owner2Name || ""}
                  onChange={(e) => handleInputChange("owner2Name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner2Phone">
                  Owner 2 Phone (Optional)
                </Label>
                <Input
                  id="owner2Phone"
                  placeholder="Enter phone number"
                  value={companyDetails.owner2Phone || ""}
                  onChange={(e) => handleInputChange("owner2Phone", e.target.value)}
               />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}