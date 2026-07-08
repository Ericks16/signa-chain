import type { Issuer } from '@signa-chain/types';
import type { IssuerEntity } from './entities/issuer.entity.js';

export function toIssuerDto(entity: IssuerEntity): Issuer {
  return {
    id: entity.id,
    did: entity.did,
    name: entity.name,
    legalName: entity.legalName,
    country: entity.country,
    ...(entity.website !== null ? { website: entity.website } : {}),
    publicKeyMultibase: entity.publicKeyMultibase,
    onChainRegistered: entity.onChainRegistered,
    ...(entity.registrationTxHash !== null
      ? { registrationTxHash: entity.registrationTxHash }
      : {}),
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
