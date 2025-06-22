import jsPDF from "jspdf";

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
  vehicleType: string;
}

interface RepairEntry {
  id?: string;
  customerName: string;
  contactNumber: string;
  address: string;
  bikeType: string;
  bikeModel: string;
  numberPlate: string;
  repairType: string;
  entryDate: string;
  deliveryDate: string;
  advancecash: string;
  totalAmount: string;
  finalAmount: string;
  parts?: Part[];
}

export const generatePDF = async (entry: RepairEntry, companyDetails: CompanyDetails) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const footerHeight = 25;

  // Helper function to add text with alignment
  const addText = (text: string, x: number, y: number, fontSize = 12, style: 'normal' | 'bold' = 'normal', align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', style);
    if (align === 'center') {
      pdf.text(text, x, y, { align: 'center' });
    } else if (align === 'right') {
      pdf.text(text, x, y, { align: 'right' });
    } else {
      pdf.text(text, x, y);
    }
  };

  // Helper function to add header - minimal design
  const addHeader = () => {
    // Just company name if needed
    if (companyDetails.companyName) {
      addText(companyDetails.companyName, margin, 15, 10, 'normal');
    }
  };

  // Helper function to add footer
  const addFooter = () => {
    const footerY = pageHeight - footerHeight;

    // Horizontal line above footer
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(margin, footerY, pageWidth - margin, footerY);

    // Footer content
    pdf.setTextColor(0, 0, 0);
    addText(companyDetails.address || "Vadodara, Gujarat, India", pageWidth / 2, footerY + 10, 10, 'normal', 'center');
    addText("This is a computer generated receipt. No signature required.", pageWidth / 2, footerY + 20, 8, 'normal', 'center');
  };

  // Add header and footer to first page
  addHeader();
  addFooter();

  // Start content - exactly like view details dialog
  let yPosition = 30;

  // Title exactly like dialog - "Repair Bill Details" centered, bold, blue
  pdf.setTextColor(30, 64, 175); // Blue-800 color
  addText("Repair Bill Details", pageWidth / 2, yPosition, 18, 'bold', 'center');
  pdf.setTextColor(0, 0, 0); // Reset to black
  yPosition += 30;

  // Customer and Bike Information - exactly like dialog layout
  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 80;
  const leftX = margin;
  const rightX = leftX + boxWidth + 10;

  // Customer Information Box - exactly like dialog
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.rect(leftX, yPosition, boxWidth, boxHeight);
  pdf.stroke();

  // Blue header like dialog
  pdf.setTextColor(30, 64, 175); // Blue-800
  addText("Customer Information", leftX + 8, yPosition + 18, 14, 'bold');
  pdf.setTextColor(0, 0, 0);

  // Content with proper spacing like dialog
  addText(`Name: ${entry.customerName}`, leftX + 8, yPosition + 35, 10);
  addText(`Contact: ${entry.contactNumber}`, leftX + 8, yPosition + 50, 10);
  addText(`Address: ${entry.address || "N/A"}`, leftX + 8, yPosition + 65, 10);

  // Bullet Information Box - exactly like dialog
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(rightX, yPosition, boxWidth, boxHeight);
  pdf.stroke();

  pdf.setTextColor(30, 64, 175); // Blue-800
  addText(`${companyDetails.vehicleType.charAt(0).toUpperCase() + companyDetails.vehicleType.slice(1)} Information`, rightX + 8, yPosition + 18, 14, 'bold');
  pdf.setTextColor(0, 0, 0);

  addText(`Type: ${entry.bikeType}`, rightX + 8, yPosition + 35, 10);
  addText(`Model: ${entry.bikeModel || "N/A"}`, rightX + 8, yPosition + 50, 10);
  addText(`Plate No: ${entry.numberPlate || "N/A"}`, rightX + 8, yPosition + 65, 10);

  yPosition += boxHeight + 15;

  // Timeline and Amount Summary - exactly like dialog layout
  const bottomBoxHeight = 70;

  // Timeline Box
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(leftX, yPosition, boxWidth, bottomBoxHeight);
  pdf.stroke();

  pdf.setTextColor(30, 64, 175); // Blue-800
  addText("Timeline", leftX + 8, yPosition + 18, 14, 'bold');
  pdf.setTextColor(0, 0, 0);

  addText(`Entry Date: ${entry.entryDate}`, leftX + 8, yPosition + 35, 10);
  addText(`Delivery Date: ${entry.deliveryDate || "Pending"}`, leftX + 8, yPosition + 50, 10);

  // Amount Summary Box - exactly like dialog
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(rightX, yPosition, boxWidth, bottomBoxHeight);
  pdf.stroke();

  pdf.setTextColor(30, 64, 175); // Blue-800
  addText("Amount Summary", rightX + 8, yPosition + 18, 14, 'bold');
  pdf.setTextColor(0, 0, 0);

  // Format amounts exactly like dialog
  const totalAmount = parseFloat(entry.totalAmount || "0");
  const advanceAmount = parseFloat(entry.advancecash || "0");
  const finalAmount = parseFloat(entry.finalAmount || "0");

  addText(`Total Amount: ₹${totalAmount.toFixed(2)}`, rightX + 8, yPosition + 35, 10);
  addText(`Advance Cash: ₹${advanceAmount.toFixed(2)}`, rightX + 8, yPosition + 50, 10);

  // Final amount with green color like dialog
  pdf.setTextColor(22, 163, 74); // Green-600
  addText(`Final Amount: ₹${finalAmount.toFixed(2)}`, rightX + 8, yPosition + 65, 10, 'bold');
  pdf.setTextColor(0, 0, 0); // Reset to black

  yPosition += bottomBoxHeight + 20;

  // Parts Details Table - exactly like dialog
  if (entry.parts && entry.parts.length > 0) {

    // Parts Details header - exactly like dialog
    pdf.setTextColor(30, 64, 175); // Blue-800
    addText("Parts Details", margin, yPosition, 14, 'bold');
    pdf.setTextColor(0, 0, 0);
    yPosition += 20;

    // Table setup - exactly like dialog table
    const tableWidth = pageWidth - (2 * margin);
    const colWidths = [80, 40, 50, 60]; // Description, Quantity, Price, Amount (no # column like dialog)
    const rowHeight = 25;

    // Helper function to draw table header - exactly like dialog
    const drawTableHeader = () => {
      // Header background - gray like dialog
      pdf.setFillColor(243, 244, 246); // Gray-100
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, yPosition, tableWidth, rowHeight);
      pdf.fillStroke();

      // Draw column separators
      let currentX = margin;
      for (let i = 0; i < colWidths.length - 1; i++) {
        currentX += colWidths[i];
        pdf.line(currentX, yPosition, currentX, yPosition + rowHeight);
      }

      // Header text - exactly like dialog
      currentX = margin;
      addText("Description", currentX + 5, yPosition + 15, 10, 'bold');
      currentX += colWidths[0];

      addText("Quantity", currentX + (colWidths[1]/2), yPosition + 15, 10, 'bold', 'center');
      currentX += colWidths[1];

      addText("Price (₹)", currentX + (colWidths[2]/2), yPosition + 15, 10, 'bold', 'center');
      currentX += colWidths[2];

      addText("Amount (₹)", currentX + (colWidths[3]/2), yPosition + 15, 10, 'bold', 'center');

      yPosition += rowHeight;
    };

    // Draw initial table header
    drawTableHeader();

    // Table rows - First page: max 5 items, subsequent pages: max 20 items
    let itemCount = 0;
    let isFirstPage = true;
    const maxItemsFirstPage = 5;
    const maxItemsPerPage = 20;

    entry.parts.forEach((part, index) => {
      const currentMaxItems = isFirstPage ? maxItemsFirstPage : maxItemsPerPage;

      // Check if we need a new page
      if (itemCount >= currentMaxItems) {
        // Add new page
        pdf.addPage();
        addHeader();
        addFooter();
        yPosition = 50;

        // Redraw table header on new page
        pdf.setTextColor(30, 64, 175); // Blue-800
        addText("Parts Details (Continued)", margin, yPosition, 14, 'bold');
        pdf.setTextColor(0, 0, 0);
        yPosition += 20;

        drawTableHeader();

        itemCount = 0;
        isFirstPage = false;
      }

      // Draw row - exactly like dialog table
      pdf.setFillColor(255, 255, 255); // White background
      pdf.setDrawColor(200, 200, 200); // Light border like dialog
      pdf.setLineWidth(0.5);
      pdf.rect(margin, yPosition, tableWidth, rowHeight);
      pdf.fillStroke();

      // Add vertical lines for columns
      let currentX = margin;
      for (let i = 0; i < colWidths.length - 1; i++) {
        currentX += colWidths[i];
        pdf.line(currentX, yPosition, currentX, yPosition + rowHeight);
      }

      // Row data - exactly like dialog layout (no # column)
      currentX = margin;
      addText(part.description, currentX + 5, yPosition + 15, 10);
      currentX += colWidths[0];

      addText(part.quantity.toString(), currentX + (colWidths[1]/2), yPosition + 15, 10, 'normal', 'center');
      currentX += colWidths[1];

      // Format price properly
      const price = parseFloat(part.price.toString());
      addText(price.toFixed(2), currentX + (colWidths[2]/2), yPosition + 15, 10, 'normal', 'center');
      currentX += colWidths[2];

      // Format amount properly
      const amount = part.quantity * price;
      addText(amount.toFixed(2), currentX + (colWidths[3]/2), yPosition + 15, 10, 'normal', 'center');

      yPosition += rowHeight;
      itemCount++;
    });

    yPosition += 20;
  }

  // No additional summary needed - already included in Amount Summary box above

  // Download the PDF
  pdf.save(`Repair-Bill-${entry.customerName.replace(/\s+/g, '-')}-${entry.id || Date.now()}.pdf`);
};
