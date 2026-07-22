import React from 'react';
import { Badge, Card, CardContent } from 'framework7-react';
import CategoryMark from './CategoryMark';
import TouchButton from './TouchButton';

function statusLabel(status) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export default function ReportCard({ report, onOpen }) {
  return (
    <Card outline className="report-card">
      <CardContent>
        {report.photoDataUrl && (
          <img className="report-evidence" src={report.photoDataUrl} alt="Attached report evidence" />
        )}
        <div className="report-card-main">
          <CategoryMark category={report.category} />
          <div className="report-card-copy">
            <div className="report-title">
              <strong>{report.title}</strong>
              <Badge className={`status-badge status-${report.status.replaceAll(' ', '-')}`}>
                {statusLabel(report.status)}
              </Badge>
            </div>
            <p className="report-category">{report.category}</p>
            {report.description && <p className="report-description">{report.description}</p>}
            {report.location && (
              <p className="report-location">
                Centro · {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
              </p>
            )}
          </div>
        </div>
        <div className={`report-progress report-progress-${report.status.replaceAll(' ', '-')}`} aria-label={`Report status: ${statusLabel(report.status)}`}>
          <span /><span /><span />
        </div>
        <TouchButton
          className="button button-outline button-small report-open-button"
          aria-label={`Open report: ${report.title}`}
          onPress={() => onOpen(report._id)}
        >
          View report
        </TouchButton>
      </CardContent>
    </Card>
  );
}
