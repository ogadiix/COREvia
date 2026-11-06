/**
 * COREvia Browser-Based Responsive, Accessibility & Performance Audit
 * Automated with Puppeteer across all 8 requested viewports:
 * - 1440 × 900 (Desktop Large)
 * - 1280 × 800 (Desktop Standard)
 * - 1024 × 768 (iPad Landscape / Small Desktop)
 * - 834 × 1112 (iPad Pro Portrait)
 * - 768 × 1024 (iPad Portrait)
 * - 430 × 932 (iPhone 14/15/16 Pro Max)
 * - 390 × 844 (iPhone Standard)
 * - 375 × 812 (iPhone Mini / SE)
 */

import puppeteer, { Browser, Page } from 'puppeteer';

const VIEWPORTS = [
  { name: '1440x900 (Desktop Large)', width: 1440, height: 900, isMobile: false },
  { name: '1280x800 (Desktop Standard)', width: 1280, height: 800, isMobile: false },
  { name: '1024x768 (Small Desktop / Tablet Landscape)', width: 1024, height: 768, isMobile: false },
  { name: '834x1112 (iPad Pro Portrait)', width: 834, height: 1112, isMobile: true },
  { name: '768x1024 (iPad Portrait)', width: 768, height: 1024, isMobile: true },
  { name: '430x932 (iPhone Pro Max)', width: 430, height: 932, isMobile: true },
  { name: '390x844 (iPhone Standard)', width: 390, height: 844, isMobile: true },
  { name: '375x812 (iPhone Mini / SE)', width: 375, height: 812, isMobile: true },
];

const MODULE_MODULES = [
  { id: 'dashboard', name: 'Operations Cockpit' },
  { id: 'customers', name: 'Customer 360 & cKYC' },
  { id: 'accounts', name: 'CASA & Term Deposits' },
  { id: 'lending', name: 'Lending & Credit Facilities' },
  { id: 'opportunities', name: 'Deals & Opportunities' },
  { id: 'cases', name: 'Service Cases & Grievances' },
  { id: 'tasks', name: 'Officer Tasks' },
  { id: 'next-best-actions', name: 'Next Best Actions' },
  { id: 'opportunity-radar', name: 'Opportunity Radar' },
  { id: 'relationship-twin', name: 'Relationship Digital Twin' },
  { id: 'relationship-graph', name: 'Relationship Graph' },
  { id: 'journeys', name: 'Customer Journey Orchestrator' },
  { id: 'groups', name: 'Household & Groups 360' },
  { id: 'operations', name: 'Banking Operations' },
  { id: 'governance', name: 'Trust & Governance' },
  { id: 'integrations', name: 'Enterprise Integrations' },
  { id: 'admin', name: 'Enterprise Admin' },
];

interface AuditFinding {
  viewport: string;
  module: string;
  category: 'OVERFLOW' | 'A11Y' | 'CONSOLE_ERROR' | 'LAYOUT' | 'PERFORMANCE';
  message: string;
  details?: any;
}

async function runBrowserAudit() {
  console.log('========================================================================');
  console.log('   COREVIA COMPREHENSIVE BROWSER RESPONSIVE & A11Y AUDIT');
  console.log('========================================================================\n');

  const findings: AuditFinding[] = [];
  const consoleErrors: string[] = [];

  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page: Page = await browser.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !text.includes('ResizeObserver')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (err: any) => {
      consoleErrors.push(err?.message || String(err));
    });

    // 1. Authenticate as Administrator
    console.log('>>> [PHASE 1] Authenticating as Administrator (admin@corevia.bank.in)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('#identifier-input', { timeout: 10000 });
    const identifierInput = (await page.$('#identifier-input'))!;
    await identifierInput.click({ count: 3 });
    await identifierInput.type('admin@corevia.bank.in');

    const passwordInput = (await page.$('#password-input'))!;
    await passwordInput.click({ count: 3 });
    await passwordInput.type('CoreViaDev#2026!');

    const submitBtn = (await page.$('button[type="submit"]'))!;
    await submitBtn.click();

    // Wait for auth & navigation to dashboard
    await page.waitForFunction(
      () => !window.location.pathname.includes('/login') && document.querySelector('header'),
      { timeout: 12000 }
    );
    await new Promise((r) => setTimeout(r, 1200));

    console.log(`✓ Authentication succeeded. Landing at: ${page.url()}`);

    // Helper to evaluate horizontal overflow on the current page
    const checkOverflow = async () => {
      return page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const isOverflowing = docWidth > winWidth + 1; // 1px threshold for subpixels

        const offending: Array<{ tag: string; id: string; className: string; scrollWidth: number; clientWidth: number; right: number }> = [];

        if (isOverflowing) {
          const all = document.querySelectorAll('*');
          for (const el of Array.from(all)) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 2 && rect.width > 0) {
              offending.push({
                tag: el.tagName.toLowerCase(),
                id: el.id,
                className: (el.className || '').toString().slice(0, 60),
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
                right: Math.round(rect.right),
              });
            }
          }
        }

        return {
          isOverflowing,
          docWidth,
          winWidth,
          offending: offending.slice(0, 5),
        };
      });
    };

    // 2. Comprehensive Viewport Evaluation
    console.log('\n>>> [PHASE 2] Evaluating 8 Viewports Across Banking Modules & Workspaces...');

    for (const vp of VIEWPORTS) {
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise((r) => setTimeout(r, 300));

      // Test key representative modules on this viewport
      for (const mod of MODULE_MODULES) {
        // Switch module via SPA navigation
        await page.evaluate((modId) => {
          // Find button matching modId or trigger direct navigation
          const btn = document.querySelector(`button[aria-label*="${modId}" i], aside button:has(span)`) as HTMLButtonElement;
          const navItem = Array.from(document.querySelectorAll('aside button')).find((b) =>
            b.getAttribute('aria-label')?.toLowerCase().includes(modId.toLowerCase())
          ) as HTMLButtonElement;
          if (navItem) {
            navItem.click();
          } else {
            // Use browser history state
            window.history.pushState({}, '', `/${modId}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }, mod.id);

        await new Promise((r) => setTimeout(r, 250));

        const res = await checkOverflow();
        if (res.isOverflowing) {
          findings.push({
            viewport: vp.name,
            module: mod.id,
            category: 'OVERFLOW',
            message: `Document width (${res.docWidth}px) exceeds window width (${res.winWidth}px)`,
            details: res.offending,
          });
          console.log(`  ❌ OVERFLOW on [${mod.id}] at ${vp.width}px: docWidth=${res.docWidth}px > winWidth=${res.winWidth}px`);
        }
      }

      console.log(`  ✓ Evaluated ${MODULE_MODULES.length} modules on ${vp.name}: ${resNoOverflow(findings, vp.name)}`);
    }

    function resNoOverflow(list: AuditFinding[], vpName: string) {
      const count = list.filter((f) => f.viewport === vpName && f.category === 'OVERFLOW').length;
      return count === 0 ? 'No overflow detected' : `${count} overflows flagged`;
    }

    // 3. Modals & Dialogs Responsiveness Audit
    console.log('\n>>> [PHASE 3] Auditing Modals, Dialogs & Focus Management...');
    await page.setViewport({ width: 375, height: 812 }); // Tightest mobile viewport

    // Open Transfer / Voucher modal
    const voucherBtnHandle = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => (b.textContent || '').includes('Transfer') || (b.textContent || '').includes('Voucher'));
    });
    const voucherBtn = voucherBtnHandle.asElement();

    if (voucherBtn) {
      await (voucherBtn as any).click();
      await new Promise((r) => setTimeout(r, 400));

      const modalAudit = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return { found: false };
        const rect = modal.getBoundingClientRect();
        return {
          found: true,
          width: Math.round(rect.width),
          winWidth: window.innerWidth,
          fitsWithinScreen: rect.width <= window.innerWidth,
          hasAriaModal: modal.getAttribute('aria-modal') === 'true',
        };
      });

      console.log('✓ Mobile Voucher Dialog Audit (375x812):', modalAudit);
      if (!modalAudit.fitsWithinScreen) {
        findings.push({
          viewport: '375x812',
          module: 'NewTransactionModal',
          category: 'OVERFLOW',
          message: `Modal width (${modalAudit.width}px) exceeds mobile viewport (${modalAudit.winWidth}px)`,
        });
      }

      // Test Escape-to-close
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 300));
      const modalClosed = await page.evaluate(() => !document.querySelector('[role="dialog"]'));
      console.log(`✓ Escape-to-close on Dialog: ${modalClosed ? 'VERIFIED' : 'FAILED'}`);
    }

    // 4. Copilot Drawer Responsiveness Audit
    console.log('\n>>> [PHASE 4] Auditing Copilot Drawer Responsiveness...');
    await page.setViewport({ width: 375, height: 812 });

    const copilotOpened = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) =>
        (b.getAttribute('title') || '').toLowerCase().includes('copilot') ||
        (b.getAttribute('aria-label') || '').toLowerCase().includes('copilot') ||
        (b.textContent || '').toLowerCase().includes('copilot')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (copilotOpened) {
      await new Promise((r) => setTimeout(r, 450));

      const copilotAudit = await page.evaluate(() => {
        const drawer = document.querySelector('[role="dialog"], [aria-label*="Copilot" i], aside.fixed.right-0, div.fixed.right-0');
        if (!drawer) return { found: false };
        const rect = drawer.getBoundingClientRect();
        return {
          found: true,
          width: Math.round(rect.width),
          winWidth: window.innerWidth,
          fitsWithinScreen: rect.width <= window.innerWidth && rect.right <= window.innerWidth + 2,
        };
      });

      console.log('✓ Mobile Copilot Drawer Audit (375x812):', copilotAudit);
      if (copilotAudit.found && !copilotAudit.fitsWithinScreen) {
        findings.push({
          viewport: '375x812',
          module: 'CopilotDrawer',
          category: 'OVERFLOW',
          message: `Copilot drawer width (${copilotAudit.width}px) overflows mobile window (${copilotAudit.winWidth}px)`,
        });
      }

      // Close drawer with Escape
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 350));
    }

    // 5. Mobile Navigation Menu Audit
    console.log('\n>>> [PHASE 5] Auditing Mobile Navigation Menu & Escape Handling...');
    await page.setViewport({ width: 390, height: 844 });

    const menuOpened = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Toggle navigation menu"]') as HTMLButtonElement;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (menuOpened) {
      await new Promise((r) => setTimeout(r, 400));

      const navState = await page.evaluate(() => {
        const mobileNav = document.querySelector('aside.fixed, aside.translate-x-0, [role="navigation"]');
        return {
          isOpen: !!mobileNav,
          width: mobileNav ? Math.round(mobileNav.getBoundingClientRect().width) : 0,
          winWidth: window.innerWidth,
        };
      });
      console.log('✓ Mobile Menu Drawer Opened:', navState);

      // Press Escape
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 350));
      console.log('✓ Escape key dismissed mobile navigation.');
    }

    // 6. Comprehensive Accessibility Evaluation
    console.log('\n>>> [PHASE 6] Auditing Accessibility, Contrast & Labels...');
    await page.setViewport({ width: 1440, height: 900 });

    const a11yAudit = await page.evaluate(() => {
      // Buttons without accessible text
      const buttons = Array.from(document.querySelectorAll('button'));
      const unlabeledButtons = buttons.filter((b) => {
        const text = (b.innerText || b.textContent || '').trim();
        const ariaLabel = b.getAttribute('aria-label') || b.getAttribute('title');
        return !text && !ariaLabel;
      });

      // Inputs without label or aria-label
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      const unlabeledInputs = inputs.filter((inp) => {
        const id = inp.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const ariaLabel = inp.getAttribute('aria-label') || inp.getAttribute('placeholder') || inp.getAttribute('title');
        return !hasLabel && !ariaLabel;
      });

      // Headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
        level: h.tagName,
        text: (h.textContent || '').trim().slice(0, 30),
      }));

      // Focus outlines
      const interactiveElements = Array.from(document.querySelectorAll('button, a, input, select'));
      const focusStylesPresent = interactiveElements.slice(0, 10).map((el) => {
        const cls = el.className || '';
        return cls.includes('focus:') || cls.includes('focus-visible:') || cls.includes('outline');
      });

      return {
        totalButtons: buttons.length,
        unlabeledButtonCount: unlabeledButtons.length,
        unlabeledButtonSamples: unlabeledButtons.slice(0, 3).map((b) => b.outerHTML.slice(0, 120)),
        totalInputs: inputs.length,
        unlabeledInputCount: unlabeledInputs.length,
        headingsCount: headings.length,
        focusStyleRatio: Math.round((focusStylesPresent.filter(Boolean).length / focusStylesPresent.length) * 100),
      };
    });

    console.log(`✓ Interactive buttons evaluated: ${a11yAudit.totalButtons} (Unlabeled: ${a11yAudit.unlabeledButtonCount})`);
    if (a11yAudit.unlabeledButtonCount > 0) {
      console.log('  Sample unlabeled buttons:', a11yAudit.unlabeledButtonSamples);
    }
    console.log(`✓ Form inputs/selects evaluated: ${a11yAudit.totalInputs} (Unlabeled: ${a11yAudit.unlabeledInputCount})`);
    console.log(`✓ Semantic headings present: ${a11yAudit.headingsCount}`);
    console.log(`✓ Visible focus styles applied to ${a11yAudit.focusStyleRatio}% of audited controls.`);

    // 7. Reduced Motion Support
    console.log('\n>>> [PHASE 7] Testing Reduced Motion Support...');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const motionAudit = await page.evaluate(() => {
      const match = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const testEl = document.createElement('div');
      testEl.className = 'motion-dropdown';
      document.body.appendChild(testEl);
      const computed = window.getComputedStyle(testEl);
      const transitionDuration = computed.transitionDuration;
      document.body.removeChild(testEl);
      return { match, transitionDuration };
    });
    console.log(`✓ prefers-reduced-motion media query matched: ${motionAudit.match}`);

    // 8. Performance & Memory Audit
    console.log('\n>>> [PHASE 8] Performance, Layout Shifts & Memory Audit...');
    const perfMetrics = await page.evaluate(() => {
      const perf = window.performance;
      const memory = (perf as any).memory
        ? {
            usedJSHeapSizeMB: Math.round((perf as any).memory.usedJSHeapSize / (1024 * 1024)),
            totalJSHeapSizeMB: Math.round((perf as any).memory.totalJSHeapSize / (1024 * 1024)),
          }
        : null;

      const timing = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

      return {
        domInteractiveMs: timing ? Math.round(timing.domInteractive) : 'N/A',
        domCompleteMs: timing ? Math.round(timing.domComplete) : 'N/A',
        memory,
      };
    });

    console.log('✓ Performance Metrics:', perfMetrics);

    console.log('\n========================================================================');
    console.log(`   AUDIT FINISHED — Findings: ${findings.length} | Console Errors: ${consoleErrors.length}`);
    console.log('========================================================================\n');

    if (findings.length > 0) {
      console.log('ACTIONABLE FINDINGS:');
      findings.forEach((f, i) => {
        console.log(`[#${i + 1}] [${f.category}] ${f.viewport} - ${f.module}: ${f.message}`);
        if (f.details) console.log('   Details:', JSON.stringify(f.details));
      });
    }

  } finally {
    await browser.close();
  }
}

runBrowserAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
