/** Use the native URL parser and the actual owning document for fragment targets. */
export function getLocalHash(href: string, document: Document): string | null {
  const link = document.createElement('a');
  link.href = href;
  const location = document.location;
  if (
    !location ||
    !link.hash ||
    link.origin !== location.origin ||
    link.pathname !== location.pathname ||
    link.search !== location.search
  )
    return null;
  return link.hash.slice(1);
}

export function getAnchorTarget(href: string, document: Document): HTMLElement | null {
  const hash = getLocalHash(href, document);
  if (hash === null) return null;
  // A literal '%' is a valid HTML id. Malformed escapes must not break navigation.
  let id = hash;
  try {
    id = decodeURIComponent(hash);
  } catch (error) {
    if (!(error instanceof URIError)) throw error;
  }
  return document.getElementById(id);
}
