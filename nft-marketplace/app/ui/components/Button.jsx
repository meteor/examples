import React from 'react';

export const Button = ({
  children,
  className = '',
  text = null,
  type = 'primary',
  onClick = () => ({}),
  startIcon = null,
  endIcon = null,
  disabled = false,
}) => {
  const btnTypes = {
    primary: 'py-2 px-4 bg-gray-500 text-white border-none', // Full background
  };

  return (
    <button
      disabled={disabled}
      className={`rounded-lg uppercase w-fit-content ${
        disabled ? 'opacity-50' : ''
      } ${btnTypes[type]} ${className}`}
      onClick={onClick}
    >
      {startIcon && <span className="mr-4">{startIcon}</span>}
      <span className="relative top-px">{text || children}</span>
      {endIcon && <span className="ml-4">{endIcon}</span>}
    </button>
  );
};
