import { useState, useMemo, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { useSubscribe, useFind, useTracker } from 'meteor/react-meteor-data';
import {
  TextInput,
  ActionIcon,
  Stack,
  Card,
  Text,
  Group,
  Badge,
  ScrollArea,
  Tooltip,
  Menu,
  Divider,
  Button,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconPin,
  IconSun,
  IconMoon,
  IconDots,
  IconDownload,
  IconUpload,
  IconWifi,
  IconWifiOff,
  IconRefresh,
  IconTrash,
  IconNote,
  IconArrowBackUp,
  IconTrashX,
  IconCheck,
  IconLanguage,
} from '@tabler/icons-react';
import { isSyncing } from 'meteor/jam:offline';
import { t, Trans, Plural } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { NotesCollection } from '../api/notes/collection';
import { createNote, recoverNote, permanentDeleteNote, emptyTrash } from '../api/notes/methods';
import { getOwnerId } from './owner';
import { activateLocale, SUPPORTED_LOCALES, LOCALE_LABELS } from './i18n';

export const NotesList = ({ selectedNoteId, onSelectNote }) => {
  const [search, setSearch] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { i18n } = useLingui();
  const ownerId = getOwnerId();

  useSubscribe('notes', ownerId);
  useSubscribe('notes.trash', ownerId);
  // Browser reports offline almost instantly; DDP's heartbeat can take 15s+ to
  // notice, so combine both signals for a responsive connectivity indicator.
  const [browserOnline, setBrowserOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  useEffect(() => {
    const handleOnline = () => setBrowserOnline(true);
    const handleOffline = () => setBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const meteorConnected = useTracker(() => Meteor.status().connected);
  const isConnected = browserOnline && meteorConnected;
  const syncing = useTracker(() => isSyncing());

  const notes = useFind(() => {
    return NotesCollection.find({}, { sort: { pinned: -1, updatedAt: -1 } });
  }, []);

  const trashedNotes = useFind(() => {
    return NotesCollection.find(
      { deleted: true },
      {
        sort: { deletedAt: -1 },
        softDelete: false,
      }
    );
  }, []);

  const filteredNotes = useMemo(() => {
    const list = showTrash ? trashedNotes : notes;
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (n) =>
        n.title?.toLowerCase().includes(q) ||
        n.body?.toLowerCase().includes(q) ||
        n.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [notes, trashedNotes, search, showTrash]);

  const handleNewNote = async () => {
    const noteId = await createNote({ ownerId, title: t`Untitled`, body: '' });
    onSelectNote(noteId);
  };

  const handleRecover = async (noteId) => {
    await recoverNote({ _id: noteId, ownerId });
  };

  const handlePermanentDelete = async (noteId) => {
    await permanentDeleteNote({ _id: noteId, ownerId });
    if (selectedNoteId === noteId) onSelectNote(null);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash({ ownerId });
    onSelectNote(null);
  };

  const handleExport = () => {
    const data = NotesCollection.find({}, { sort: { updatedAt: -1 } }).fetch();
    const exportData = data.map(({ title, body, pinned, tags, createdAt, updatedAt }) => ({
      title,
      body,
      pinned,
      tags,
      createdAt,
      updatedAt,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) return;
        for (const note of imported) {
          await createNote({
            ownerId,
            title: note.title || t`Imported`,
            body: note.body || '',
          });
        }
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    input.click();
  };

  const formatShortDate = (date) =>
    date ? i18n.date(date, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const formatDeletedDate = (date) =>
    date ? i18n.date(date, { month: 'short', day: 'numeric' }) : '';

  return (
    <Stack h="100%" gap="md">
      {/* Header */}
      <Group justify="space-between" py={4}>
        <Group gap="sm">
          <img
            src="/icons/icon-192.png"
            alt="Notes Offline"
            width={28}
            height={28}
            style={{ borderRadius: 6 }}
          />
          <Text fw={800} size="xl">
            {showTrash ? <Trans>Trash</Trans> : <Trans>Notes</Trans>}
          </Text>
          <Tooltip label={syncing ? t`Syncing...` : isConnected ? t`Online` : t`Offline`}>
            {syncing ? (
              <IconRefresh size={18} color="var(--mantine-color-blue-6)" className="spin" />
            ) : isConnected ? (
              <IconWifi size={18} color="var(--mantine-color-green-6)" />
            ) : (
              <IconWifiOff size={18} color="var(--mantine-color-red-6)" />
            )}
          </Tooltip>
        </Group>
        <Group gap="sm">
          <Tooltip label={colorScheme === 'dark' ? t`Light mode` : t`Dark mode`}>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={toggleColorScheme}
              aria-label={t`Toggle color scheme`}
            >
              {colorScheme === 'dark' ? <IconSun size={22} /> : <IconMoon size={22} />}
            </ActionIcon>
          </Tooltip>
          <Menu position="bottom-end" width={220}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" aria-label={t`More actions`}>
                <IconDots size={22} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconDownload size={18} />} onClick={handleExport}>
                <Trans>Export notes</Trans>
              </Menu.Item>
              <Menu.Item leftSection={<IconUpload size={18} />} onClick={handleImport}>
                <Trans>Import notes</Trans>
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label>
                <Group gap={6}>
                  <IconLanguage size={14} />
                  <Trans>Language</Trans>
                </Group>
              </Menu.Label>
              {SUPPORTED_LOCALES.map((locale) => (
                <Menu.Item
                  key={locale}
                  leftSection={
                    i18n.locale === locale ? (
                      <IconCheck size={18} />
                    ) : (
                      <span style={{ width: 18, display: 'inline-block' }} />
                    )
                  }
                  onClick={() => activateLocale(locale)}
                >
                  {LOCALE_LABELS[locale]}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
          {!showTrash && (
            <Tooltip label={t`New note (Ctrl+N)`}>
              <ActionIcon
                variant="filled"
                size="lg"
                onClick={handleNewNote}
                aria-label={t`New note`}
              >
                <IconPlus size={22} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Search */}
      <TextInput
        placeholder={showTrash ? t`Search trash...` : t`Search notes...`}
        leftSection={<IconSearch size={20} />}
        size="md"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <Divider />

      {/* Trash: empty all button */}
      {showTrash && trashedNotes.length > 0 && (
        <Button
          variant="light"
          color="red"
          size="sm"
          leftSection={<IconTrashX size={18} />}
          onClick={handleEmptyTrash}
        >
          <Trans>Empty trash ({trashedNotes.length})</Trans>
        </Button>
      )}

      {/* Notes list */}
      <ScrollArea flex={1} offsetScrollbars>
        <Stack gap="sm">
          {filteredNotes.map((note) => (
            <Card
              key={note._id}
              withBorder
              padding="md"
              onClick={() => !showTrash && onSelectNote(note._id)}
              style={{
                cursor: showTrash ? 'default' : 'pointer',
                borderWidth: note._id === selectedNoteId && !showTrash ? 2 : 1,
                borderColor:
                  note._id === selectedNoteId && !showTrash
                    ? 'var(--mantine-color-blue-5)'
                    : undefined,
                backgroundColor:
                  note._id === selectedNoteId && !showTrash
                    ? 'var(--mantine-color-blue-light)'
                    : undefined,
                opacity: showTrash ? 0.8 : 1,
              }}
            >
              <Group justify="space-between" mb={6}>
                <Text fw={600} size="md" lineClamp={1} style={{ flex: 1 }}>
                  {note.title || <Trans>Untitled</Trans>}
                </Text>
                {!showTrash && note.pinned && (
                  <IconPin size={18} color="var(--mantine-color-blue-6)" />
                )}
              </Group>
              <Text size="sm" c="dimmed" lineClamp={2} mb={8}>
                {note.body || <Trans>No content</Trans>}
              </Text>
              {!showTrash && note.tags?.length > 0 && (
                <Group gap={6} mb={6}>
                  {note.tags.map((tag) => (
                    <Badge key={tag} size="sm" variant="light" radius="sm">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              )}
              <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed">
                  {showTrash ? (
                    <Trans>Deleted {formatDeletedDate(note.deletedAt)}</Trans>
                  ) : (
                    formatShortDate(note.updatedAt)
                  )}
                </Text>
                {showTrash && (
                  <Group gap="xs">
                    <Tooltip label={t`Recover`}>
                      <ActionIcon
                        size="md"
                        variant="subtle"
                        color="green"
                        onClick={() => handleRecover(note._id)}
                        aria-label={t`Recover note`}
                      >
                        <IconArrowBackUp size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={t`Delete forever`}>
                      <ActionIcon
                        size="md"
                        variant="subtle"
                        color="red"
                        onClick={() => handlePermanentDelete(note._id)}
                        aria-label={t`Delete permanently`}
                      >
                        <IconTrashX size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                )}
              </Group>
            </Card>
          ))}
          {filteredNotes.length === 0 && (
            <Text c="dimmed" ta="center" size="md" py={40}>
              {showTrash ? (
                <Trans>Trash is empty</Trans>
              ) : search ? (
                <Trans>No notes match your search</Trans>
              ) : (
                <Trans>No notes yet. Create one!</Trans>
              )}
            </Text>
          )}
        </Stack>
      </ScrollArea>

      <Divider />

      {/* Footer with trash toggle */}
      <Group justify="space-between" py={2}>
        <Text size="sm" c="dimmed">
          {showTrash ? (
            <Plural value={trashedNotes.length} one="# in trash" other="# in trash" />
          ) : (
            <Plural value={notes.length} one="# note" other="# notes" />
          )}
        </Text>
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          leftSection={showTrash ? <IconNote size={16} /> : <IconTrash size={16} />}
          onClick={() => {
            setShowTrash(!showTrash);
            onSelectNote(null);
          }}
          aria-label={showTrash ? t`Back to notes` : t`View trash`}
        >
          {showTrash ? <Trans>Back to notes</Trans> : <Trans>Trash ({trashedNotes.length})</Trans>}
        </Button>
      </Group>
    </Stack>
  );
};
