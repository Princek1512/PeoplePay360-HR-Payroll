import React from 'react';
import { Modal } from '../../components/shared/Modal';
import { Printer } from 'lucide-react';

interface PayslipPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslipId: string;
}

export const PayslipPrintModal: React.FC<PayslipPrintModalProps> = ({
  isOpen,
  onClose,
  payslipId
}) => {
  const token = localStorage.getItem('peoplepay360_token');
  const previewUrl = `/api/payslips/${payslipId}/html`;

  const handlePrint = () => {
    const iframe = document.getElementById('payslip-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Printable Salary Statement"
      subtitle="Formatted enterprise payslip breakdown ready for printing and archiving"
      maxWidth="4xl"
    >
      <div className="flex items-center justify-end pb-3">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Print Document / Save PDF</span>
        </button>
      </div>

      <div className="w-full h-[650px] bg-white rounded-xl overflow-hidden border border-slate-700 shadow-inner">
        <iframe
          id="payslip-iframe"
          src={previewUrl}
          title="Payslip Preview"
          className="w-full h-full border-none"
        />
      </div>
    </Modal>
  );
};
