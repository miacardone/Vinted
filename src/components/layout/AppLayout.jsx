import { useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Icon from '@/components/ui/Icon';
import { Popover, Tooltip } from '@/components/ui/Overlay';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/brand/BrandProvider';
import { ROUTES } from '@/data/navigation';
import { bellAlerts, getSeverity } from '@/domain/alerts';
import { readPref, writePref } from '@/utils/storage';
import { relativeTime } from '@/utils/format';

const SIDEBAR_KEY = 'ddc.sidebarCollapsed';

/**
 * The bell reads the SAME alerts the Alerts page does.
 *
 * It used to hold a hardcoded array that claimed "18 cases due within 24
 * hours" regardless of the book underneath it. A notification count that is
 * decorative is worse than no notification count — people learn the number
 * means nothing, and then it means nothing on the day it is real.
 */
function Topbar() {
  const { user, signOut } = useAuth();
  const brand = useBrand();
  const navigate = useNavigate();

  const alerts = useMemo(() => bellAlerts(4), []);
  const [read, setRead] = useState(() => new Set());

  const unread = alerts.filter((a) => !read.has(a.id)).length;

  return (
    <header className="topbar">
      <Tooltip label="Open your performance dashboard" side="bottom">
        <button
          type="button"
          className="row row--xtight"
          style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--c-ink-muted)', fontSize: 'var(--fs-small)' }}
          onClick={() => navigate(ROUTES.dashboard)}
        >
          <Icon name="chart" size={15} /> View my stats
        </button>
      </Tooltip>

      <Popover
        align="right"
        width={300}
        trigger={({ toggle }) => (
          <Tooltip label="Notifications" side="bottom">
            <button type="button" className="bell" onClick={toggle} aria-label="Notifications">
              <Icon name="bell" size={17} />
              {unread > 0 && <span className="bell__count">{unread}</span>}
            </button>
          </Tooltip>
        )}
      >
        {({ close }) => (
          <>
            <div className="row row--between" style={{ padding: 'var(--s-2)' }}>
              <span className="small strong">Alerts</span>
              {unread > 0 && (
                <button
                  type="button"
                  className="micro"
                  style={{ border: 0, background: 'transparent', color: 'var(--c-primary)', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setRead(new Set(alerts.map((a) => a.id)))}
                >
                  Mark all read
                </button>
              )}
            </div>

            {alerts.length === 0 && <div className="popover__item"><span className="micro subtle">Nothing to act on.</span></div>}

            {alerts.map((a) => (
              <button
                key={a.id}
                type="button"
                className="popover__item"
                style={{ alignItems: 'flex-start' }}
                onClick={() => { setRead((p) => new Set(p).add(a.id)); close?.(); navigate(ROUTES.alerts); }}
              >
                <span
                  className={`dot dot--${getSeverity(a.severity).tone}`}
                  style={{ marginTop: 5, background: read.has(a.id) ? 'transparent' : undefined }}
                />
                <span style={{ minWidth: 0 }}>
                  <span className="small strong" style={{ display: 'block' }}>{a.title}</span>
                  <span className="micro subtle" style={{ display: 'block' }}>{a.action?.label ?? getSeverity(a.severity).label}</span>
                  <span className="nano subtle">{relativeTime(a.at)}</span>
                </span>
              </button>
            ))}

            <button
              type="button"
              className="popover__item"
              onClick={() => { close?.(); navigate(ROUTES.alerts); }}
              style={{ borderTop: '1px solid var(--c-line)', color: 'var(--c-primary)', fontWeight: 600 }}
            >
              <Icon name="bell" size={14} /> See all alerts
            </button>
          </>
        )}
      </Popover>

      <Popover
        align="right"
        width={220}
        trigger={({ toggle }) => (
          <button type="button" className="row row--xtight" style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2 }} onClick={toggle} aria-label="Account menu">
            <span className="avatar">{user?.initials}</span>
            <span style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <span className="small strong" style={{ display: 'block' }}>{user?.roleLabel}</span>
              <span className="nano subtle">{brand.shortName}</span>
            </span>
            <Icon name="chevronDown" size={13} className="subtle" />
          </button>
        )}
      >
        {() => (
          <>
            <div style={{ padding: 'var(--s-2)', borderBottom: '1px solid var(--c-line)' }}>
              <div className="small strong">{user?.name}</div>
              <div className="micro subtle">{user?.email}</div>
            </div>
            <button type="button" className="popover__item" onClick={signOut}>
              <Icon name="logout" size={14} className="subtle" /> Log out
            </button>
          </>
        )}
      </Popover>
    </header>
  );
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => readPref(SIDEBAR_KEY) === 'true');

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      writePref(SIDEBAR_KEY, next);
      return next;
    });
  };

  return (
    <div className="shell">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="shell__main">
        <Topbar />
        <main className="shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
