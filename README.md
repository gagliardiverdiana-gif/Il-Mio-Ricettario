<div align="center">

# 📖 Il Mio Ricettario

**Gestione di ricette e ingredienti con scorte sempre coerenti.**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

</div>

---

## 📖 Descrizione

**Il Mio Ricettario** è un'applicazione web full stack per gestire ricette e ingredienti. Un frontend React consuma un'API REST in Node.js/Express, che salva i dati su MySQL.

Il cuore del progetto è la **coerenza dei dati**: quando si crea una ricetta, gli ingredienti vengono scalati dalle scorte; quando la si elimina, le scorte vengono ripristinate. Tutto avviene dentro transazioni, quindi il database non resta mai a metà di un'operazione.

## ✨ Funzionalità

- 🍝 **Ricette:** elenco con gli ingredienti usati, creazione con quantità e unità di misura, eliminazione con ripristino delle scorte
- 🥕 **Ingredienti:** elenco con scorta e stato (OK, POCO, ESAURITO), aggiunta, modifica e rifornimento, eliminazione bloccata se l'ingrediente è usato in una ricetta
- 📦 **Scorte automatiche:** la creazione di una ricetta scala le quantità, con conversione tra unità compatibili (es. kg → g), e viene rifiutata se la scorta non basta; l'eliminazione le ripristina esattamente
- 🔒 **Transazioni con lock:** `SELECT ... FOR UPDATE`, controlli prima delle scritture, `COMMIT`/`ROLLBACK`
- 🛡️ **API robuste:** validazione degli input e codici HTTP chiari (400, 404, 409)
- 🧭 **Interfaccia guidata:** nel form della ricetta compaiono solo le unità compatibili con la scorta e non si può aggiungere due volte lo stesso ingrediente

## 🛠️ Tecnologie

| Livello | Strumenti |
|---|---|
| **Frontend** | React, TypeScript, React Router, Axios, CSS |
| **Backend** | Node.js, Express 5, TypeScript, dotenv |
| **Database** | MySQL 8+ (driver `mysql2`) |

## 📁 Struttura del progetto

```
Il-Mio-Ricettario/
├── backend/
│   ├── src/
│   │   ├── server-principale.ts  # Avvio del server e rotte generali
│   │   ├── api-ricette.ts        # Rotte delle ricette (transazioni)
│   │   ├── api-ingredienti.ts    # Rotte degli ingredienti
│   │   ├── connessione-db.ts     # Pool di connessioni e helper delle transazioni
│   │   ├── errori.ts             # Errori HTTP e middleware centrale
│   │   └── unita.ts              # Conversione delle unità di misura
│   ├── database.sql              # Creazione di database e tabelle
│   └── .env.example              # Modello delle variabili d'ambiente
└── frontend/
    └── src/
        ├── componenti/           # Home, Ricette, Ingredienti, Modal
        ├── utils/                # Unità di misura e messaggi di errore
        └── styles/               # Fogli di stile
```

## 🚀 Come avviare il progetto

**Requisiti:** Node.js 18+, MySQL 8.0.16+ in esecuzione, Git.

**1. Clona il repository**

```bash
git clone https://github.com/gagliardiverdiana-gif/Il-Mio-Ricettario.git
cd Il-Mio-Ricettario
```

**2. Crea il database**

```bash
mysql -u TUO_UTENTE -p < backend/database.sql
```

Lo script crea il database `Ricettario_cucina` con le tabelle `ricette`, `ingredienti` e `ricetta_ingrediente`.

**3. Avvia il backend**

```bash
cd backend
npm install
cp .env.example .env    # poi inserisci i tuoi dati di accesso a MySQL
npm run dev
```

Il server parte su `http://localhost:3001`.

**4. Avvia il frontend** (in un secondo terminale)

```bash
cd frontend
npm install
npm start
```

L'app si apre su `http://localhost:3000`.

## 🔌 API

| Metodo | Rotta | Descrizione |
|---|---|---|
| GET | `/api/ingredienti` | Elenco con stato delle scorte e `puoEliminare` |
| GET | `/api/ingredienti/:id` | Dettaglio |
| POST | `/api/ingredienti` | Creazione (la quantità è la scorta iniziale) |
| PUT | `/api/ingredienti/:id` | Modifica o rifornimento (409 se si cambia unità in modo incompatibile su un ingrediente in uso) |
| DELETE | `/api/ingredienti/:id` | Eliminazione (409 se usato in una ricetta) |
| GET | `/api/ricette` | Elenco con riepilogo ingredienti |
| POST | `/api/ricette` | Creazione con scarico scorte in transazione (nome, istruzioni e difficoltà obbligatori) |
| PUT | `/api/ricette/:id` | Modifica di nome, istruzioni e difficoltà |
| DELETE | `/api/ricette/:id` | Eliminazione con ripristino scorte in transazione |
| GET | `/api/stats` | Conteggio ricette e ingredienti |
| GET | `/api/health` | Stato del server e del database |

Gli errori hanno sempre la forma `{ "errore": "messaggio" }`: 400 dati non validi, 404 risorsa inesistente, 409 conflitto (scorta insufficiente, ingrediente in uso), 500 errore interno senza dettagli tecnici.

## 🗺️ Sviluppi futuri

- [ ] Ricerca e filtri
- [ ] Modifica degli ingredienti di una ricetta con ricalcolo delle scorte
- [ ] Migrazione del frontend a Vite
- [ ] Test automatici

## 👥 Autori

Progetto sviluppato in coppia durante un corso di formazione, da **[Verdiana Gagliardi](https://github.com/gagliardiverdiana-gif)** e **[antozito2845-design](https://github.com/antozito2845-design)**.
