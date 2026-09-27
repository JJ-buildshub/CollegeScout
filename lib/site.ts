/**
 * Canonical origin, used for metadataBase, share-preview tags, the sitemap and
 * robots.txt. Preview deployments set NEXT_PUBLIC_SITE_URL to their own origin
 * so their canonicals don't point at production.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://collegescout.app";
