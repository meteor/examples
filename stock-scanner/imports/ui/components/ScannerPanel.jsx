import React from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import KeyboardOutlinedIcon from '@mui/icons-material/KeyboardOutlined';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

export default function ScannerPanel({
  manualSku,
  onManualSkuChange,
  onAddSku,
  onScanBarcode,
  busy,
}) {
  return (
    <Paper className="scan-panel" variant="outlined">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <span className="scanner-icon" aria-hidden="true"><QrCodeScannerIcon /></span>
          <Stack spacing={0.25}>
            <Typography className="section-label">Shelf count</Typography>
            <Typography variant="h2" fontSize={22} fontWeight={850}>
              Scan the next label
            </Typography>
          </Stack>
        </Stack>
        <Button
          className="camera-scan-button"
          variant="contained"
          aria-label="Scan barcode"
          startIcon={<QrCodeScannerIcon />}
          onClick={onScanBarcode}
          disabled={busy}
        >
          Open barcode scanner
        </Button>
        <div className="manual-divider"><span>or enter a shelf label</span></div>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <TextField
            label="Manual SKU"
            value={manualSku}
            onChange={(event) => onManualSkuChange(event.target.value)}
            fullWidth
            InputProps={{ startAdornment: <KeyboardOutlinedIcon className="manual-input-icon" /> }}
          />
          <Button
            variant="contained"
            aria-label="Add manual SKU"
            startIcon={<AddIcon />}
            onClick={onAddSku}
            disabled={busy || !manualSku.trim()}
            sx={{ minWidth: 132, minHeight: 52 }}
          >
            Add item
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
