import React from 'react';
import { Meteor } from 'meteor/meteor';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import RefreshIcon from '@mui/icons-material/Refresh';
import HcpUpdatePanel from '../components/HcpUpdatePanel';
import NativeStatus from '../components/NativeStatus';

function InformationRow({ label, value }) {
  return (
    <ListItem divider>
      <ListItemText primary={label} secondary={value} secondaryTypographyProps={{ className: 'info-value' }} />
    </ListItem>
  );
}

export default function SystemInfoPage({
  appInfo,
  ddpEnabled,
  ddpEndpoint,
  ddpStatus,
  hcp,
  onReconnect,
  onToggleDdp,
}) {
  return (
    <Container maxWidth="lg" className="app-content system-content">
      <Stack spacing={2.25}>
        <Box component="header" className="task-header">
          <Typography className="eyebrow">Developer tools</Typography>
          <Typography component="h2" variant="h4" fontWeight={900}>
            System information
          </Typography>
          <Typography className="task-copy">
            Inspect native runtime, live data connection, and application update state.
          </Typography>
        </Box>

        <Box className="system-grid">
          <Paper className="system-panel" variant="outlined">
            <Typography component="h3" variant="h6" fontWeight={850}>Application</Typography>
            <List disablePadding>
              <InformationRow label="Application name" value={appInfo.name} />
              <InformationRow label="Application ID" value={appInfo.appId} />
              <InformationRow label="Application version" value={appInfo.version} />
              <InformationRow label="Build number" value={appInfo.build} />
            </List>
          </Paper>

          <Paper className="system-panel" variant="outlined">
            <Typography component="h3" variant="h6" fontWeight={850}>Runtime</Typography>
            <NativeStatus />
            <List disablePadding>
              <InformationRow label="Platform" value={appInfo.platform} />
              <InformationRow label="Runtime mode" value={appInfo.native ? 'Native Capacitor' : 'Browser preview'} />
              <InformationRow label="Meteor release" value={Meteor.release || 'Development checkout'} />
            </List>
          </Paper>
        </Box>

        <Paper className="system-panel ddp-panel" variant="outlined">
          <Stack spacing={1.5}>
            <Box>
              <Typography component="h3" variant="h6" fontWeight={850}>Live data connection</Typography>
              <Typography color="text.secondary" fontSize={14}>DDP status: {ddpStatus}</Typography>
            </Box>
            <Box className="endpoint-box">
              <Typography fontSize={12} fontWeight={850} color="text.secondary">DDP endpoint</Typography>
              <Typography className="endpoint-value">{ddpEndpoint}</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ sm: 'center' }}>
              <FormControlLabel
                control={(
                  <Switch
                    checked={ddpEnabled}
                    onChange={(event) => onToggleDdp(event.target.checked)}
                    inputProps={{ 'aria-label': 'Live DDP connection' }}
                  />
                )}
                label="Live DDP connection"
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={onReconnect}
                aria-label="Reconnect now"
              >
                Reconnect now
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <HcpUpdatePanel {...hcp} />
      </Stack>
    </Container>
  );
}
