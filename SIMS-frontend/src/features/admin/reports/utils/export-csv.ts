import type { AdvisingStudent } from '../types';

/**
 * Escapes a cell value for standard CSV formatting.
 */
function escapeCsvValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export advising report student records to a client-side CSV download.
 */
export function exportAdvisingReportToCsv(
  students: AdvisingStudent[],
  semesterLabel: string = 'advising-report'
): void {
  if (!students || students.length === 0) return;

  const headers = [
    'Student Identifier',
    'Class Standing',
    'Enrolled Credit Hours',
    'Required Minimum Credit Hours',
    'Credit Deficit Hours',
    'Advisory Status',
  ];

  const rows = students.map((s) => {
    const deficit = Math.max(0, s.min_credit_hours - s.enrolled_credit_hours);
    return [
      escapeCsvValue(s.student_identifier),
      escapeCsvValue(s.class_standing),
      escapeCsvValue(s.enrolled_credit_hours),
      escapeCsvValue(s.min_credit_hours),
      escapeCsvValue(deficit),
      escapeCsvValue('Below Minimum'),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanLabel = semesterLabel.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const filename = `advising_report_${cleanLabel}_${new Date().toISOString().split('T')[0]}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
