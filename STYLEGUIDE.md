# F.A.S.T. Web Style Guide

## Shared Assets
- Use shared stylesheet: assets/shared.css
- Use navigation script: assets/navigation.js (defer)
- For pages inside subfolders, reference assets relatively (e.g., ../assets/…)

## Naming Conventions
- Privacy Policy links point to PrivacyPolicy.html
- Terms of Service links point to TermsOfService.html
- Logout links/buttons redirect to Loginv2/index.html
- Top-left brand link points to FAST V2.html

## Branding
- Place F.A.S.T. logo text in the top-left of each page
- Markup: a.fast-logo inside a primary nav
- Apply class fast-hover to interactive nav items when available

## Navigation
- Wrap main navigation in a <nav> with role="navigation" and aria-label="Primary"
- The navigation.js script:
  - Normalizes link targets based on visible text (privacy policy, terms of service, logout)
  - Adds page transition and loader overlay
  - Provides basic ARIA feedback for interactive elements

## Accessibility
- Interactive elements should have role="button" when they are anchors acting as buttons
- Maintain focus outlines for keyboard users (shared.css provides defaults)
- Avoid motion for users with reduced motion (shared.css respects prefers-reduced-motion)

## Animations and Feedback
- Page transitions: fast-page + fast-enter/fast-exit classes
- Loader overlay: #pageLoader with .spinner
- Hover feedback: fast-hover for subtle lift

## Responsiveness
- Keep nav elements flexible using fast-nav (flex layout)
- Use existing page-specific responsive styles; shared assets are mobile-friendly

## Cross-Browser
- Shared CSS uses widely-supported properties and gradients
- JS avoids modern APIs that lack broad support; works on evergreen browsers

## Breaking Changes
- Anchor clicks to HTML pages are intercepted to show a loader and fade transition
- index.html is now the canonical home alias; old FAST V2.html is renamed to index.html
- Some legacy relative paths may be normalized by navigation.js to /WebPage/… routes

## Implementation Checklist
- Include assets/shared.css and assets/navigation.js on every page
- Add a top-left a.fast-logo linking to FASTV2.html
- Ensure footer/newsletter/legal links use the naming conventions above
- Verify logout flows route to Loginv2/index.html
