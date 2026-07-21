import React from 'react';

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

export function SystemMeter({ label, value, helper, tone = 'cyan', icon: Icon }) {
  const percent = clampPercent(value);

  return (
    <section className={`system-meter system-meter--${tone}`}>
      <div className="system-meter__header">
        <div className="system-meter__label">
          {Icon ? <Icon aria-hidden="true" size={18} strokeWidth={2.2} /> : null}
          <span>{label}</span>
        </div>
        <strong>{percent}%</strong>
      </div>

      <div
        className="system-meter__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span className="system-meter__fill" style={{ width: `${percent}%` }} />
      </div>

      {helper ? <p className="system-meter__helper">{helper}</p> : null}
    </section>
  );
}
