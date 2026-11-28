import { Title, type TitleProps } from '@mantine/core';
import { useEffect, useRef } from 'react';

/** False until the first page heading has rendered in this browser tab. */
let appHasRenderedAPage = false;

/**
 * The page's single h1. After client-side navigation it receives focus, so screen reader
 * and keyboard users start at the new content (UI-AUTH-03, NFR-22). On the very first
 * page of a visit it does not: the browser's natural order (skip link, header) applies.
 */
export function PageHeading({ children, ...props }: Omit<TitleProps, 'order'>) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (appHasRenderedAPage) {
      ref.current?.focus();
    }
    appHasRenderedAPage = true;
  }, []);
  return (
    <Title order={1} ref={ref} tabIndex={-1} style={{ outline: 'none' }} {...props}>
      {children}
    </Title>
  );
}
