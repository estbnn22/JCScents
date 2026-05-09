import Link from "next/link";
import { siteContactLinks } from "@/lib/site-contact-links";

export function SiteFooter() {
  return (
    <footer className="site-footer mt-auto">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-14">
        <div>
          <p className="font-display text-3xl text-[var(--color-gold-soft)] sm:text-[2.2rem]">
            JC Scents
          </p>
          <p className="mt-3 max-w-md text-sm leading-7 text-white/68 sm:text-base">
            &copy; 2026 JC Scents. Todos los derechos reservados.
          </p>
          <Link
            href="/admin"
            className="footer-admin-link"
            aria-label="Acceso administrativo"
          >
            Admin
          </Link>
        </div>

        <nav aria-label="Redes sociales">
          <ul className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-end">
            {siteContactLinks.map((link) => (
              <li key={link.label}>
                {"href" in link ? (
                  <a href={link.href} className="footer-link">
                    {link.label}
                  </a>
                ) : (
                  <span className="footer-link">{link.label}</span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
