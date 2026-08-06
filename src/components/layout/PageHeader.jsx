export function PageHeader({ eyebrow, title, subtitle, actions, children }) {
  return (
    <header className="page-head">
      <div className="page-head__title">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p className="page-head__sub">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

export default PageHeader;
