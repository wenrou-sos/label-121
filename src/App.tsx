import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AlertsPanel from "@/components/alerts/AlertsPanel";
import SearchModal from "@/components/common/SearchModal";
import Dashboard from "@/pages/Dashboard";
import BetDistribution from "@/pages/BetDistribution";
import OddsTracking from "@/pages/OddsTracking";
import UpsetAnalysis from "@/pages/UpsetAnalysis";
import TeamHistory from "@/pages/TeamHistory";
import LiveAnalysis from "@/pages/LiveAnalysis";
import { useSearchStore } from "@/store/useSearchStore";

function AppContent() {
  const navigate = useNavigate();
  const setExternalNavigate = useSearchStore(s => s.setExternalNavigate);

  useEffect(() => {
    setExternalNavigate((path: string) => navigate(path));
    return () => setExternalNavigate(null);
  }, [navigate, setExternalNavigate]);

  return (
    <div className="flex h-screen bg-esports-bg text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bet-distribution" element={<BetDistribution />} />
            <Route path="/odds-tracking" element={<OddsTracking />} />
            <Route path="/upset-analysis" element={<UpsetAnalysis />} />
            <Route path="/team-history" element={<TeamHistory />} />
            <Route path="/live-analysis" element={<LiveAnalysis />} />
          </Routes>
        </main>
      </div>
      <AlertsPanel />
      <SearchModal />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
