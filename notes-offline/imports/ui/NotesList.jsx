import React, { useState, useMemo } from 'react';
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
} from '@tabler/icons-react';
import { isSyncing } from 'meteor/jam:offline';
import { NotesCollection } from '../api/notes/collection';
import { createNote, recoverNote, permanentDeleteNote, emptyTrash } from '../api/notes/methods';

export const NotesList = ({ selectedNoteId, onSelectNote }) => {
  const [search, setSearch] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const isLoading = useSubscribe('notes');
  useSubscribe('notes.trash');
  const isConnected = useTracker(() => Meteor.status().connected);
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
        n.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [notes, trashedNotes, search, showTrash]);

  const handleNewNote = async () => {
    const noteId = await createNote({ title: 'Untitled', body: '' });
    onSelectNote(noteId);
  };

  const handleRecover = async (noteId) => {
    await recoverNote({ _id: noteId });
  };

  const handlePermanentDelete = async (noteId) => {
    await permanentDeleteNote({ _id: noteId });
    if (selectedNoteId === noteId) onSelectNote(null);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash({});
    onSelectNote(null);
  };

  const handleExport = () => {
    const data = NotesCollection.find({}, { sort: { updatedAt: -1 } }).fetch();
    const exportData = data.map(({ _id, title, body, pinned, tags, createdAt, updatedAt }) => ({
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
            title: note.title || 'Imported',
            body: note.body || '',
          });
        }
      } catch (err) {
        console.error('Import failed:', err);
      }
    };
    input.click();
  };

  return (
    <Stack h="100%" gap="md">
      {/* Header */}
      <Group justify="space-between" py={4}>
        <Group gap="sm">
          <Text fw={800} size="xl">
            {showTrash ? 'Trash' : 'Notes'}
          </Text>
          <Tooltip label={syncing ? 'Syncing...' : isConnected ? 'Online' : 'Offline'}>
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
          <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={toggleColorScheme}
              aria-label="Toggle color scheme"
            >
              {colorScheme === 'dark' ? <IconSun size={22} /> : <IconMoon size={22} />}
            </ActionIcon>
          </Tooltip>
          <Menu position="bottom-end" width={200}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" aria-label="More actions">
                <IconDots size={22} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconDownload size={18} />} onClick={handleExport}>
                Export notes
              </Menu.Item>
              <Menu.Item leftSection={<IconUpload size={18} />} onClick={handleImport}>
                Import notes
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          {!showTrash && (
            <Tooltip label="New note (Ctrl+N)">
              <ActionIcon variant="filled" size="lg" onClick={handleNewNote} aria-label="New note">
                <IconPlus size={22} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Search */}
      <TextInput
        placeholder={showTrash ? 'Search trash...' : 'Search notes...'}
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
          Empty trash ({trashedNotes.length})
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
                  {note.title || 'Untitled'}
                </Text>
                {!showTrash && note.pinned && (
                  <IconPin size={18} color="var(--mantine-color-blue-6)" />
                )}
              </Group>
              <Text size="sm" c="dimmed" lineClamp={2} mb={8}>
                {note.body || 'No content'}
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
                  {showTrash
                    ? `Deleted ${note.deletedAt?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                    : note.updatedAt?.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                </Text>
                {showTrash && (
                  <Group gap="xs">
                    <Tooltip label="Recover">
                      <ActionIcon
                        size="md"
                        variant="subtle"
                        color="green"
                        onClick={() => handleRecover(note._id)}
                        aria-label="Recover note"
                      >
                        <IconArrowBackUp size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete forever">
                      <ActionIcon
                        size="md"
                        variant="subtle"
                        color="red"
                        onClick={() => handlePermanentDelete(note._id)}
                        aria-label="Delete permanently"
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
              {showTrash
                ? 'Trash is empty'
                : search
                  ? 'No notes match your search'
                  : 'No notes yet. Create one!'}
            </Text>
          )}
        </Stack>
      </ScrollArea>

      <Divider />

      {/* Footer with trash toggle */}
      <Group justify="space-between" py={2}>
        <Text size="sm" c="dimmed">
          {showTrash
            ? `${trashedNotes.length} in trash`
            : `${notes.length} note${notes.length !== 1 ? 's' : ''}`}
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
          aria-label={showTrash ? 'Back to notes' : 'View trash'}
        >
          {showTrash ? 'Back to notes' : `Trash (${trashedNotes.length})`}
        </Button>
      </Group>
    </Stack>
  );
};
