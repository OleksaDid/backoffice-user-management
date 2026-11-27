import { Pagination } from '@mantine/core';

const CONTROL_LABELS = {
  first: 'First page',
  previous: 'Previous page',
  next: 'Next page',
  last: 'Last page',
} as const;

/** DASH-13: page controls in a labelled nav; Mantine marks the current page aria-current. */
export function UsersPagination(props: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (props.totalPages <= 1) {
    return null;
  }
  return (
    <nav aria-label="Pagination">
      <Pagination
        total={props.totalPages}
        value={props.page}
        onChange={props.onChange}
        withEdges
        getItemProps={(page) => ({ 'aria-label': `Page ${page}` })}
        getControlProps={(control) => ({ 'aria-label': CONTROL_LABELS[control] })}
      />
    </nav>
  );
}
