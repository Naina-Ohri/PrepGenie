import React from 'react';

const VARIANT_CLASSES = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
  secondary:
    'border border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:border-indigo-200 disabled:text-indigo-200',
  ghost:
    'text-gray-600 hover:bg-gray-100 disabled:text-gray-300',
  danger:
    'text-red-600 hover:bg-red-50 disabled:text-red-200',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

/**
 * Button
 * Shared button primitive used across PrepGenie so every call-to-action
 * shares consistent sizing, color, disabled/loading state, and a visible
 * keyboard focus ring (see tokens.css).
 *
 * Usage:
 *   <Button onClick={fn}>Analyze Resume</Button>
 *   <Button variant="secondary" size="sm">Skip</Button>
 *   <Button variant="danger">End interview</Button>
 *   <Button isLoading loadingText="Analyzing…">Analyze Resume</Button>
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {isLoading && (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}
