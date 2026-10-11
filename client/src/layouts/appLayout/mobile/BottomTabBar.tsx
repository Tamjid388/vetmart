import { useLocation, useNavigate } from 'react-router';
import { bottomTabDefs, getBottomTabKey } from '../menuItems.tsx';

type BottomTabBarProps = {
  onMoreOpen: () => void;
};

/**
 * E8a mobile bottom tab bar (5 tabs per `Bottom navigation.png`).
 * Mobile only — rendered by AppLayout below `md`, fixed above the iOS home indicator.
 */
function BottomTabBar({ onMoreOpen }: BottomTabBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeKey = getBottomTabKey(location.pathname);

  return (
    <nav
      role="tablist"
      aria-label="প্রধান নেভিগেশন (Primary)"
      className="mobile-bottom-bar fixed right-0 bottom-0 left-0 z-[1000] border-t border-slate-200 bg-white md:hidden"
    >
      <div className="grid h-[68px] grid-cols-5">
        {bottomTabDefs.map((tab) => {
          const isActive = tab.isMore ? false : activeKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              onClick={() => {
                if (tab.isMore) {
                  onMoreOpen();
                } else if (tab.route) {
                  navigate(tab.route);
                }
              }}
              className="flex min-h-[48px] min-w-[48px] cursor-pointer flex-col items-center justify-center gap-1 border-0 bg-transparent px-1 py-2"
            >
              <span
                className={`flex items-center justify-center rounded-full px-4 py-1 text-lg leading-none transition-colors ${
                  isActive ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-transparent text-slate-500'
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[11px] leading-tight font-medium ${
                  isActive ? 'text-[#16A34A]' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabBar;
