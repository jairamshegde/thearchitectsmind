import type { APIRoute } from 'astro';
import { cmsConfig } from '../../cms/config';

// JSON is valid YAML, so the CMS config is generated from TypeScript and never drifts from SITE.
export const GET: APIRoute = () =>
  new Response(JSON.stringify(cmsConfig, null, 2), { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } });
