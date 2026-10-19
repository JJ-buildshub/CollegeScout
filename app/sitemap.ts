import type { MetadataRoute } from "next";
import { colleges } from "@/lib/colleges";
import { livePathwaySlugs } from "@/lib/pathways";
import { SITE_URL } from "@/lib/site";

/**
 * 336 college profiles, the seven static routes and each Talent Pathways page. Without this, the profiles
 * are only reachable by crawling the directory's client-filtered grid, which is
 * the bulk of what the site has to offer.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/directory", "/matcher", "/checklist", "/scholarships", "/pathways", "/about-data"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const profiles = colleges.map((college) => ({
    url: `${SITE_URL}/directory/${college.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const pathways = livePathwaySlugs().map((slug) => ({
    url: `${SITE_URL}/pathways/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...profiles, ...pathways];
}
