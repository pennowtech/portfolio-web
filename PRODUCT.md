# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences visit intentionally without one being prioritized over the others:

- **Recruiters/hiring managers** evaluating Sukhdeep for full-time architect/engineering roles — the site functions as an interactive resume.
- **Potential clients/collaborators** evaluating him for consulting, contract architecture work, or partnership.
- **Peers/technical community** reading the long-form writing and exploring the open-source projects for credibility and networking.

## Product Purpose

SinghBuildsTech is Sukhdeep Singh's portfolio site: it presents his practical architecture experience, selected engineering projects, technical skills, and long-form technical writing. Success is a visitor (recruiter, client, or peer) coming away with an accurate, credible picture of his real-world engineering depth — not a generic personal-brand page.

## Positioning

"Architecture grounded in engineering" — the site's differentiator is that Sukhdeep pairs architectural thinking with hands-on implementation across genuinely varied, high-stakes domains (medical devices, high-frequency trading, autonomous driving, embedded systems/CAN bus, microservices, network protocols), backed by real shipped projects rather than diagrams alone.

## Operating Context

- Content (articles) is authored and published through Notion via a custom admin/editor flow (`pages/write.jsx`, `pages/admin/`).
- The site supports light/dark themes, keyboard navigation, and responsive phone/tablet layouts.
- Localization exists for English and German (`LanguageContext`).
- Google Analytics is optional and stays disabled until affirmative consent; reCAPTCHA is scoped to the contact form only; fonts are served locally, not from Google Fonts.

## Capabilities and Constraints

- Sections: About, Skills (Technical Toolkit — 36 skills across Architecture, Architecture Modelling, Languages, Frameworks & Testing, Systems & Networking, Data & Platforms, Middleware), Projects, Articles (blog, Notion-sourced), Contact (protected form).
- Featured projects: **Rusty CAN Studio** (open-source desktop CAN/CAN-FD analysis tool, Rust/Tauri/React), **Lingora** (Sukhdeep's own AI-native, local-first, offline-first language-learning app, React Native/Tauri/SQLite, has a public GitHub repo and a dedicated in-site privacy policy since it collects user data), **Shelfie** (offline-first Android eBook/library reader with AI assistance — private product engineering, no public link or repo).
- Dedicated legal pages exist: general Privacy hub, Lingora-specific privacy policy, Lingora in-app account/data deletion page, and an Imprint.
- Licensed under GPLv3; third-party names/trademarks/assets remain subject to their owners' rights.

## Brand Commitments

- Brand name: **SinghBuildsTech**. Primary slogan: "Architecture grounded in engineering."
- Visual direction (from `docs/BRAND.md`): graphite as structural foundation, forest green for actions/active states and the "BuildsTech" wordmark portion, orange as a restrained supporting accent only where it already carries meaning, blue excluded from the interface palette. Geometric "S" monogram in an open structural frame.
- Contact: `singhbuildstech@gmail.com`.

## Evidence on Hand

- Real bio, work history, and skills content exist (`components/Intro/AboutSection.jsx`, `pages/about-me.jsx`, `utils/consts.jsx`).
- Real shipped/open-source projects exist as evidence (Rusty CAN Studio, Lingora, Shelfie) — no fabricated demo links, screenshots, or claims should be added for Shelfie beyond what is already stated, since it has no public link.
- 20+ published long-form articles exist under `posts/`/Notion (Kafka, C++, Rust, Slack apps, design patterns, etc.).
- No client testimonials, user counts, or business metrics currently exist on the site. Future work must not fabricate social proof, testimonials, or metrics.

## Product Principles

1. Show real, verifiable engineering work — not aspirational claims. Every project and skill listed traces back to actual experience or a real shipped artifact.
2. Serve recruiters, clients, and peers simultaneously; do not narrow the site to a single funnel at the expense of the others.
3. Respect the confidentiality boundary of private work (Shelfie) — describe it honestly without implying public availability.
4. Keep privacy/consent commitments (opt-in analytics, scoped reCAPTCHA, local fonts) as binding product behavior, not incidental implementation detail.
5. Architecture and engineering credibility over generic personal-branding polish — the differentiator is depth, not decoration.

## Accessibility & Inclusion

Keyboard navigation and responsive phone/tablet layouts are existing, confirmed requirements (per README). No additional accessibility standard (e.g. WCAG level) has been specified.
