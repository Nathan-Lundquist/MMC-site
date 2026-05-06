import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { services, quickLinks, companyInfo } from '@/data/navigation';

export default function Footer() {
  return (
    <footer className="bg-foreground text-white relative overflow-hidden">
      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 relative">
        {/* Top — brand statement */}
        <div className="mb-16 lg:mb-20">
          <Logo className="text-white mb-8" />
          <p className="font-display text-3xl lg:text-4xl text-white/80 max-w-lg leading-[1.15]">
            Dream it. Design it.
            <br />
            Build it. <span className="text-brand italic">Enjoy it.</span>
          </p>
        </div>

        <div className="divider-organic mb-16" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Hours + Contact */}
          <div className="lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 mb-5">Contact</p>
            <div className="flex flex-col gap-1">
              <a href={companyInfo.phoneHref} className="text-sm text-white/70 hover:text-white transition-colors duration-150 py-1.5 min-h-[44px] flex items-center">{companyInfo.phone}</a>
              <a href={`mailto:${companyInfo.email}`} className="text-sm text-white/70 hover:text-white transition-colors duration-150 py-1.5 min-h-[44px] flex items-center">{companyInfo.email}</a>
              <p className="text-sm text-white/50 py-1.5">{companyInfo.fax} (fax)</p>
            </div>
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <p className="text-sm text-white/60">Mon – Fri: 9am – 4pm</p>
              <p className="text-sm text-white/50 mt-1">{companyInfo.address}</p>
              <p className="text-sm text-white/50">{companyInfo.city}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-2 lg:col-start-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 mb-5">Navigate</p>
            <div className="flex flex-col gap-1">
              {quickLinks.map(link => (
                <Link
                  key={link.to}
                  href={link.to}
                  className="text-sm text-white/60 hover:text-white transition-colors duration-150 py-1.5 min-h-[44px] flex items-center"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="lg:col-span-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 mb-5">Services</p>
            <div className="flex flex-col gap-1">
              {services.map(s => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="text-sm text-white/60 hover:text-white transition-colors duration-150 py-1.5 min-h-[44px] flex items-center"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className="lg:col-span-2 lg:col-start-11">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 mb-5">Follow</p>
            <div className="flex gap-3">
              <a href={companyInfo.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-11 h-11 rounded-full bg-white/[0.06] hover:bg-brand flex items-center justify-center transition-all duration-200 text-white/30 hover:text-white text-xs font-bold">
                f
              </a>
              <a href={companyInfo.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-11 h-11 rounded-full bg-white/[0.06] hover:bg-brand flex items-center justify-center transition-all duration-200 text-white/30 hover:text-white text-xs font-bold">
                ig
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="text-[11px] text-white/25">&copy; {new Date().getFullYear()} {companyInfo.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
