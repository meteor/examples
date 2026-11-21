import React from 'react';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CategoryMark from './CategoryMark';

export default function InventoryList({ items, lowStockOnly, onToggleLowStock, onSelect }) {
  const lowCount = items.filter((item) => item.count <= item.minStock).length;
  const visibleItems = lowStockOnly
    ? items.filter((item) => item.count <= item.minStock)
    : items;

  return (
    <Paper className="inventory-panel" variant="outlined">
      <Stack spacing={1.5} sx={{ p: 2, pb: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
          <Typography variant="h2" fontSize={20} fontWeight={700}>
            Audit queue
          </Typography>
          <Badge badgeContent={lowCount} color="warning">
            <Button
              size="small"
              variant={lowStockOnly ? 'contained' : 'outlined'}
              aria-label={lowStockOnly ? 'Show all stock' : 'Show low stock'}
              onClick={onToggleLowStock}
              sx={{ minHeight: 48, px: 2 }}
            >
              Low stock
            </Button>
          </Badge>
        </Stack>
        <Typography color="text.secondary" fontSize={14}>
          {visibleItems.length} products ready for count review
        </Typography>
      </Stack>
      <List>
        {visibleItems.map((item) => (
          <ListItem disablePadding key={item._id}>
            <ListItemButton onClick={() => onSelect(item._id)} aria-label={`Open ${item.sku}`}>
              <CategoryMark category={item.category} />
              <ListItemText
                primary={
                  <span className="product-copy">
                    <span className="product-name">{item.name}</span>
                    <span className="product-meta">{item.category} · {item.sku}</span>
                    <span className="stock-level" aria-label={`${item.count} on hand, minimum ${item.minStock}`}>
                      <span style={{ width: `${Math.min(100, (item.count / Math.max(item.minStock, 1)) * 70)}%` }} />
                    </span>
                  </span>
                }
              />
              <Stack className="stock-count" spacing={0.25} alignItems="flex-end">
                <strong>{item.count}</strong>
                <span>min {item.minStock}</span>
                {item.count <= item.minStock && <Chip label="Low" size="small" color="warning" />}
              </Stack>
              <ChevronRightIcon className="row-chevron" aria-hidden="true" />
            </ListItemButton>
          </ListItem>
        ))}
        {visibleItems.length === 0 && (
          <Box className="empty-state">
            <Inventory2OutlinedIcon color="disabled" />
            <Typography fontWeight={700}>
              {lowStockOnly ? 'No low-stock items' : 'No inventory items yet'}
            </Typography>
            <Typography color="text.secondary" fontSize={14}>
              {lowStockOnly
                ? 'Every scanned item is currently above its minimum stock level.'
                : 'Enter a SKU or scan a barcode to start a live stock count.'}
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  );
}
