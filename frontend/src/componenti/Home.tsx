import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/home.css";

interface Statistiche {
  totalRicette: number;
  totalIngredienti: number;
}

const Home: React.FC = () => {
  const [stats, setStats] = useState<Statistiche>({ totalRicette: 0, totalIngredienti: 0 });
  const [errore, setErrore] = useState(false);

  useEffect(() => {
    axios
      .get<Statistiche>("/api/stats")
      .then((res) => setStats(res.data))
      .catch(() => setErrore(true));
  }, []);

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">📖 Il Mio Ricettario</h1>
          <p className="hero-subtitle">Gestisci ricette e scorte degli ingredienti</p>
          <div className="hero-buttons">
            {/* Link di React Router: cambia pagina senza ricaricare l'app */}
            <Link to="/ricette" className="btn btn-primary btn-lg hero-btn">
              📝 Crea la tua ricetta
            </Link>
            <Link to="/ingredienti" className="btn btn-secondary btn-lg hero-btn">
              🛒 Aggiungi ingredienti
            </Link>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          {errore ? (
            <p style={{ textAlign: "center", color: "#dc3545" }}>
              Impossibile caricare le statistiche. Il backend è acceso?
            </p>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalRicette}</div>
                <div className="stat-label">Ricette</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.totalIngredienti}</div>
                <div className="stat-label">Ingredienti</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
