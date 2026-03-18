import React from 'react';
import { Stack, Text, Title, Kbd, Group } from '@mantine/core';
import { IconNotes } from '@tabler/icons-react';

export const EmptyState = () => (
  <Stack align="center" justify="center" h="100vh" gap="lg" style={{ marginTop: '-80px' }}>
    <IconNotes size={96} stroke={1} opacity={0.2} />
    <Title order={2} c="dimmed" ta="center">Your notes, always available</Title>
    <Text c="dimmed" size="lg" ta="center" maw={400}>
      Select a note from the sidebar or create a new one to get started
    </Text>
    <Stack gap="sm" mt="lg">
      <Group gap="xs" justify="center">
        <Kbd size="lg">Ctrl</Kbd>
        <Text size="md" c="dimmed">+</Text>
        <Kbd size="lg">N</Kbd>
        <Text size="md" c="dimmed">to create a note</Text>
      </Group>
      <Group gap="xs" justify="center">
        <Kbd size="lg">Esc</Kbd>
        <Text size="md" c="dimmed">to deselect</Text>
      </Group>
    </Stack>
  </Stack>
);
