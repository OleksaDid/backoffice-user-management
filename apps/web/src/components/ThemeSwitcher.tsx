import { type MantineColorScheme, SegmentedControl, useMantineColorScheme } from '@mantine/core';

const OPTIONS: { label: string; value: MantineColorScheme }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'auto' },
];

/**
 * THEME-01: Light, Dark or System, available on every page. Mantine's SegmentedControl
 * renders native radio inputs, so it is a keyboard-operable radio group.
 */
export function ThemeSwitcher() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  return (
    <SegmentedControl
      role="radiogroup"
      aria-label="Theme"
      size="xs"
      value={colorScheme}
      onChange={(value) => {
        setColorScheme(value);
      }}
      data={OPTIONS}
    />
  );
}
