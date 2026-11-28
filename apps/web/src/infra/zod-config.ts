import { z } from 'zod';

/**
 * The Content-Security-Policy forbids eval (script-src 'self'). zod probes for `new Function`
 * to compile fast object parsers; the probe is caught, but browsers still report the blocked
 * eval as a console error (Firefox does). Interpreted parsing is fast enough for our forms.
 * Imported first in main.tsx, before any schema parses.
 */
z.config({ jitless: true });
