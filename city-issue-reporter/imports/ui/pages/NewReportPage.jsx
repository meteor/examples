import React from 'react';
import { Block, List, ListInput, Page } from 'framework7-react';
import { REPORT_CATEGORIES } from '../../api/reports/schema';
import AppNavbar from '../components/AppNavbar';
import TouchButton from '../components/TouchButton';

export default function NewReportPage({
  form,
  location,
  message,
  photoStatus,
  submitting,
  onChange,
  onUseLocation,
  onAttachPhoto,
  onSubmit,
  onBack,
}) {
  return (
    <Page name="new-report">
      <AppNavbar
        title="New report"
        backLabel="Reports"
        onBack={onBack}
        actionLabel="Submit current report"
        actionText="Send"
        actionDisabled={submitting}
        onAction={onSubmit}
      />
      <div className="page-width form-page-width">
        <Block className="page-intro">
          <div className="section-label">Field intake</div>
          <h1>Describe what needs attention</h1>
          <p>A clear title, location, and photo help the right crew act faster.</p>
          <div className="intake-steps" aria-label="Report steps">
            <span className="active"><strong>1</strong>Issue</span>
            <span><strong>2</strong>Evidence</span>
            <span><strong>3</strong>Send</span>
          </div>
        </Block>

        <Block className="form-surface">
          <div className="form-stack">
            <div className="form-section-heading">
              <span>1</span>
              <div><strong>Issue details</strong><small>What happened and what is affected</small></div>
            </div>
            <List strongIos outlineIos dividersIos className="intake-list">
              <ListInput
                inputId="issue-title"
                label="Issue title"
                type="text"
                placeholder="Broken light by station"
                clearButton
                value={form.title}
                inputProps={{ 'aria-label': 'Issue title' }}
                onInput={(event) => onChange({ title: event.target.value })}
                onChange={(event) => onChange({ title: event.target.value })}
              />
              <ListInput
                inputId="issue-category"
                label="Category"
                type="select"
                value={form.category}
                inputProps={{ 'aria-label': 'Category' }}
                onChange={(event) => onChange({ category: event.target.value })}
              >
                {REPORT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </ListInput>
              <ListInput
                inputId="issue-description"
                label="Description"
                type="textarea"
                placeholder="Add landmarks, direction, or impact"
                resizable
                value={form.description}
                inputProps={{ 'aria-label': 'Description' }}
                onInput={(event) => onChange({ description: event.target.value })}
                onChange={(event) => onChange({ description: event.target.value })}
              />
            </List>

            <div className="form-section-heading evidence-heading">
              <span>2</span>
              <div><strong>Field evidence</strong><small>Add context from where you are</small></div>
            </div>

            {(location || photoStatus || message) && (
              <div className="capture-statuses" role="status">
                {location && (
                  <div className="location-summary">
                    Location added · {location.latitude}, {location.longitude}
                  </div>
                )}
                {photoStatus && <div className="location-summary">{photoStatus}</div>}
                {message && <div className="toast-summary">{message}</div>}
              </div>
            )}

            <div className="capture-actions">
              <TouchButton
                className="button button-outline button-large"
                aria-label="Use current location"
                onPress={onUseLocation}
              >
                <span className="action-mark" aria-hidden="true">LOC</span>
                Use current location
              </TouchButton>
              <TouchButton
                className="button button-outline button-large"
                aria-label="Attach photo"
                onPress={onAttachPhoto}
              >
                <span className="action-mark" aria-hidden="true">CAM</span>
                Attach photo
              </TouchButton>
            </div>

            <div className="submit-summary">
              <span className="network-dot connected" />
              Ready to send securely when your report is complete
            </div>
            <TouchButton
              className="button button-fill button-large submit-report-button"
              aria-label="Submit report"
              disabled={submitting}
              onPress={onSubmit}
            >
              {submitting ? 'Sending report...' : 'Submit report'}
            </TouchButton>
          </div>
        </Block>
      </div>
    </Page>
  );
}
