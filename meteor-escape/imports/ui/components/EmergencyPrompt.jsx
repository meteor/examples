import React from 'react';
import { Flame, Shield, Zap } from 'lucide-react';

const EMERGENCY_CONTENT = {
  meteor: {
    eyebrow: 'Meteor',
    title: 'Brace for debris',
    detail: 'Raise the shield before the hull takes another hit.',
    tone: 'coral',
    Icon: Shield,
  },
  overheat: {
    eyebrow: 'Overheat',
    title: 'Core running hot',
    detail: 'Dump heat fast or the engines will scorch the shield grid.',
    tone: 'yellow',
    Icon: Flame,
  },
  path: {
    eyebrow: 'Path',
    title: 'Clear lane ahead',
    detail: 'Punch the drive now to bank warp while the corridor is open.',
    tone: 'mint',
    Icon: Zap,
  },
};

export function EmergencyPrompt({ emergency, statusText }) {
  const content = EMERGENCY_CONTENT[emergency] ?? EMERGENCY_CONTENT.meteor;
  const { Icon } = content;

  return (
    <section className={`emergency-prompt emergency-prompt--${content.tone}`}>
      <div className="emergency-prompt__header">
        <div>
          <p className="emergency-prompt__eyebrow">{content.eyebrow}</p>
          <h2>{content.title}</h2>
        </div>
        <span className="emergency-prompt__icon" aria-hidden="true">
          <Icon size={24} strokeWidth={2.3} />
        </span>
      </div>

      <p className="emergency-prompt__detail">{content.detail}</p>
      <p className="emergency-prompt__status">{statusText}</p>
    </section>
  );
}
