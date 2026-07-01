import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import type { CredentialAnchor } from '../typechain-types/index.js';
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('CredentialAnchor', () => {
  let anchor: CredentialAnchor;
  let admin: SignerWithAddress;
  let issuerManager: SignerWithAddress;
  let stranger: SignerWithAddress;

  const ISSUER_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ISSUER_MANAGER_ROLE'));
  const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes('ADMIN_ROLE'));

  const SAMPLE_DID = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuias8sisDArDJF6heW';
  const SAMPLE_PUBKEY = 'z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuias8sisDArDJF6heW';

  beforeEach(async () => {
    [admin, issuerManager, stranger] = await ethers.getSigners() as [
      SignerWithAddress,
      SignerWithAddress,
      SignerWithAddress,
    ];

    const CredentialAnchorFactory = await ethers.getContractFactory('CredentialAnchor');
    const proxy = await upgrades.deployProxy(
      CredentialAnchorFactory,
      [admin.address],
      { kind: 'uups', initializer: 'initialize' },
    );
    await proxy.waitForDeployment();

    anchor = proxy as unknown as CredentialAnchor;

    await anchor.connect(admin).grantRole(ISSUER_MANAGER_ROLE, issuerManager.address);
  });

  // ─── Version ───────────────────────────────────────────────────────────── //

  describe('version()', () => {
    it('returns the correct version string', async () => {
      expect(await anchor.version()).to.equal('1.0.0');
    });
  });

  // ─── Issuer Registration ───────────────────────────────────────────────── //

  describe('registerIssuer()', () => {
    it('registers an issuer and emits IssuerRegistered', async () => {
      await expect(anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY))
        .to.emit(anchor, 'IssuerRegistered')
        .withArgs(SAMPLE_DID, SAMPLE_PUBKEY, issuerManager.address);
    });

    it('marks the issuer as active after registration', async () => {
      await anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY);
      expect(await anchor.isIssuerActive(SAMPLE_DID)).to.be.true;
    });

    it('reverts if issuer already registered', async () => {
      await anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY);
      await expect(
        anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY),
      ).to.be.revertedWithCustomError(anchor, 'IssuerAlreadyRegistered');
    });

    it('reverts for empty DID', async () => {
      await expect(
        anchor.connect(issuerManager).registerIssuer('', SAMPLE_PUBKEY),
      ).to.be.revertedWithCustomError(anchor, 'EmptyDID');
    });

    it('reverts for empty public key', async () => {
      await expect(
        anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, ''),
      ).to.be.revertedWithCustomError(anchor, 'EmptyPublicKey');
    });

    it('reverts if called by non-ISSUER_MANAGER_ROLE', async () => {
      await expect(
        anchor.connect(stranger).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY),
      ).to.be.revertedWithCustomError(anchor, 'AccessControlUnauthorizedAccount');
    });
  });

  // ─── Issuer Deactivation ───────────────────────────────────────────────── //

  describe('deactivateIssuer()', () => {
    beforeEach(async () => {
      await anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY);
    });

    it('deactivates an active issuer', async () => {
      await expect(anchor.connect(issuerManager).deactivateIssuer(SAMPLE_DID))
        .to.emit(anchor, 'IssuerDeactivated')
        .withArgs(SAMPLE_DID, issuerManager.address);
      expect(await anchor.isIssuerActive(SAMPLE_DID)).to.be.false;
    });

    it('reverts for unknown DID', async () => {
      await expect(
        anchor.connect(issuerManager).deactivateIssuer('did:key:unknown'),
      ).to.be.revertedWithCustomError(anchor, 'IssuerNotFound');
    });

    it('reverts if already inactive', async () => {
      await anchor.connect(issuerManager).deactivateIssuer(SAMPLE_DID);
      await expect(
        anchor.connect(issuerManager).deactivateIssuer(SAMPLE_DID),
      ).to.be.revertedWithCustomError(anchor, 'IssuerNotActive');
    });
  });

  // ─── Merkle Anchoring ─────────────────────────────────────────────────── //

  describe('anchorBatch()', () => {
    const ROOT = ethers.keccak256(ethers.toUtf8Bytes('batch-root-1'));
    const BATCH_ID = 'batch-2025-001';
    const COUNT = 10;

    beforeEach(async () => {
      await anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY);
    });

    it('anchors a Merkle root and emits MerkleRootAnchored', async () => {
      const tx = await anchor.connect(admin).anchorBatch(ROOT, COUNT, BATCH_ID, SAMPLE_DID);
      const receipt = await tx.wait();
      if (!receipt) throw new Error('No receipt');
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      if (!block) throw new Error('No block');
      await expect(tx)
        .to.emit(anchor, 'MerkleRootAnchored')
        .withArgs(1, ROOT, COUNT, BATCH_ID, block.timestamp);
    });

    it('increments anchor count', async () => {
      expect(await anchor.anchorCount()).to.equal(0);
      await anchor.connect(admin).anchorBatch(ROOT, COUNT, BATCH_ID, SAMPLE_DID);
      expect(await anchor.anchorCount()).to.equal(1);
    });

    it('stores anchor data retrievable by id', async () => {
      await anchor.connect(admin).anchorBatch(ROOT, COUNT, BATCH_ID, SAMPLE_DID);
      const record = await anchor.getAnchor(1);
      expect(record.merkleRoot).to.equal(ROOT);
      expect(record.credentialCount).to.equal(COUNT);
      expect(record.batchId).to.equal(BATCH_ID);
    });

    it('isRootAnchored returns true for anchored root', async () => {
      await anchor.connect(admin).anchorBatch(ROOT, COUNT, BATCH_ID, SAMPLE_DID);
      const [found, id] = await anchor.isRootAnchored(ROOT);
      expect(found).to.be.true;
      expect(id).to.equal(1);
    });

    it('isRootAnchored returns false for unknown root', async () => {
      const [found] = await anchor.isRootAnchored(ethers.ZeroHash);
      expect(found).to.be.false;
    });

    it('reverts for zero root', async () => {
      await expect(
        anchor.connect(admin).anchorBatch(ethers.ZeroHash, COUNT, BATCH_ID, SAMPLE_DID),
      ).to.be.revertedWithCustomError(anchor, 'InvalidMerkleRoot');
    });

    it('reverts for empty batch id', async () => {
      await expect(
        anchor.connect(admin).anchorBatch(ROOT, COUNT, '', SAMPLE_DID),
      ).to.be.revertedWithCustomError(anchor, 'EmptyBatchId');
    });

    it('reverts for zero credential count', async () => {
      await expect(
        anchor.connect(admin).anchorBatch(ROOT, 0, BATCH_ID, SAMPLE_DID),
      ).to.be.revertedWithCustomError(anchor, 'InvalidCredentialCount');
    });

    it('reverts if issuer is not active', async () => {
      await anchor.connect(issuerManager).deactivateIssuer(SAMPLE_DID);
      await expect(
        anchor.connect(admin).anchorBatch(ROOT, COUNT, BATCH_ID, SAMPLE_DID),
      ).to.be.revertedWithCustomError(anchor, 'IssuerNotActive');
    });
  });

  // ─── Revocation ───────────────────────────────────────────────────────── //

  describe('revokeCredential()', () => {
    const CRED_HASH = ethers.keccak256(ethers.toUtf8Bytes('urn:uuid:test-credential-id'));

    beforeEach(async () => {
      await anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY);
    });

    it('revokes a credential and emits CredentialRevoked', async () => {
      await expect(anchor.connect(issuerManager).revokeCredential(CRED_HASH, SAMPLE_DID))
        .to.emit(anchor, 'CredentialRevoked')
        .withArgs(CRED_HASH, SAMPLE_DID, issuerManager.address);
    });

    it('isRevoked returns true after revocation', async () => {
      await anchor.connect(issuerManager).revokeCredential(CRED_HASH, SAMPLE_DID);
      expect(await anchor.isRevoked(CRED_HASH)).to.be.true;
    });

    it('isRevoked returns false before revocation', async () => {
      expect(await anchor.isRevoked(CRED_HASH)).to.be.false;
    });

    it('reverts on double revocation', async () => {
      await anchor.connect(issuerManager).revokeCredential(CRED_HASH, SAMPLE_DID);
      await expect(
        anchor.connect(issuerManager).revokeCredential(CRED_HASH, SAMPLE_DID),
      ).to.be.revertedWithCustomError(anchor, 'CredentialAlreadyRevoked');
    });

    it('reverts for unknown issuer', async () => {
      await expect(
        anchor.connect(issuerManager).revokeCredential(CRED_HASH, 'did:key:unknown'),
      ).to.be.revertedWithCustomError(anchor, 'IssuerNotFound');
    });
  });

  // ─── Pause ────────────────────────────────────────────────────────────── //

  describe('pause/unpause', () => {
    it('pauses and blocks state-changing operations', async () => {
      await anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY);
      await anchor.connect(admin).pause();
      await expect(
        anchor.connect(issuerManager).registerIssuer('did:key:other', SAMPLE_PUBKEY),
      ).to.be.revertedWithCustomError(anchor, 'EnforcedPause');
    });

    it('unpauses and allows operations again', async () => {
      await anchor.connect(admin).pause();
      await anchor.connect(admin).unpause();
      await expect(
        anchor.connect(issuerManager).registerIssuer(SAMPLE_DID, SAMPLE_PUBKEY),
      ).to.not.be.reverted;
    });

    it('reverts pause if called by non-admin', async () => {
      await expect(
        anchor.connect(stranger).pause(),
      ).to.be.revertedWithCustomError(anchor, 'AccessControlUnauthorizedAccount');
    });
  });

  // ─── UUPS Upgrade ─────────────────────────────────────────────────────── //

  describe('UUPS upgrade authorization', () => {
    it('reverts upgrade from non-upgrader', async () => {
      const UPGRADER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('UPGRADER_ROLE'));
      const CredentialAnchorV2 = await ethers.getContractFactory('CredentialAnchor');
      await expect(
        upgrades.upgradeProxy(await anchor.getAddress(), CredentialAnchorV2.connect(stranger)),
      ).to.be.reverted;
    });
  });

  // ─── Helpers ──────────────────────────────────────────────────────────── //

  async function getLastBlockTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock('latest');
    if (!block) throw new Error('No block found');
    return block.timestamp;
  }
});
