# Design System Rules - Installation 2026

> This document provides comprehensive design system rules for integrating Figma designs into this Next.js project using the Model Context Protocol.

---

## 1. Token Definitions

### CSS Variables (Global Design Tokens)

**Location:** `src/app/globals.css`

```css
:root {
  --background: #fff462;
  --foreground: #171717;
  --font-noto-sans-jp: [loaded via Next.js font];
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-noto-sans-jp);
}
```

### Color Palette

#### Primary Colors
| Token | Hex Value | Usage |
|-------|-----------|-------|
| Background Yellow | `#fff462` | Main background |
| Primary Blue | `#2d9cdb` | Buttons, interactive elements |
| Primary Blue Hover | `#2589c5` | Button hover state |
| Orange Accent | `#ef7314` | Frames, emphasis |
| Light Box BG | `rgba(255,244,98,0.6)` | Semi-transparent containers |
| Foreground | `#171717` | Default text |

#### Bodai Theme System (12 Themes)
**Location:** `src/data/bodaiList.ts`

Each Bodai has unique colors:

| Bodai | Name | Background Gradient | Text Color |
|-------|------|---------------------|------------|
| 月 | Moon | `#e6eeff` → `#ffffff` | `#373174` |
| 火 | Fire | `#ffcccc` → `#ffffff` | `#891700` |
| 空 | Sky | `#d9f2ff` → `#ffffff` | `#004989` |
| 山 | Mountain | `#d9f2d9` → `#ffffff` | `#005E27` |
| 稲穂 | Rice | `#f2e6d9` → `#ffffff` | `#7C5C35` |
| 泉 | Spring | `#ccffe6` → `#ffffff` | `#135699` |
| 川 | River | `#d9e6f2` → `#ffffff` | `#004C72` |
| 大地 | Earth | `#e6ccb3` → `#ffffff` | `#683927` |
| 観音 | Kannon | `#ffe6f2` → `#ffffff` | `#680052` |
| 風 | Wind | `#e6ffe6` → `#ffffff` | `#00450C` |
| 海 | Sea | `#cce6ff` → `#ffffff` | `#261660` |
| 太陽 | Sun | `#ffffcc` → `#ffffff` | `#802200` |

### Typography

**Font Family:** Noto Sans JP
- Weights: 400 (Regular), 500 (Medium), 700 (Bold)
- Loaded via Next.js `next/font/google`

**Font Loading Pattern:**
```tsx
import { Noto_Sans_JP } from 'next/font/google';

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
});
```

---

## 2. Component Library

### Component Location
All UI components are in `src/components/`

### Available Components

| Component | File | Purpose |
|-----------|------|---------|
| LoginForm | `LoginForm.tsx` | Main authentication form |
| TextFieldCard | `TextFieldCard.tsx` | Reusable input field with validation |
| BackgroundPattern | `BackgroundPattern.tsx` | Decorative cross pattern element |
| Main | `Main.tsx` | Post-login display screen |

### Component Props Interface

**TextFieldCard:**
```tsx
interface TextFieldCardProps {
  variant: 'top' | 'bottom';
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  error?: string;
  errorClassName?: string;
}
```

**Main:**
```tsx
interface MainProps {
  phraseData: PhraseResponse;
  bodai: Bodai[];
}
```

### Component Usage Example
```tsx
<TextFieldCard
  variant="top"
  label="会員番号(CA番号)を入力ください。"
  value={memberId}
  onChange={handleMemberIdChange}
  placeholder="会員番号(CA番号)を入力ください。"
  error={memberIdError}
/>
```

---

## 3. Frameworks & Libraries

### Core Stack
| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.0.10 | React framework (App Router) |
| React | 19.2.1 | UI library |
| Tailwind CSS | 4.x | Utility-first CSS |
| TypeScript | 5.x | Type safety |

### Build Tools
- **Bundler:** Next.js (Turbopack)
- **CSS Processing:** PostCSS with `@tailwindcss/postcss`
- **Linting:** ESLint with `eslint-config-next`

### Package.json Dependencies
```json
{
  "dependencies": {
    "next": "16.0.10",
    "react": "19.2.1",
    "react-dom": "19.2.1"
  },
  "devDependencies": {
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 4. Asset Management

### Asset Structure
```
src/assets/img/
├── icon_*.png          # Bodai icons (12 total)
├── bg_*.png            # Bodai backgrounds (12 total)
├── main-title.png      # Main title logo
├── icon_change.svg     # Background change button icon
├── icon_operation.svg  # Operation guide icon
└── guide_inaho-01.png  # Instructional guide

public/images/
└── bigcross.png        # Decorative cross pattern
```

### Import Pattern (Static Imports)
```tsx
// Use path aliases for imports
import mainTitle from '@/assets/img/main-title.png';
import iconOperation from '@/assets/img/icon_operation.svg';

// Usage with Next.js Image
<Image
  src={mainTitle}
  alt="title"
  className="w-full h-auto"
  priority
/>
```

### Image Optimization Guidelines
- Always use Next.js `<Image>` component
- Use `priority` for above-fold images
- Use `fill` with `sizes` for responsive images
- Use static imports for type safety

```tsx
// Responsive image pattern
<Image
  src={currentBodai.img}
  alt={currentBodai.name}
  fill
  sizes="102px"
  className="object-contain"
/>
```

---

## 5. Icon System

### Icon Storage
All icons are stored as PNG/SVG files in `src/assets/img/`

### Icon Naming Convention
- Format: `icon_{name}.{png|svg}`
- Bodai icons: `icon_rice.png`, `icon_fire.png`, `icon_earth.png`, etc.
- UI icons: `icon_change.svg`, `icon_operation.svg`

### Icon Import Pattern
```tsx
import { StaticImageData } from 'next/image';
import iconRice from '@/assets/img/icon_rice.png';
import iconFire from '@/assets/img/icon_fire.png';
// ... additional icons
```

### Icon Usage in Components
```tsx
<div className="relative w-[102px] h-[102px]">
  <Image
    src={iconImage}
    alt={iconName}
    fill
    sizes="102px"
    className="object-contain"
  />
</div>
```

---

## 6. Styling Approach

### CSS Methodology: Tailwind CSS v4 with Inline Theme

**Global Styles:** `src/app/globals.css`
```css
@import "tailwindcss";

:root {
  --background: #fff462;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-noto-sans-jp);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-noto-sans-jp), "Noto Sans JP", sans-serif;
}
```

### Tailwind Class Patterns

**Layout:**
```tsx
// Flexbox centering
className="flex items-center justify-center"

// Container sizing
className="w-full max-w-120 px-4 py-4"
```

**Typography:**
```tsx
className="font-medium text-sm text-center"
```

**Colors (Arbitrary Values):**
```tsx
// Background
className="bg-[#fff462]"

// Text
className="text-[#6d4000]"

// Border
className="border-[#ef7314]"
```

**Interactive States:**
```tsx
className="hover:bg-[#2589c5] transition-colors disabled:opacity-60"
```

### Responsive Design: sizeClamp() Utility

**Location:** `src/lib/css.ts`

```tsx
export function sizeClamp(
  minPx: number,           // Minimum size in pixels
  maxPx: number,           // Maximum size in pixels
  minVwPx = 390,          // Min viewport (default: iPhone 12/13)
  maxVwPx = 1206,         // Max viewport
  rootFontSizePx = 16
): string
```

**Usage:**
```tsx
// Fluid width
style={{ width: sizeClamp(340, 500) }}

// Fluid font size
style={{ fontSize: sizeClamp(16, 18, 390, 1206) }}
```

### Additional CSS Utilities
```tsx
// Convert pixels to rem
export function rem(px: number): string

// Convert pixels to em
export function em(px: number): string
```

---

## 7. Project Structure

```
installation2026/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with font setup
│   │   ├── page.tsx            # Home/login page
│   │   ├── globals.css         # Global styles & design tokens
│   │   ├── main/page.tsx       # Post-login main screen
│   │   └── debug/page.tsx      # Debug/demo page
│   │
│   ├── components/             # Reusable UI components
│   │   ├── LoginForm.tsx
│   │   ├── TextFieldCard.tsx
│   │   ├── BackgroundPattern.tsx
│   │   └── Main.tsx
│   │
│   ├── lib/                    # Utility functions
│   │   ├── api.ts              # API client
│   │   ├── css.ts              # CSS utilities (sizeClamp, rem, em)
│   │   ├── storage.ts          # localStorage management
│   │   ├── validators.ts       # Form validation
│   │   └── lang.ts             # Language detection
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useLoginForm.ts
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── bodai.ts
│   │
│   ├── data/                   # Static data files
│   │   ├── bodaiList.ts        # Bodai themes configuration
│   │   └── branchList.ts       # Branch name mappings
│   │
│   └── assets/img/             # Static images (imported)
│
├── public/images/              # Static assets (public path)
├── package.json
├── tsconfig.json               # TypeScript config with path aliases
├── postcss.config.mjs
├── next.config.ts
└── eslint.config.mjs
```

### Path Aliases
```json
// tsconfig.json
{
  "paths": {
    "@/*": ["./src/*"],
    "@/assets/*": ["./src/assets/*"]
  }
}
```

---

## 8. Design Patterns & Best Practices

### State Management
- Use React hooks (`useState`, `useEffect`) for component state
- Use `sessionStorage` for temporary post-login data
- Use `localStorage` with TTL for persistent data (e.g., "remember me")
- Extract complex logic into custom hooks (e.g., `useLoginForm`)

### Form Handling Pattern
```tsx
// Custom hook pattern
const {
  memberId,
  memberIdError,
  handleMemberIdChange,
  // ... other fields
} = useLoginForm();
```

### API Integration
**Location:** `src/lib/api.ts`

```tsx
interface PhraseResponse {
  bodai_no: number;
  // ... other fields
}

export async function fetchPhrase(userId: string): Promise<PhraseResponse>
```

### Error Handling
- Form validation: Use `validators.ts` utilities
- API errors: Handle codes 400 (not found), 401 (invalid user)
- Graceful fallbacks: Redirect on unrecoverable errors

### Internationalization
**Location:** `src/lib/lang.ts`

```tsx
type SupportedLang = 'ja' | 'en' | 'pt';
export function getPreferredLang(): SupportedLang
```

---

## 9. Figma Integration Guidelines

### When Converting Figma Designs:

1. **Colors:** Map Figma colors to existing tokens or use Tailwind arbitrary values `bg-[#hexcode]`

2. **Typography:** Use Noto Sans JP font family with weights 400, 500, 700

3. **Spacing:** Use Tailwind spacing utilities or `sizeClamp()` for fluid sizing

4. **Components:** Create new components in `src/components/` following existing patterns

5. **Images:**
   - Add to `src/assets/img/` for imported assets
   - Use Next.js `<Image>` component
   - Follow naming convention: `{type}_{name}.{ext}`

6. **Responsive:** Use `sizeClamp()` utility for fluid responsive values targeting 390px-1206px viewports

7. **Themes:** If implementing new themes, follow the Bodai data structure pattern in `src/data/bodaiList.ts`

### Example: Creating a New Component from Figma

```tsx
// src/components/NewComponent.tsx
import Image from 'next/image';
import { sizeClamp } from '@/lib/css';

interface NewComponentProps {
  title: string;
  icon: StaticImageData;
}

export function NewComponent({ title, icon }: NewComponentProps) {
  return (
    <div
      className="flex items-center gap-3 bg-[#fff462] rounded-lg px-4 py-3"
      style={{ width: sizeClamp(300, 450) }}
    >
      <div className="relative w-12 h-12">
        <Image
          src={icon}
          alt={title}
          fill
          sizes="48px"
          className="object-contain"
        />
      </div>
      <span
        className="font-medium text-[#171717]"
        style={{ fontSize: sizeClamp(14, 18) }}
      >
        {title}
      </span>
    </div>
  );
}
```

---

## 10. File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `LoginForm.tsx` |
| Hooks | camelCase with `use` prefix | `useLoginForm.ts` |
| Utilities | camelCase | `validators.ts` |
| Types | camelCase | `bodai.ts` |
| Data files | camelCase with `List` suffix | `bodaiList.ts` |
| Images (icons) | snake_case with `icon_` prefix | `icon_rice.png` |
| Images (backgrounds) | snake_case with `bg_` prefix | `bg_inaho.png` |
| Pages | Next.js convention | `page.tsx` |

---

## Quick Reference

### Import Shortcuts
```tsx
import { sizeClamp, rem, em } from '@/lib/css';
import { fetchPhrase } from '@/lib/api';
import { getPreferredLang } from '@/lib/lang';
import { is8DigitNumber } from '@/lib/validators';
import { bodaiList } from '@/data/bodaiList';
import type { Bodai } from '@/types/bodai';
```

### Common Tailwind Patterns
```tsx
// Button
className="bg-[#2d9cdb] text-white font-medium py-3 px-6 rounded-lg hover:bg-[#2589c5] transition-colors disabled:opacity-60"

// Card container
className="bg-white/60 rounded-xl p-4 border-2 border-[#ef7314]"

// Centered layout
className="min-h-screen flex flex-col items-center justify-center"

// Responsive width
className="w-[95%] max-w-[343px]"
```
