export function Card({ className = '', children, ...rest }) {
  return (
    <section className={`card ${className}`.trim()} {...rest}>
      {children}
    </section>
  );
}

export function CardHead({ title, subtitle, actions, eyebrow, children }) {
  return (
    <header className="card__head">
      <div className="card__head-text">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {title && <h2>{title}</h2>}
        {subtitle && <p className="small muted">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="row row--tight">{actions}</div>}
    </header>
  );
}

export function CardBody({ flush = false, tight = false, className = '', children }) {
  const classes = ['card__body', flush ? 'card__body--flush' : '', tight ? 'card__body--tight' : '', className]
    .filter(Boolean)
    .join(' ');
  return <div className={classes}>{children}</div>;
}

export function CardFoot({ children }) {
  return <footer className="card__foot">{children}</footer>;
}

export default Card;
