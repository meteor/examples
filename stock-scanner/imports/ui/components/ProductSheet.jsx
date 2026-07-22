import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { CATEGORIES } from '../../api/inventory/schema';
import CategoryMark from './CategoryMark';

export default function ProductSheet({ item, onClose, onSave, onAdjust }) {
  const useSideSheet = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Other');
  const [minStock, setMinStock] = useState('0');
  const itemId = item?._id;
  const itemName = item?.name ?? '';
  const itemCategory = item?.category ?? 'Other';
  const itemMinStock = item?.minStock ?? 0;

  useEffect(() => {
    if (!itemId) return;
    setName(itemName);
    setCategory(itemCategory);
    setMinStock(String(itemMinStock));
  }, [itemId, itemName, itemCategory, itemMinStock]);

  const open = Boolean(item);

  return (
    <Drawer
      anchor={useSideSheet ? 'right' : 'bottom'}
      open={open}
      onClose={onClose}
      PaperProps={{
        className: useSideSheet ? 'product-sheet product-sheet-side' : 'product-sheet',
      }}
    >
      {item && (
        <Stack spacing={2} className="product-sheet-content">
          <Stack className="sheet-product-header" direction="row" spacing={1.5} alignItems="center">
            <CategoryMark category={item.category} size="large" />
            <Stack spacing={0.25} minWidth={0}>
              <Typography className="section-label">Count adjustment</Typography>
              <Typography variant="h2" fontSize={24} fontWeight={900} className="product-name">
                {item.name}
              </Typography>
              <Typography color="text.secondary" fontSize={13}>{item.sku} · {item.category}</Typography>
            </Stack>
          </Stack>
          <div className="count-stepper" aria-label={`${item.count} on hand`}>
            <IconButton aria-label="Count down" onClick={() => onAdjust(item._id, -1)}>
              <RemoveIcon />
            </IconButton>
            <div><strong>{item.count}</strong><span>on hand</span></div>
            <IconButton aria-label="Count up" onClick={() => onAdjust(item._id, 1)}>
              <AddIcon />
            </IconButton>
          </div>
          {item.count <= item.minStock && <Chip label={`Low stock · minimum ${item.minStock}`} color="warning" />}
          <Typography className="section-label">Product details</Typography>
          <TextField
            label="Product name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            fullWidth
          >
            {CATEGORIES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Minimum stock"
            type="number"
            value={minStock}
            onChange={(event) => setMinStock(event.target.value)}
            fullWidth
            inputProps={{ min: 0 }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end" className="sheet-actions">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() =>
                onSave({
                  itemId: item._id,
                  name,
                  category,
                  minStock: Number(minStock || 0),
                })
              }
              sx={{ minHeight: 52 }}
            >
              Save product
            </Button>
          </Stack>
        </Stack>
      )}
    </Drawer>
  );
}
