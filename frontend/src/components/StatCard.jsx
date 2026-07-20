export default function StatCard({ icon, label, value, trend, trendLabel, iconBg, iconColor = 'text-primary' }) {
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6 hover:bg-surface-container-low transition-colors animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1 mr-3">
          <p className="text-on-surface-variant text-label-sm sm:text-label-md truncate">{label}</p>
          <p className="text-headline-sm sm:text-display-lg text-on-surface font-mono truncate">{value}</p>
          {(trend || trendLabel) && (
            <div className="flex items-center gap-1.5">
              {isUp && <span className="material-symbols-outlined text-emerald-600 text-sm">trending_up</span>}
              {isDown && <span className="material-symbols-outlined text-red-600 text-sm">trending_down</span>}
              {trendLabel && (
                <span className={`text-label-sm sm:text-label-md ${isUp ? 'text-emerald-600' : isDown ? 'text-red-600' : 'text-on-surface-variant'}`}>
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-primary-fixed'}`}>
          <span className={`material-symbols-outlined text-lg ${iconColor}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
