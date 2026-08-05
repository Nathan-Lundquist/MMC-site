"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight, Phone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/Logo';
import { services, companyInfo } from '@/data/navigation';
import { useScrollPosition } from '@/hooks/useScrollPosition';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const scrollY = useScrollPosition();
  const pathname = usePathname();
  const scrolled = scrollY > 20;

  const hasDarkHero = pathname !== '/';
  const lightText = hasDarkHero && !scrolled;

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
  }, [pathname]);

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
      {/* Utility bar — phone + tagline, collapses on scroll */}
      <div
        className={`hidden lg:block overflow-hidden transition-all duration-300 ${
          scrolled ? 'max-h-0 opacity-0' : 'max-h-8 opacity-100'
        }`}
      >
        <div className={`max-w-7xl mx-auto px-6 h-8 flex items-center justify-between border-b transition-colors duration-300 ${
          lightText ? 'border-white/10' : 'border-border/60'
        }`}>
          <a
            href={companyInfo.phoneHref}
            className={`flex items-center gap-1.5 text-[11px] font-medium tracking-wide transition-colors duration-150 ${
              lightText ? 'text-white/50 hover:text-white/80' : 'text-foreground/45 hover:text-brand'
            }`}
          >
            <Phone size={10} />
            {companyInfo.phone}
          </a>
          <span className={`text-[10px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 ${
            lightText ? 'text-white/30' : 'text-foreground/25'
          }`}>
            {companyInfo.tagline}
          </span>
        </div>
      </div>

      {/* Main nav row */}
      <div className="flex items-center justify-between h-16 lg:h-[68px] mx-auto max-w-7xl px-6">
        {/* Logo */}
        <Link href="/" className={`relative z-50 transition-colors duration-300 ${lightText ? 'text-white' : 'text-foreground'}`}>
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          <NavLink href="/about" light={lightText}>About</NavLink>

          {/* Services dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              className={`flex items-center gap-1 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors duration-300 px-3 py-2 rounded-lg cursor-pointer ${
                pathname.startsWith('/services')
                  ? 'text-brand'
                  : lightText
                    ? 'text-white/70 hover:text-white hover:bg-white/[0.08]'
                    : 'text-foreground/55 hover:text-foreground hover:bg-foreground/[0.04]'
              }`}
            >
              Services
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[400px] bg-background/98 backdrop-blur-xl border border-border rounded-2xl shadow-xl shadow-foreground/[0.07] p-3 grid grid-cols-2 gap-0.5"
                >
                  {/* Arrow pointer */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-background border-l border-t border-border rotate-45 rounded-sm" />
                  {services.map(s => (
                    <Link
                      key={s.slug}
                      href={`/services/${s.slug}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/[0.05] transition-all duration-150 group"
                    >
                      {s.label}
                      <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-40 transition-opacity duration-150 shrink-0 ml-1" />
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
          <Button asChild size="sm" className="rounded-full px-5">
            <Link href="/quote">Get a Quote</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
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

      {/* Mobile Menu */}
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

                  {/* Mobile services section */}
                  <div className="py-4 border-b border-border">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 px-0.5">Services</p>
                    <div className="grid grid-cols-2 gap-1">
                      {services.map(s => (
                        <Link
                          key={s.slug}
                          href={`/services/${s.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 py-2 px-2.5 text-[13px] font-medium text-foreground/60 hover:text-foreground rounded-lg hover:bg-foreground/[0.04] transition-colors duration-150 min-h-[40px]"
                        >
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  </div>

                  <MobileNavLink href="/portfolio" onClick={() => setMobileOpen(false)}>Portfolio</MobileNavLink>
                  <MobileNavLink href="/testimonials" onClick={() => setMobileOpen(false)}>Reviews</MobileNavLink>
                  <MobileNavLink href="/blog" onClick={() => setMobileOpen(false)}>Blog</MobileNavLink>
                  <MobileNavLink href="/contact" onClick={() => setMobileOpen(false)}>Contact</MobileNavLink>
                </div>
              </nav>

              <div className="px-6 py-8 border-t border-border">
                <Button asChild size="lg" className="w-full mb-4 rounded-full">
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
