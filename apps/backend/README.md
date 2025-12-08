# MediCare Backend (Nest.js)

Tento adresář obsahuje základ backendu postavený na Nest.js.

## Rychlý start

```bash
npm run setup
npm run dev
```

- API poběží na `http://localhost:3000`
- Health endpoint: `GET /health`
- Swagger dokumentace: `http://localhost:3000/api-docs`

## Struktura

- `src/main.ts` – bootstrap aplikace, bezpečnostní middlewary, Swagger.
- `src/app.module.ts` – hlavní modul s konfigurací loggeru a připojením k MongoDB.
- `src/health` – jednoduchý health check modul.
- `src/common/logger.service.ts` – ukázkový wrapper nad Pino loggerem.

## Testy

- `npm run test` – unit testy přes Jest.
- `npm run test:e2e` – end-to-end testy (Supertest).
