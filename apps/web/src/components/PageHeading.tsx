import { Title, type TitleProps } from '@mantine/core';
import { useEffect, useRef } from 'react';

/**
 * The page's single h1. It receives focus when the page mounts, so after client-side
 * navigation screen reader and keyboard users start at the new content (UI-AUTH-03).
 */
export function PageHeading({ children, ...props }: Omit<TitleProps, 'order'>) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <Title order={1} ref={ref} tabIndex={-1} style={{ outline: 'none' }} {...props}>
      {children}
    </Title>
  );
}
