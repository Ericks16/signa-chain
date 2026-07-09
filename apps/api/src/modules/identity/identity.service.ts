import { Injectable } from '@nestjs/common';
import { resolveDid } from '@signa-chain/vc-sdk';
import type { DIDResolutionResult } from '@signa-chain/types';

@Injectable()
export class IdentityService {
  resolve(did: string): DIDResolutionResult {
    return resolveDid(did);
  }
}
