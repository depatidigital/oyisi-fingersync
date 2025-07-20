'use client';

import React, { useEffect, useRef } from 'react';

interface FingerprintModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName: string;
}

export default function FingerprintModal({ isOpen, onConfirm, onCancel, userName }: FingerprintModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Enter key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onConfirm();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the modal for keyboard events
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full mx-4 transform -translate-y-40 animate-modalPop"
        tabIndex={-1}
      >
        <div className="text-center">
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-800 mb-2">
                {userName}
              </div>
              <div className="text-sm text-blue-600">
                Pastikan pengguna telah dipindai pada pemindai sidik jari
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
            <div className="flex items-center justify-center">
              <svg className="h-5 w-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-700">
                Tekan <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Enter</kbd> untuk konfirmasi atau <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Esc</kbd> untuk batal
              </span>
            </div>
          </div>
          
          <div className="flex justify-center space-x-3">
                          <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Konfirmasi Pindai
              </button>
          </div>
        </div>
      </div>
    </div>
  );
} 