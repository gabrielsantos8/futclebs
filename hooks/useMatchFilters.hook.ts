import { useCallback } from 'react';
import { MatchWithExtras, MatchCategory } from '../types/app.types';

export const useMatchFilters = (matches: MatchWithExtras[]) => {
  const getFilteredMatches = useCallback((category: MatchCategory) => {
    if (category === 'open') return matches.filter(m => m.status === 'open');
    if (category === 'pending') return matches.filter(m => m.hasPendingVotes);
    if (category === 'finished') return matches.filter(m => m.status === 'finished' && !m.hasPendingVotes);
    return matches;
  }, [matches]);

  const getCategoryCount = useCallback((category: MatchCategory) => {
    if (category === 'open') return matches.filter(m => m.status === 'open').length;
    if (category === 'pending') return matches.filter(m => m.hasPendingVotes).length;
    if (category === 'finished') return matches.filter(m => m.status === 'finished' && !m.hasPendingVotes).length;
    return 0;
  }, [matches]);

  return {
    getFilteredMatches,
    getCategoryCount
  };
};

