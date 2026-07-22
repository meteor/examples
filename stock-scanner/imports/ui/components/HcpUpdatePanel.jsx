import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

export default function HcpUpdatePanel({
  checking,
  installing,
  message,
  updateVersion,
  onCheck,
  onPreview,
  onInstall,
  onDismiss,
}) {
  const open = Boolean(updateVersion);

  return (
    <>
      <Paper className="hcp-panel" variant="outlined">
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box className="hcp-icon" aria-hidden="true">
            <CloudSyncIcon fontSize="small" />
          </Box>
          <Stack spacing={1.25} flex={1}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h2" fontSize={18} fontWeight={800}>
                App updates
              </Typography>
              <Chip size="small" label="Ready when teams are" color="primary" variant="outlined" />
            </Stack>
            <Typography color="text.secondary" fontSize={14} lineHeight={1.55}>
              Keep floor teams on the latest checklist with a clear prompt before
              the app refreshes.
            </Typography>
            {checking && <LinearProgress aria-label="Checking for HCP update" />}
            {message && (
              <Typography className="hcp-message" fontSize={13}>
                {message}
              </Typography>
            )}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="contained"
                startIcon={<SystemUpdateAltIcon />}
                onClick={onCheck}
                disabled={checking || installing}
                sx={{ minHeight: 52 }}
              >
                Check for update
              </Button>
              <Button
                variant="outlined"
                aria-label="Preview HCP update"
                onClick={onPreview}
                disabled={installing}
                sx={{ minHeight: 52 }}
              >
                Preview prompt
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Dialog
        open={open}
        onClose={onDismiss}
        aria-labelledby="stock-hcp-dialog-title"
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle id="stock-hcp-dialog-title">New app update available</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Version {updateVersion} is ready to install. The app will refresh
            after the update is applied.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onDismiss} disabled={installing}>
            Not now
          </Button>
          <Button variant="contained" onClick={onInstall} disabled={installing}>
            Install update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
