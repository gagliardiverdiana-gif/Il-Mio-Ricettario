import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import Home from "./componenti/Home";
import Ingredienti from "./componenti/Ingredienti";
import Ricette from "./componenti/Ricette";

const Navbar: React.FC = () => {
  const location = useLocation();
  const getActivePath = () => {
    if (location.pathname === "/") return "home";
    if (location.pathname === "/ricette") return "ricette";
    if (location.pathname === "/ingredienti") return "ingredienti";
    return "home";
  };

  return (
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
        <h1>🍳 Ricettario</h1>
      </header>

      <nav
        style={{
          padding: "15px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "2px solid #667eea",
          textAlign: "center",
        }}
      >
        <Link
          to="/"
          style={{
            margin: "0 8px",
            padding: "12px 24px",
            fontSize: "16px",
            background: getActivePath() === "home" ? "#667eea" : "#f8f9fa",
            color: getActivePath() === "home" ? "white" : "#495057",
            textDecoration: "none",
            borderRadius: "25px",
            display: "inline-block",
            transition: "all 0.3s",
          }}
        >
          🏠 Home
        </Link>

        <Link
          to="/ricette"
          style={{
            margin: "0 8px",
            padding: "12px 24px",
            fontSize: "16px",
            background: getActivePath() === "ricette" ? "#667eea" : "#f8f9fa",
            color: getActivePath() === "ricette" ? "white" : "#495057",
            textDecoration: "none",
            borderRadius: "25px",
            display: "inline-block",
            transition: "all 0.3s",
          }}
        >
          📋 Ricette
        </Link>

        <Link
          to="/ingredienti"
          style={{
            margin: "0 8px",
            padding: "12px 24px",
            fontSize: "16px",
            background:
              getActivePath() === "ingredienti" ? "#667eea" : "#f8f9fa",
            color: getActivePath() === "ingredienti" ? "white" : "#495057",
            textDecoration: "none",
            borderRadius: "25px",
            display: "inline-block",
            transition: "all 0.3s",
          }}
        >
          🥬 Ingredienti
        </Link>
      </nav>
    </>
  );
};

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
