import React from 'react';
import { cn } from '@/lib/utils';

export default function SeatMap({ seats, rows, cols, premiumRows = [], selectedIds = [], currentUserId, onToggle }) {
  const seatMap = {};
  (seats || []).forEach(s => { seatMap[s.seatId] = s; });

  const rowLabels = 'ABCDEFGHJKLMNPQRSTUVWXYZ'.slice(0, rows).split('');

  const seatStyle = (seatId) => {
    const seat = seatMap[seatId];
    const isSelected = selectedIds.includes(seatId);
    if (isSelected) return 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/50 scale-105';
    if (!seat) return 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed';
    if (seat.status === 'BOOKED') return 'bg-zinc-700 text-white/30 border-zinc-600 cursor-not-allowed';
    if (seat.status === 'HELD') {
      if (seat.heldBy === currentUserId) return 'bg-amber-500/30 text-amber-200 border-amber-500/50';
      return 'bg-amber-900/40 text-amber-300/40 border-amber-700/40 cursor-not-allowed';
    }
    return 'bg-white/5 hover:bg-red-600/20 hover:border-red-500/50 text-white/70 border-white/15 cursor-pointer';
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-max mx-auto">
        <div className="mx-auto mb-8 w-3/4 max-w-md">
          <div className="h-2 rounded-full bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
          <p className="text-center text-[10px] text-white/40 tracking-[0.3em] mt-2 uppercase">Screen this way</p>
        </div>
        <div className="space-y-2">
          {rowLabels.map((row, ri) => (
            <div key={row} className="flex items-center gap-2 justify-center">
              <span className="w-5 text-center text-xs text-white/40 font-medium">{row}</span>
              <div className="flex gap-1.5">
                {Array.from({ length: cols }, (_, i) => {
                  const seatId = `${row}${i + 1}`;
                  const seat = seatMap[seatId];
                  const isPremium = premiumRows.includes(row);
                  const disabled = !seat || seat.status === 'BOOKED' || (seat.status === 'HELD' && seat.heldBy !== currentUserId);
                  return (
                    <button
                      key={seatId}
                      disabled={disabled}
                      onClick={() => seat && onToggle && onToggle(seatId)}
                      title={`${seatId} · ${isPremium ? 'Premium' : 'Standard'} · ${seat ? seat.status : 'N/A'}`}
                      className={cn(
                        'w-7 h-7 sm:w-8 sm:h-8 rounded-md border text-[10px] sm:text-xs font-medium transition-all flex items-center justify-center',
                        isPremium && !selectedIds.includes(seatId) && seat?.status === 'AVAILABLE' ? 'ring-1 ring-amber-500/30' : '',
                        seatStyle(seatId)
                      )}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <span className="w-5 text-center text-xs text-white/40 font-medium">{row}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-white/60">
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-white/10 border border-white/15" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-600" /> Selected</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-900/40 border border-amber-700/40" /> Held</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-zinc-700" /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded ring-1 ring-amber-500/30 bg-white/10" /> Premium</span>
        </div>
      </div>
    </div>
  );
}