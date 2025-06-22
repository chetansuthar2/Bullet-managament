"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Share2, Loader2 } from "lucide-react";

interface PDFButtonProps {
  entry: any;
  companyDetails: any;
}

const PDFButton = ({ entry, companyDetails }: PDFButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePDFGeneration = async () => {
    setLoading(true);
    try {
      // Dynamically import the PDF generation logic
      const { generatePDF } = await import("@/lib/pdfGenerator");

      // Generate and download PDF
      await generatePDF(entry, companyDetails);

      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-blue-600"
      onClick={handlePDFGeneration}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Share2 className="h-4 w-4 mr-1" />
      )}
      Share PDF
    </Button>
  );
};

export default PDFButton;
