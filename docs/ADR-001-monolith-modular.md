# ADR-001: Monolito modular en lugar de microservicios

**Estado:** Aceptado  
**Fecha:** 2026-07-01

## Contexto

SIGNA CHAIN v1 es un producto nuevo en mercado no validado. El equipo es pequeño.

## Decisión

Un único deployable NestJS con módulos separados por dominio (issuer, credential, verification, anchoring, identity). Cada módulo es autónomo en su directorio pero se compila y despliega como uno.

## Consecuencias positivas

- Cero overhead de red entre módulos en v1
- Un solo conjunto de configs, CI/CD y observabilidad
- Refactorizable a servicios si el tráfico real lo exige (las interfaces de módulo ya delimitan los límites)

## Consecuencias negativas

- Un deploy afecta todos los módulos (aceptable en v1)
- Escalar un módulo implica escalar todo (aceptable hasta ~10k req/min)

## Alternativas descartadas

- Microservicios desde el inicio: coste operativo injustificado para un equipo pequeño sin tráfico validado
- Serverless: cold starts son incompatibles con verificación en tiempo real
