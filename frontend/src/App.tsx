import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Home from "./componenti/Home";
import Ingredienti from "./componenti/Ingredienti";
import Ricette from "./componenti/Ricette";

const stileLink = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  margin: "0 8px",
  padding: "12px 24px",
  fontSize: "16px",
  background: isActive ? "#667eea" : "#f8f9fa",
  color: isActive ? "white" : "#495057",
  textDecoration: "none",
  borderRadius: "25px",
  display: "inline-block",
  transition: "all 0.3s",
});

const Navbar: React.FC = () => (
  <>
    <header
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "20px",
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      }}
    >
      <h1>📖 Il Mio Ricettario</h1>
    </header>

    <nav
      style={{
        padding: "15px",
        background: "rgba(255,255,255,0.95)",
        borderBottom: "2px solid #667eea",
        textAlign: "center",
      }}
    >
      {/* NavLink sa da solo se la rotta è attiva: niente confronti manuali sul percorso */}
      <NavLink to="/" end style={stileLink}>
        🏠 Home
      </NavLink>
      <NavLink to="/ricette" style={stileLink}>
        📋 Ricette
      </NavLink>
      <NavLink to="/ingredienti" style={stileLink}>
        🥬 Ingredienti
      </NavLink>
    </nav>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <main style={{ padding: "30px", maxWidth: "1400px", margin: "0 auto" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ricette" element={<Ricette />} />
            <Route path="/ingredienti" element={<Ingredienti />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
