import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/home.css";

const Home: React.FC = () => {
  const [stats, setStats] = useState({ totalRicette: 0, totalIngredienti: 0 });

  useEffect(() => {
    axios
      .get("/api/stats")
      .then((res) => setStats(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">🍳 Ricettario</h1>
          <p className="hero-subtitle">Gestisci le tue ricette</p>
          <div className="hero-buttons">
            <a href="/ricette" className="btn btn-primary btn-lg hero-btn">
              📝 Crea la tua ricetta
            </a>
            <a
              href="/ingredienti"
              className="btn btn-secondary btn-lg hero-btn"
            >
              🛒 Aggiungi ingredienti
            </a>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
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
        </div>
      </section>
    </div>
  );
};

export default Home;
