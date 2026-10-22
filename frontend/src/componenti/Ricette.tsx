import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../componenti/Modal";

interface Ingrediente {
  id: number;
  nome: string;
  quantita: number;
  unita: string;
}

interface Ricetta {
  id: number;
  nome: string;
  istruzioni: string;
  difficolta: "facile" | "media" | "difficile";
  ingredienti_nomi?: string;
}

const Ricette: React.FC = () => {
  const [ingredientiDisponibili, setIngredientiDisponibili] = useState<
    Ingrediente[]
  >([]);
  const [ricette, setRicette] = useState<Ricetta[]>([]);
  const [mostraModaleRic, setMostraModaleRic] = useState(false);
  const [nome, setNome] = useState("");
  const [istruzioni, setIstruzioni] = useState("");
  const [difficolta, setDifficolta] = useState<
    "facile" | "media" | "difficile" | ""
  >("");
  const [ingredientiSelezionati, setIngredientiSelezionati] = useState<
    { ingredienteId: number; nome: string; quantita: number; unita: string }[]
  >([]);

  // 🆕 STATO PER TOGGLE ESPANSIONE RICETTE - FUORI DAL MAP!
  const [ricetteEspanse, setRicetteEspanse] = useState<{
    [key: number]: boolean;
  }>({});

  // 🔧 Carica dati con check array
  useEffect(() => {
    axios
      .get("/api/ingredienti")
      .then((res) => {
        setIngredientiDisponibili(Array.isArray(res.data) ? res.data : []);
      })
      .catch(console.error);

    axios
      .get("/api/ricette")
      .then((res) => {
        setRicette(Array.isArray(res.data) ? res.data : []);
      })
      .catch(console.error);
  }, []);

  const aggiungiIngredienteForm = () => {
    const select = document.getElementById(
      "ingredienteSelect",
    ) as HTMLSelectElement;
    const quantitaInput = document.getElementById(
      "quantitaExtra",
    ) as HTMLInputElement;
    const unitaSelect = document.getElementById(
      "unitaExtra",
    ) as HTMLSelectElement;

    if (select?.value && quantitaInput?.value) {
      const ingrediente = ingredientiDisponibili.find(
        (ing) => ing.id === +select.value,
      );
      if (ingrediente) {
        setIngredientiSelezionati([
          ...ingredientiSelezionati,
          {
            ingredienteId: ingrediente.id,
            nome: ingrediente.nome,
            quantita: +quantitaInput.value,
            unita: unitaSelect.value as string,
          },
        ]);
        quantitaInput.value = "";
        unitaSelect.value = "";
        select.value = "";
      }
    }
  };

  const rimuoviIngredienteForm = (index: number) => {
    setIngredientiSelezionati(
      ingredientiSelezionati.filter((_, i) => i !== index),
    );
  };

  const salvaRicetta = () => {
    if (
      !nome ||
      !istruzioni ||
      !difficolta ||
      ingredientiSelezionati.length === 0
    ) {
      alert("Compila tutti i campi obbligatori!");
      return;
    }
    axios
      .post("/api/ricette", {
        nome,
        istruzioni,
        difficolta,
        ingredienti: ingredientiSelezionati.map((ing) => ({
          ingredienteId: ing.ingredienteId,
          quantita: ing.quantita,
          unita: ing.unita,
        })),
      })
      .then((res) => {
        console.log("✅ Ricetta salvata:", res.data);
        setMostraModaleRic(false);
        setNome("");
        setIstruzioni("");
        setDifficolta("");
        setIngredientiSelezionati([]);
        window.location.reload(); // Refresh lista
      })
      .catch((err) => {
        console.error("❌ Errore:", err.response?.data || err.message);
        alert("Errore: " + (err.response?.data?.errore || "Controlla console"));
      });
  };

  const eliminaRicetta = (id: number) => {
    if (window.confirm("Elimina ricetta?")) {
      axios.delete(`/api/ricette/${id}`).then(() => window.location.reload());
    }
  };

  // 🆕 FUNZIONE TOGGLE RICETTA (usa stato globale)
  const toggleRicetta = (id: number) => {
    setRicetteEspanse((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div>
      <h2>📋 Gestione Ricette</h2>

      {/* 🔘 PULSANTE MODALE */}
      <button
        onClick={() => setMostraModaleRic(true)}
        style={{
          padding: "15px 35px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "18px",
          cursor: "pointer",
          marginBottom: "30px",
        }}
      >
        📝 Nuova Ricetta
      </button>

      {/* MODALE FORM RICETTA */}
      <Modal
        isOpen={mostraModaleRic}
        onClose={() => setMostraModaleRic(false)}
        title="📝 Crea Nuova Ricetta"
      >
        <input
          placeholder="Nome ricetta (obbligatorio)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        />
        <textarea
          placeholder="Istruzioni dettagliate (obbligatorio)"
          value={istruzioni}
          onChange={(e) => setIstruzioni(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            minHeight: "120px",
            resize: "vertical",
          }}
        />
        <select
          value={difficolta}
          onChange={(e) =>
            setDifficolta(
              e.target.value as "facile" | "media" | "difficile" | "",
            )
          }
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            fontSize: "16px",
            borderRadius: "6px",
            border: "1px solid #ddd",
          }}
        >
          <option value="">Seleziona difficoltà</option>
          <option value="facile">🥚 Facile</option>
          <option value="media">🥘 Media</option>
          <option value="difficile">🔥 Difficile</option>
        </select>

        {/* AGGIUNGI INGREDIENTI */}
        <h4 style={{ marginBottom: "10px" }}>Ingredienti:</h4>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px",
            flexWrap: "wrap",
          }}
        >
          <select
            id="ingredienteSelect"
            style={{ padding: "10px", flex: 1, minWidth: "150px" }}
          >
            <option value="">Seleziona ingrediente</option>
            {ingredientiDisponibili.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.nome}
              </option>
            ))}
          </select>
          <input
            id="quantitaExtra"
            type="number"
            placeholder="Q.tà"
            style={{ padding: "10px", width: "80px" }}
          />
          <select id="unitaExtra" style={{ padding: "10px", width: "100px" }}>
            <option value="">Unità</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="pz">pz</option>
            <option value="kg">kg</option>
            <option value="cl">cl</option>
          </select>
          <button
            onClick={aggiungiIngredienteForm}
            style={{
              padding: "10px 15px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ➕
          </button>
        </div>

        {/* LISTA SELEZIONATI */}
        {ingredientiSelezionati.length > 0 ? (
          <div
            style={{
              marginBottom: "20px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {ingredientiSelezionati.map((ing, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: "#e9ecef",
                  marginBottom: "8px",
                  borderRadius: "6px",
                }}
              >
                <span>
                  {ing.nome}:{" "}
                  <strong>
                    {ing.quantita} {ing.unita}
                  </strong>
                </span>
                <button
                  onClick={() => rimuoviIngredienteForm(index)}
                  style={{
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              color: "#6c757d",
              fontStyle: "italic",
              marginBottom: "20px",
            }}
          >
            Nessun ingrediente selezionato (obbligatorio!)
          </p>
        )}

        <div
          style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
        >
          <button
            onClick={() => setMostraModaleRic(false)}
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
            onClick={salvaRicetta}
            style={{
              padding: "12px 24px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            💾 Salva Ricetta
          </button>
        </div>
      </Modal>

      {/* GRIGLIA RICETTE */}
      <h3>Ricette Salvate ({ricette.length})</h3>
      {Array.isArray(ricette) && ricette.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
          }}
        >
          {ricette.map((ricetta) => {
            const mostraProcedimento = ricetteEspanse[ricetta.id] || false;

            return (
              <div
                key={ricetta.id}
                style={{
                  border: "2px solid #dee2e6",
                  borderRadius: "12px",
                  background: "white",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                {/* HEADER */}
                <div style={{ padding: "25px", background: "#f8f9fa" }}>
                  <h4 style={{ color: "#007bff", margin: "0 0 15px 0" }}>
                    {ricetta.nome}
                  </h4>
                  <p style={{ margin: "0 0 10px 0" }}>
                    <strong>Difficoltà:</strong>
                    <span
                      style={{
                        background: "#d1ecf1",
                        color: "#0c5460",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        marginLeft: "8px",
                      }}
                    >
                      {ricetta.difficolta}
                    </span>
                  </p>
                  <h5 style={{ margin: "15px 0 10px 0", color: "#28a745" }}>
                    Ingredienti:
                  </h5>
                  <div
                    style={{
                      background: "#d4edda",
                      padding: "12px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <strong>
                      {ricetta.ingredienti_nomi || "Nessun ingrediente"}
                    </strong>
                  </div>

                  {/* 🔘 PULSANTE TOGGLE - FUNZIONA! */}
                  <button
                    onClick={() => toggleRicetta(ricetta.id)}
                    style={{
                      marginTop: "15px",
                      padding: "10px 20px",
                      background: mostraProcedimento ? "#6c757d" : "#17a2b8",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      cursor: "pointer",
                      fontSize: "14px",
                      width: "100%",
                      fontWeight: "bold",
                    }}
                  >
                    📖{" "}
                    {mostraProcedimento
                      ? "Nascondi Procedimento"
                      : "Mostra Procedimento"}
                  </button>
                </div>

                {/* PROCEDIMENTO ESPANDIBILE */}
                {mostraProcedimento && (
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "25px",
                      borderTop: "1px solid #dee2e6",
                      animation: "slideDown 0.3s ease-out",
                    }}
                  >
                    <h5 style={{ marginTop: 0, color: "#495057" }}>
                      Procedimento:
                    </h5>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.6",
                        background: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        borderLeft: "4px solid #007bff",
                      }}
                    >
                      {ricetta.istruzioni || "Nessuna istruzione disponibile"}
                    </div>
                  </div>
                )}

                {/* ELIMINA */}
                <div
                  style={{
                    padding: "15px 25px",
                    background: "#f1f3f4",
                    textAlign: "right",
                  }}
                >
                  <button
                    onClick={() => eliminaRicetta(ricetta.id)}
                    style={{
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p
          style={{
            textAlign: "center",
            color: "#6c757d",
            fontStyle: "italic",
            padding: "60px",
          }}
        >
          Nessuna ricetta salvata. Crea la prima! 📝
        </p>
      )}
    </div>
  );
};

export default Ricette;
