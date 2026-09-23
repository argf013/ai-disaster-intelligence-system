import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import ImageAnalysisView from './views/ImageAnalysisView';
import DamageAssessmentView from './views/DamageAssessmentView';
import EmergencyMessagesView from './views/EmergencyMessagesView';
import ShelterMapView from './views/ShelterMapView';
import HistoryView from './views/HistoryView';
import ReportsView from './views/ReportsView';
import AdminView from './views/AdminView';
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reportAssessmentId, setReportAssessmentId] = useState(null);

  // Shared active operational location across all modules
  const [currentLocation, setCurrentLocation] = useState({
    name: 'Hyderabad (Flood Zone)',
    latitude: 17.3850,
    longitude: 78.4867,
  });

  // Shared Integrated Assessment Context: aggregates image analysis, before/after, and emergency text into dashboard/assessment
  const [assessmentContext, setAssessmentContext] = useState({
    vision: null, // { disaster_type, image_confidence, image_severity, yolo_objects, annotated_image_url }
    damage: null, // { change_score, damage_level, heatmap_url }
    emergency: null, // { text, classification, confidence, urgency_level }
  });

  const handleUseVisionInAssessment = (visionData) => {
    setAssessmentContext((prev) => ({
      ...prev,
      vision: visionData,
    }));
    setActiveTab('dashboard');
  };

  const handleUseDamageInAssessment = (damageData) => {
    setAssessmentContext((prev) => ({
      ...prev,
      damage: damageData,
    }));
    setActiveTab('dashboard');
  };

  const handleUseEmergencyInAssessment = (emergencyData) => {
    setAssessmentContext((prev) => ({
      ...prev,
      emergency: emergencyData,
    }));
    setActiveTab('dashboard');
  };

  const handleClearContextItem = (key) => {
    setAssessmentContext((prev) => ({
      ...prev,
      [key]: null,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm">
        Initializing Disaster Intelligence Terminal...
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginView onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterView onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const handleNavigateToReports = (assessmentId = null) => {
    if (assessmentId) {
      setReportAssessmentId(assessmentId);
    }
    setActiveTab('reports');
  };

  const handleNavigateToShelters = () => {
    setActiveTab('shelter-map');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateToReports={handleNavigateToReports}
            onNavigateToShelters={handleNavigateToShelters}
            assessmentContext={assessmentContext}
            onClearContextItem={handleClearContextItem}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
          />
        )}
        {activeTab === 'image-analysis' && (
          <ImageAnalysisView
            onUseInAssessment={handleUseVisionInAssessment}
            currentLocation={currentLocation}
            onNavigateToShelters={handleNavigateToShelters}
          />
        )}
        {activeTab === 'damage-assessment' && (
          <DamageAssessmentView
            onUseInAssessment={handleUseDamageInAssessment}
            currentLocation={currentLocation}
            onNavigateToShelters={handleNavigateToShelters}
          />
        )}
        {activeTab === 'emergency-messages' && (
          <EmergencyMessagesView onUseInAssessment={handleUseEmergencyInAssessment} />
        )}
        {activeTab === 'shelter-map' && (
          <ShelterMapView
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
          />
        )}
        {activeTab === 'history' && (
          <HistoryView onSelectAssessmentForReport={handleNavigateToReports} />
        )}
        {activeTab === 'reports' && (
          <ReportsView preselectedAssessmentId={reportAssessmentId} />
        )}
        {activeTab === 'admin' && <AdminView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          AI Disaster Intelligence System &bull; Integrates Live Open-Meteo Telemetry,
          HuggingFace Vision &amp; Language Models, and Municipal GIS Infrastructure.
        </p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
