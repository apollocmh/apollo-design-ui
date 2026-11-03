/** A section is derived from the URL, including direct visits and history navigation. */
export type SiteSection = 'docs' | 'components' | 'icons';

export function sectionForPath(path: string): SiteSection {
  const pathname = path.replace(/\.html$/, '').replace(/\/$/, '');
  if (pathname === '/guide/icons') return 'icons';
  if (pathname === '/components' || pathname.startsWith('/components/')) return 'components';
  return 'docs';
}

export const sectionLinks = [
  { section: 'docs', to: '/guide/getting-started', key: 'docs' },
  { section: 'components', to: '/components', key: 'components' },
  { section: 'icons', to: '/guide/icons', key: 'iconGallery' },
] as const;
