import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Modal from "./Modal";
import { unitaCompatibili } from "../utils/unita";
import { messaggioErrore } from "../utils/errori";

type Difficolta = "facile" | "media" | "difficile";

interface Ingrediente {
  id: number;
  nome: string;
  quantita: number;
  unita: string;
}

interface Ricetta {
  id: number;
  nome: string;
  istruzioni: string | null;
  difficolta: Difficolta;
  ingredienti_nomi: string;
}

interface IngredienteSelezionato {
  ingredienteId: number;
  nome: string;
  quantita: number;
  unita: string;
}

const stileCampo: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  fontSize: "16px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};

const stileBottone = (colore: string): React.CSSProperties => ({
  padding: "12px 24px",
  background: colore,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
});

const Ricette: React.FC = () => {
  const [ricette, setRicette] = useState<Ricetta[]>([]);
  const [ingredientiDisponibili, setIngredientiDisponibili] = useState<Ingrediente[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [mostraModale, setMostraModale] = useState(false);
  const [ricetteEspanse, setRicetteEspanse] = useState<Record<number, boolean>>({});

  // Campi della ricetta: componenti controllati, i valori vivono nello stato
  const [nome, setNome] = useState("");
  const [istruzioni, setIstruzioni] = useState("");
  const [difficolta, setDifficolta] = useState<Difficolta | "">("");
  const [selezionati, setSelezionati] = useState<IngredienteSelezionato[]>([]);

  // Riga "aggiungi ingrediente": anche questi sono stato, non letture dal DOM
  const [idScelto, setIdScelto] = useState("");
  const [quantitaScelta, setQuantitaScelta] = useState("");
  const [unitaScelta, setUnitaScelta] = useState("");

  const ingredienteScelto = ingredientiDisponibili.find((i) => i.id === Number(idScelto));

  // Ricette e scorte insieme: creare o eliminare una ricetta cambia le scorte
  const caricaDati = useCallback(async () => {
    try {
      const [resRicette, resIngredienti] = await Promise.all([
        axios.get<Ricetta[]>("/api/ricette"),
        axios.get<Ingrediente[]>("/api/ingredienti"),
      ]);
      setRicette(resRicette.data);
      setIngredientiDisponibili(resIngredienti.data);
    } catch (err) {
      alert("Errore nel caricamento: " + messaggioErrore(err));
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => {
    caricaDati();
  }, [caricaDati]);

  const azzeraForm = () => {
    setNome("");
    setIstruzioni("");
    setDifficolta("");
    setSelezionati([]);
    setIdScelto("");
    setQuantitaScelta("");
    setUnitaScelta("");
  };

  const chiudiModale = () => {
    setMostraModale(false);
    azzeraForm();
  };

  // Scegliendo un ingrediente, l'unità parte da quella in cui è tenuta la scorta
  const scegliIngrediente = (id: string) => {
    setIdScelto(id);
    const ing = ingredientiDisponibili.find((i) => i.id === Number(id));
    setUnitaScelta(ing ? ing.unita : "");
  };

  const aggiungiIngrediente = () => {
    const quantita = Number(quantitaScelta);
    if (!ingredienteScelto || !unitaScelta || !(quantita > 0)) {
      alert("Scegli un ingrediente, una quantità maggiore di 0 e l'unità");
      return;
    }
    setSelezionati((prec) => [
      ...prec,
      {
        ingredienteId: ingredienteScelto.id,
        nome: ingredienteScelto.nome,
        quantita,
        unita: unitaScelta,
      },
    ]);
    setIdScelto("");
    setQuantitaScelta("");
    setUnitaScelta("");
  };

  const rimuoviIngrediente = (ingredienteId: number) =>
    setSelezionati((prec) => prec.filter((s) => s.ingredienteId !== ingredienteId));

  const salvaRicetta = async () => {
    if (!nome.trim() || !istruzioni.trim() || !difficolta || selezionati.length === 0) {
      alert("Nome, istruzioni, difficoltà e almeno un ingrediente sono obbligatori");
      return;
    }
    try {
      await axios.post("/api/ricette", {
        nome,
        istruzioni,
        difficolta,
        ingredienti: selezionati.map(({ ingredienteId, quantita, unita }) => ({
          ingredienteId,
          quantita,
          unita,
        })),
      });
      chiudiModale();
      await caricaDati();
    } catch (err) {
      // Es. scorta insufficiente (409): il messaggio arriva dal backend
      alert("Impossibile salvare: " + messaggioErrore(err));
    }
  };

  const eliminaRicetta = async (ricetta: Ricetta) => {
    if (!window.confirm(`Eliminare "${ricetta.nome}"? Le scorte verranno ripristinate.`)) return;
    try {
      await axios.delete(`/api/ricette/${ricetta.id}`);
      await caricaDati();
    } catch (err) {
      alert("Errore nell'eliminazione: " + messaggioErrore(err));
    }
  };

  const toggleRicetta = (id: number) =>
    setRicetteEspanse((prec) => ({ ...prec, [id]: !prec[id] }));

  // Nella tendina non compaiono gli ingredienti già aggiunti alla ricetta
  const ingredientiSelezionabili = ingredientiDisponibili.filter(
    (ing) => !selezionati.some((s) => s.ingredienteId === ing.id),
  );

  return (
    <div>
      <h2>📋 Gestione Ricette</h2>

      <button
        onClick={() => setMostraModale(true)}
        style={{ ...stileBottone("#007bff"), padding: "15px 35px", fontSize: "18px", marginBottom: "30px" }}
      >
        📝 Nuova Ricetta
      </button>

      <Modal isOpen={mostraModale} onClose={chiudiModale} title="📝 Crea Nuova Ricetta">
        <input
          placeholder="Nome ricetta (obbligatorio)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={stileCampo}
        />
        <textarea
          placeholder="Istruzioni (obbligatorie)"
          value={istruzioni}
          onChange={(e) => setIstruzioni(e.target.value)}
          style={{ ...stileCampo, minHeight: "120px", resize: "vertical" }}
        />
        <select
          value={difficolta}
          onChange={(e) => setDifficolta(e.target.value as Difficolta | "")}
          style={{ ...stileCampo, marginBottom: "20px" }}
        >
          <option value="">Seleziona difficoltà</option>
          <option value="facile">🥚 Facile</option>
          <option value="media">🥘 Media</option>
          <option value="difficile">🔥 Difficile</option>
        </select>

        <h4 style={{ marginBottom: "10px" }}>Ingredienti:</h4>
        <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
          <select
            value={idScelto}
            onChange={(e) => scegliIngrediente(e.target.value)}
            style={{ padding: "10px", flex: 1, minWidth: "150px" }}
          >
            <option value="">Seleziona ingrediente</option>
            {ingredientiSelezionabili.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.nome} (disp. {ing.quantita} {ing.unita})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Q.tà"
            value={quantitaScelta}
            onChange={(e) => setQuantitaScelta(e.target.value)}
            style={{ padding: "10px", width: "80px" }}
          />
          {/* Solo unità convertibili in quella della scorta: niente g per le uova */}
          <select
            value={unitaScelta}
            onChange={(e) => setUnitaScelta(e.target.value)}
            disabled={!ingredienteScelto}
            style={{ padding: "10px", width: "110px" }}
          >
            {!ingredienteScelto && <option value="">Unità</option>}
            {ingredienteScelto &&
              unitaCompatibili(ingredienteScelto.unita).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
          </select>
          <button onClick={aggiungiIngrediente} style={{ ...stileBottone("#007bff"), padding: "10px 15px" }}>
            ➕
          </button>
        </div>

        {selezionati.length > 0 ? (
          <div style={{ marginBottom: "20px", maxHeight: "200px", overflowY: "auto" }}>
            {selezionati.map((ing) => (
              <div
                key={ing.ingredienteId}
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
                  {ing.nome}: <strong>{ing.quantita} {ing.unita}</strong>
                </span>
                <button
                  onClick={() => rimuoviIngrediente(ing.ingredienteId)}
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
          <p style={{ color: "#6c757d", fontStyle: "italic", marginBottom: "20px" }}>
            Nessun ingrediente selezionato (almeno uno è obbligatorio)
          </p>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={chiudiModale} style={stileBottone("#6c757d")}>
            Annulla
          </button>
          <button onClick={salvaRicetta} style={{ ...stileBottone("#28a745"), fontSize: "16px" }}>
            💾 Salva Ricetta
          </button>
        </div>
      </Modal>

      <h3>Ricette Salvate ({ricette.length})</h3>
      {caricamento ? (
        <p>Caricamento...</p>
      ) : ricette.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6c757d", fontStyle: "italic", padding: "60px" }}>
          Nessuna ricetta salvata. Crea la prima! 📝
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
          {ricette.map((ricetta) => {
            const espansa = ricetteEspanse[ricetta.id] ?? false;
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
                <div style={{ padding: "25px", background: "#f8f9fa" }}>
                  <h4 style={{ color: "#007bff", margin: "0 0 15px 0" }}>{ricetta.nome}</h4>
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
                  <h5 style={{ margin: "15px 0 10px 0", color: "#28a745" }}>Ingredienti:</h5>
                  <div style={{ background: "#d4edda", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
                    <strong>{ricetta.ingredienti_nomi}</strong>
                  </div>
                  <button
                    onClick={() => toggleRicetta(ricetta.id)}
                    style={{
                      marginTop: "15px",
                      padding: "10px 20px",
                      background: espansa ? "#6c757d" : "#17a2b8",
                      color: "white",
                      border: "none",
                      borderRadius: "25px",
                      cursor: "pointer",
                      fontSize: "14px",
                      width: "100%",
                      fontWeight: "bold",
                    }}
                  >
                    📖 {espansa ? "Nascondi procedimento" : "Mostra procedimento"}
                  </button>
                </div>

                {espansa && (
                  <div style={{ background: "#f8f9fa", padding: "25px", borderTop: "1px solid #dee2e6" }}>
                    <h5 style={{ marginTop: 0, color: "#495057" }}>Procedimento:</h5>
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

                <div style={{ padding: "15px 25px", background: "#f1f3f4", textAlign: "right" }}>
                  <button onClick={() => eliminaRicetta(ricetta)} style={{ ...stileBottone("#dc3545"), padding: "10px 20px" }}>
                    🗑️ Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Ricette;
