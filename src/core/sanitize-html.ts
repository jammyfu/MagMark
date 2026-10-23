import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const purify =
  typeof window !== 'undefined' && typeof (DOMPurify as any).sanitize === 'function'
    ? DOMPurify
    : (DOMPurify as any)(new JSDOM('').window);

/** Sanitize document content before previewing or copying it on the host site. */
export function sanitizeDocumentHtml(html: string): string {
  return purify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
    FORBID_ATTR: ['srcdoc'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    SANITIZE_NAMED_PROPS: true,
  });
}

