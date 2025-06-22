"use client";
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, Copy, X, Loader2, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { RepairEntry as OriginalRepairEntry } from "@/lib/storage";

// Define Part interface to match the one in BikeRepairManagement
export interface Part {
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
}

// Extend RepairEntry to include userId and parts
export type RepairEntry = OriginalRepairEntry & { 
  userId: string;
  parts?: Part[];  // optional
};

interface SharePDFButtonProps {
  entry: RepairEntry;
  companyDetails: CompanyDetails;
}

export function SharePDFButton(props: SharePDFButtonProps) {
  const { entry, companyDetails } = props;
  const [loading, setLoading] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const billRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use entry.parts or default to empty array
  const parts = entry.parts || [];

  const generatePDF = useCallback(async () => {
    if (!billRef.current) return null;
    
    setLoading(true);
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pages = billRef.current.querySelectorAll('.pdf-page');
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
        });
        
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }
      
      return pdf.output("blob");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleShare = useCallback(async () => {
    const pdfBlob = await generatePDF();
    if (!pdfBlob) return;
    
    try {
      if (navigator.share) {
        const file = new File([pdfBlob], `repair-bill-${entry.id}.pdf`, {
          type: "application/pdf",
        });
        
        await navigator.share({
          title: `Repair Bill - ${entry.customerName}`,
          files: [file],
        });
      } else {
        setShowShareOptions(true);
      }
    } catch (error) {
      console.error("Sharing failed:", error);
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: "Error",
          description: "Sharing failed. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [entry, generatePDF, toast]);

  const handleDownload = useCallback(async () => {
    const pdfBlob = await generatePDF();
    if (!pdfBlob) return;
    
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `repair-bill-${entry.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowShareOptions(false);
    toast({
      title: "Success",
      description: "PDF downloaded successfully!",
    });
  }, [entry, generatePDF, toast]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
      setShowShareOptions(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  }, [toast]);

  const renderAmountSummary = (entry: RepairEntry) => (
    <div className="border rounded-lg p-4 bg-gray-50 mb-6">
      <h3 className="text-lg font-semibold mb-3 text-blue-700">Amount Summary</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="font-medium">Subtotal:</span>
          <span>
            ₹{parts.reduce((sum, part) => sum + (part.quantity * part.price), 0).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Total Amount:</span>
          <span className="font-bold">₹{entry.totalAmount || "0.00"}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Advance Paid:</span>
          <span>₹{entry.advancecash || "0.00"}</span>
        </div>
        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="font-bold">Final Amount:</span>
          <span className="font-bold text-green-700">
            ₹{entry.finalAmount || "0.00"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="text-blue-600 flex items-center gap-1"
        onClick={handleShare}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share PDF
          </>
        )}
      </Button>

      <div 
        ref={billRef} 
        className="absolute -left-[9999px] w-[210mm]"
      >
        <div className="pdf-page w-[210mm] min-h-[297mm] p-8 bg-white text-gray-800 font-sans">
          <div className="flex flex-col items-center justify-center mb-4 border-b-2 border-blue-700 pb-4">
            <h1 className="text-2xl font-bold text-center">
              {companyDetails?.companyName || "Bullet Repair Shop"}
            </h1>
            
            <div className="flex justify-between w-full mt-2">
              <div className="text-sm">
                {companyDetails?.owner1Name && (
                  <p>
                    {companyDetails.owner1Name} ({companyDetails.owner1Phone})
                  </p>
                )}
              </div>
              <div className="text-sm">
                {companyDetails?.owner2Name && (
                  <p>
                    {companyDetails.owner2Name} ({companyDetails.owner2Phone})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold border-b-2 border-blue-500 pb-2 inline-block px-8">
              REPAIR BILL DETAILS
            </h2>
            <div className="text-sm text-right mt-1">
              {new Date().toLocaleDateString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-700 border-b pb-2">Customer Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {entry.customerName}</p>
                <p><span className="font-medium">Contact:</span> {entry.contactNumber}</p>
                <p><span className="font-medium">Address:</span> {entry.address || "N/A"}</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-700 border-b pb-2">Bullet Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Type:</span> {entry.bikeType}</p>
                <p><span className="font-medium">Model:</span> {entry.bikeModel || "N/A"}</p>
                <p><span className="font-medium">Plate No:</span> {entry.numberPlate || "N/A"}</p>
                <p><span className="font-medium">Repair Type:</span> {entry.repairType}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-700 border-b pb-2">Repair Timeline</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Entry Date:</span> {entry.entryDate}</p>
                <p><span className="font-medium">Delivery Date:</span> {entry.deliveryDate || "N/A"}</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-700 border-b pb-2">Payment Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Total Amount:</span> ₹{entry.totalAmount || "0.00"}</p>
                <p><span className="font-medium">Advance Paid:</span> ₹{entry.advancecash || "0.00"}</p>
                <p><span className="font-medium">Final Amount:</span> ₹{entry.finalAmount || "0.00"}</p>
              </div>
            </div>
          </div>
          
          {parts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-4 text-blue-700">Parts Detail</h3>
            </div>
          )}

          {parts.length > 0 && (
            <div className="border rounded-lg overflow-hidden mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left w-12">#</th>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-center w-24">Qty</th>
                    <th className="border p-2 text-center w-32">Price (₹)</th>
                    <th className="border p-2 text-center w-32">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.slice(0, 5).map((part, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2">{part.description}</td>
                      <td className="border p-2 text-center">{part.quantity}</td>
                      <td className="border p-2 text-center">{part.price.toFixed(2)}</td>
                      <td className="border p-2 text-center">{(part.quantity * part.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {parts.length <= 5 && renderAmountSummary(entry)}
          
          <div className="mt-auto pt-4 border-t border-gray-300 bg-blue-50 rounded-lg p-4">
            <div className="flex justify-center">
              <p className="text-sm text-gray-600">
                {companyDetails?.address || "Vadodara, Gujarat, India"} <br />
                This is a computer generated receipt. NO signature required.
              </p>
            </div>
          </div>
        </div>

        {parts.length > 5 && (
          (() => {
            const itemsPerPage = 15;
            const totalPages = Math.ceil((parts.length - 5) / itemsPerPage);
            let partIndex = 5;
            const pages = [];
            
            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
              const start = 5 + (pageIndex * itemsPerPage);
              const end = start + itemsPerPage;
              const pageParts = parts.slice(start, end);
              const isLastPage = end >= parts.length;
              
              pages.push(
                <div key={pageIndex} className="pdf-page w-[210mm] min-h-[297mm] p-8 bg-white text-gray-800 font-sans flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-4 text-blue-700">
                      Parts Detail {pageIndex > 0 ? `(Continued)` : ''}
                    </h3>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2 text-left w-12">#</th>
                          <th className="border p-2 text-left">Description</th>
                          <th className="border p-2 text-center w-24">Qty</th>
                          <th className="border p-2 text-center w-32">Price (₹)</th>
                          <th className="border p-2 text-center w-32">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageParts.map((part, index) => {
                          partIndex = start + index + 1;
                          return (
                            <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                              <td className="border p-2 text-center">{partIndex}</td>
                              <td className="border p-2">{part.description}</td>
                              <td className="border p-2 text-center">{part.quantity}</td>
                              <td className="border p-2 text-center">{part.price.toFixed(2)}</td>
                              <td className="border p-2 text-center">{(part.quantity * part.price).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {isLastPage && renderAmountSummary(entry)}
                  
                  <div className="mt-auto pt-4 border-t border-gray-300 bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-center">
                      <p className="text-sm text-gray-600">
                        {companyDetails?.address || "Vadodara, Gujarat, India"}
                        <br />
                        <span className="mt-1 italic">
                          This is a computer generated receipt. NO signature required.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            
            return pages;
          })()
        )}
      </div>

      {showShareOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Share Repair Bill</h3>
              <button 
                onClick={() => setShowShareOptions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleDownload}
              >
                <Download className="h-5 w-5" />
                <span>Download PDF</span>
              </button>
              
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={handleCopyLink}
              >
                <Copy className="h-5 w-5" />
                <span>Copy Shareable Link</span>
              </button>
              
              <div className="pt-4">
                <p className="text-sm text-gray-600 text-center">
                  To share via WhatsApp, Email, etc., download the PDF first and then share the file.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}