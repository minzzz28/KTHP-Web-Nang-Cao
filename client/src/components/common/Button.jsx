const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-light',
  outline: 'btn-outline-primary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export function Button({
  children,
  className = '',
  variant = 'primary',
  icon,
  loading = false,
  type = 'button',
  disabled = false,
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      className={`btn ${VARIANT_CLASS[variant] || VARIANT_CLASS.primary} ${className}`.trim()}
      disabled={loading || disabled}
    >
      {loading ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : icon ? <i className={`bi ${icon}`} aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}
