
import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800 shadow-2xl transition-all duration-300">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 mb-4 border border-emerald-500/20 shadow-inner">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-5.09 3.393-9.51 7.393-12.01" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">{title}</h1>
        <p className="text-slate-400 text-sm sm:text-base px-2 leading-relaxed">{subtitle}</p>
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};
