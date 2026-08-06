import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Wordmark from '@/brand/Wordmark';
import { useBrand } from '@/brand/BrandProvider';
import { NAV_ITEMS } from '@/components/layout/navigation';

/**
 * Dark navigation rail.
 *
 * Groups auto-expand when a child route is active, so a deep link lands with
 * its section already open rather than leaving the user to work out where they
 * are. Manual toggling still wins after that.
 */
export function Sidebar() {
  const brand = useBrand();
  const { pathname } = useLocation();

  const groupContaining = (path) =>
    NAV_ITEMS.find((item) => item.children?.some((child) => path.startsWith(child.to)))?.id;

  const [openGroups, setOpenGroups] = useState(() => {
    const active = groupContaining(pathname);
    return new Set(active ? [active] : []);
  });

  useEffect(() => {
    const active = groupContaining(pathname);
    if (active) {
      setOpenGroups((current) => (current.has(active) ? current : new Set([...current, active])));
    }
  }, [pathname]);

  const toggleGroup = (id) => {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <nav className="rail" aria-label="Main navigation">
      <div className="rail__head">
        <Wordmark inverse />
      </div>

      <div className="rail__nav">
        {NAV_ITEMS.map((item) => {
          if (!item.children) {
            return (
              <div key={item.id} className="rail__section">
                <NavLink
                  to={item.to}
                  className={({ isActive }) => `rail__link ${isActive ? 'is-active' : ''}`.trim()}
                >
                  <Icon name={item.icon} size={17} className="rail__icon" />
                  <span className="rail__label">{item.label}</span>
                </NavLink>
              </div>
            );
          }

          const isOpen = openGroups.has(item.id);
          const hasActiveChild = item.children.some((child) => pathname.startsWith(child.to));

          return (
            <div key={item.id} className="rail__section">
              <button
                type="button"
                className="rail__toggle"
                onClick={() => toggleGroup(item.id)}
                aria-expanded={isOpen}
              >
                <Icon
                  name={item.icon}
                  size={17}
                  className="rail__icon"
                  style={hasActiveChild ? { color: 'var(--c-nav-active)' } : undefined}
                />
                <span className="rail__label">{item.label}</span>
                <Icon name="chevron" size={13} className={`rail__chevron ${isOpen ? 'is-open' : ''}`.trim()} />
              </button>

              {isOpen && (
                <div className="rail__children">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.id}
                      to={child.to}
                      end={child.end}
                      className={({ isActive }) => `rail__child ${isActive ? 'is-active' : ''}`.trim()}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rail__foot">
        <span className="rail__tenant">
          <span className="rail__tenant-dot" />
          {brand.name} · {brand.productName}
        </span>
      </div>
    </nav>
  );
}

export default Sidebar;
