import { LegalDocumentScreen } from '@/features/legal/components/LegalDocumentScreen';
import { TERMS_OF_SERVICE } from '@/features/legal/content';

export default function TermsScreen() {
  return <LegalDocumentScreen testIDPrefix="legal-terms" document={TERMS_OF_SERVICE} />;
}
