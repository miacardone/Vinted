/**
 * Tabs and sub-tabs.
 *
 * Two levels exist because Users needs them: top-level tabs (User management /
 * Skills / Permissions) and sub-tabs inside one panel (Users / Roles / Groups).
 * The visual weight difference is what keeps that legible.
 */

export function Tabs({ tabs = [], active, onChange, className = '' }) {
  return (
    <div className={`tabs ${className}`.trim()} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`tab ${active === tab.id ? 'is-active' : ''}`.trim()}
          onClick={() => onChange?.(tab.id)}
        >
          {tab.label}
          {tab.count != null && <span className="tab__count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SubTabs({ tabs = [], active, onChange }) {
  return (
    <div className="subtabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`subtab ${active === tab.id ? 'is-active' : ''}`.trim()}
          onClick={() => onChange?.(tab.id)}
        >
          {tab.label}
          {tab.count != null && <span className="micro faint"> ({tab.count})</span>}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
