import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Modal from "./Modal";
import { UNITA } from "../utils/unita";
import { messaggioErrore } from "../utils/errori";

interface Ingrediente {
  id: number;
  nome: string;
  quantita: number;
  unita: string;
  descrizione: string | null;
  stato: "OK" | "POCO" | "ESAURITO";
  puoEliminare: boolean;
}

/** Valori del form: un unico oggetto per creazione e modifica. */
interface DatiForm {
  nome: string;
  quantita: string;
  unita: string;
  descrizione: string;
}

const FORM_VUOTO: DatiForm = { nome: "", quantita: "", unita: "", descrizione: "" };

const COLORI_STATO: Record<Ingrediente["stato"], string> = {
  OK: "#28a745",
  POCO: "#fd7e14",
  ESAURITO: "#dc3545",
};

const stileCampo: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  border: "1px solid #ddd",
  borderRadius: "6px",
};

const stileBottone = (colore: string): React.CSSProperties => ({
  padding: "12px 24px",
  background: colore,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
});

const Ingredienti: React.FC = () => {
  const [ingredienti, setIngredienti] = useState<Ingrediente[]>([]);
  const [caricamento, setCaricamento] = useState(true);
  const [mostraModale, setMostraModale] = useState(false);
  // null = nuovo ingrediente; un id = modifica di un ingrediente esistente
  const [idInModifica, setIdInModifica] = useState<number | null>(null);
  const [form, setForm] = useState<DatiForm>(FORM_VUOTO);

  // Ricarica i dati dal backend: si usa al primo caricamento e dopo ogni modifica
  const caricaIngredienti = useCallback(async () => {
    try {
      const res = await axios.get<Ingrediente[]>("/api/ingredienti");
      setIngredienti(res.data);
    } catch (err) {
      alert("Errore nel caricamento: " + messaggioErrore(err));
    } finally {
      setCaricamento(false);
    }
  }, []);

  useEffect(() => {
    caricaIngredienti();
  }, [caricaIngredienti]);

  const aggiornaCampo = (campo: keyof DatiForm, valore: string) =>
    setForm((prec) => ({ ...prec, [campo]: valore }));

  const apriNuovo = () => {
    setIdInModifica(null);
    setForm(FORM_VUOTO);
    setMostraModale(true);
  };

  const apriModifica = (ing: Ingrediente) => {
    setIdInModifica(ing.id);
    setForm({
      nome: ing.nome,
      quantita: String(ing.quantita),
      unita: ing.unita,
      descrizione: ing.descrizione ?? "",
    });
    setMostraModale(true);
  };

  const chiudiModale = () => {
    setMostraModale(false);
    setForm(FORM_VUOTO);
    setIdInModifica(null);
  };

  const salva = async () => {
    const quantita = Number(form.quantita);
    if (!form.nome.trim() || !form.unita || form.quantita === "" || quantita < 0) {
      alert("Nome, quantità (0 o più) e unità sono obbligatori");
      return;
    }
    const dati = { ...form, quantita };
    try {
      if (idInModifica === null) {
        await axios.post("/api/ingredienti", dati);
      } else {
        await axios.put(`/api/ingredienti/${idInModifica}`, dati);
      }
      chiudiModale();
      await caricaIngredienti();
    } catch (err) {
      alert("Errore nel salvataggio: " + messaggioErrore(err));
    }
  };

  const elimina = async (ing: Ingrediente) => {
    if (!window.confirm(`Eliminare "${ing.nome}"?`)) return;
    try {
      await axios.delete(`/api/ingredienti/${ing.id}`);
      await caricaIngredienti();
    } catch (err) {
      alert("Errore nell'eliminazione: " + messaggioErrore(err));
    }
  };

  return (
    <div>
      <h2>🥬 Gestione Ingredienti</h2>

      <button onClick={apriNuovo} style={{ ...stileBottone("#28a745"), padding: "15px 30px", fontSize: "16px", marginBottom: "30px" }}>
        ➕ Aggiungi Ingrediente
      </button>

      <Modal
        isOpen={mostraModale}
        onClose={chiudiModale}
        title={idInModifica === null ? "🥬 Nuovo Ingrediente" : "✏️ Modifica / Rifornisci"}
      >
        <input
          placeholder="Nome (es. Farina)"
          value={form.nome}
          onChange={(e) => aggiornaCampo("nome", e.target.value)}
          style={{ ...stileCampo, marginBottom: "15px" }}
        />
        <div style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="Quantità in scorta"
            value={form.quantita}
            onChange={(e) => aggiornaCampo("quantita", e.target.value)}
            style={{ ...stileCampo, flex: 1 }}
          />
          <select
            value={form.unita}
            onChange={(e) => aggiornaCampo("unita", e.target.value)}
            style={{ ...stileCampo, width: "140px" }}
          >
            <option value="">Unità</option>
            {UNITA.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <textarea
          placeholder="Descrizione (opzionale)"
          value={form.descrizione}
          onChange={(e) => aggiornaCampo("descrizione", e.target.value)}
          style={{ ...stileCampo, marginBottom: "20px", minHeight: "80px", resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={chiudiModale} style={stileBottone("#6c757d")}>
            Annulla
          </button>
          <button onClick={salva} style={stileBottone("#28a745")}>
            💾 Salva
          </button>
        </div>
      </Modal>

      <h3>Ingredienti ({ingredienti.length})</h3>
      {caricamento ? (
        <p>Caricamento...</p>
      ) : ingredienti.length === 0 ? (
        <p style={{ color: "#6c757d", fontStyle: "italic" }}>
          Nessun ingrediente. Aggiungi il primo!
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
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
              <h4 style={{ margin: "0 0 10px 0", color: "#007bff" }}>{ing.nome}</h4>
              <p style={{ fontSize: "18px", margin: "5px 0", fontWeight: "bold" }}>
                {ing.quantita} {ing.unita}{" "}
                <span
                  style={{
                    background: COLORI_STATO[ing.stato],
                    color: "white",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "13px",
                  }}
                >
                  {ing.stato}
                </span>
              </p>
              {ing.descrizione && (
                <p style={{ color: "#666", fontStyle: "italic" }}>{ing.descrizione}</p>
              )}
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button onClick={() => apriModifica(ing)} style={stileBottone("#17a2b8")}>
                  ✏️ Modifica
                </button>
                <button
                  onClick={() => elimina(ing)}
                  disabled={!ing.puoEliminare}
                  title={ing.puoEliminare ? "Elimina" : "Usato in una ricetta: non eliminabile"}
                  style={{
                    ...stileBottone(ing.puoEliminare ? "#dc3545" : "#6c757d"),
                    cursor: ing.puoEliminare ? "pointer" : "not-allowed",
                    opacity: ing.puoEliminare ? 1 : 0.7,
                  }}
                >
                  {ing.puoEliminare ? "🗑️ Elimina" : "🔒 Bloccato"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Ingredienti;
