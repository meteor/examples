import React from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

export default function HcpUpdatePrompt({
  installing,
  opened,
  updateVersion,
  onDismiss,
  onInstall,
  onReview,
}) {
  return (
    <>
      <Snackbar
        className="hcp-update-reminder"
        open={Boolean(updateVersion) && !opened}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          action={
            <Button
              color="inherit"
              size="small"
              aria-label="Review update"
              onClick={onReview}
              sx={{ minHeight: 48 }}
            >
              Review
            </Button>
          }
        >
          Update ready
        </Alert>
      </Snackbar>

      <Dialog
        open={Boolean(updateVersion) && opened}
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
