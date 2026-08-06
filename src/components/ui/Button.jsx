import Icon from '@/components/ui/Icon';

/**
 * Button. Labels always name the action that will happen — "Record decision",
 * never "OK" — so a user can predict the result before clicking.
 */
export function Button({
  variant = 'secondary',
  size,
  block,
  icon,
  iconAfter,
  as: Tag = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size ? `btn--${size}` : '',
    block ? 'btn--block' : '',
    !children ? 'btn--icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      className={classes}
      {...(Tag === 'button' ? { type: rest.type ?? 'button' } : {})}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 13 : 15} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={size === 'sm' ? 13 : 15} />}
    </Tag>
  );
}

export default Button;
