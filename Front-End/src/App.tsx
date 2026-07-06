import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/common/ErrorBoundary";

// Pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import PatientLogin from "./pages/patient/PatientLogin";
import PatientRegister from "./pages/patient/PatientRegister";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientProfile from "./pages/patient/PatientProfile";
import DoctorLogin from "./pages/doctor/DoctorLogin";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorSearchPage from "./pages/doctor/SearchPage";
import PendingApproval from "./pages/doctor/PendingApproval";
import DoctorLayout from "./components/doctor/DoctorLayout";
import ViewProfile from "./pages/doctor/profile/ViewProfile";
import EditProfile from "./pages/doctor/profile/EditProfile";
import DoctorChangePassword from "./pages/doctor/profile/DoctorChangePassword";
import DoctorConsultationDetails from "./pages/doctor/consultations/ConsultationDetails";
import DoctorPatients from "./pages/doctor/patients/DoctorPatients";
import PatientDetails from "./pages/doctor/patients/PatientDetails";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboardOld from "./pages/admin/AdminDashboard";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountLocked from "./pages/AccountLocked";

// Profile Components
import { ProfilePage } from "./pages/patient/profile/ProfilePage";
import { ProfileOverview } from "./components/profile/ProfileOverview";
import { EditBasicInfo } from "./components/profile/EditBasicInfo";
import { EditMedicalInfo } from "./components/profile/EditMedicalInfo";
import { EditEmergencyContact } from "./components/profile/EditEmergencyContact";
import { ProfileStats } from "./components/profile/ProfileStats";
import { EditPassword } from "./components/profile/EditPassword";
import { MedicalFilesTab } from "./components/profile/MedicalFilesTab";
import LabTestsPage from "./pages/patient/medical-file/LabTestsPage";
import LabTestResultDetail from "./pages/patient/medical-file/LabTestResultDetail";

// Health Trackers Routes
import TrackersHub from "./pages/patient/trackers/TrackersHub";
import MoodTracker from "./pages/patient/trackers/mood/MoodTracker";
import WeightTracker from "./pages/patient/trackers/weight/WeightTracker";
import PeriodTracker from "./pages/patient/trackers/period/PeriodTracker";
import FertilityTracker from "./pages/patient/trackers/fertility/FertilityTracker";
import PregnancyTracker from "./pages/patient/trackers/pregnancy/PregnancyTracker";
import SmartBand from "./pages/patient/trackers/smart-band/SmartBand";

// AI Center Pages
import AiCenterHub from "./pages/patient/ai-center/AiCenterHub";
import GDMScreeningPage from "./pages/patient/ai-center/GDMScreeningPage";
import PreeclampsiaScreeningPage from "./pages/patient/ai-center/PreeclampsiaScreeningPage";
import PretermScreeningPage from "./pages/patient/ai-center/PretermScreeningPage";
import SCBUScreeningPage from "./pages/patient/ai-center/SCBUScreeningPage";
import PredictionHistoryPage from "./pages/patient/ai-center/PredictionHistoryPage";
import PredictionDetailPage from "./pages/patient/ai-center/PredictionDetailPage";

// Patient Consultation Pages
import {
  DoctorSearch,
  DoctorDetails,
  BookConsultation,
  MyConsultations,
  ConsultationDetails,
  ReviewDoctor,
  PaymentCallback,
  VideoCall,
  PrescriptionPage,
  MyPrescriptions,
} from "./pages/patient/consultations";

// Doctor Consultation Pages
import {
  DoctorConsultations,
  WorkingHours,
  DoctorVideoCall,
  CompleteConsultation,
  DoctorPrescriptions,
} from "./pages/doctor/consultations";

// Doctor Settings
import GoogleConnect from "./pages/doctor/settings/GoogleConnect";
import DoctorFinancials from "./pages/doctor/financials/DoctorFinancials";

// Article Pages
import ArticlesList from "./pages/articles/ArticlesList";
import ArticleDetail from "./pages/articles/ArticleDetail";

// Doctor Article Pages
import MyArticles from "./pages/doctor/articles/MyArticles";
import ArticleForm from "./pages/doctor/articles/ArticleForm";
import DoctorReviews from "@/pages/doctor/reviews/DoctorReviews";

// Admin Pages & Layout
import AdminLayout from "./components/admin/AdminLayout";
import RequirePermission from "./components/auth/RequirePermission";
import AdminDashboardNew from "./pages/admin/AdminDashboardNew";
import PatientsManagement from "./pages/admin/users/PatientsManagement";
import DoctorsManagement from "./pages/admin/users/DoctorsManagement";
import AdminsManagement from "./pages/admin/users/AdminsManagement";
import ConsultationsPage from "./pages/admin/ConsultationsPage";
import JoinRequestsPage from "./pages/admin/JoinRequestsPage";
import FinancialsPage from "./pages/admin/FinancialsPage";
import MessagesPage from "./pages/admin/MessagesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import ArticlesManagement from "./pages/admin/articles/ArticlesManagement";
import ArticleReview from "./pages/admin/articles/ArticleReview";
import NotificationsPage from "./pages/admin/NotificationsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import FAQsPage from "./pages/admin/FAQsPage";
import AboutUsPage from "./pages/admin/AboutUsPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import { NotificationSettingsPage } from "./pages/settings/NotificationSettings";
import NotificationsListPage from "./pages/notifications/NotificationsListPage";
import KnowledgeBasePage from "./pages/admin/KnowledgeBasePage";
import ChatbotStatsPage from "./pages/admin/ChatbotStatsPage";
import ChatbotPage from "./pages/patient/ChatbotPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";

// AI Center Dashboards
import DoctorAiDashboard from "./pages/doctor/ai-center/DoctorAiDashboard";
import DoctorAiPredictionDetail from "./pages/doctor/ai-center/DoctorAiPredictionDetail";
import AdminAiAnalytics from "./pages/admin/ai-center/AdminAiAnalytics";

// Public Static Pages
import {
  AboutUs,
  ContactUs,
  JoinAsDoctor,
  TermsAndConditions,
  PrivacyPolicy,
  LifeStagePage,
  LifeStagesHub,
  DoctorPublicProfile,
  DoctorsListPage,
} from "./pages/public";

// Landing Page
import LandingPage from "./pages/landing";
import PublicLayout from "./components/layout/PublicLayout";
import { ChatWidget } from "./components/chatbot/ChatWidget";
import { GlobalSiteSettings } from "./components/layout/GlobalSiteSettings";

const queryClient = new QueryClient();

const TrackersLayout = () => {
  const location = useLocation();
  const isHub = location.pathname === "/trackers" || location.pathname === "/trackers/";
  return (
    <div className={`min-h-screen bg-slate-50/50 ${isHub ? "" : "pb-20"}`}>
      <Outlet />
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-center" richColors />
        <BrowserRouter>
          <AuthProvider>
            <GlobalSiteSettings />
            <Routes>
              {/* Landing Page - Home */}
              <Route path="/" element={<LandingPage />} />

              {/* Public Articles Routes — Manual Header for Premium Layout */}
              <Route path="/articles" element={<ArticlesList />} />
              <Route path="/articles/:slug" element={<ArticleDetail />} />

              {/* Public Static Pages */}
              <Route path="/about" element={<AboutUs />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/join-as-doctor" element={<JoinAsDoctor />} />
              <Route
                path="/join"
                element={<Navigate to="/join-as-doctor" replace />}
              />
              <Route path="/terms" element={<TermsAndConditions />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/life-stages" element={<LifeStagesHub />} />
              <Route path="/life-stages/:slug" element={<LifeStagePage />} />

              {/* Public Doctors Pages */}
              <Route path="/doctors" element={<DoctorsListPage />} />
              <Route path="/doctors/:id" element={<DoctorPublicProfile />} />

              <Route path="/trackers" element={<TrackersHub />} />

              {/* Patient Auth Routes - Redirect old URLs to clean URLs */}
              <Route
                path="/patient/login"
                element={<Navigate to="/login" replace />}
              />
              <Route
                path="/patient/register"
                element={<Navigate to="/register" replace />}
              />
              <Route
                path="/patient/trackers"
                element={<Navigate to="/trackers" replace />}
              />
              {/* Clean URLs for patient auth */}
              <Route path="/login" element={<PatientLogin />} />
              <Route path="/register" element={<PatientRegister />} />

              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedUserTypes={["patient"]}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />

              {/* New Profile Routes */}
              <Route
                path="/patient/profile"
                element={
                  <ProtectedRoute allowedUserTypes={["patient"]}>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ProfileOverview />} />
                <Route path="basic" element={<EditBasicInfo />} />
                <Route path="medical" element={<EditMedicalInfo />} />
                <Route path="medical-files" element={<MedicalFilesTab />} />
                <Route path="emergency" element={<EditEmergencyContact />} />
                <Route path="stats" element={<ProfileStats />} />
                <Route path="password" element={<EditPassword />} />
              </Route>

              {/* Health Trackers Routes - Accessible to all, but data requires auth */}
              <Route
                path="/trackers"
                element={<TrackersLayout />}
              >
                <Route index element={<TrackersHub />} />
                <Route path="mood" element={<MoodTracker />} />
                <Route path="weight" element={<WeightTracker />} />
                <Route path="period" element={<PeriodTracker />} />
                <Route path="fertility" element={<FertilityTracker />} />
                <Route path="pregnancy" element={<PregnancyTracker />} />
                <Route path="smart-band" element={<SmartBand />} />
              </Route>

              {/* Redirect old tracker URLs to new ones */}
              <Route
                path="/pregnancy-tracker"
                element={<Navigate to="/trackers/pregnancy" replace />}
              />
              <Route
                path="/mood-tracker"
                element={<Navigate to="/trackers/mood" replace />}
              />
              <Route
                path="/weight-tracker"
                element={<Navigate to="/trackers/weight" replace />}
              />
              <Route
                path="/period-tracker"
                element={<Navigate to="/trackers/period" replace />}
              />
              <Route
                path="/fertility-tracker"
                element={<Navigate to="/trackers/fertility" replace />}
              />

              {/* AI Center Routes - Available to authenticated patients */}
              <Route path="/patient/ai-center">
                <Route
                  index
                  element={
                    <ProtectedRoute allowedUserTypes={["patient"]}>
                      <AiCenterHub />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="gdm"
                  element={
                    <ProtectedRoute allowedUserTypes={["patient"]}>
                      <GDMScreeningPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="preeclampsia"
                  element={
                    <ProtectedRoute allowedUserTypes={["patient"]}>
                      <PreeclampsiaScreeningPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="preterm"
                  element={
                    <ProtectedRoute allowedUserTypes={["patient"]}>
                      <PretermScreeningPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="scbu"
                  element={
                    <ProtectedRoute allowedUserTypes={["patient"]}>
                      <SCBUScreeningPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="history"
                  element={
                    <ProtectedRoute allowedUserTypes={["patient"]}>
                      <PredictionHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="history/:id"
                  element={
                    <ProtectedRoute allowedUserTypes={["patient"]}>
                      <PredictionDetailPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Patient Chatbot Full Page — accessible to all users */}
              <Route path="/patient/chatbot" element={<ChatbotPage />} />

              {/* Patient OCR Lab Tests Page */}
              <Route
                path="/patient/medical-files/lab-tests"
                element={
                  <ProtectedRoute allowedUserTypes={["patient"]}>
                    <LabTestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/medical-files/lab-tests/:id"
                element={
                  <ProtectedRoute allowedUserTypes={["patient"]}>
                    <LabTestResultDetail />
                  </ProtectedRoute>
                }
              />

              {/* Patient Notification Routes */}
              <Route
                path="/patient/notifications"
                element={
                  <ProtectedRoute allowedUserTypes={["patient"]}>
                    <NotificationsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/notifications/settings"
                element={
                  <ProtectedRoute allowedUserTypes={["patient"]}>
                    <NotificationSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy redirects */}
              <Route
                path="/settings/notifications"
                element={
                  <Navigate to="/patient/notifications/settings" replace />
                }
              />
              <Route
                path="/notifications"
                element={<Navigate to="/patient/notifications" replace />}
              />

              {/* Patient Consultation Routes */}
              <Route
                path="/patient/consultations"
                element={
                  <ProtectedRoute allowedUserTypes={["patient"]}>
                    <Outlet />
                  </ProtectedRoute>
                }
              >
                <Route index element={<MyConsultations />} />
                <Route path="doctors" element={<DoctorSearch />} />
                <Route path="doctors/:id" element={<DoctorDetails />} />
                <Route path="book/:id" element={<BookConsultation />} />
                <Route path="payment-callback" element={<PaymentCallback />} />
                <Route path="prescriptions" element={<MyPrescriptions />} />
                <Route path=":id" element={<ConsultationDetails />} />
                <Route path=":id/review" element={<ReviewDoctor />} />
                <Route path=":id/video" element={<VideoCall />} />
                <Route path=":id/prescription" element={<PrescriptionPage />} />
              </Route>

              {/* Doctor Routes */}
              <Route path="/doctor/login" element={<DoctorLogin />} />
              <Route path="/doctor/pending" element={<PendingApproval />} />

              {/* Protected Doctor Portal */}
              <Route
                path="/doctor"
                element={
                  <ProtectedRoute allowedUserTypes={["doctor"]}>
                    <DoctorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DoctorDashboard />} />
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="search" element={<DoctorSearchPage />} />

                <Route path="consultations" element={<DoctorConsultations />} />
                <Route
                  path="consultations/:id"
                  element={<DoctorConsultationDetails />}
                />
                <Route
                  path="consultations/:id/video"
                  element={<DoctorVideoCall />}
                />
                <Route
                  path="consultations/:id/complete"
                  element={<CompleteConsultation />}
                />

                <Route path="prescriptions" element={<DoctorPrescriptions />} />

                <Route path="patients" element={<DoctorPatients />} />
                <Route path="patients/:id" element={<PatientDetails />} />

                <Route path="working-hours" element={<WorkingHours />} />

                <Route path="articles" element={<MyArticles />} />
                <Route
                  path="articles/create"
                  element={<ArticleForm mode="create" />}
                />
                <Route
                  path="articles/:id"
                  element={<ArticleForm mode="edit" />}
                />
                <Route
                  path="articles/:id/edit"
                  element={<ArticleForm mode="edit" />}
                />

                <Route path="profile" element={<ViewProfile />} />
                <Route path="profile/edit" element={<EditProfile />} />
                <Route path="change-password" element={<DoctorChangePassword />} />

                <Route path="financials" element={<DoctorFinancials />} />
                <Route path="reviews" element={<DoctorReviews />} />

                {/* Doctor AI Center */}
                <Route path="ai-center" element={<DoctorAiDashboard />} />
                <Route path="ai-center/:id" element={<DoctorAiPredictionDetail />} />

                <Route
                  path="settings/google-connect"
                  element={<GoogleConnect />}
                />

                {/* Doctor Notifications */}
                <Route
                  path="notifications"
                  element={<NotificationsListPage />}
                />
                <Route
                  path="notifications/settings"
                  element={<NotificationSettingsPage />}
                />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin Panel with Layout */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedUserTypes={["admin"]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboardNew />} />
                <Route path="dashboard" element={<AdminDashboardNew />} />
                <Route path="profile" element={<AdminProfilePage />} />

                {/* Users Management */}
                <Route
                  path="users/patients"
                  element={
                    <RequirePermission route="/admin/users/patients">
                      <PatientsManagement />
                    </RequirePermission>
                  }
                />
                <Route
                  path="users/doctors"
                  element={
                    <RequirePermission route="/admin/users/doctors">
                      <DoctorsManagement />
                    </RequirePermission>
                  }
                />
                <Route
                  path="users/admins"
                  element={
                    <RequirePermission route="/admin/users/admins">
                      <AdminsManagement />
                    </RequirePermission>
                  }
                />

                {/* Join Requests */}
                <Route
                  path="join-requests"
                  element={
                    <RequirePermission route="/admin/join-requests">
                      <JoinRequestsPage />
                    </RequirePermission>
                  }
                />

                {/* Consultations */}
                <Route
                  path="consultations"
                  element={
                    <RequirePermission route="/admin/consultations">
                      <ConsultationsPage />
                    </RequirePermission>
                  }
                />

                {/* Financials */}
                <Route
                  path="financials"
                  element={
                    <RequirePermission route="/admin/financials">
                      <FinancialsPage />
                    </RequirePermission>
                  }
                />

                {/* Analytics */}
                <Route
                  path="analytics"
                  element={
                    <RequirePermission route="/admin/analytics">
                      <AnalyticsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="ai-analytics"
                  element={
                    <RequirePermission route="/admin/ai-analytics">
                      <AdminAiAnalytics />
                    </RequirePermission>
                  }
                />

                {/* Articles */}
                <Route
                  path="articles"
                  element={
                    <RequirePermission route="/admin/articles">
                      <ArticlesManagement />
                    </RequirePermission>
                  }
                />
                <Route
                  path="articles/:id"
                  element={
                    <RequirePermission route="/admin/articles">
                      <ArticleReview />
                    </RequirePermission>
                  }
                />

                {/* Messages */}
                <Route
                  path="messages"
                  element={
                    <RequirePermission route="/admin/messages">
                      <MessagesPage />
                    </RequirePermission>
                  }
                />

                {/* Notifications - Send & History */}
                <Route
                  path="notifications"
                  element={
                    <RequirePermission route="/admin/notifications">
                      <NotificationsPage />
                    </RequirePermission>
                  }
                />
                {/* Admin's own received notifications - no permission required */}
                <Route
                  path="my-notifications"
                  element={<NotificationsListPage />}
                />
                <Route
                  path="notifications/settings"
                  element={<NotificationSettingsPage />}
                />

                {/* Settings */}
                <Route
                  path="settings"
                  element={
                    <RequirePermission route="/admin/settings">
                      <SettingsPage />
                    </RequirePermission>
                  }
                />

                {/* Audit Logs */}
                <Route
                  path="audit-logs"
                  element={
                    <RequirePermission route="/admin/audit-logs">
                      <AuditLogsPage />
                    </RequirePermission>
                  }
                />

                {/* FAQs Management */}
                <Route
                  path="faqs"
                  element={
                    <RequirePermission route="/admin/faqs">
                      <FAQsPage />
                    </RequirePermission>
                  }
                />

                {/* About Us Management */}
                <Route
                  path="about"
                  element={
                    <RequirePermission route="/admin/about">
                      <AboutUsPage />
                    </RequirePermission>
                  }
                />

                {/* Knowledge Base Management */}
                <Route
                  path="knowledge-base"
                  element={
                    <RequirePermission route="/admin/knowledge-base">
                      <KnowledgeBasePage />
                    </RequirePermission>
                  }
                />

                {/* Chatbot Stats page */}
                <Route
                  path="chatbot/stats"
                  element={
                    <RequirePermission route="/admin/chatbot">
                      <ChatbotStatsPage />
                    </RequirePermission>
                  }
                />
              </Route>

              {/* Auth Routes */}
              <Route
                path="/verify-email"
                element={
                  <ProtectedRoute requireVerification={false}>
                    <EmailVerification />
                  </ProtectedRoute>
                }
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/account-locked" element={<AccountLocked />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatWidget />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
