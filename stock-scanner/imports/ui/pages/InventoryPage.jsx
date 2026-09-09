import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InventoryList from '../components/InventoryList';
import ScannerPanel from '../components/ScannerPanel';

export default function InventoryPage({
  busy,
  items,
  lowStockOnly,
  manualSku,
  onAddSku,
  onManualSkuChange,
  onScanBarcode,
  onSelect,
  onToggleLowStock,
  ready,
}) {
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);
  const lowCount = items.filter((item) => item.count <= item.minStock).length;
  const countedItems = items.filter((item) => item.count > 0).length;
  const progress = items.length ? Math.round((countedItems / items.length) * 100) : 0;

  return (
    <Container maxWidth="lg" className="app-content">
      <Stack spacing={2.25}>
        <Box component="header" className="shift-brief">
          <Box className="shift-brief-media">
            <Box
              component="img"
              src="/images/stockroom-shift.jpg"
              alt="Organized stockroom shelves ready for a barcode count"
            />
            <Box className="shift-zone-pill">Zone A · Morning shift</Box>
          </Box>
          <Box className="shift-brief-content">
            <Typography className="eyebrow">Inventory audit</Typography>
            <Box className="shift-title-row">
              <Typography component="h2" variant="h4" fontWeight={900}>
                Today’s floor count
              </Typography>
              <ArrowForwardIcon aria-hidden="true" />
            </Box>
            <Typography className="task-copy">
              Scan shelf labels, correct quantities, and clear low-stock checks while walking the floor.
            </Typography>
            <Box className="shift-progress-row">
              <Box>
                <Typography>Shift progress</Typography>
                <strong>{countedItems} of {items.length} products</strong>
              </Box>
              <strong className="shift-progress-value">{progress}%</strong>
            </Box>
            <Box className="shift-progress-track" aria-label={`Shift progress ${progress}%`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <span style={{ width: `${progress}%` }} />
            </Box>
          </Box>
          <Box className="shift-stats" aria-label="Inventory summary">
            <Box><span>Products</span><strong>{items.length}</strong></Box>
            <Box><span>Units</span><strong>{totalCount}</strong></Box>
            <Box className={lowCount ? 'attention' : ''}><span>Low alerts</span><strong>{lowCount}</strong></Box>
          </Box>
        </Box>

        <ScannerPanel
          manualSku={manualSku}
          onManualSkuChange={onManualSkuChange}
          onAddSku={onAddSku}
          onScanBarcode={onScanBarcode}
          busy={busy}
        />

        {!ready && <Alert severity="info">Inventory syncing</Alert>}

        <InventoryList
          items={items}
          lowStockOnly={lowStockOnly}
          onToggleLowStock={onToggleLowStock}
          onSelect={onSelect}
        />
      </Stack>
    </Container>
  );
}
