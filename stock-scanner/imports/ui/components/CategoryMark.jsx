import React from 'react';
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalGroceryStoreOutlinedIcon from '@mui/icons-material/LocalGroceryStoreOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';

const CATEGORY_ICONS = {
  Apparel: CheckroomOutlinedIcon,
  Electronics: DevicesOutlinedIcon,
  Grocery: LocalGroceryStoreOutlinedIcon,
  Hardware: HandymanOutlinedIcon,
  Pharmacy: MedicalServicesOutlinedIcon,
  Other: Inventory2OutlinedIcon,
};

export default function CategoryMark({ category, size = 'medium' }) {
  const Icon = CATEGORY_ICONS[category] || Inventory2OutlinedIcon;

  return (
    <span
      className={`category-mark category-${category.toLowerCase()} category-mark-${size}`}
      aria-label={`${category} product type`}
      role="img"
    >
      <Icon fontSize="inherit" />
    </span>
  );
}
