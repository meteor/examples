import React from 'react';
import { CircleDot, Cpu, Trophy } from 'lucide-react';
import { Navbar, Page, Tabbar, TabbarLink } from 'konsta/react';
import { ConnectionBanner } from './ConnectionBanner';

const NAV_ITEMS = [
  { key: 'play', label: 'Play', icon: CircleDot },
  { key: 'records', label: 'Records', icon: Trophy },
  { key: 'system', label: 'System', icon: Cpu },
];

export function AppShell({ view, onNavigate, children, connection }) {
  const showNavigation = view !== 'match';

  return (
    <Page className="app-shell" pageContent={false}>
      <Navbar
        className="app-shell__navbar"
        title="Meteor Drop"
        subtitle="Meteor + Capacitor"
      />

      <ConnectionBanner
        connected={connection.connected}
        status={connection.status}
        ddpEnabled={connection.ddpEnabled}
        networkStatus={connection.networkStatus}
      />

      <div className="app-shell__layout">
        {showNavigation ? (
          <aside className="app-shell__rail" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const selected = view === item.key;

              return (
                <button
                  key={item.key}
                  className={`app-shell__rail-link${selected ? ' is-selected' : ''}`}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  aria-current={selected ? 'page' : undefined}
                >
                  <Icon aria-hidden="true" size={18} strokeWidth={2.25} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </aside>
        ) : null}

        <main className="app-shell__content">{children}</main>
      </div>

      {showNavigation ? (
        <Tabbar className="app-shell__tabbar" labels>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;

            return (
              <TabbarLink
                key={item.key}
                active={active}
                label={item.label}
                aria-label={item.label}
                onClick={() => onNavigate(item.key)}
                icon={<Icon aria-hidden="true" size={18} strokeWidth={2.25} />}
              />
            );
          })}
        </Tabbar>
      ) : null}
    </Page>
  );
}
