import React, { useLayoutEffect, useRef } from 'react';
import { ListInput } from 'framework7-react';

export default function AccessibleListInput({ accessibleLabel, ...props }) {
  const inputRef = useRef(null);

  useLayoutEffect(() => {
    const field = inputRef.current?.el?.querySelector('input, select, textarea');
    field?.setAttribute('aria-label', accessibleLabel);
  }, [accessibleLabel]);

  return <ListInput ref={inputRef} {...props} />;
}
