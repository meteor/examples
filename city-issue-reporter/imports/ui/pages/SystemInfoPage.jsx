import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Block, List, ListItem, Page, Toggle } from 'framework7-react';
import AppNavbar from '../components/AppNavbar';
import HcpUpdateCard from '../components/HcpUpdateCard';
import NativeStatus from '../components/NativeStatus';
import TouchButton from '../components/TouchButton';

export default function SystemInfoPage({
  appInfo,
  ddpEnabled,
  ddpEndpoint,
  ddpMessage,
  ddpStatus,
  hcpChecking,
  hcpMessage,
  onCheckHcpUpdate,
  onOpenNavigation,
  onPreviewHcpUpdate,
  onReconnect,
  onToggleDdp,
}) {
  return (
    <Page name="system-information">
      <AppNavbar title="System information" onOpenNavigation={onOpenNavigation} />
      <div className="page-width system-page-width">
        <Block className="page-intro">
          <div className="section-label">Developer tools</div>
          <h1>System information</h1>
          <p>Inspect native runtime, live data connection, and application update state.</p>
        </Block>

        <div className="system-grid">
          <Block className="system-card">
            <h2>Application</h2>
            <List dividersIos className="information-list">
              <ListItem title="Application name" after={appInfo.name} />
              <ListItem title="Application ID" after={appInfo.appId} />
              <ListItem title="Application version" after={appInfo.version} />
              <ListItem title="Build number" after={appInfo.build} />
            </List>
          </Block>

          <Block className="system-card">
            <h2>Runtime</h2>
            <NativeStatus />
            <List dividersIos className="information-list">
              <ListItem title="Platform" after={appInfo.platform} />
              <ListItem title="Runtime mode" after={appInfo.native ? 'Native Capacitor' : 'Browser preview'} />
              <ListItem title="Meteor release" after={Meteor.release || 'Development checkout'} />
            </List>
          </Block>
        </div>

        <Block className="system-card ddp-card">
          <h2>Live data connection</h2>
          <p className="system-card-copy">DDP status: {ddpStatus}</p>
          <p className="system-card-copy" role="status">{ddpMessage}</p>
          <div className="endpoint-box">
            <span>DDP endpoint</span>
            <code>{ddpEndpoint}</code>
          </div>
          <div className="ddp-control-row">
            <div>
              <strong>Live DDP connection</strong>
              <span>Pause or resume realtime report sync.</span>
            </div>
            <div
              className="ddp-toggle-hit"
              role="switch"
              tabIndex="0"
              aria-checked={ddpEnabled}
              aria-label="Live DDP connection"
              onClick={() => onToggleDdp(!ddpEnabled)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onToggleDdp(!ddpEnabled);
                }
              }}
            >
              <Toggle checked={ddpEnabled} readonly aria-hidden="true" />
            </div>
          </div>
          <TouchButton
            className="button button-outline button-large"
            aria-label="Reconnect now"
            onPress={onReconnect}
          >
            Reconnect now
          </TouchButton>
        </Block>

        <Block className="system-update-block">
          <HcpUpdateCard
            checking={hcpChecking}
            message={hcpMessage}
            onCheck={onCheckHcpUpdate}
            onPreview={onPreviewHcpUpdate}
          />
        </Block>
      </div>
    </Page>
  );
}
