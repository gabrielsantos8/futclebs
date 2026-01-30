import { useState } from 'react';
import { MatchCategory, Step } from '../types/app.types';

export const useUIState = () => {
  const [step, setStep] = useState<Step>(Step.PHONE_CHECK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<MatchCategory>('open');
  const [activeAdminMenu, setActiveAdminMenu] = useState<string | null>(null);

  return {
    step,
    setStep,
    loading,
    setLoading,
    error,
    setError,
    activeCategory,
    setActiveCategory,
    activeAdminMenu,
    setActiveAdminMenu
  };
};

