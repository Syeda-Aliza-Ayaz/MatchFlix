"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen, onClose, onConfirm, title, description, confirmText = "Confirm", cancelText = "Cancel"
}: ConfirmModalProps) {
  
  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
            style={{
              background: "rgba(6,6,8,0.75)",
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-sm rounded-sm p-8 overflow-hidden text-center shadow-2xl"
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              boxShadow: "0 25px 50px -12px rgba(232,57,42,0.15)",
            }}
          >
            {/* Warning glow behind the text */}
            <div 
              className="absolute pointer-events-none top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(232,57,42,0.15) 0%, transparent 70%)", filter: "blur(20px)" }}
            />

            <h3 className="font-serif text-2xl text-[var(--white)] mb-3 relative z-10">{title}</h3>
            <p className="text-[0.85rem] text-[var(--white2)] mb-8 font-light relative z-10 leading-relaxed">
              {description}
            </p>

            <div className="flex gap-4 relative z-10">
              <button 
                onClick={onClose}
                className="btn-ghost interactive flex-1 text-xs px-2"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className="btn-danger interactive flex-1 text-xs px-2"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
