'use client';
import { useDebounce } from '@/hooks/useDebounce';
import {
  addToWatchlist,
  removeFromWatchlist,
} from '@/lib/actions/watchlist.actions';
import { Star, StarIcon, Stars, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Minimal WatchlistButton implementation to satisfy page requirements.
// This component focuses on UI contract only. It toggles local state and
// calls onWatchlistChange if provided. Styling hooks match globals.css.

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = 'button',
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);

  const label = useMemo(() => {
    if (type === 'icon') return added ? '' : '';
    return added ? 'Remove from Watchlist' : 'Add to Watchlist';
  }, [added, type]);

  // Handle adding/removing stocks from watchlist
  const toggleWatchlist = async () => {
    const result = added
      ? await removeFromWatchlist(symbol)
      : await addToWatchlist(symbol, company);

    if (result.success) {
      toast.success(added ? 'Removed from Watchlist' : 'Added to Watchlist', {
        description: `${company} ${
          added ? 'removed from' : 'added to'
        } your watchlist`,
      });

      // Notify parent component of watchlist change for state synchronization
      onWatchlistChange?.(symbol, !added);
    }
  };

  // Debounce the toggle function to prevent rapid API calls (300ms delay)
  const debouncedToggle = useDebounce(toggleWatchlist, 300);

  // Click handler that provides optimistic UI updates
  const handleClick = (e: React.MouseEvent) => {
    // Prevent event bubbling and default behavior
    e.stopPropagation();
    e.preventDefault();

    setAdded(!added);
    debouncedToggle();
  };

  if (type === 'icon') {
    return (
      <button
        title={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        aria-label={
          added
            ? `Remove ${symbol} from watchlist`
            : `Add ${symbol} to watchlist`
        }
        className="flex items-center justify-center p-2 rounded-lg transition-all"
        style={{
          background: added ? 'rgba(253, 212, 88, 0.15)' : 'transparent',
          color: '#FDD458',
          border: `1px solid ${added ? 'rgba(253, 212, 88, 0.3)' : 'rgba(48, 51, 58, 0.5)'}`,
          cursor: 'pointer',
        }}
        onClick={handleClick}
      >
        <Star size={16} fill={added ? 'currentColor' : 'none'} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all"
      style={{
        background: added ? 'rgba(255, 73, 91, 0.15)' : 'rgba(253, 212, 88, 0.15)',
        color: added ? '#FF495B' : '#FDD458',
        border: `1px solid ${added ? 'rgba(255, 73, 91, 0.3)' : 'rgba(253, 212, 88, 0.3)'}`,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = added ? 'rgba(255, 73, 91, 0.25)' : 'rgba(253, 212, 88, 0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = added ? 'rgba(255, 73, 91, 0.15)' : 'rgba(253, 212, 88, 0.15)';
      }}
    >
      {showTrashIcon && added ? (
        <Trash2 size={14} />
      ) : added ? (
        <Star fill="currentColor" size={14} />
      ) : (
        <Star size={14} />
      )}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;