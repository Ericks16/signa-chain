# Modelo de Confianza — SIGNA CHAIN

## Flujo principal

```
Emisor (EPN) → firma EdDSA → Credencial VC 2.0
                    ↓
             Titular guarda VC + MerkleProof
                    ↓
         Verificador recibe VC del titular
                    ↓
    1. Resuelve DID del emisor → clave pública (on-chain o DID doc)
    2. Verifica firma EdDSA sobre el payload canónico
    3. Verifica prueba de Merkle contra raíz anclada on-chain
    4. Consulta estado de revocación on-chain
    5. Comprueba fecha de expiración
```

## De dónde viene la confianza (honestidad epistémica)

| Afirmación | Fuente de confianza | Lo que la blockchain aporta |
|---|---|---|
| "Este diploma fue emitido por la EPN" | Firma EdDSA con clave privada de la EPN | Clave pública registrada on-chain (DID) |
| "El diploma no fue modificado" | Firma criptográfica + hash en Merkle | Raíz de Merkle inmutable con timestamp |
| "El diploma no fue revocado" | Lista de revocación on-chain | Estado inmutable y auditable |
| "El diploma existía antes de fecha X" | Timestamp del bloque de anclaje | Prueba de existencia temporal |

**Lo que la blockchain NO prueba:** que el contenido del diploma es verdadero (eso lo garantiza la firma del emisor). La blockchain es el directorio de claves públicas y el registro de estado, no el árbitro de veracidad.

## Marco legal (Ecuador)

La firma EdDSA de SIGNA CHAIN NO equivale legalmente a una firma electrónica reconocida según la Ley de Comercio Electrónico de Ecuador. SIGNA CHAIN complementa, pero no reemplaza, las firmas acreditadas por entidades como el Banco Central o Security Data.
