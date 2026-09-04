import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle } from 'lucide-react';

export function DepartmentDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  department,
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!department) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(department.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete department:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Department"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-red-50 rounded-[8px] border border-red-100 text-[#DC2626]">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-[12.5px] leading-relaxed">
            <span className="font-semibold">Warning:</span> Are you sure you want to delete{' '}
            <span className="font-bold underline">{department.name}</span>?
          </div>
        </div>

        <p className="text-[13px] text-[#52525B] leading-relaxed">
          Associated tasks and team members will be unassigned from this department. No employee accounts or tasks will be permanently removed.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F4F4F5] mt-6">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-[13px]"
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Department'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
