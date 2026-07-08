import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateEd25519KeyPair, signBytes } from '@signa-chain/vc-sdk';
import type { KmsProvider } from './kms-provider.interface.js';

interface EncryptedKeyFile {
  iv: string;
  authTag: string;
  ciphertext: string;
  publicKey: string;
}

@Injectable()
export class LocalKmsProvider implements KmsProvider {
  private readonly logger = new Logger(LocalKmsProvider.name);
  private readonly keysPath: string;
  private readonly masterKey: Buffer;

  constructor(config: ConfigService) {
    this.keysPath = config.get<string>('KMS_LOCAL_KEYS_PATH') ?? './keys';

    const masterKeyBase64 = config.get<string>('KMS_LOCAL_MASTER_KEY');
    if (!masterKeyBase64) {
      throw new Error('KMS_LOCAL_MASTER_KEY is required when KMS_PROVIDER=local');
    }

    const masterKey = Buffer.from(masterKeyBase64, 'base64');
    if (masterKey.length !== 32) {
      throw new Error('KMS_LOCAL_MASTER_KEY must decode to exactly 32 bytes (AES-256)');
    }

    this.masterKey = masterKey;
  }

  async generateKeyPair(keyId: string): Promise<{ publicKey: Uint8Array }> {
    const filePath = this.keyFilePath(keyId);

    if (await this.fileExists(filePath)) {
      throw new Error(`KMS key "${keyId}" already exists — refusing to overwrite`);
    }

    const { privateKey, publicKey } = await generateEd25519KeyPair();

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(privateKey), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const file: EncryptedKeyFile = {
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      publicKey: Buffer.from(publicKey).toString('base64'),
    };

    await mkdir(this.keysPath, { recursive: true });
    await writeFile(filePath, JSON.stringify(file), { encoding: 'utf-8', mode: 0o600 });

    this.logger.log(`Generated KMS key "${keyId}"`);
    return { publicKey };
  }

  async sign(keyId: string, message: Uint8Array): Promise<Uint8Array> {
    const filePath = this.keyFilePath(keyId);
    const raw = await readFile(filePath, 'utf-8');
    const file = JSON.parse(raw) as EncryptedKeyFile;

    const iv = Buffer.from(file.iv, 'base64');
    const authTag = Buffer.from(file.authTag, 'base64');
    const ciphertext = Buffer.from(file.ciphertext, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);
    const privateKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    try {
      return await signBytes(message, privateKey);
    } finally {
      privateKey.fill(0);
    }
  }

  private keyFilePath(keyId: string): string {
    return join(this.keysPath, `${keyId}.json`);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
