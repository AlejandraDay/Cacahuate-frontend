import { jsPDF } from 'jspdf';
import type { FormSubmissionResult } from '../types';

export const exportSubmissionToPdf = (submission: FormSubmissionResult, patientName?: string) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const marginX = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  let y = 64;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Informe de sesión', marginX, y);
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(90);
  if (patientName) {
    doc.text(`Paciente: ${patientName}`, marginX, y);
    y += 16;
  }
  doc.text(`Terapeuta: ${submission.therapistName}`, marginX, y);
  y += 16;
  doc.text(`Fecha: ${new Date(submission.submittedAt).toLocaleString('es-ES')}`, marginX, y);
  y += 28;

  doc.setDrawColor(220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 24;

  for (const answer of submission.answers) {
    const labelLines = doc.splitTextToSize(answer.fieldLabel, contentWidth);
    const valueText = answer.fieldType === 4 ? (answer.value === 'true' ? 'Sí' : 'No') : answer.value || '—';
    const valueLines = doc.splitTextToSize(valueText, contentWidth);
    const blockHeight = (labelLines.length + valueLines.length) * 14 + 18;

    if (y + blockHeight > pageHeight - 48) {
      doc.addPage();
      y = 64;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(labelLines, marginX, y);
    y += labelLines.length * 14 + 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(valueLines, marginX, y);
    y += valueLines.length * 14 + 14;
  }

  const fileSafeName = (patientName ?? 'formulario').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  doc.save(`informe_${fileSafeName}_${submission.id.slice(0, 8)}.pdf`);
};
