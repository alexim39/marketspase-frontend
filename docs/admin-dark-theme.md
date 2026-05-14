# Admin Dark Theme Guide

The admin app now uses a shared dark-theme SCSS foundation so new screens can match the existing MCC look and feel without repeating color and layout decisions.

## Theme entrypoints

- Global theme bootstrap: `C:/Projects/marketspase-workspace/marketspase/projects/admin/src/styles.scss`
- Shared theme partial: `C:/Projects/marketspase-workspace/marketspase/projects/admin/src/styles/_admin-theme.scss`
- Angular include path: `angular.json` now exposes `projects/admin/src/styles`, so component SCSS can import the shared theme with:

```scss
@use 'admin-theme' as admin;
```

## Available mixins

The shared partial exposes the core building blocks used in the admin shell and the main operations pages:

- `@include admin.page-shell($padding)`  
  Standard page spacing and vertical rhythm.

- `@include admin.surface-frame($radius, $shadow)`  
  Dark elevated panel shell without padding.

- `@include admin.surface-card($padding, $radius, $shadow)`  
  Dark elevated panel shell with padding.

- `@include admin.panel-header()`  
  Standard flex header layout for page and panel headings.

- `@include admin.section-eyebrow($color)`  
  Uppercase section kicker styling.

- `@include admin.input-control()`  
  Shared dark input, select, and textarea treatment.

- `@include admin.button(primary | surface | ghost | danger)`  
  Shared button variants used across the admin app.

- `@include admin.hover-lift($translate)`  
  Reusable hover treatment for cards, rows, and quick links.

## Recommended pattern for new components

Use the shared mixins first, then add page-specific layout on top:

```scss
@use 'admin-theme' as admin;

.page-shell {
  @include admin.page-shell(1.5rem);
}

.panel {
  @include admin.surface-card(1.25rem);
}

.panel-header {
  @include admin.panel-header();
}

.save-btn {
  @include admin.button(primary);
}

.field input,
.field select,
.field textarea {
  @include admin.input-control();
}
```

## Styling rules going forward

1. Prefer theme mixins over hardcoded hex values.
2. Use CSS variables from the shared theme for one-off colors before introducing new values.
3. Keep new admin screens on dark surfaces by default.
4. Avoid inline styles in `index.html`; global visuals should live in `styles.scss` or the shared partial.
5. If a new reusable visual pattern shows up more than once, add it to `_admin-theme.scss` instead of copying it between components.

## Current themed surfaces

The shared dark foundation is already applied to:

- admin shell sidebar/header/search
- admin login screen
- dashboard overview
- community operations desk
- payment settings
- login streak settings
- badge settings
- gamification settings
- storefront review moderation
- storefront delivery release review
- finance management core surfaces

This is the baseline future admin screens should follow.
