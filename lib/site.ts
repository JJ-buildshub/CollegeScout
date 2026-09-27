/**
 * Canonical origin, used for metadataBase, share-preview tags, the sitemap and
 * robots.txt. Preview deployments set NEXT_PUBLIC_SITE_URL to their own origin
 * so their canonicals don't point at production.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://collegescout.app";

/** Where queries, feedback and corrections go. Used by the footer, the
 * About our data page, and the per-profile correction link. */
export const CONTACT_EMAIL = "hello.collegescout@gmail.com";
