import React, { useState, useEffect } from 'react';
import { useFind } from 'meteor/react-meteor-data';
import {
  TextInput,
  Textarea,
  Group,
  ActionIcon,
  Stack,
  Text,
  Tooltip,
  Badge,
  SegmentedControl,
  TypographyStylesProvider,
  Divider,
} from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import {
  IconPin,
  IconPinFilled,
  IconTrash,
  IconArrowLeft,
  IconEye,
  IconEdit,
  IconTag,
  IconX,
} from '@tabler/icons-react';
import Markdown from 'react-markdown';
import { NotesCollection } from '../api/notes/collection';
import { updateNote, removeNote, togglePin } from '../api/notes/methods';

export const NoteEditor = ({ noteId, onClose }) => {
  const [note] = useFind(() => NotesCollection.find({ _id: noteId }), [noteId]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [viewMode, setViewMode] = useState('edit');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
    }
  }, [note?._id]);

  useEffect(() => {
    setViewMode('edit');
    setTagInput('');
  }, [noteId]);

  const debouncedSave = useDebouncedCallback((fields) => {
    updateNote({ _id: noteId, ...fields });
  }, 500);

  const handleTitleChange = (e) => {
    const newTitle = e.currentTarget.value;
    setTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  const handleBodyChange = (e) => {
    const newBody = e.currentTarget.value;
    setBody(newBody);
    debouncedSave({ body: newBody });
  };

  const handleDelete = async () => {
    await removeNote({ _id: noteId });
    onClose();
  };

  const handleTogglePin = () => {
    togglePin({ _id: noteId });
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      const currentTags = note?.tags || [];
      if (!currentTags.includes(newTag) && currentTags.length < 20) {
        updateNote({ _id: noteId, tags: [...currentTags, newTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const currentTags = note?.tags || [];
    updateNote({ _id: noteId, tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  if (!note) {
    return (
      <Text c="dimmed" ta="center" py="xl" size="lg">
        Note not found
      </Text>
    );
  }

  return (
    <Stack h="100%" gap="md">
      {/* Toolbar */}
      <Group justify="space-between" py={4}>
        <ActionIcon variant="subtle" size="xl" onClick={onClose} hiddenFrom="sm" aria-label="Back">
          <IconArrowLeft size={24} />
        </ActionIcon>
        <Group gap="sm" ml="auto">
          <SegmentedControl
            size="sm"
            value={viewMode}
            onChange={setViewMode}
            data={[
              {
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconEdit size={18} />
                    <Text size="sm">Edit</Text>
                  </Group>
                ),
                value: 'edit',
              },
              {
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconEye size={18} />
                    <Text size="sm">Preview</Text>
                  </Group>
                ),
                value: 'preview',
              },
            ]}
          />
          <Tooltip label={note.pinned ? 'Unpin' : 'Pin'}>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={handleTogglePin}
              aria-label="Toggle pin"
            >
              {note.pinned ? <IconPinFilled size={22} /> : <IconPin size={22} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              variant="subtle"
              size="lg"
              color="red"
              onClick={handleDelete}
              aria-label="Delete note"
            >
              <IconTrash size={22} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Divider />

      {/* Title */}
      <TextInput
        value={title}
        onChange={handleTitleChange}
        placeholder="Note title"
        variant="unstyled"
        styles={{ input: { fontWeight: 800, fontSize: '2rem', lineHeight: 1.2 } }}
      />

      {/* Body */}
      {viewMode === 'edit' ? (
        <Textarea
          value={body}
          onChange={handleBodyChange}
          placeholder="Start writing... (supports Markdown)"
          autosize
          minRows={12}
          maxRows={40}
          variant="unstyled"
          styles={{ input: { fontSize: '1.1rem', lineHeight: 1.7 } }}
          flex={1}
        />
      ) : (
        <TypographyStylesProvider flex={1} fz="md" style={{ minHeight: 250 }}>
          {body ? (
            <Markdown>{body}</Markdown>
          ) : (
            <Text c="dimmed" fs="italic" size="lg">
              Nothing to preview
            </Text>
          )}
        </TypographyStylesProvider>
      )}

      <Divider />

      {/* Tags */}
      <Group gap={8} wrap="wrap" align="center">
        <IconTag size={18} color="var(--mantine-color-dimmed)" />
        {note.tags?.map((tag) => (
          <Badge
            key={tag}
            size="lg"
            variant="light"
            radius="sm"
            style={{ cursor: 'pointer' }}
            rightSection={
              <ActionIcon
                size="xs"
                variant="transparent"
                onClick={() => handleRemoveTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                <IconX size={12} />
              </ActionIcon>
            }
          >
            {tag}
          </Badge>
        ))}
        <TextInput
          value={tagInput}
          onChange={(e) => setTagInput(e.currentTarget.value)}
          onKeyDown={handleAddTag}
          placeholder="Add tag..."
          size="sm"
          variant="unstyled"
          w={140}
        />
      </Group>

      {/* Metadata */}
      <Text size="sm" c="dimmed">
        Last updated:{' '}
        {note.updatedAt?.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </Stack>
  );
};
