import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BrandProvider from '@/brand/BrandProvider';
import AuthProvider from '@/context/AuthContext';
import ToastProvider from '@/context/ToastContext';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import { ROUTES } from '@/utils/constants';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import RuleGroups from '@/pages/RuleGroups';
import BulkActions from '@/pages/BulkActions';
import RuleCheck from '@/pages/RuleCheck';
import AssignmentReasons from '@/pages/AssignmentReasons';
import QueueManagement from '@/pages/QueueManagement';
import CaseManagement from '@/pages/CaseManagement';
import UploadCases from '@/pages/UploadCases';
import WorkCase from '@/pages/WorkCase';
import ReportsCenter from '@/pages/ReportsCenter';
import Monitoring from '@/pages/Monitoring';
import CustomReports from '@/pages/CustomReports';
import Users from '@/pages/Users';
import ApiDocumentation from '@/pages/ApiDocumentation';
import AccountSettings from '@/pages/AccountSettings';
import Webhooks from '@/pages/Webhooks';
import SystemPreferences from '@/pages/SystemPreferences';
import Help from '@/pages/Help';
import NotFound from '@/pages/NotFound';

/**
 * Provider order matters: brand tokens land on :root before anything paints,
 * auth gates the routes, and toasts sit outermost so any screen can confirm a
 * mutation.
 */
export function App() {
  return (
    <BrandProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path={ROUTES.login} element={<Login />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
                <Route path={ROUTES.dashboard} element={<Dashboard />} />

                <Route path={ROUTES.ruleGroups} element={<RuleGroups />} />
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

                <Route path={ROUTES.users} element={<Users />} />
                <Route path={ROUTES.apiDocumentation} element={<ApiDocumentation />} />

                <Route path={ROUTES.accountSettings} element={<AccountSettings />} />
                <Route path={ROUTES.webhooks} element={<Webhooks />} />
                <Route path={ROUTES.systemPreferences} element={<SystemPreferences />} />

                <Route path={ROUTES.help} element={<Help />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </BrandProvider>
  );
}

export default App;
