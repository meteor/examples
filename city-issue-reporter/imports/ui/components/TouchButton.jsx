import React from 'react';

export default function TouchButton({
  children,
  className,
  disabled,
  onPress,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={className}
      disabled={disabled}
      onClick={onPress}
      {...props}
    >
      {children}
    </button>
  );
}
