'use client';

import { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#374151', // dark gray
];

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="w-10 h-10 rounded-lg border-2 border-base-300 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
        style={{ backgroundColor: value }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        aria-label="Select color"
      />

      {isOpen && (
        <div className="absolute top-12 left-0 z-10 bg-base-100 border border-base-300 rounded-lg shadow-lg p-3">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="w-8 h-8 rounded border-2 border-base-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>

          <div className="border-t border-base-300 pt-3">
            <label className="block text-xs font-medium mb-1">Custom Color</label>
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-8 rounded border border-base-300"
            />
          </div>

          <button
            type="button"
            className="absolute top-1 right-1 btn btn-xs btn-ghost"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}