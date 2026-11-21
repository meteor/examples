import React from 'react';
import { Badge, Block, Page } from 'framework7-react';
import AppNavbar from '../components/AppNavbar';
import CategoryMark from '../components/CategoryMark';
import TouchButton from '../components/TouchButton';

const STATUS_INDEX = { draft: 0, submitted: 1, 'in review': 2, fixed: 3 };

function statusLabel(status) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export default function ReportDetailPage({
  report,
  message,
  onBack,
  onScheduleFollowUp,
  onShareReport,
}) {
  if (!report) {
    return (
      <Page name="missing-report">
        <AppNavbar title="Report" backLabel="Reports" onBack={onBack} />
        <Block className="empty-list">Report not found</Block>
      </Page>
    );
  }

  return (
    <Page name="report-detail">
      <AppNavbar title="Report detail" backLabel="Reports" onBack={onBack} />
      <div className="page-width detail-page-width">
        <Block className="detail-hero">
          {report.photoDataUrl ? (
            <img src={report.photoDataUrl} alt="Attached report evidence" />
          ) : (
            <div className="detail-placeholder">
              <CategoryMark category={report.category} size="large" />
            </div>
          )}
          <div className="detail-hero-copy">
            <div className="section-label">{report.category} report</div>
            <h1 className="report-title">{report.title}</h1>
            <p className="detail-meta">
              <Badge className={`status-badge status-${report.status.replaceAll(' ', '-')}`}>
                {statusLabel(report.status)}
              </Badge>
              <span>Centro district</span>
            </p>
          </div>
        </Block>

        <Block className="lifecycle-section">
          <div className="section-label">Report lifecycle</div>
          <div className="status-timeline" aria-label={`Current status: ${statusLabel(report.status)}`}>
            {['Draft', 'Submitted', 'In review', 'Fixed'].map((label, index) => (
              <div className={index <= STATUS_INDEX[report.status] ? 'complete' : ''} key={label}>
                <span>{index < STATUS_INDEX[report.status] ? '✓' : index + 1}</span>
                <small>{label}</small>
              </div>
            ))}
          </div>
        </Block>

        <Block className="detail-card">
          <div className="detail-section-heading">Field notes</div>
          <p>{report.description || 'No additional field notes were added.'}</p>
          {report.location && (
            <div className="detail-location">
              <span className="location-pin" aria-hidden="true">LOC</span>
              <div>
                <strong>Centro district</strong>
                <small>{report.location.latitude}, {report.location.longitude}</small>
              </div>
            </div>
          )}
          {message && <div className="toast-summary">{message}</div>}
          <div className="detail-actions">
            <TouchButton
              className="button button-outline button-large"
              aria-label="Schedule follow-up"
              onPress={() => onScheduleFollowUp(report)}
            >
              Schedule follow-up
            </TouchButton>
            <TouchButton
              className="button button-fill button-large"
              aria-label="Share report"
              onPress={() => onShareReport(report)}
            >
              Share report
            </TouchButton>
            <TouchButton
              className="button button-quiet button-large"
              aria-label="Back to reports"
              onPress={onBack}
            >
              Back to reports
            </TouchButton>
          </div>
        </Block>
      </div>
    </Page>
  );
}
