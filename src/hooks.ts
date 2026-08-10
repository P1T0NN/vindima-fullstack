// HELPERS
import { applyDefaultValidationMessages } from '@/shared/features/validations/config/validationsConfig';

// Universal hooks run once per runtime (SSR and browser), before any schema `.parse` —
// the one place to swap zod's default error strings for our human, code-based ones.
applyDefaultValidationMessages();
