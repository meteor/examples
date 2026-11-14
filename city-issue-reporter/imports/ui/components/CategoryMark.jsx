import React from 'react';

const CATEGORY_MARKS = {
  Pothole: 'PH',
  Streetlight: 'LT',
  Sidewalk: 'SW',
  Graffiti: 'GR',
  'Blocked lane': 'BL',
  Other: 'OT',
};

export default function CategoryMark({ category, size = 'medium' }) {
  return (
    <span
      className={`category-mark category-${category.toLowerCase().replaceAll(' ', '-')} category-mark-${size}`}
      aria-label={`${category} category`}
      role="img"
    >
      {CATEGORY_MARKS[category] || CATEGORY_MARKS.Other}
    </span>
  );
}
