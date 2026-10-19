import { LegalDocumentScreen } from '@/features/legal/components/LegalDocumentScreen';
import { PRIVACY_POLICY } from '@/features/legal/content';

export default function PrivacyScreen() {
  return <LegalDocumentScreen testIDPrefix="legal-privacy" document={PRIVACY_POLICY} />;
}
