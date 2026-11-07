"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, FlaskConical, Layers3, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./app-shell.module.css";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNew = pathname === "/brands/new";
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#app-content">Skip to content</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/brands" className={styles.logo} aria-label="Loopwise workspace">
            <span className={styles.logoMark}><RefreshCw size={21} aria-hidden="true" /></span>
            Loopwise<span className={styles.wordmarkDot}>.</span>
          </Link>
          <nav aria-label="Main navigation" className={styles.nav}>
            <Link href="/brands" aria-current={!isNew && pathname.startsWith("/brands") ? "page" : undefined}><Layers3 size={16} aria-hidden="true" />Brands</Link>
            <Link href="/brands/new" aria-current={isNew ? "page" : undefined}><Plus size={16} aria-hidden="true" />New</Link>
          </nav>
          <span className={styles.workspace}>YOUR GROWTH WORKSPACE</span>
        </div>
      </header>
      <div className={styles.masthead}>
        <div><p className={styles.eyebrow}>A LITTLE MORE INSIGHT. A LOT MORE IMPACT.</p>
          <p className={styles.tagline}>Predict before you post.<br className={styles.mobileBreak} /> <span>Learn after you post.</span></p></div>
        <ArrowUpRight className={styles.mastheadIcon} size={38} aria-hidden="true" />
      </div>
      {process.env.NEXT_PUBLIC_USE_MOCKS === "true" && <div className={styles.demo} role="status"><FlaskConical size={16} aria-hidden="true" /><span>Demo workspace · Sample data. Actions do not publish or save changes.</span></div>}
      <div id="app-content" tabIndex={-1} className={styles.content}>{children}</div>
      <footer className={styles.footer}><span>Loopwise / Your AI growth team</span><span>Understand → Create → Test → Learn</span></footer>
    </div>
  );
}

export function NewBrandButton() {
  return <Button render={<Link href="/brands/new" />} className="min-h-11 bg-[#7C3AED] px-4 text-white hover:bg-[#6D28D9]"><Plus aria-hidden="true" />Connect a brand</Button>;
}
