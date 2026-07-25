# Portfolio Improvement Roadmap

This document is the shared plan and decision log for improving the portfolio incrementally. It should be updated after every approved step so the current state, next action, and design decisions remain clear.

## Working Agreement

- Preserve the website's existing typography, font combinations, and colorful personality.
- Improve one contained area at a time.
- Present the intended result before changing a section.
- Wait for feedback and approval before implementation.
- Do not silently expand an approved step into adjacent sections.
- Verify every implementation with lint and a production build.
- Keep light and dark themes usable at each step.
- Treat phone, tablet, and desktop layouts as part of every step's definition of done.
- Record accepted decisions and requested corrections in this document.

## Status Legend

| Status        | Meaning                                          |
| ------------- | ------------------------------------------------ |
| `Not started` | No proposal or implementation has begun.         |
| `Proposed`    | An overview is ready and awaiting feedback.      |
| `Approved`    | The proposal is accepted and ready to implement. |
| `In progress` | Implementation is underway.                      |
| `In review`   | Implemented and awaiting visual feedback.        |
| `Complete`    | Reviewed and accepted.                           |
| `Deferred`    | Intentionally postponed.                         |

## Design Guardrails

### Preserve

- The current typography and font families.
- The orange and blue TechishDeep identity.
- The varied colors used for technologies, tags, and visual accents.
- Blue as a restrained action color rather than a repeated decorative color.
- The existing content structure and personal tone.
- The current light/dark theme capability.
- The original layout until a section-specific replacement is approved.

### Improve Gradually

- Spacing and alignment.
- Responsive behavior.
- Visual hierarchy and readability.
- Interaction feedback and accessibility.
- Component consistency.
- Shadows, borders, and radii where they clarify grouping.
- Maintainability without unnecessary rewrites.

## Responsive Baseline

Responsive behavior is a cross-cutting requirement, not a final polish task. Every approved step will be designed and reviewed at these representative viewport widths:

| Viewport | Purpose                                                                         |
| -------- | ------------------------------------------------------------------------------- |
| 360 px   | Small phone: no horizontal overflow, clipped content, or unreachable controls.  |
| 390 px   | Common phone: comfortable reading, touch targets, and stacked layouts.          |
| 768 px   | Tablet portrait: intentional use of space rather than a stretched phone layout. |
| 1024 px  | Tablet landscape/small laptop: balanced columns, navigation, and spacing.       |
| 1440 px  | Desktop: controlled content width and readable line lengths.                    |

Across all steps:

- Start with the smallest layout and add complexity only when space allows.
- Use flexible widths and content-driven height; avoid fixed dimensions where content can grow.
- Keep interactive controls at least 44 × 44 px where practical.
- Preserve readable text sizes and line lengths without requiring pinch-to-zoom.
- Prevent horizontal page scrolling, clipped labels, and overlapping sticky elements.
- Keep navigation, forms, theme controls, and article actions keyboard and touch accessible.
- Test both light and dark themes at phone, tablet, and desktop sizes.

## Roadmap

| Step | Area                  | Intended outcome                                                                                                        | Status        |
| ---- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------- |
| 0    | Dummy article         | Provide reliable local article content rendered through the existing Markdown pipeline.                                 | `In review`   |
| 1    | Header and navigation | Improve alignment, navigation states, touch targets, and phone/tablet navigation while retaining the existing identity. | `Complete`    |
| 2    | Profile hero          | Refine the background, profile card, statistics, introduction, and primary action across all viewports.                 | `Deferred`    |
| 3    | Profile highlights    | Improve content hierarchy, cards, imagery, skill presentation, and responsive spacing.                                  | `Complete`    |
| 4    | Article listing       | Refine cards, images, metadata, tags, and the one/two/three-column responsive article grid.                             | `Complete`    |
| 5    | Article reading page  | Improve reading width, heading rhythm, code overflow, table of contents, and responsive navigation.                     | `Not started` |
| 6    | Contact section       | Improve form hierarchy, mobile field stacking, touch targets, field states, feedback, and calls to action.              | `Not started` |
| 7    | Footer                | Improve link organization, alignment, social links, touch targets, and responsive stacking.                             | `Not started` |
| 8    | Consistency pass      | Review spacing, accessibility, dark mode, and visual consistency at every target viewport.                              | `Not started` |

## Step 1: Header and Navigation

Status: `Complete`

### Proposed Outcome

- Preserve the TechishDeep logo typography and its orange/blue colors.
- Preserve the theme switch.
- Improve vertical alignment and whitespace.
- Refine link hover and active states using existing colors.
- Keep the full desktop navigation beside the theme switch where it fits comfortably; provide an intentional menu for phone and tablet widths.
- Use a left-side mobile/tablet navigation drawer with clear touch targets, focus behavior, and background contrast.
- Close the mobile drawer after a navigation choice.
- Allow closing the drawer with its close button, the Escape key, or a click outside it.
- Prevent background scrolling while the drawer is open.
- Keep sticky navigation with a subtler border and shadow.
- Preserve the Login decision until its former authoring workflow is either restored or formally retired.

### Approved Scope

- Remove the inactive Login label from the public navigation.
- Keep desktop navigation beside the theme switch.
- Use an accessible left-side drawer for phone and tablet navigation.
- Implement the remaining proposed header behavior without changing adjacent sections.
- Treat a replacement owner-only authoring workflow as a separate future decision.

### Login History

- Login was intended for the site owner, not general portfolio visitors.
- It authenticated a WordPress user through a WPGraphQL login mutation and stored the returned token and username in browser storage.
- The token protected a `/create-post` page where the owner could upload an MDX file, preview it in a Markdown editor, and prepare a WordPress post.
- The post-creation mutation was commented out, so the publishing workflow was already incomplete before removal.
- The login page, login component, post editor, and GraphQL queries were removed together in commit `f729265` (May 2023), while the visual navbar label and some unused token/validation utilities remained.
- Restoring this feature requires a separate security and architecture review; the old browser-token implementation should not simply be reinstated.

### Implementation

- Files changed: `components/HeaderMain.jsx`, `components/Navbar.jsx`, and `components/NavBarItem.jsx`.
- The public Login label was removed.
- Desktop navigation remains beside the theme switch at desktop widths.
- Phone and tablet widths use a left-side drawer with an overlay.
- Drawer navigation closes after a choice, with Escape, with the close button, or by selecting the overlay.
- Focus moves into the drawer, remains contained while it is open, and returns to the menu button when it closes.
- Background scrolling is locked while the drawer is open.
- Navigation controls have visible focus states and minimum 44 px touch heights.
- The header is consistently sticky with a subtle translucent background, border, and shadow in both themes.
- Validation: `npm run lint` passes with 18 pre-existing warnings and no errors.
- Validation: `npm run build` passes. The build reports existing invalid Notion-token warnings but completes successfully.
- Final visual acceptance: accepted by moving to Step 2.

## Step 2: Profile Hero

Status: `Deferred`

### Observed Issues

- The hero relies on a fixed 384 px background height and a large negative card offset, making its composition fragile as content wraps.
- The profile image uses non-descriptive alternative text.
- The Connect and Show more interactions are clickable `div` elements, so they are not naturally keyboard-accessible controls.
- The statistics appear hard-coded and may no longer represent meaningful portfolio information.
- The introductory copy is long for a hero and includes several wording issues that reduce clarity.
- The card hierarchy and spacing are optimized mainly for large screens; phone and tablet layouts need a more deliberate composition.

### Proposed Outcome

- Preserve the existing photographic background, angled divider, circular TechishDeep profile image, typography, and colorful identity.
- Keep the profile card overlapping the background, but use responsive spacing and content-driven sizing rather than a fragile fixed-height composition.
- Establish a clear reading order: identity, role/location, concise introduction, supporting facts, then primary action.
- Replace clickable `div` elements with accessible buttons/links and give both actions visible hover and keyboard-focus states.
- Make the primary Connect action visually clear without introducing a new color system.
- Retain statistics only if their values are accurate and useful; otherwise replace them with stable professional facts.
- Improve text clarity while preserving the personal tone and technical/travel theme.
- Use a stacked phone layout, an intentionally spaced tablet layout, and a balanced desktop layout without horizontal overflow.
- Preserve light and dark theme contrast.

### Explicitly Unchanged

- Header and navigation.
- The Profile Highlights section below the hero.
- Article cards, contact form, and footer.
- Existing font families and the overall page content order.

### Approved Content Direction

- Replace the temporary statistics with stable professional facts: `18+ Years`, `6 Domains`, and `5 Core Languages`.
- Rewrite and condense the supplied professional bio for a clear hero introduction.
- Preserve the fuller technical detail for the Profile Highlights section rather than overloading the hero.

### Implementation

- File changed: `components/Intro/AboutSection.jsx`.
- Rebuilt the hero with content-driven card sizing and responsive background overlap.
- Added the stable professional facts `18+ Years`, `6 Technical Domains`, and `5 Core Languages` in a single compact metrics band.
- Presented the supplied bio as five icon-led highlights covering experience, languages, platforms, systems expertise, and working style.
- Rewrote the hero in a neutral professional voice without first-person or testimonial phrasing.
- Preserved the background image, angled divider, circular TechishDeep mark, typography, and orange/blue identity.
- Replaced clickable `div` elements with keyboard-operable actions and visible focus states.
- Added stacked phone actions, a compact three-column metrics row, responsive icon bullets, and a controlled desktop content width.
- Improved the profile image alternative text and light/dark theme contrast.
- Reserved blue for the primary action; supporting icons inherit the surrounding text color without separate backgrounds.
- Removed card-like backgrounds from the icon-led highlights and retained only subtle separators.
- Centered every metric value and its full label within an equal-width column.
- Validation: `npm run lint` passes with 17 pre-existing warnings and no errors.
- Validation: sandboxed `next build --webpack` passes. Notion requests are unavailable in the sandbox, and the existing fallback behavior allows static generation to complete.
- Final visual acceptance: not accepted; further iteration deferred at the user's request.

## Step 3: Profile Highlights

Status: `Complete`

### Observed Issues

- The section combines unrelated card styles, rotated imagery, colored technology tiles, Markdown blocks, and a large skill-icon cloud without a clear visual hierarchy.
- Several layouts switch to side-by-side columns at tablet width even when the content needs more space.
- The profile image has no alternative text.
- Technology cards contain malformed class markup and use separate colored backgrounds that compete with the content.
- The section depends on fixed positions in the `headingBlocks` array, making missing or shorter Notion content fragile.
- Heading, paragraph, image, and skill spacing is inconsistent across phone, tablet, and desktop layouts.

### Proposed Outcome

- Create one cohesive professional section with a clear heading, short introduction, focused capability groups, and a restrained skills index.
- Preserve the existing Notion-supplied content and technical breadth while presenting it in a more deliberate order.
- Use the page background throughout; avoid decorative card backgrounds and excessive shadows.
- Use typography, whitespace, thin separators, and alignment as the primary hierarchy.
- Keep icons in the surrounding text color; reserve varied technology colors for small, meaningful accents only.
- Keep blue reserved for actionable buttons or links.
- Remove decorative image rotation and give imagery a stable responsive aspect ratio with descriptive alternative text.
- Use a single-column phone layout, an intentional tablet layout, and balanced desktop columns only where content width supports them.
- Handle missing `headingBlocks` safely so the section does not fail when Notion content is incomplete.
- Keep all text in a neutral professional voice.

### Explicitly Unchanged

- Header and navigation.
- Deferred profile hero.
- Article listing, contact form, and footer.
- Existing font families, light/dark themes, and the complete skills list.

### Proposed Content Structure

1. Section introduction.
2. Architecture and delivery capabilities.
3. Engineering and platform expertise.
4. Representative imagery.
5. Compact, categorized skills index.

### Approved Scope

- Implement the proposed content-led Profile Highlights redesign.
- Keep the changes contained to the Profile Highlights section and its directly supporting components.

### Implementation

- File changed: `components/Intro/IntroHighlight.jsx`.
- Replaced the disconnected card and rotated-image composition with one cohesive, content-led section.
- Added a clear section introduction and five structured content blocks separated through spacing and thin rules.
- Preserved the existing Notion content when available and added safe neutral fallbacks for missing blocks.
- Replaced two competing images with one stable, responsive development image and descriptive alternative text.
- Removed colored technology tiles, decorative shadows, and separate skill backgrounds.
- Organized the complete skills list into Languages, Frameworks & Testing, Systems & Architecture, and Data & Platforms.
- Kept skill icons in the surrounding text color and reserved blue for actions.
- Used a single-column phone/tablet content flow and introduced desktop columns only at the large breakpoint.
- Validation: `npm run lint` passes with 13 pre-existing warnings and no errors.
- Validation: sandboxed `next build --webpack` passes; unavailable Notion requests use the existing fallback behavior.
- Final visual acceptance: accepted by moving to Step 4.

## Current Step: Article Listing

Status: `Complete`

### Observed Issues

- The section background and repeated angled divider add visual weight that competes with the article content.
- Cards use heavy shadows, multiple nested wrappers, and another angled divider, creating a busy stacked-card appearance.
- Card heights vary with titles, excerpts, metadata, and tags, making the grid uneven.
- The grid changes to two columns at tablet width and three columns at 1024 px without controlling card content density.
- Category badges use a fixed bright red treatment regardless of the article category or surrounding palette.
- Metadata has very low contrast, and tags can become visually dominant.
- The entire title/excerpt area is linked while tags contain separate links, making the interaction structure harder to understand.
- The “View all articles” action uses a clickable wrapper around a link rather than one clear interactive element.

### Proposed Outcome

- Use a calm section background and let article imagery and typography provide the visual interest.
- Create clean, equal-height article cards with one image, a restrained category label, title, concise excerpt, metadata, and limited tags.
- Use subtle borders and hover movement instead of heavy shadows and decorative dividers.
- Keep the established green treatment for the primary “View all articles” action.
- Use one column on phones, two columns on tablets, and three columns only on wider desktop screens.
- Maintain a stable image ratio and clamp long titles/excerpts so card rows remain aligned.
- Improve date and reading-time contrast while keeping metadata visually secondary.
- Keep tags compact, keyboard accessible, and visually quieter than the article title.
- Make the article title/image link and tag links semantically clear without nested or competing interactions.
- Preserve both light and dark themes and the existing article data.

### Explicitly Unchanged

- Header, profile hero, and Profile Highlights.
- Individual article reading pages.
- Pagination and tag archive pages.
- Article content, font families, and data sources.

### Approved Scope

- Implement the proposed responsive article-listing redesign.
- Keep the “View all articles” action green, replacing the proposed blue action treatment.
- Keep the dummy article fixture until its removal is explicitly requested.

### Implementation

- Files changed: `components/HomeArticles.jsx`, `components/Post/VerticalCard.jsx`, `components/Post/PostCategories.jsx`, `components/Post/PostDate.jsx`, and `components/Post/PostTags.jsx`.
- Removed the section and card dividers, nested wrappers, heavy shadows, and fixed red category treatment from the homepage listing.
- Added equal-height bordered cards with a stable 16:9 image, clamped titles and excerpts, restrained metadata, and compact outlined tags.
- Kept image/title links and tag links semantically separate.
- Added one phone column, two tablet columns, and three columns at wide desktop widths.
- Retained green for the “View all articles” action.
- Added card-only variants for shared category, date, and tag components so individual article pages remain visually unchanged.
- Preserved the dummy article fixture without modification.
- Added a Git-ignored `.env.local` with placeholders for `NOTION_KEY`, `NOTION_DATABASE_ID`, and the optional contact-form database ID.
- Validation: `npm run lint` passes with 13 pre-existing warnings and no errors.
- Validation: sandboxed `next build --webpack` passes; empty Notion credentials use the existing fallback behavior.
- Final visual acceptance: accepted by moving to Step 5.

## Dummy Article Fixture

The temporary article exists to make design work reviewable without relying on Notion.

- Metadata: `utils/dummyArticle.js`
- Markdown: `posts/designing-resilient-software-systems.md`
- Homepage integration: `pages/index.jsx`
- Article route integration: `pages/blog/[blog].jsx`

All integration points use the searchable marker:

```text
TODO(dummy-content)
```

When real content replaces the fixture, search for that marker and remove the guarded code and fixture files.

## Validation Checklist

Complete this checklist after each implementation step:

- [ ] The approved scope is the only visual area changed.
- [ ] Existing typography is preserved unless explicitly approved otherwise.
- [ ] Existing color identity is preserved unless explicitly approved otherwise.
- [ ] Small-phone layouts have been reviewed at 360 px and 390 px.
- [ ] Tablet layouts have been reviewed at 768 px and 1024 px.
- [ ] Desktop layout has been reviewed at 1440 px.
- [ ] There is no unintended horizontal page scrolling.
- [ ] Touch targets and mobile/tablet navigation are usable.
- [ ] Light theme remains readable.
- [ ] Dark theme remains readable.
- [ ] Keyboard and focus behavior remain usable.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] The updated step status and decision log are recorded below.

## Decision Log

| Date       | Area            | Decision or feedback                                                                          | Result                                                                                     |
| ---------- | --------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 2026-07-25 | Process         | Improve the website step-by-step, with an overview and approval before each implementation.   | Adopted as the working agreement.                                                          |
| 2026-07-25 | Visual identity | Preserve the current typography and variety of colors.                                        | Added as a design guardrail.                                                               |
| 2026-07-25 | Responsiveness  | Treat phone and tablet behavior as part of every roadmap step, not only the final pass.       | Added viewport-specific acceptance criteria.                                               |
| 2026-07-25 | Navigation      | Keep desktop navigation beside the theme switch and use a left-side drawer on phones/tablets. | Added to the approved Step 1 direction.                                                    |
| 2026-07-25 | Login           | Investigate the historical purpose before deciding whether to keep or remove it.              | Former owner-only WordPress authoring flow documented; final decision pending.             |
| 2026-07-25 | Login           | Remove the inactive Login label from the public header; reconsider authoring separately.      | Approved for Step 1.                                                                       |
| 2026-07-25 | Step 1          | Move forward to the next roadmap step after header implementation and validation.             | Header and navigation marked complete.                                                     |
| 2026-07-25 | Step 2          | Review the profile hero as the next contained improvement.                                    | Responsive profile hero proposal prepared.                                                 |
| 2026-07-25 | Step 2 content  | Replace temporary counts with professional facts and improve the supplied bio.                | Hero content rewritten and implemented.                                                    |
| 2026-07-25 | Step 2 feedback | Paragraph-heavy copy and separate metric cards felt unlike the intended portfolio direction.  | Restored icon-led bullets and consolidated facts into a restrained metrics band.           |
| 2026-07-25 | Step 2 styling  | Avoid excessive blue, center metric labels precisely, and use a neutral professional voice.   | Reduced blue to the primary action, realigned metrics, and rewrote all hero copy.          |
| 2026-07-25 | Step 2 styling  | Icons should match the text and highlights should not use separate card backgrounds.          | Removed icon containers and highlight backgrounds; retained subtle separators.             |
| 2026-07-25 | Step 2 outcome  | The revised hero still did not meet the intended visual direction; move to the next area.     | Step 2 deferred without visual acceptance.                                                 |
| 2026-07-25 | Step 3          | Begin the Profile Highlights improvement with the lessons from Step 2 carried forward.        | Restrained, content-led proposal prepared.                                                 |
| 2026-07-25 | Step 3          | Approve the proposed restrained, responsive Profile Highlights direction.                     | Implemented and moved to visual review.                                                    |
| 2026-07-25 | Step 3 voice    | The initial fallback copy sounded overly formal and generic.                                  | Rewritten in a direct, conversational, professional tone.                                  |
| 2026-07-25 | Step 3 content  | The revised copy explained architecture rather than highlighting the actual profile.          | Replaced with concrete career, domain, technology, delivery, and working-style highlights. |
| 2026-07-25 | Step 3 outcome  | Accept the revised career-focused highlights and move to the next roadmap step.               | Step 3 marked complete.                                                                    |
| 2026-07-25 | Step 4          | Move to the article-listing improvement after committing the accepted work.                   | Responsive article-card proposal prepared.                                                 |
| 2026-07-25 | Step 4 styling  | Keep the established green action color instead of replacing it with blue.                    | Green retained for the primary article-listing action.                                     |
| 2026-07-25 | Dummy content   | Keep the dummy article until its removal is explicitly requested.                             | Fixture preserved unchanged.                                                               |
| 2026-07-25 | Notion          | Add a safe local place for the Notion key and explain its use.                                | Git-ignored `.env.local` created with required placeholders.                               |
| 2026-07-25 | Step 4 outcome  | Accept the article-listing implementation and move to the next roadmap step.                  | Step 4 marked complete.                                                                    |
| 2026-07-25 | Content         | Use a removable dummy Markdown article rendered by the existing code.                         | Fixture added with `TODO(dummy-content)` markers.                                          |
| 2026-07-25 | Full redesign   | The initial complete redesign changed too much at once and was rejected.                      | Reverted; incremental review process adopted.                                              |

## Update Template

Copy this block when starting a new step:

```markdown
### Step N — Area

- Status: `Proposed`
- Goal:
- Proposed changes:
- Explicitly unchanged:
- Feedback:
- Approved scope:
- Files changed:
- Validation:
- Final decision:
```
