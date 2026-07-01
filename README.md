# SIGNA CHAIN

> Verifica cualquier diploma o certificado en segundos, sin llamar a la universidad. El emisor lo firma una vez; cualquiera lo comprueba para siempre.

## ¿Qué es?

Sistema de credenciales verificables (W3C VC 2.0) donde:
1. Un **emisor** (ej. EPN) firma criptográficamente un diploma con EdDSA/Ed25519
2. El **titular** guarda esa credencial firmada
3. Cualquier **verificador** comprueba la firma matemáticamente — sin llamar al emisor

La blockchain (Polygon) guarda solo claves públicas, raíces de Merkle y estados de revocación. **No guarda datos personales.**

## Stack

| Capa | Tecnología |
|------|-----------|
| API | NestJS + TypeScript (monolito modular) |
| Frontend | Next.js 15 + TailwindCSS v4 + Framer Motion |
| Base de datos | PostgreSQL |
| Blockchain | Solidity 0.8.27 en Polygon Amoy (testnet) |
| SDK | `@signa-chain/vc-sdk` — EdDSA, DIDs, Merkle, verificación |

## Estructura

```
signa-chain/
├── apps/api          # NestJS API
├── apps/web          # Next.js frontend
├── contracts/        # CredentialAnchor.sol + Hardhat
├── packages/
│   ├── types         # Tipos compartidos
│   ├── vc-sdk        # SDK de credenciales verificables
│   └── ui            # Componentes UI
└── docs/             # ADRs, modelo de confianza
```

## Inicio rápido

### Requisitos
- Node.js >= 20
- pnpm >= 9

```bash
# Instalar dependencias
pnpm install

# Tests
pnpm --filter @signa-chain/vc-sdk test    # 25 tests SDK
pnpm --filter @signa-chain/contracts test  # 28 tests contrato

# Dev
pnpm dev
```

### Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```bash
cp .env.example .env
cp contracts/.env.example contracts/.env.local
```

**NUNCA** comitees archivos `.env` con valores reales.

## Despliegue

### API → Railway

1. Crea un proyecto en [railway.app](https://railway.app)
2. Conecta este repositorio
3. Railway detecta `railway.json` automáticamente
4. Añade las variables de entorno desde `.env.example` en el panel de Railway
5. El deploy se activa en cada push a `main`

Variables obligatorias en Railway:
```
NODE_ENV=production
DATABASE_URL=          # PostgreSQL connection string (Railway lo provee)
JWT_SECRET=            # openssl rand -base64 64
ALLOWED_ORIGINS=       # URL de tu frontend en Vercel
POLYGON_AMOY_RPC=      # RPC endpoint
CREDENTIAL_ANCHOR_ADDRESS= # Dirección del contrato desplegado
```

### Frontend → Vercel

1. Importa el repo en [vercel.com/new](https://vercel.com/new)
2. Vercel detecta Next.js automáticamente
3. **Root Directory:** `apps/web`
4. Añade en Environment Variables:
```
NEXT_PUBLIC_API_URL=   # URL de tu API en Railway
```

### Contrato → Polygon Amoy

```bash
cd contracts
cp .env.example .env.local
# Rellena DEPLOYER_PRIVATE_KEY y POLYGON_AMOY_RPC
npx hardhat run scripts/deploy.ts --network amoy
# Guarda la dirección del proxy → CREDENTIAL_ANCHOR_ADDRESS en Railway
```

> ⚠️ La clave del deployer es solo para el deploy inicial. En producción, las claves de los emisores deben gestionarse via KMS/HSM.

## Seguridad

Ver [SECURITY.md](./SECURITY.md) para reportar vulnerabilidades y los principios de seguridad del sistema.

## Docs técnicas

- [ADR-001: Monolito modular](./docs/ADR-001-monolith-modular.md)
- [ADR-002: Merkle batching](./docs/ADR-002-merkle-batching.md)
- [Modelo de confianza](./docs/trust-model.md)
