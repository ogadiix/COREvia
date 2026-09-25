import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { NextBestAction } from '../../types';
import { CheckSquare, AlertCircle, Calendar, Flag } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: NextBestAction | null;
  onConfirm: (
    id: number,
    taskData: { title: string; dueDate: string; priority: string; description: string }
  ) => Promise<void>;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  action,
  onConfirm,
}) => {
  const [title, setTitle] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (action) {
      setTitle(action.title);

      // Default due date by urgency
      let defaultDays = 3;
      if (action.urgency === 'IMMEDIATE') defaultDays = 1;
      else if (action.urgency === 'TODAY') defaultDays = 1;
      else if (action.urgency === 'THIS_WEEK') defaultDays = 5;

      const target = new Date();
      target.setDate(target.getDate() + defaultDays);
      setDueDate(target.toISOString().split('T')[0]);

      // Priority mapping
      const p =
        action.priority === 'CRITICAL'
          ? 'CRITICAL'
          : action.priority === 'HIGH'
          ? 'HIGH'
          : 'MEDIUM';
      setPriority(p);

      setDescription(
        `[Generated from Next Best Action: ${action.actionId}]\n\nRationale: ${action.rationale}\nExpected Impact: ${action.expectedImpact}`
      );
      setError(null);
    }
  }, [action]);

  if (!action) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(action.id, {
        title: title.trim(),
        dueDate,
        priority,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Create CRM Task from Recommendation"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-start gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            Converting this recommendation into a tracked institutional Task links it directly to
            the customer's relationship record and tracks execution metrics.
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs p-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            required
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-xs p-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              disabled={loading}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Description & Action Plan
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
            disabled={loading}
          />
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Creating Task...' : 'Create & Link Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
