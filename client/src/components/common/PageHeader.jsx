export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
      <div>
        {eyebrow ? <div className="section-kicker mb-2">{eyebrow}</div> : null}
        <h1 className="page-title mb-2">{title}</h1>
        {description ? <p className="text-muted-app mb-0">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}
