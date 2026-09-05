import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { Printer, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

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
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !payslipId) return;

    const loadPayslip = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.get(`/payslips/${payslipId}/html`, {
          responseType: 'text'
        });
        setHtmlContent(res.data);
      } catch (err: any) {
        console.error('Failed to fetch printable payslip:', err);
        setError(err.response?.data?.message || 'Failed to render payslip document.');
      } finally {
        setLoading(false);
      }
    };

    loadPayslip();
  }, [isOpen, payslipId]);

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
      subtitle="Official enterprise payslip breakdown ready for printing and archiving"
      maxWidth="4xl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
        <div className="text-xs text-muted-foreground">
          Review your official statement before printing or saving as PDF.
        </div>
        <button
          onClick={handlePrint}
          disabled={loading || !!error}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          <span>Print Document / Save PDF</span>
        </button>
      </div>

      {loading ? (
        <div className="w-full h-[650px] flex flex-col items-center justify-center gap-3 bg-secondary/30 rounded-xl border border-border">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Generating official salary statement...</p>
        </div>
      ) : error ? (
        <div className="w-full h-[300px] flex flex-col items-center justify-center gap-3 bg-destructive/10 rounded-xl border border-destructive/30 text-destructive p-6 text-center">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : (
        <div className="w-full h-[650px] bg-white rounded-xl overflow-hidden border border-border shadow-inner">
          <iframe
            id="payslip-iframe"
            srcDoc={htmlContent}
            title="Payslip Preview"
            className="w-full h-full border-none"
          />
        </div>
      )}
    </Modal>
  );
};
