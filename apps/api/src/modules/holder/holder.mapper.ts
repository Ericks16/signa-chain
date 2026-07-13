import type { Holder } from '@signa-chain/types';
import type { HolderEntity } from './entities/holder.entity.js';

export function toHolderDto(entity: HolderEntity): Holder {
  return {
    id: entity.id,
    did: entity.did,
    name: entity.name,
    email: entity.email,
    publicKeyMultibase: entity.publicKeyMultibase,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
