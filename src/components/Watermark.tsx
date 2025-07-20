'use client';

import React from 'react';

export default function Watermark() {
  return (
    <div className="fixed bottom-4 right-4 z-10 pointer-events-none">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
        <div className="text-xs text-gray-600 font-medium">
          By{' '}
          <span className="text-blue-600 font-semibold">Rifki Dermawan</span>
          {' / '}
          <span className="text-green-600 font-semibold">Depati Digital</span>
        </div>
      </div>
    </div>
  );
} 