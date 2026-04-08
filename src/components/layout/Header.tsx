"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { services } from '@/data/navigation';
import { companyInfo } from '@/data/navigation';
import { useScrollPosition } from '@/hooks/useScrollPosition';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollY = useScrollPosition();
  const pathname = usePathname();
  const scrolled = scrollY > 20;

  // Pages with dark PageHero need light nav text when not scrolled
  // Homepage is excluded — it has a light hero
  const hasDarkHero = pathname !== '/';
  const lightText = hasDarkHero && !scrolled;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed left-0 right-0 z-50 transition-all duration-300 top-0 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm shadow-foreground/[0.02]'
          : 'bg-transparent'
      }`}
    >
      <div className="flex items-center justify-between h-16 lg:h-18 mx-auto max-w-7xl px-6">
        {/* Logo */}
        <Link href="/" className={`relative z-50 transition-colors duration-300 ${lightText ? 'text-white' : 'text-foreground'}`}>
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink href="/about" light={lightText}>About</NavLink>
          <NavLink href="/services/hardscape" light={lightText}>Services</NavLink>
          <NavLink href="/portfolio" light={lightText}>Work</NavLink>
          <NavLink href="/testimonials" light={lightText}>Reviews</NavLink>
          <NavLink href="/blog" light={lightText}>Blog</NavLink>
          <NavLink href="/contact" light={lightText}>Contact</NavLink>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/portal"
            className={`text-[13px] font-medium transition-colors duration-300 ${
              lightText ? 'text-white/70 hover:text-white' : 'text-foreground/55 hover:text-foreground'
            }`}
          >
            Login
          </Link>
          <Button asChild size="sm">
            <Link href="/quote">Get a Quote</Link>
          </Button>
        </div>

        {/* Mobile Toggle — min 44x44 touch target per skill §2 */}
        <button
          className={`lg:hidden w-11 h-11 flex items-center justify-center cursor-pointer relative z-50 -mr-2 transition-colors duration-300 ${
            lightText && !mobileOpen ? 'text-white' : 'text-foreground'
          }`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu — animated slide-in */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 top-0 bg-background z-40"
          >
            <div className="flex flex-col h-full pt-20">
              <nav className="flex-1 px-6 py-6 overflow-y-auto">
                <div className="flex flex-col gap-0">
                  <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>Home</MobileNavLink>
                  <MobileNavLink href="/about" onClick={() => setMobileOpen(false)}>About</MobileNavLink>
                  {services.map(s => (
                    <Link
                      key={s.slug}
                      href={`/services/${s.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between py-4 min-h-[44px] text-sm text-muted-foreground border-b border-border hover:text-foreground transition-colors duration-150"
                    >
                      {s.label}
                      <ArrowUpRight size={14} />
                    </Link>
                  ))}
                  <MobileNavLink href="/portfolio" onClick={() => setMobileOpen(false)}>Portfolio</MobileNavLink>
                  <MobileNavLink href="/testimonials" onClick={() => setMobileOpen(false)}>Reviews</MobileNavLink>
                  <MobileNavLink href="/blog" onClick={() => setMobileOpen(false)}>Blog</MobileNavLink>
                  <MobileNavLink href="/contact" onClick={() => setMobileOpen(false)}>Contact</MobileNavLink>
                </div>
              </nav>

              <div className="px-6 py-8 border-t border-border">
                <Button asChild size="lg" className="w-full mb-4">
                  <Link href="/quote">Get a Free Quote</Link>
                </Button>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <a href={companyInfo.phoneHref} className="hover:text-foreground transition-colors duration-150">{companyInfo.phone}</a>
                  <span className="text-border">|</span>
                  <Link href="/portal" onClick={() => setMobileOpen(false)} className="hover:text-foreground transition-colors duration-150">Login</Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ href, children, light }: { href: string; children: string; light?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      {...(active ? { 'aria-current': 'page' as const } : {})}
      className={`text-[13px] font-medium uppercase tracking-[0.12em] transition-colors duration-300 px-3 py-2 rounded-lg ${
        active
          ? 'text-brand'
          : light
            ? 'text-white/70 hover:text-white hover:bg-white/[0.08]'
            : 'text-foreground/55 hover:text-foreground hover:bg-foreground/[0.04]'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: string }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between py-4 min-h-[44px] text-lg font-semibold text-foreground border-b border-border hover:text-brand transition-colors duration-150"
    >
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
}
