import { useState, useEffect } from 'react';
import { MantineProvider, AppShell, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { t } from '@lingui/macro';
import { NotesList } from './NotesList';
import { NoteEditor } from './NoteEditor';
import { EmptyState } from './EmptyState';
import { createNote } from '../api/notes/methods';
import { getOwnerId } from './owner';

/**
 * Mantine Theme Configuration
 *
 * This theme showcases the key areas of Mantine's createTheme API:
 * - primaryColor / primaryShade: which color swatch + shade to use
 * - fontSizes / headings: typography scale
 * - defaultRadius: global border radius token
 * - components: per-component default props and style overrides
 *
 * Docs: https://mantine.dev/theming/theme-object/
 */
const theme = createTheme({
  primaryColor: 'indigo',
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: 'md',
  fontSizes: {
    xs: '0.8rem',
    sm: '0.95rem',
    md: '1.05rem',
    lg: '1.2rem',
    xl: '1.4rem',
  },
  headings: {
    sizes: {
      h1: { fontSize: '2rem' },
      h2: { fontSize: '1.6rem' },
      h3: { fontSize: '1.35rem' },
    },
  },
  components: {
    AppShell: {
      styles: () => ({
        navbar: {
          backgroundColor: 'light-dark(var(--mantine-color-indigo-0), var(--mantine-color-dark-7))',
        },
      }),
    },
    Card: {
      defaultProps: {
        withBorder: true,
      },
    },
    ActionIcon: {
      defaultProps: {
        variant: 'light',
      },
    },
  },
});

export const App = () => {
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+N (Option+N on macOS) — Ctrl/Cmd+N is reserved by browsers to
      // open a new window, so we can't intercept it outside PWA standalone.
      // Match on e.code so Option+N on macOS (which types ˜) still triggers.
      if (e.altKey && e.code === 'KeyN') {
        e.preventDefault();
        createNote({ ownerId: getOwnerId(), title: t`Untitled`, body: '' }).then((id) =>
          setSelectedNoteId(id)
        );
      }
      if (e.key === 'Escape') {
        setSelectedNoteId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" />
      <AppShell navbar={{ width: 400, breakpoint: 'sm' }} padding="xl">
        <AppShell.Navbar p="lg">
          <NotesList selectedNoteId={selectedNoteId} onSelectNote={setSelectedNoteId} />
        </AppShell.Navbar>
        <AppShell.Main>
          {selectedNoteId ? (
            <NoteEditor noteId={selectedNoteId} onClose={() => setSelectedNoteId(null)} />
          ) : (
            <EmptyState />
          )}
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
};
