import React from 'react';
import { List, ListItem, Page, Panel, View } from 'framework7-react';
import useModalFocus from '../useModalFocus';

const sections = [
  { id: 'home', label: 'Reports', description: 'Recent field reports', mark: 'R' },
  { id: 'new', label: 'New report', description: 'Capture an issue', mark: '+' },
  { id: 'system', label: 'System information', description: 'Runtime and updates', mark: 'i' },
];

export default function AppMenu({ currentView, onClose, onNavigate, opened, persistent }) {
  useModalFocus(opened && !persistent, '.app-menu');

  return (
    <Panel
      left
      reveal
      swipe={!persistent}
      opened={opened}
      backdrop={!persistent}
      className="app-menu"
      role={persistent ? undefined : 'dialog'}
      aria-modal={persistent ? undefined : 'true'}
      aria-label={persistent ? undefined : 'Application navigation'}
      closeByBackdropClick
      onPanelClosed={() => {
        if (!persistent) onClose();
      }}
    >
      <View>
        <Page>
          <div className="menu-brand">
            <div className="menu-brand-mark" aria-hidden="true">CS</div>
            <div>
              <strong>Civic Snap</strong>
              <span>Community field reports</span>
            </div>
          </div>
          <List className="menu-list">
            {sections.map((section) => (
              <ListItem
                key={section.id}
                link="#"
                title={section.label}
                subtitle={section.description}
                selected={currentView === section.id || (section.id === 'home' && currentView === 'detail')}
                noChevron
                aria-label={section.label}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate(section.id);
                  onClose();
                }}
              >
                <span slot="media" className="menu-item-mark" aria-hidden="true">{section.mark}</span>
              </ListItem>
            ))}
          </List>
          <div className="menu-version">Version 1.0.0 (1)</div>
        </Page>
      </View>
    </Panel>
  );
}
