export function TextInput({ id, label, error, helpText, className = '', ...props }) {
  return (
    <div className={className}>
      {label ? <label htmlFor={id} className="form-label">{label}</label> : null}
      <input id={id} className={`form-control ${error ? 'is-invalid' : ''}`} aria-invalid={Boolean(error)} aria-describedby={helpText || error ? `${id}-help` : undefined} {...props} />
      {error ? <div id={`${id}-help`} className="invalid-feedback">{error}</div> : null}
      {!error && helpText ? <div id={`${id}-help`} className="form-text">{helpText}</div> : null}
    </div>
  );
}

export function SelectInput({ id, label, error, helpText, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label ? <label htmlFor={id} className="form-label">{label}</label> : null}
      <select id={id} className={`form-select ${error ? 'is-invalid' : ''}`} aria-invalid={Boolean(error)} aria-describedby={helpText || error ? `${id}-help` : undefined} {...props}>{children}</select>
      {error ? <div id={`${id}-help`} className="invalid-feedback">{error}</div> : null}
      {!error && helpText ? <div id={`${id}-help`} className="form-text">{helpText}</div> : null}
    </div>
  );
}

export function TextareaInput({ id, label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label ? <label htmlFor={id} className="form-label">{label}</label> : null}
      <textarea id={id} className={`form-control ${error ? 'is-invalid' : ''}`} aria-invalid={Boolean(error)} {...props} />
      {error ? <div className="invalid-feedback">{error}</div> : null}
    </div>
  );
}
