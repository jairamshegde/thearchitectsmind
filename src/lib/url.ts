const UNTOUCHED = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

/** Prefix a site-root path with the configured base: "/writing/" → "/thearchitectsmind/writing/". */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  if (UNTOUCHED.test(path)) return path;
  const root = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${root}${path.startsWith('/') ? path : `/${path}`}`;
}
