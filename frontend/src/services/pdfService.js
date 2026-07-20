import jsPDF from 'jspdf';
import 'jspdf-autotable';

const LOGO_BASE64_URL = '/mp360-logo.png';

const addLogoToDoc = async (doc, yPos) => {
  try {
    const response = await fetch(LOGO_BASE64_URL);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        doc.addImage(reader.result, 'PNG', 14, yPos - 12, 20, 20);
        resolve();
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return Promise.resolve();
  }
};

export const exportStudentsPDF = async (students, title = 'Student Records') => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  await addLogoToDoc(doc, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MarkPro 360 Office', pageWidth / 2, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, 37, { align: 'center' });

  const rows = students.map((s) => [
    s.studentId || '',
    s.studentName || '',
    s.fatherName || '',
    s.phone || '',
    s.course || '',
    `PKR ${(parseFloat(s.totalFee) || 0).toLocaleString()}`,
    `PKR ${(parseFloat(s.paid) || 0).toLocaleString()}`,
    `PKR ${(parseFloat(s.pending) || 0).toLocaleString()}`,
    s.status || '',
    s.paymentMethod || '',
  ]);

  doc.autoTable({
    head: [['ID', 'Name', 'Father Name', 'Phone', 'Course', 'Total Fee', 'Paid', 'Pending', 'Status', 'Method']],
    body: rows,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [0, 35, 111],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [247, 249, 251],
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 28 },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 16 },
      9: { cellWidth: 22 },
    },
  });

  const summaryY = doc.lastAutoTable.finalY + 15;
  const totalFee = students.reduce((s, r) => s + (parseFloat(r.totalFee) || 0), 0);
  const totalPaid = students.reduce((s, r) => s + (parseFloat(r.paid) || 0), 0);
  const totalPending = students.reduce((s, r) => s + (parseFloat(r.pending) || 0), 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Summary', 14, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Students: ${students.length}`, 14, summaryY + 7);
  doc.text(`Total Fee: PKR ${totalFee.toLocaleString()}`, 14, summaryY + 14);
  doc.text(`Total Collected: PKR ${totalPaid.toLocaleString()}`, 14, summaryY + 21);
  doc.text(`Total Pending: PKR ${totalPending.toLocaleString()}`, 14, summaryY + 28);

  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportFeeReportPDF = async (students, title = 'Fee Report') => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  await addLogoToDoc(doc, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MarkPro 360 Office', pageWidth / 2, 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(title, pageWidth / 2, 30, { align: 'center' });

  const rows = students.map((s) => [
    s.studentName || '',
    s.studentId || '',
    `PKR ${(parseFloat(s.totalFee) || 0).toLocaleString()}`,
    `PKR ${(parseFloat(s.paid) || 0).toLocaleString()}`,
    `PKR ${(parseFloat(s.pending) || 0).toLocaleString()}`,
    s.status || '',
  ]);

  doc.autoTable({
    head: [['Name', 'ID', 'Total Fee', 'Paid', 'Pending', 'Status']],
    body: rows,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 35, 111], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 249, 251] },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
