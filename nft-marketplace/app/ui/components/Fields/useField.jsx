import { useLayoutEffect, useRef, useState } from 'react';

export const useField = ({ onChange, value, label }) => {
  const firstUpdate = useRef(0);
  const [active, setActive] = useState(false);

  useLayoutEffect(() => {
    if (firstUpdate.current <= 1 && label) {
      firstUpdate.current += 1;
      setActive(!!value);
    }
    if (!value && label && firstUpdate.current > 1) {
      setActive(!!value);
    }
  }, [value]);

  const handleChange = e => {
    if (label) {
      setActive(!!e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return { handleChange, active };
};
