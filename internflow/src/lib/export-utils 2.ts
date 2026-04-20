import jsPDF from "jspdf";

export function exportBonafidePDF(studentName: string, companyName: string, role: string, startDate: string, endDate: string) {
  const doc = new jsPDF("p", "pt", "a4");

  // Basic styling
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(34, 197, 94); // Green brand color
  doc.text("RATHINAM GROUP OF INSTITUTIONS", 298, 80, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.text("BONAFIDE CERTIFICATE", 298, 110, { align: "center" });

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 150);

  const bodyText = `This is to certify that ${studentName} is a bonafide student of Rathinam College. 
They have been officially granted On-Duty (OD) permission to pursue an internship as a 
${role} at ${companyName}.

The approved internship duration is from ${startDate} to ${endDate}.

During this period, the student's attendance will be recorded as On-Duty subject to the 
submission of the final internship completion certificate.`;

  const splitText = doc.splitTextToSize(bodyText, 500);
  doc.text(splitText, 50, 200, { lineHeightFactor: 1.5 });

  // Signatures
  doc.setFont("helvetica", "bold");
  doc.text("Placement Coordinator", 50, 500);
  doc.text("Principal / Dean", 400, 500);

  doc.save(`Bonafide_${studentName.replace(/\s+/g, "_")}.pdf`);
}

export function exportODFormPDF(studentName: string, companyName: string, role: string) {
  const doc = new jsPDF("p", "pt", "a4");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ON-DUTY (OD) REQUEST FORM", 298, 80, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  
  doc.text(`Student Name: ${studentName}`, 50, 150);
  doc.text(`Company: ${companyName}`, 50, 180);
  doc.text(`Role: ${role}`, 50, 210);
  doc.text(`Approval Status: OFFICIALLY APPROVED`, 50, 240);

  doc.text("Authorized by the Rathinam Placement Cell.", 50, 300);

  doc.save(`OD_Form_${studentName.replace(/\s+/g, "_")}.pdf`);
}

export function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) {
    return;
  }
  
  const separator = ',';
  const keys = Object.keys(rows[0]);
  
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map((row) => {
      const record = row as Record<string, unknown>;
      return keys.map(k => {
        const raw = record[k] === null || record[k] === undefined ? "" : record[k];
        let cell = raw instanceof Date ? raw.toLocaleString() : String(raw).replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement("a");
  if (link.download !== undefined) { 
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
