import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Dashboard from "@/pages/Dashboard";
import BetDistribution from "@/pages/BetDistribution";
import OddsTracking from "@/pages/OddsTracking";
import UpsetAnalysis from "@/pages/UpsetAnalysis";
import TeamHistory from "@/pages/TeamHistory";
import LiveAnalysis from "@/pages/LiveAnalysis";

export default function App() {
  return (
    <Router>
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
    </div>
    </Router>
  );
}
