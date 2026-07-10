import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, JsonRpcProvider, Wallet, type ContractTransactionResponse } from 'ethers';

const CREDENTIAL_ANCHOR_ABI = [
  'function registerIssuer(string did, string publicKeyMultibase) external',
];

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private contract: Contract | null | undefined;

  constructor(private readonly config: ConfigService) {}

  /**
   * CredentialAnchor isn't deployed on every environment yet, so this stays
   * undefined→null until CREDENTIAL_ANCHOR_ADDRESS/CREDENTIAL_ANCHOR_SIGNER_KEY are
   * both set — callers treat a null contract as "anchoring not configured", not an error.
   */
  private getContract(): Contract | null {
    if (this.contract !== undefined) {
      return this.contract;
    }

    const address = this.config.get<string>('CREDENTIAL_ANCHOR_ADDRESS');
    const signerKey = this.config.get<string>('CREDENTIAL_ANCHOR_SIGNER_KEY');
    if (!address || !signerKey) {
      this.contract = null;
      return this.contract;
    }

    const rpcUrl = this.config.get<string>('POLYGON_AMOY_RPC') ?? 'https://rpc-amoy.polygon.technology';
    const provider = new JsonRpcProvider(rpcUrl);
    const signer = new Wallet(signerKey, provider);
    this.contract = new Contract(address, CREDENTIAL_ANCHOR_ABI, signer);
    return this.contract;
  }

  /**
   * Registers an issuer's DID + public key on CredentialAnchor.registerIssuer(). The
   * signer must hold ISSUER_MANAGER_ROLE on the deployed contract (the deploy account
   * gets it automatically via initialize()). Returns the tx hash, or null when anchoring
   * isn't configured — callers persist that on IssuerEntity (onChainRegistered/registrationTxHash).
   */
  async registerIssuerOnChain(did: string, publicKeyMultibase: string): Promise<string | null> {
    const contract = this.getContract();
    if (!contract) {
      this.logger.warn(
        `registerIssuerOnChain skipped for ${did} — CredentialAnchor is not configured ` +
          '(CREDENTIAL_ANCHOR_ADDRESS / CREDENTIAL_ANCHOR_SIGNER_KEY).',
      );
      return null;
    }

    const registerIssuer = contract.getFunction('registerIssuer');
    const tx = (await registerIssuer(did, publicKeyMultibase)) as ContractTransactionResponse;
    const receipt = await tx.wait();
    if (!receipt) {
      throw new Error(`registerIssuer transaction for ${did} did not produce a receipt`);
    }

    this.logger.log(`Issuer ${did} registered on-chain — tx ${receipt.hash}`);
    return receipt.hash;
  }
}
