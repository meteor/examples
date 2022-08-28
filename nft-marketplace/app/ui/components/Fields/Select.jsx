import React from 'react';

export const Select = ({
  children,
  className = '',
  onChange = () => ({}),
}) => {
  return (
    <select
      className={`mx-0 text-p font-thin p-3 h-14 bg-white rounded-lg border-2 border-lilac ${className}`}
      onChange={onChange}
    >
      {children}
    </select>
  );
};
