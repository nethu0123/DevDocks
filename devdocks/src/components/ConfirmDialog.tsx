import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 px-4 pt-8 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-md overflow-hidden rounded-lg border border-purple-400/30 bg-[#161b22] shadow-2xl shadow-purple-950/30"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
            <div className="flex items-start gap-3 px-4 py-4">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded ring-1 ${
                danger
                  ? 'bg-[#ff7b72]/10 text-[#ffb3ad] ring-[#ff7b72]/25'
                  : 'bg-purple-500/10 text-purple-300 ring-purple-400/25'
              }`}>
                <AlertTriangle size={15} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#c9d1d9]">{message}</p>
              </div>

              <button
                onClick={onCancel}
                className="rounded p-1 text-[#8b949e] transition hover:bg-[#0d1117] hover:text-white"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#30363d] bg-[#0d1117]/45 px-4 py-3">
              <button
                onClick={onCancel}
                className="h-8 rounded border border-[#30363d] bg-[#161b22] px-4 text-xs font-semibold text-[#c9d1d9] transition hover:border-purple-400/50 hover:text-white"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`h-8 rounded px-4 text-xs font-bold text-white transition ${
                  danger
                    ? 'bg-[#da3633] hover:bg-[#f85149]'
                    : 'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
