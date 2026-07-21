import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Button, List, ListItem } from 'konsta/react';
import { HcpUpdateDialog } from '../components/HcpUpdateDialog';

function StatusPill({ label, value, ariaLabel }) {
  return (
    <span className="status-pill" aria-label={ariaLabel}>
      <strong>{label}</strong>
      <span>{value}</span>
    </span>
  );
}

export function SystemInfoPage({
  appInfo,
  ddpEnabled,
  ddpEndpoint,
  ddpStatus,
  hcp,
  onReconnect,
  onToggleDdp,
}) {
  const normalizedDdpStatus = ddpEnabled ? ddpStatus : 'paused';
  const ddpReadyLabel = `DDP ${normalizedDdpStatus}`;
  const ddpStatusValue = normalizedDdpStatus.charAt(0).toUpperCase() + normalizedDdpStatus.slice(1);
  const capacitorLabel = appInfo.native ? 'Meteor.isCapacitor true' : 'Meteor.isCapacitor false';

  return (
    <>
      <section className="system-page" aria-labelledby="system-information-title">
        <div className="system-page__header">
          <div>
            <p className="eyebrow">Developer tools</p>
            <h1 id="system-information-title">System information</h1>
            <p className="system-page__copy">
              Inspect runtime, live data, and update state without crowding the mission flow.
            </p>
          </div>
        </div>

        <section className="system-section">
          <h2>Application</h2>
          <List inset strong>
            <ListItem title="Application name" after={appInfo.name} />
            <ListItem title="Application ID" after={appInfo.appId} />
            <ListItem title="Application version" after={appInfo.version} />
            <ListItem title="Build number" after={appInfo.build} />
          </List>
        </section>

        <section className="system-section">
          <h2>Runtime</h2>
          <div className="system-status" aria-label="Native status">
            <StatusPill
              label="Native"
              value={appInfo.native ? 'Ready' : 'Preview'}
              ariaLabel={appInfo.native ? 'Native ready' : 'Native browser preview'}
            />
            <StatusPill
              label="DDP"
              value={ddpStatusValue}
              ariaLabel={ddpReadyLabel}
            />
            <StatusPill
              label="Mode"
              value={appInfo.native ? 'Phone shell' : 'Browser preview'}
              ariaLabel={capacitorLabel}
            />
          </div>
          <List inset strong>
            <ListItem title="Platform" after={appInfo.platform} />
            <ListItem title="Runtime mode" after={appInfo.native ? 'Native Capacitor' : 'Browser preview'} />
            <ListItem title="Meteor release" after={Meteor.release || 'Development checkout'} />
          </List>
        </section>

        <section className="system-section">
          <h2>Live data connection</h2>
          <p className="system-section__copy">DDP status: {ddpStatusValue}</p>
          <List inset strong>
            <ListItem
              title="DDP endpoint"
              after={<code className="system-page__endpoint">{ddpEndpoint}</code>}
            />
          </List>

          <div className="system-toggle-row">
            <div>
              <strong>Live DDP connection</strong>
              <p>Pause or resume mission sync.</p>
            </div>
            <button
              type="button"
              className={`system-toggle${ddpEnabled ? ' is-enabled' : ''}`}
              role="switch"
              aria-checked={ddpEnabled}
              aria-label="Live DDP connection"
              onClick={() => onToggleDdp(!ddpEnabled)}
            >
              <span className="system-toggle__thumb" aria-hidden="true" />
            </button>
          </div>

          <Button className="system-action-button" onClick={onReconnect}>
            Reconnect now
          </Button>
        </section>

        <section className="system-section">
          <h2>App updates</h2>
          <p className="system-section__copy">
            Check Hot Code Push state and preview the install prompt before release day.
          </p>
          <p className="system-section__status" role="status" aria-live="polite">
            {hcp.message}
          </p>
          <div className="system-section__actions">
            <Button
              tonal={false}
              className="system-action-button system-action-button--primary"
              onClick={hcp.onCheck}
              disabled={hcp.checking || hcp.installing}
            >
              {hcp.checking ? 'Checking' : 'Check for update'}
            </Button>
            <Button
              className="system-action-button"
              aria-label="Preview HCP update"
              onClick={hcp.onPreview}
              disabled={hcp.installing}
            >
              Preview HCP update
            </Button>
          </div>
        </section>
      </section>

      <HcpUpdateDialog
        installing={hcp.installing}
        updateVersion={hcp.updateVersion}
        onDismiss={hcp.onDismiss}
        onInstall={hcp.onInstall}
      />
    </>
  );
}
