import React from 'react';
import { Flame, Shield, Zap } from 'lucide-react';

const ACTIONS = [
  {
    action: 'shield',
    label: 'Shield',
    detail: 'Deflect meteors',
    tone: 'cyan',
    Icon: Shield,
  },
  {
    action: 'cool',
    label: 'Cool',
    detail: 'Bleed reactor heat',
    tone: 'yellow',
    Icon: Flame,
  },
  {
    action: 'boost',
    label: 'Boost',
    detail: 'Charge warp lane',
    tone: 'mint',
    Icon: Zap,
  },
];

export function ActionControls({ busy, disabled, recommendedAction, onAction }) {
  return (
    <section className="mission-actions" aria-label="Mission controls">
      {ACTIONS.map(({ action, label, detail, tone, Icon }) => {
        const emphasized = action === recommendedAction;

        return (
          <button
            key={action}
            className={`mission-action mission-action--${tone}${emphasized ? ' is-recommended' : ''}`}
            type="button"
            onClick={() => onAction(action)}
            disabled={disabled || busy}
            aria-pressed={false}
          >
            <span className="mission-action__icon" aria-hidden="true">
              <Icon size={22} strokeWidth={2.3} />
            </span>
            <span className="mission-action__body">
              <span className="mission-action__label">{label}</span>
              <span className="mission-action__detail">{detail}</span>
            </span>
          </button>
        );
      })}
    </section>
  );
}
