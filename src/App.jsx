import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BrandProvider from '@/brand/BrandProvider';
import AuthProvider from '@/context/AuthContext';
import ToastProvider from '@/context/ToastContext';
import AppLayout from '@/components/layout/AppLayout';
import RequireAuth from '@/components/layout/RequireAuth';
import { ROUTES } from '@/data/navigation';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Placeholder from '@/pages/Placeholder';
import CaseManagement from '@/pages/CaseManagement';
import WorkCase from '@/pages/WorkCase';
import RuleGroups from '@/pages/RuleGroups';
import AddRule from '@/pages/AddRule';
import BulkActions from '@/pages/BulkActions';
import RuleCheck from '@/pages/RuleCheck';
import AssignmentReasons from '@/pages/AssignmentReasons';
import QueueManagement from '@/pages/QueueManagement';
import UploadCases from '@/pages/UploadCases';
import ReportsCenter from '@/pages/ReportsCenter';
import Monitoring from '@/pages/Monitoring';
import CustomReports from '@/pages/CustomReports';

/**
 * Routing follows our edited IA (data/navigation.js): no Case priority, no
 * Unmatched docs, no Scheduler, Archived as a tab, Users as one page.
 *
 * Screens still being built render through Placeholder so the app stays
 * navigable while the rebuild lands chunk by chunk.
 */
export function App() {
  return (
    <BrandProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path={ROUTES.login} element={<Login />} />

              <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
                <Route path={ROUTES.dashboard} element={<Dashboard />} />

                <Route path={ROUTES.ruleGroups} element={<RuleGroups />} />
                <Route path={ROUTES.addRule} element={<AddRule />} />
                <Route path={ROUTES.bulkActions} element={<BulkActions />} />
                <Route path={ROUTES.ruleCheck} element={<RuleCheck />} />

                <Route path={ROUTES.assignmentReasons} element={<AssignmentReasons />} />
                <Route path={ROUTES.queueManagement} element={<QueueManagement />} />
                <Route path={ROUTES.caseManagement} element={<CaseManagement />} />
                <Route path={ROUTES.uploadCases} element={<UploadCases />} />

                <Route path={ROUTES.workCase} element={<WorkCase />} />
                <Route path={ROUTES.workCaseDetail()} element={<WorkCase />} />

                <Route path={ROUTES.reportsCenter} element={<ReportsCenter />} />
                <Route path={ROUTES.monitoring} element={<Monitoring />} />
                <Route path={ROUTES.customReports} element={<CustomReports />} />

                <Route path={ROUTES.users} element={<Placeholder title="Users" description="People, skills and permissions." icon="users" />} />
                <Route path={ROUTES.apiDocumentation} element={<Placeholder title="API documentation" description="Endpoints, schemas and samples." icon="code" />} />

                <Route path={ROUTES.accountSettings} element={<Placeholder title="Account settings" description="Your profile, password and sessions." icon="userCircle" />} />
                <Route path={ROUTES.webhooks} element={<Placeholder title="Webhooks" description="Send case events to your own systems." icon="webhook" />} />
                <Route path={ROUTES.systemPreferences} element={<Placeholder title="System preferences" description="Numbering, due-date offsets and thresholds." icon="sliders" />} />

                <Route path={ROUTES.help} element={<Placeholder title="Help" description="Guides, reference material and support." icon="help" />} />

                <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </BrandProvider>
  );
}

export default App;
