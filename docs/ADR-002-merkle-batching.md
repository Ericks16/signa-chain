# ADR-002: Anclaje por lotes con árbol de Merkle

**Estado:** Aceptado  
**Fecha:** 2026-07-01

## Contexto

Anclar cada credencial individualmente en blockchain costaría gas proporcional al volumen de emisión. Eso es inviable a escala incluso moderada.

## Decisión

Se agrupan N hashes de credenciales en un árbol de Merkle y se ancla solo la raíz (`bytes32`) en `CredentialAnchor.sol`. Cada credencial almacena su prueba de Merkle off-chain (array de siblings + path indices). Para verificar una credencial, se recalcula el leaf, se aplica la prueba, y se compara la raíz resultante con la raíz on-chain.

## Consecuencias positivas

- Costo de gas por credencial → 0 cuando N es grande
- La raíz es verificable públicamente y permanentemente
- La prueba de Merkle viaja con la credencial (portabilidad)

## Consecuencias negativas

- Una credencial no puede verificarse on-chain hasta que su batch sea anclado
- Introduce latencia de lote (configurable: cada hora, cada N credenciales, o manual)
- Si se pierde la prueba de Merkle off-chain, la credencial no puede vincularse a la raíz

## Alternativas descartadas

- Anclar cada hash individualmente: costo prohibitivo y no escalable
- No anclar: se pierde el timestamp inmutable como garantía adicional
