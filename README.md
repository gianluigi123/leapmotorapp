# Leapmotor T03 Web Manager

Questa è una webapp per gestire la tua Leapmotor T03, visualizzando autonomia e stato della batteria.

## Struttura del Progetto
- `backend/`: API in FastAPI (Python)
- `frontend/`: Interfaccia in React (TypeScript)

## Requisiti
- Python 3.10+
- Node.js & npm

## Configurazione

### 1. Backend
Entra nella cartella `backend` e crea un file `.env` partendo da `.env.example`:
```bash
cd backend
cp .env.example .env
```
Modifica il file `.env` con la tua email e password dell'app Leapmotor.

### 2. Frontend
Entra nella cartella `frontend` e installa le dipendenze:
```bash
cd frontend
npm install
```

## Come Avviare l'App

### Avviare il Backend
Dalla cartella `backend`:
```bash
python main.py
```
Il server sarà attivo su `http://localhost:8000`.

### Avvio Rapido (Consigliato)
Ho aggiunto un file batch per gestire l'applicazione in modo semplice. Dalla cartella principale del progetto, fai doppio clic su:
`gestisci_app.bat`

Questo file:
1. Apre il Backend e il Frontend in finestre separate (ridotte a icona).
2. Mantiene aperta una finestra di controllo.
3. Quando premi un tasto nella finestra di controllo, chiude automaticamente entrambi i servizi.

### Avviare manualmente i componenti
#### Avviare il Backend
Dalla cartella `backend`:
```bash
python main.py
```
Il server sarà attivo su `http://localhost:8000`.

#### Avviare il Frontend
Dalla cartella `frontend`:
```bash
npm run dev
```
L'app sarà accessibile su `http://localhost:5173`.

## Note sulla Sicurezza
- I certificati necessari (`app.crt`, `app.key`) sono già inclusi nella cartella `backend/certs/`.
- Non condividere il file `.env` con nessuno.
