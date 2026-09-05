import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/shared/Modal';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';

interface TimeOffRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TimeOffRequestModal: React.FC<TimeOffRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [types, setTypes] = useState<any[]>([]);
  const [timeOffTypeId, setTimeOffTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      apiClient.get('/timeoff/types').then((res) => {
        setTypes(res.data.data || []);
        if (res.data.data?.length > 0) {
          setTimeOffTypeId(res.data.data[0].id);
        }
      }).catch(console.error);

      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const calculateDuration = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 1;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 1;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      setLoading(false);
      return;
    }

    const durationAmount = calculateDuration(startDate, endDate);

    try {
      await apiClient.post('/timeoff/requests', {
        timeOffTypeId,
        startDate,
        endDate,
        durationAmount,
        reason
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit time off request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Time Off Request"
      subtitle="Request leave days or hours. Approval automatically deducts from your allocated balance."
      maxWidth="md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
            Time Off Type
          </label>
          <select
            value={timeOffTypeId}
            onChange={(e) => setTimeOffTypeId(e.target.value)}
            className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            required
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
            Reason for Leave
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide context for manager review..."
            className="w-full bg-background border border-input rounded-md px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
