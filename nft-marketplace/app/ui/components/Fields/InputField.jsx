import React from 'react';
import { useField } from './useField';

export const InputField = ({
  classNameContainer,
  textArea,
  inputClasses,
  label,
  disabled,
  name = '',
  placeholder = '',
  onChange,
  value,
  ...props
}) => {
  const { handleChange, active } = useField({
    onChange,
    value,
    label,
  });
  return (
    <div className={`${classNameContainer || ''}`}>
      <div className="relative flex flex-col w-full">
        {textArea ? (
          <textarea
            disabled={disabled}
            onChange={handleChange}
            className={`w-full border-2 border-porcelain rounded-lg px-4 py-5 ${inputClasses}`}
            name={name}
            id={name}
            value={value}
            placeholder={placeholder}
            {...props}
          />
        ) : (
          <input
            disabled={disabled}
            onChange={handleChange}
            className={`w-full border-2 border-porcelain rounded-lg px-4 py-5 ${inputClasses}`}
            name={name}
            id={name}
            value={value}
            placeholder={placeholder}
            {...props}
          />
        )}

        {label && (
          <label
            style={{ marginBottom: 0 }}
            className={[
              'absolute top-0 left-0 flex items-center px-4 transition-all duration-200 ease-in-out text-manatee font-light',
              active ? 'text-caption py-2' : 'text-p py-5 cursor-text',
              !!placeholder && !active && 'opacity-0',
            ].join(' ')}
            htmlFor={name}
          >
            {label}
          </label>
        )}
      </div>
    </div>
  );
};
