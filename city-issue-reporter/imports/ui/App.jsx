import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { App as F7App, View } from 'framework7-react';
import { IssueReports } from '../api/reports/collection';
import { createDraft, submit, updateDraft } from '../api/reports/methods';
import AppMenu from './components/AppMenu';
import HcpUpdateDialog from './components/HcpUpdateDialog';
import HcpUpdateReminder from './components/HcpUpdateReminder';
import { getOwnerId } from './owner';
import HomePage from './pages/HomePage';
import NewReportPage from './pages/NewReportPage';
import ReportDetailPage from './pages/ReportDetailPage';
import SystemInfoPage from './pages/SystemInfoPage';
import { capturePhoto } from './native/camera';
import { getCurrentLocation } from './native/geolocation';
import { getNetworkStatus, listenNetworkStatus } from './native/network';
import { scheduleFollowUp } from './native/notifications';
import { shareReport } from './native/share';
import { exitNativeApp, useNativeBackButton } from './native/backButton';
import {
  CIVIC_SNAP_INFO,
  getApplicationInfo,
  getDdpEndpoint,
} from './native/appInfo';
import {
  HCP_PREVIEW_VERSION,
  applyHcpUpdate,
  checkForHcpUpdates,
  listenForHcpUpdates,
} from './native/hcp';

const emptyForm = {
  title: '',
  category: 'Pothole',
  description: '',
};

const browserAppInfo = {
  ...CIVIC_SNAP_INFO,
  platform: 'web',
  native: false,
};

function useWideNavigation() {
  const [wide, setWide] = useState(
    () => globalThis.matchMedia?.('(min-width: 1024px)').matches || false
  );

  useEffect(() => {
    const query = globalThis.matchMedia?.('(min-width: 1024px)');
    if (!query) return undefined;

    const update = (event) => setWide(event.matches);
    setWide(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return wide;
}

export default function App() {
  const ownerId = useMemo(() => getOwnerId(), []);
  const draftReportIdRef = useRef(null);
  const submittingRef = useRef(false);
  const [view, setView] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const wideNavigation = useWideNavigation();
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [location, setLocation] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [photoStatus, setPhotoStatus] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appInfo, setAppInfo] = useState(browserAppInfo);
  const [ddpEnabled, setDdpEnabled] = useState(true);
  const [ddpMessage, setDdpMessage] = useState('Live report sync is available.');
  const [hcpMessage, setHcpMessage] = useState('Ready to check for mobile updates.');
  const [checkingHcp, setCheckingHcp] = useState(false);
  const [installingHcp, setInstallingHcp] = useState(false);
  const [hcpUpdateVersion, setHcpUpdateVersion] = useState(null);
  const [hcpPromptOpen, setHcpPromptOpen] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({
    connected: true,
    connectionType: 'unknown',
  });

  useNativeBackButton(() => {
    if (submitting) return;

    if (hcpPromptOpen) {
      setHcpPromptOpen(false);
    } else if (menuOpen) {
      setMenuOpen(false);
    } else if (view !== 'home') {
      navigate('home');
    } else {
      void exitNativeApp();
    }
  });

  const { reports, ready, ddpStatus } = useTracker(() => {
    const handle = Meteor.subscribe('reports.byOwner', ownerId);
    return {
      reports: IssueReports.find({ ownerId }, { sort: { updatedAt: -1 } }).fetch(),
      ready: handle.ready(),
      ddpStatus: Meteor.status().status,
    };
  }, [ownerId]);

  const selectedReport = reports.find((report) => report._id === selectedReportId) || null;

  useEffect(() => {
    void getApplicationInfo().then(setAppInfo);
  }, []);

  useEffect(() => {
    getNetworkStatus().then(setNetworkStatus).catch(() => {});
    return listenNetworkStatus(setNetworkStatus);
  }, []);

  useEffect(() => (
    listenForHcpUpdates((version) => {
      setHcpUpdateVersion(version);
      setHcpPromptOpen(true);
      setHcpMessage(`Version ${version} downloaded and ready.`);
    })
  ), []);

  function resetDraftForm() {
    draftReportIdRef.current = null;
    setForm(emptyForm);
    setLocation(null);
    setPhotoDataUrl(null);
    setPhotoStatus('');
    setMessage('');
  }

  function navigate(nextView) {
    if (nextView === 'new') resetDraftForm();
    if (nextView === 'home') setSelectedReportId(null);
    setView(nextView);
  }

  async function handleUseLocation() {
    setMessage('');
    try {
      const nextLocation = await getCurrentLocation();
      setLocation(nextLocation);
    } catch (error) {
      console.warn('Unable to capture location', error);
      setMessage('Location unavailable. Check permission and try again.');
    }
  }

  async function handleAttachPhoto() {
    setMessage('');
    try {
      const photo = await capturePhoto();
      setPhotoDataUrl(photo.dataUrl);
      setPhotoStatus(photo.dataUrl ? 'Photo attached' : 'Open on a phone to add a camera photo');
    } catch (error) {
      console.warn('Unable to attach photo', error);
      setMessage('Camera unavailable. Check permission and try again.');
    }
  }

  async function handleSubmit() {
    if (submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);

    setMessage('Sending report...');
    try {
      let reportId = draftReportIdRef.current;
      if (!reportId) {
        const draft = await createDraft({ ownerId, category: form.category });
        reportId = draft.reportId;
        draftReportIdRef.current = reportId;
      }
      await updateDraft({
        ownerId,
        reportId,
        patch: {
          title: form.title || `${form.category} report`,
          category: form.category,
          description: form.description,
          ...(location ? { location } : {}),
          ...(photoDataUrl ? { photoDataUrl } : {}),
        },
      });
      await submit({ ownerId, reportId });
      draftReportIdRef.current = null;
      setSelectedReportId(reportId);
      setMessage('Report sent');
      setView('detail');
    } catch (error) {
      console.warn('Unable to submit report', error);
      setMessage('Unable to send report. Try again without leaving this screen.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleScheduleFollowUp(report) {
    try {
      const result = await scheduleFollowUp({ reportId: report._id, title: report.title });
      setMessage(result.scheduled ? 'Follow-up scheduled' : 'Notifications unavailable');
    } catch (error) {
      console.warn('Unable to schedule follow-up', error);
      setMessage('Unable to schedule follow-up');
    }
  }

  async function handleShareReport(report) {
    const result = await shareReport({
      title: report.title,
      text: ['Report summary', report.title, report.category, report.status].join('\n'),
    });
    setMessage(
      result.shared
        ? 'Share sheet opened'
        : result.copied
          ? 'Report summary copied'
          : 'Sharing unavailable'
    );
  }

  async function handleCheckHcpUpdate() {
    setCheckingHcp(true);
    setHcpMessage('Checking for a newer app version...');
    try {
      const result = await checkForHcpUpdates();
      setHcpMessage(
        result.checked
          ? 'You will be prompted here when a new version is ready.'
          : 'Updates can be checked from mobile builds.'
      );
    } catch (error) {
      console.warn('HCP check failed', error);
      setHcpMessage('Unable to check for updates. Try again.');
    } finally {
      setCheckingHcp(false);
    }
  }

  async function handleInstallHcpUpdate() {
    setInstallingHcp(true);
    try {
      await applyHcpUpdate();
    } catch (error) {
      console.warn('HCP reload failed', error);
      setInstallingHcp(false);
      setHcpMessage('Install unavailable here.');
    }
  }

  function previewHcpUpdate() {
    setHcpUpdateVersion(HCP_PREVIEW_VERSION);
    setHcpPromptOpen(true);
    setHcpMessage('Previewing the update prompt.');
  }

  function handleToggleDdp(enabled) {
    setDdpEnabled(enabled);
    if (enabled) {
      Meteor.reconnect();
      setDdpMessage('Live report sync resumed.');
    } else {
      Meteor.disconnect();
      setDdpMessage('Live report sync paused.');
    }
  }

  function handleReconnect() {
    setDdpEnabled(true);
    Meteor.reconnect();
    setDdpMessage('Reconnecting live report sync.');
  }

  return (
    <F7App name="Civic Snap" theme="auto">
      <AppMenu
        currentView={view}
        opened={wideNavigation || menuOpen}
        persistent={wideNavigation}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigate}
      />
      <View main className="main-view">
        {view === 'home' && (
          <HomePage
            ready={ready}
            reports={reports}
            networkStatus={networkStatus}
            onNewReport={() => navigate('new')}
            onOpenNavigation={() => setMenuOpen(true)}
            onOpenReport={(reportId) => {
              setSelectedReportId(reportId);
              setMessage('');
              setView('detail');
            }}
          />
        )}
        {view === 'new' && (
          <NewReportPage
            form={form}
            location={location}
            message={message}
            photoStatus={photoStatus}
            submitting={submitting}
            onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
            onUseLocation={handleUseLocation}
            onAttachPhoto={handleAttachPhoto}
            onSubmit={handleSubmit}
            onBack={() => {
              if (!submitting) navigate('home');
            }}
          />
        )}
        {view === 'detail' && (
          <ReportDetailPage
            report={selectedReport}
            message={message}
            onBack={() => navigate('home')}
            onScheduleFollowUp={handleScheduleFollowUp}
            onShareReport={handleShareReport}
          />
        )}
        {view === 'system' && (
          <SystemInfoPage
            appInfo={appInfo}
            ddpEnabled={ddpEnabled}
            ddpEndpoint={getDdpEndpoint()}
            ddpMessage={ddpMessage}
            ddpStatus={ddpStatus}
            hcpChecking={checkingHcp}
            hcpMessage={hcpMessage}
            onCheckHcpUpdate={handleCheckHcpUpdate}
            onOpenNavigation={() => setMenuOpen(true)}
            onPreviewHcpUpdate={previewHcpUpdate}
            onReconnect={handleReconnect}
            onToggleDdp={handleToggleDdp}
          />
        )}
      </View>
      <HcpUpdateReminder
        visible={Boolean(hcpUpdateVersion) && !hcpPromptOpen}
        onReview={() => setHcpPromptOpen(true)}
      />
      <HcpUpdateDialog
        installing={installingHcp}
        opened={hcpPromptOpen}
        updateVersion={hcpUpdateVersion}
        onDismiss={() => setHcpPromptOpen(false)}
        onInstall={handleInstallHcpUpdate}
      />
    </F7App>
  );
}
