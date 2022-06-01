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
    primary: 'py-3.5 px-4 bg-dodger text-white border-none', // Full background
    secondary: `py-3.5 px-4 bg-transparent text-dodger border-2 border-dodger ${
      !disabled
        ? 'hover:bg-dodger hover:text-white hover:border-transparent'
        : ''
    }`, // Outline
    tertiary: 'py-3.5 px-4 bg-transparent text-dodger border-none', // Transparent
    danger: `py-3.5 px-4 bg-transparent text-vermilion border-2 border-vermilion ${
      !disabled
        ? 'hover:bg-vermilion hover:text-white hover:border-transparent'
        : ''
    }`, // Red outline
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
