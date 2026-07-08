import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KMS_PROVIDER_TOKEN } from './kms-provider.interface.js';
import { LocalKmsProvider } from './local-kms.provider.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KMS_PROVIDER_TOKEN,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('KMS_PROVIDER');
        if (provider === 'local') {
          return new LocalKmsProvider(config);
        }
        throw new Error(`Unsupported KMS_PROVIDER: "${provider}"`);
      },
    },
  ],
  exports: [KMS_PROVIDER_TOKEN],
})
export class KmsModule {}
