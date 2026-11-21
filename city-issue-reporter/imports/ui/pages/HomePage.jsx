import React from 'react';
import { Badge, Block, List, Page, Preloader } from 'framework7-react';
import AppNavbar from '../components/AppNavbar';
import ReportCard from '../components/ReportCard';
import TouchButton from '../components/TouchButton';

export default function HomePage({
  ready,
  reports,
  networkStatus,
  onNewReport,
  onOpenNavigation,
  onOpenReport,
}) {
  const queued = reports.filter((report) => report.status === 'draft').length;
  const submitted = reports.filter((report) => report.status === 'submitted').length;

  return (
    <Page name="home">
      <AppNavbar title="Civic Snap" onOpenNavigation={onOpenNavigation} />
      <div className="page-width">
        <Block className="field-brief">
          <div className="field-brief-media">
            <img
              src="/images/neighborhood-field.jpg"
              alt="Neighborhood street with a bike lane, transit stop, and pothole"
            />
            <span className="field-area-pill">Centro · Field brief</span>
          </div>
          <div className="field-brief-copy">
            <div className="section-label">Community reports</div>
            <h1>Report nearby issue</h1>
            <p>Capture a street problem, add field evidence, and send it to the right local crew.</p>
            <TouchButton
              className="button button-fill button-large new-report-button"
              aria-label="New report"
              onPress={onNewReport}
            >
              <span aria-hidden="true">+</span>
              New report
            </TouchButton>
          </div>
          <div className="field-status" aria-label="Report summary">
            <div className="network-metric">
              <span className={networkStatus.connected ? 'network-dot connected' : 'network-dot'} />
              <span>Field sync</span>
              <strong>{networkStatus.connected ? networkStatus.connectionType : 'offline'}</strong>
            </div>
            <div><span>Drafts</span><strong>{queued}</strong></div>
            <div><span>Submitted</span><strong>{submitted}</strong></div>
          </div>
        </Block>

        <Block className="list-heading">
          <div>
            <div className="section-label">Neighborhood queue</div>
            <h2>Recent reports</h2>
          </div>
          <Badge>{reports.length}</Badge>
        </Block>

        {!ready ? (
          <div className="loading-state" role="status">
            <Preloader />
            <span>Syncing reports</span>
          </div>
        ) : (
          <List mediaList className="report-list">
            {reports.map((report) => (
              <ReportCard key={report._id} report={report} onOpen={onOpenReport} />
            ))}
            {reports.length === 0 && (
              <li className="empty-list">
                <div>No reports yet</div>
                <p>Create a report to see offline drafts and submitted issues here.</p>
              </li>
            )}
          </List>
        )}
      </div>
    </Page>
  );
}
