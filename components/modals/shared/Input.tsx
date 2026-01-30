
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider group-focus-within:text-emerald-500 transition-colors">
        {label}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-3.5 bg-slate-800/50 border ${
          error ? 'border-red-500' : 'border-slate-700/50 group-focus-within:border-emerald-500/50'
        } rounded-2xl text-white text-base focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-slate-600 appearance-none`}
        style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
      />
      {error && <span className="text-xs text-red-500 mt-1 ml-1 animate-pulse">{error}</span>}
    </div>
  );
};
