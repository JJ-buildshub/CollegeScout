/**
 * The one page heading every section uses: which part of the site you're in, the page's name, and
 * one sentence on what it's for. The eyebrow names the top menu item a page sits under, when that differs from the page.
 */
export default function PageHeader({
  eyebrow,
  title,
  children,
}: {
  /** Left out on a page that is its own top menu item, where it would only repeat the title. */
  eyebrow?: "Explore" | "Your work" | "About";
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header>
      {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gold-600">{eyebrow}</p>}
      <h1 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
      {children && <div className="mt-1 max-w-3xl text-sm text-slate-500">{children}</div>}
    </header>
  );
}
