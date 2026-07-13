import type {
  VerifiableCredential,
  VerificationResult,
  VerificationDetail,
  MerkleProof,
} from '@signa-chain/types';
import { verifyBytes } from '../crypto/ed25519.js';
import { extractPublicKey } from '../did/did-key.js';
import { canonicalize } from '../credential/serializer.js';
import { MerkleTree } from '../merkle/tree.js';
import { buildCredentialLeaf } from '../merkle/credential-merkle.js';
import { sha256Bytes } from '../crypto/hash.js';

export interface VerifyCredentialOptions {
  credential: VerifiableCredential;
  merkleProof?: MerkleProof;
  anchoredRootHex?: string;
  isRevoked?: boolean;
  resolveIssuerName?: (did: string) => Promise<string | undefined>;
}

export async function verifyCredential(opts: VerifyCredentialOptions): Promise<VerificationResult> {
  const { credential, merkleProof, anchoredRootHex, isRevoked = false } = opts;
  const details: VerificationDetail[] = [];
  const issuerId = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
  const checkedAt = new Date().toISOString();

  let signatureValid = false;
  let merkleProofValid: boolean | null = null;
  let expired = false;

  const sigCheck = await checkSignature(credential, issuerId);
  signatureValid = sigCheck.passed;
  details.push(sigCheck);

  const expiryCheck = checkExpiry(credential);
  expired = !expiryCheck.passed;
  details.push(expiryCheck);

  details.push({
    check: 'revocation',
    passed: !isRevoked,
    message: isRevoked ? 'Credential has been revoked by the issuer' : 'Credential is not revoked',
  });

  if (merkleProof && anchoredRootHex) {
    const merkleCheck = checkMerkleProof(credential, merkleProof, anchoredRootHex);
    merkleProofValid = merkleCheck.passed;
    details.push(merkleCheck);
  }

  const resolvedIssuerName = opts.resolveIssuerName
    ? await opts.resolveIssuerName(issuerId)
    : undefined;

  const merkleOk = merkleProofValid === null || merkleProofValid === true;

  let status: VerificationResult['status'];
  if (!signatureValid) status = 'invalid_signature';
  else if (isRevoked) status = 'revoked';
  else if (expired) status = 'expired';
  else if (!merkleOk) status = 'merkle_proof_invalid';
  else status = 'valid';

  return {
    status,
    credentialId: credential.id,
    issuerId,
    // exactOptionalPropertyTypes: omit the key entirely when undefined
    ...(resolvedIssuerName !== undefined ? { issuerName: resolvedIssuerName } : {}),
    checkedAt,
    signatureValid,
    merkleProofValid,
    revoked: isRevoked,
    expired,
    details,
  };
}

async function checkSignature(
  credential: VerifiableCredential,
  issuerId: string,
): Promise<VerificationDetail> {
  try {
    if (!credential.proof) {
      return { check: 'signature', passed: false, message: 'No proof found in credential' };
    }

    const { proof, ...credentialWithoutProof } = credential;
    const canonical = canonicalize(credentialWithoutProof);
    const messageBytes = new TextEncoder().encode(canonical);

    const signatureBytes = Buffer.from(proof.proofValue, 'base64url');
    const publicKey = extractPublicKey(issuerId);

    const valid = await verifyBytes(signatureBytes, messageBytes, publicKey);
    return {
      check: 'signature',
      passed: valid,
      message: valid
        ? 'EdDSA signature is valid'
        : 'EdDSA signature verification failed — credential may have been tampered',
    };
  } catch (err) {
    return {
      check: 'signature',
      passed: false,
      message: `Signature check error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function checkExpiry(credential: VerifiableCredential): VerificationDetail {
  if (!credential.expirationDate) {
    return { check: 'expiry', passed: true, message: 'No expiration date set' };
  }
  const expiry = new Date(credential.expirationDate);
  const now = new Date();
  const passed = expiry > now;
  return {
    check: 'expiry',
    passed,
    message: passed
      ? `Credential is valid until ${credential.expirationDate}`
      : `Credential expired on ${credential.expirationDate}`,
  };
}

function checkMerkleProof(
  credential: VerifiableCredential,
  proof: MerkleProof,
  anchoredRootHex: string,
): VerificationDetail {
  try {
    // MerkleTree hashes each raw leaf once more internally, so the leaf actually
    // proven is sha256(buildCredentialLeaf(credential)) — matching buildMerkleBatch().
    const expectedLeaf =
      '0x' + Buffer.from(sha256Bytes(buildCredentialLeaf(credential))).toString('hex');
    if (expectedLeaf !== proof.leaf) {
      return {
        check: 'merkle_proof',
        passed: false,
        message:
          'Merkle proof leaf does not correspond to this credential — the stored proof may belong to a different credential',
      };
    }

    const valid = MerkleTree.verify(proof, anchoredRootHex);
    return {
      check: 'merkle_proof',
      passed: valid,
      message: valid
        ? `Merkle proof valid against on-chain root ${anchoredRootHex.slice(0, 10)}…`
        : 'Merkle proof does not match the anchored root — batch may have been altered',
    };
  } catch (err) {
    return {
      check: 'merkle_proof',
      passed: false,
      message: `Merkle proof check error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
