import { UserOptions } from 'jspdf-autotable';
import jsPDF from 'jspdf';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}