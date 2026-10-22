import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../componenti/Modal";

interface Ingrediente {
  id: number;
  nome: string;
  quantita: number;
  unita: string;
  descrizione?: string;
  puoEliminare: boolean;
}

const Ingredienti: React.FC = () => {
  const [ingredienti, setIngredienti] = useState<Ingrediente[]>([]);
  const [mostraModaleIng, setMostraModaleIng] = useState(false);
  const [nome, setNome] = useState("");
  const [quantita, setQuantita] = useState(0);
  const [unita, setUnita] = useState("");
  const [descrizione, setDescrizione] = useState("");

  // 🔧 Carica TUTTI ingredienti + usato status (1 chiamata!)
  useEffect(() => {
    const caricaIngredienti = async () => {
      try {
        const [ingrRes, ricRes] = await Promise.all([
          axios.get("/api/ingredienti"),
          axios.get("/api/ricette"),
        ]);

        const tuttiIngredienti = Array.isArray(ingrRes.data)
          ? ingrRes.data
          : [];
        const ricette = Array.isArray(ricRes.data) ? ricRes.data : [];

        // Check usati da ingredienti_nomi
        const usati = new Set<number>();
        ricette.forEach((ricetta: any) => {
          tuttiIngredienti.forEach((ing: any) => {
            if (ricetta.ingredienti_nomi?.includes(ing.nome)) {
              usati.add(ing.id);
            }
          });
        });

        // Aggiungi puoEliminare
        const conCheck = tuttiIngredienti.map((ing: any) => ({
          ...ing,
          puoEliminare: !usati.has(ing.id),
        }));

        setIngredienti(conCheck);
      } catch (err) {
        console.error("❌ Caricamento ingredienti:", err);
      }
    };
    caricaIngredienti();
  }, []);

  const salvaIngrediente = () => {
    if (!nome || quantita <= 0 || !unita) {
      alert("Nome, quantità e unità obbligatori!");
      return;
    }
    axios
      .post("/api/ingredienti", {
        nome,
        quantita,
        unita,
        descrizione,
      })
      .then(() => {
        setMostraModaleIng(false);
        setNome("");
        setQuantita(0);
        setUnita("");
        setDescrizione("");
        window.location.reload(); // Refresh lista
      })
      .catch((err) =>
        alert("Errore salva: " + (err.response?.data?.errore || err.message)),
      );
  };

  const eliminaIngrediente = (id: number) => {
    const ing = ingredienti.find((i) => i.id === id);
    if (!ing?.puoEliminare) {
      alert("❌ Ingrediente usato in ricette!");
      return;
    }
    if (window.confirm(`Elimina "${ing.nome}"?`)) {
      axios
        .delete(`/api/ingredienti/${id}`)
        .then(() => window.location.reload())
        .catch((err) => alert("Errore elimina: " + err.message));
    }
  };

  return (
    <div>
      <h2>🥬 Gestione Ingredienti</h2>

      {/* 🔘 PULSANTE MODALE (sostituisce vecchio form) */}
      <button
        onClick={() => setMostraModaleIng(true)}
        style={{
          padding: "15px 30px",
          background: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
          marginBottom: "30px",
        }}
      >
        ➕ Aggiungi Ingrediente
      </button>

      {/* MODALE FORM */}
      <Modal
        isOpen={mostraModaleIng}
        onClose={() => setMostraModaleIng(false)}
        title="🥬 Nuovo Ingrediente"
      >
        <input
          placeholder="Nome (es. Farina)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            border: "1px solid #ddd",
            borderRadius: "6px",
          }}
        />
        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
          <input
            type="number"
            placeholder="Quantità"
            value={quantita}
            onChange={(e) => setQuantita(+e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          />
          <select
            value={unita}
            onChange={(e) => setUnita(e.target.value)}
            style={{
              width: "120px",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "6px",
            }}
          >
            <option value="">Unità</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="pz">pz</option>
            <option value="kg">kg</option>
            <option value="cl">cl</option>
            <option value="q.b">q.b</option>
            <option value="cucchiaio">Cucchiaio</option>
            <option value="cucchiaino">Cucchiaino</option>
          </select>
        </div>
        <textarea
          placeholder="Descrizione (opzionale)"
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            minHeight: "80px",
            resize: "vertical",
          }}
        />
        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => setMostraModaleIng(false)}
            style={{
              padding: "12px 24px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Annulla
          </button>
          <button
            onClick={salvaIngrediente}
            style={{
              padding: "12px 24px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            💾 Salva Ingrediente
          </button>
        </div>
      </Modal>

      {/* GRIGLIA (invariata - perfetta!) */}
      <h3>Ingredienti ({ingredienti.length})</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {ingredienti.map((ing) => (
          <div
            key={ing.id}
            style={{
              border: "2px solid #dee2e6",
              padding: "20px",
              borderRadius: "12px",
              background: "white",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0", color: "#007bff" }}>
              {ing.nome}
            </h4>
            <p
              style={{ fontSize: "18px", margin: "5px 0", fontWeight: "bold" }}
            >
              {ing.quantita} {ing.unita.toUpperCase()}
            </p>
            {ing.descrizione && (
              <p style={{ color: "#666", fontStyle: "italic" }}>
                {ing.descrizione}
              </p>
            )}
            <button
              onClick={() => eliminaIngrediente(ing.id)}
              disabled={!ing.puoEliminare}
              style={{
                background: ing.puoEliminare ? "#dc3545" : "#6c757d",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                cursor: ing.puoEliminare ? "pointer" : "not-allowed",
                marginTop: "15px",
                opacity: ing.puoEliminare ? 1 : 0.7,
              }}
              title={
                !ing.puoEliminare
                  ? "🔒 Usato in ricette. Rimuovi prima dalle ricette."
                  : "🗑️ Elimina"
              }
            >
              {ing.puoEliminare ? "🗑️ Elimina" : "🔒 Bloccato"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ingredienti;
