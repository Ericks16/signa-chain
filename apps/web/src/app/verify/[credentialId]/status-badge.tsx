import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import type { VerificationStatus } from '@signa-chain/types';

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; description: string; colorClass: string; Icon: typeof CheckCircle2 }
> = {
  valid: {
    label: 'Válida',
    description: 'La firma es auténtica y la credencial no ha sido revocada.',
    colorClass: 'text-success border-success/30 bg-success/10',
    Icon: CheckCircle2,
  },
  revoked: {
    label: 'Revocada',
    description: 'El emisor revocó esta credencial. Ya no debe considerarse válida.',
    colorClass: 'text-danger border-danger/30 bg-danger/10',
    Icon: XCircle,
  },
  expired: {
    label: 'Expirada',
    description: 'Esta credencial superó su fecha de expiración.',
    colorClass: 'text-warning border-warning/30 bg-warning/10',
    Icon: Clock,
  },
  invalid_signature: {
    label: 'Firma inválida',
    description: 'La firma no corresponde al contenido — la credencial pudo haber sido alterada.',
    colorClass: 'text-danger border-danger/30 bg-danger/10',
    Icon: XCircle,
  },
  tampered: {
    label: 'Alterada',
    description: 'El contenido de la credencial no coincide con lo firmado por el emisor.',
    colorClass: 'text-danger border-danger/30 bg-danger/10',
    Icon: XCircle,
  },
  merkle_proof_invalid: {
    label: 'Prueba Merkle inválida',
    description: 'La credencial no pudo anclarse contra el registro on-chain esperado.',
    colorClass: 'text-danger border-danger/30 bg-danger/10',
    Icon: XCircle,
  },
  issuer_not_found: {
    label: 'Emisor no encontrado',
    description: 'No se pudo resolver el emisor de esta credencial.',
    colorClass: 'text-warning border-warning/30 bg-warning/10',
    Icon: AlertTriangle,
  },
};

export function StatusBadge({ status }: { status: VerificationStatus }): React.ReactElement {
  const { label, description, colorClass, Icon } = STATUS_CONFIG[status];

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${colorClass}`}>
      <Icon className="mt-0.5 h-6 w-6 shrink-0" />
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}
