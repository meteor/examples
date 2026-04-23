import { Stack, Text, Title, Kbd, Group } from '@mantine/core';
import { IconNotes } from '@tabler/icons-react';
import { Trans } from '@lingui/macro';

export const EmptyState = () => (
  <Stack align="center" justify="center" h="100vh" gap="lg" style={{ marginTop: '-80px' }}>
    <IconNotes size={96} stroke={1} opacity={0.2} />
    <Title order={2} c="dimmed" ta="center">
      <Trans>Your notes, always available</Trans>
    </Title>
    <Text c="dimmed" size="lg" ta="center" maw={400}>
      <Trans>Select a note from the sidebar or create a new one to get started</Trans>
    </Text>
    <Stack gap="sm" mt="lg">
      <Group gap="xs" justify="center">
        <Kbd size="lg">Alt</Kbd>
        <Text size="md" c="dimmed">
          +
        </Text>
        <Kbd size="lg">N</Kbd>
        <Text size="md" c="dimmed">
          <Trans>to create a note</Trans>
        </Text>
      </Group>
      <Group gap="xs" justify="center">
        <Kbd size="lg">Esc</Kbd>
        <Text size="md" c="dimmed">
          <Trans>to deselect</Trans>
        </Text>
      </Group>
    </Stack>
    <Text size="sm" c="dimmed" ta="center" maw={440} mt="md">
      <Trans>
        Notes are tied to this device. Clearing browser data will unlink them. Use Export from the
        menu to keep a backup.
      </Trans>
    </Text>
  </Stack>
);
