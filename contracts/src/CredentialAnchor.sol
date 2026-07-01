// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * CredentialAnchor — registro on-chain mínimo para SIGNA CHAIN.
 *
 * HONESTIDAD TÉCNICA: Este contrato NO prueba que una credencial es verdadera.
 * Provee tres garantías:
 *   1. Un hash (raíz de Merkle) existió sin cambios desde el bloque de anclaje.
 *   2. Un emisor registró una clave pública en un momento determinado.
 *   3. Una credencial fue marcada como revocada por su emisor.
 *
 * La autenticidad depende de la firma EdDSA del emisor, verificada off-chain.
 */
contract CredentialAnchor is
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ─────────────────────────────── Roles ────────────────────────────────── //

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ISSUER_MANAGER_ROLE = keccak256("ISSUER_MANAGER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ─────────────────────────────── State ────────────────────────────────── //

    struct IssuerRecord {
        string did;
        string publicKeyMultibase;
        bool active;
        uint256 registeredAt;
        uint256 deactivatedAt;
    }

    struct AnchorRecord {
        bytes32 merkleRoot;
        uint256 timestamp;
        uint256 blockNumber;
        uint32 credentialCount;
        string batchId;
    }

    mapping(string => IssuerRecord) private _issuers;
    mapping(bytes32 => bool) private _revokedCredentials;
    mapping(uint256 => AnchorRecord) private _anchors;
    mapping(bytes32 => uint256) private _rootToAnchorId; // O(1) root lookup

    uint256 private _anchorCount;

    // ─────────────────────────────── Events ───────────────────────────────── //

    event MerkleRootAnchored(
        uint256 indexed anchorId,
        bytes32 indexed merkleRoot,
        uint32 credentialCount,
        string batchId,
        uint256 timestamp
    );

    event IssuerRegistered(
        string indexed did,
        string publicKeyMultibase,
        address indexed registeredBy
    );

    event IssuerDeactivated(
        string indexed did,
        address indexed deactivatedBy
    );

    event CredentialRevoked(
        bytes32 indexed credentialHash,
        string indexed issuerId,
        address indexed revokedBy
    );

    // ─────────────────────────────── Errors ───────────────────────────────── //

    error IssuerAlreadyRegistered(string did);
    error IssuerNotFound(string did);
    error IssuerNotActive(string did);
    error CredentialAlreadyRevoked(bytes32 credentialHash);
    error InvalidMerkleRoot();
    error EmptyBatchId();
    error InvalidCredentialCount();
    error EmptyDID();
    error EmptyPublicKey();

    // ─────────────────────────────── Init ─────────────────────────────────── //

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) external initializer {
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(ISSUER_MANAGER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    // ─────────────────────────── Merkle Anchoring ─────────────────────────── //

    /**
     * Ancla una raíz de Merkle que representa un lote de credenciales.
     * Solo emisores activos pueden anclar sus propios lotes.
     *
     * @param merkleRoot  Raíz del árbol de Merkle (bytes32)
     * @param credentialCount  Número de credenciales en el lote
     * @param batchId  Identificador del lote (UUID o hash, off-chain)
     * @param issuerId  DID del emisor que ancla
     */
    function anchorBatch(
        bytes32 merkleRoot,
        uint32 credentialCount,
        string calldata batchId,
        string calldata issuerId
    ) external onlyRole(ISSUER_MANAGER_ROLE) whenNotPaused returns (uint256 anchorId) {
        if (merkleRoot == bytes32(0)) revert InvalidMerkleRoot();
        if (bytes(batchId).length == 0) revert EmptyBatchId();
        if (credentialCount == 0) revert InvalidCredentialCount();

        IssuerRecord storage issuer = _issuers[issuerId];
        if (!issuer.active) revert IssuerNotActive(issuerId);

        unchecked {
            anchorId = ++_anchorCount;
        }

        _anchors[anchorId] = AnchorRecord({
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            blockNumber: block.number,
            credentialCount: credentialCount,
            batchId: batchId
        });
        _rootToAnchorId[merkleRoot] = anchorId;

        emit MerkleRootAnchored(anchorId, merkleRoot, credentialCount, batchId, block.timestamp);
    }

    /**
     * Cualquiera puede consultar si una raíz de Merkle está anclada (O(1)).
     * Retorna (true, anchorId) si se encuentra, (false, 0) si no.
     *
     * NOTA: La presencia on-chain solo prueba existencia temporal.
     * La validez de la credencial individual depende de la prueba de Merkle off-chain
     * y la firma EdDSA del emisor.
     */
    function isRootAnchored(bytes32 merkleRoot) external view returns (bool found, uint256 anchorId) {
        anchorId = _rootToAnchorId[merkleRoot];
        found = anchorId != 0;
    }

    function getAnchor(uint256 anchorId) external view returns (AnchorRecord memory) {
        return _anchors[anchorId];
    }

    function anchorCount() external view returns (uint256) {
        return _anchorCount;
    }

    // ───────────────────────────── DID Registry ───────────────────────────── //

    /**
     * Registra un emisor autorizado con su DID y clave pública.
     * Solo ISSUER_MANAGER_ROLE puede registrar emisores.
     */
    function registerIssuer(
        string calldata did,
        string calldata publicKeyMultibase
    ) external onlyRole(ISSUER_MANAGER_ROLE) whenNotPaused {
        if (bytes(did).length == 0) revert EmptyDID();
        if (bytes(publicKeyMultibase).length == 0) revert EmptyPublicKey();
        if (_issuers[did].registeredAt != 0) revert IssuerAlreadyRegistered(did);

        _issuers[did] = IssuerRecord({
            did: did,
            publicKeyMultibase: publicKeyMultibase,
            active: true,
            registeredAt: block.timestamp,
            deactivatedAt: 0
        });

        emit IssuerRegistered(did, publicKeyMultibase, msg.sender);
    }

    /**
     * Desactiva un emisor (sin borrar su historial).
     * Las credenciales emitidas antes de la desactivación siguen siendo verificables.
     */
    function deactivateIssuer(
        string calldata did
    ) external onlyRole(ISSUER_MANAGER_ROLE) whenNotPaused {
        IssuerRecord storage issuer = _issuers[did];
        if (issuer.registeredAt == 0) revert IssuerNotFound(did);
        if (!issuer.active) revert IssuerNotActive(did);

        issuer.active = false;
        issuer.deactivatedAt = block.timestamp;

        emit IssuerDeactivated(did, msg.sender);
    }

    function getIssuer(string calldata did) external view returns (IssuerRecord memory) {
        return _issuers[did];
    }

    function isIssuerActive(string calldata did) external view returns (bool) {
        return _issuers[did].active;
    }

    // ─────────────────────────── Revocation List ──────────────────────────── //

    /**
     * Revoca una credencial por su hash (keccak256 del ID de credencial).
     * Solo el emisor que ancló originalmente puede revocar sus propias credenciales
     * (verificado off-chain por ISSUER_MANAGER_ROLE que actúa como proxy firmado).
     */
    function revokeCredential(
        bytes32 credentialHash,
        string calldata issuerId
    ) external onlyRole(ISSUER_MANAGER_ROLE) whenNotPaused {
        if (_revokedCredentials[credentialHash]) {
            revert CredentialAlreadyRevoked(credentialHash);
        }

        IssuerRecord storage issuer = _issuers[issuerId];
        if (issuer.registeredAt == 0) revert IssuerNotFound(issuerId);

        _revokedCredentials[credentialHash] = true;

        emit CredentialRevoked(credentialHash, issuerId, msg.sender);
    }

    function isRevoked(bytes32 credentialHash) external view returns (bool) {
        return _revokedCredentials[credentialHash];
    }

    // ─────────────────────── Admin / Pause / Upgrade ──────────────────────── //

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    // ─────────────────────────── Version ──────────────────────────────────── //

    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
