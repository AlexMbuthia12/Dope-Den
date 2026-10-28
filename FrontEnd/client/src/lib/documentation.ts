export interface DocSection {
  id: string;
  title: string;
  description?: string;
  subsections: DocSubsection[];
}

export interface DocSubsection {
  id: string;
  title: string;
  content: string;
}

export const documentation: DocSection[] = [
  {
    id: "overview",
    title: "1. Product Overview",
    description: "Purpose, target audience, and core value proposition",
    subsections: [
      {
        id: "purpose",
        title: "Purpose",
        content: `This document outlines the requirements, architecture, and design principles for the frontend of a modern e-commerce clothing store. The application is designed to deliver a high-performance, responsive, and visually appealing user experience akin to industry leaders like FashionNova. It will be built using React and Vite, and will communicate with a Java Spring Boot backend via RESTful APIs.`,
      },
      {
        id: "target-audience",
        title: "Target Audience",
        content: `Fashion-conscious consumers looking for a seamless, fast, and intuitive online shopping experience across desktop, tablet, and mobile devices.`,
      },
    ],
  },
  {
    id: "architecture",
    title: "2. Architecture & Technology Stack",
    description: "Frontend technologies, state management, and backend integration",
    subsections: [
      {
        id: "frontend-technologies",
        title: "Frontend Technologies",
        content: `The application will leverage a modern, high-performance technology stack designed for scalability and rapid development:

- **Core Framework:** React 18+ (Functional Components & Hooks)
- **Build Tool:** Vite (for rapid HMR and optimized production builds)
- **Language:** TypeScript (for type safety and self-documenting code)
- **Routing:** React Router DOM v6+
- **Styling:** Tailwind CSS (utility-first framework for rapid UI development and layout optimization)
- **Icons:** Lucide React or Heroicons`,
      },
      {
        id: "state-management",
        title: "State Management & Data Fetching",
        content: `State management is divided into server state and client state:

- **Server State (API):** TanStack Query (React Query) for caching, background updates, and pagination of backend data.
- **Client State (Global):** Zustand or Redux Toolkit for managing global UI state (e.g., cart drawer visibility, user authentication status, theme preferences).
- **Local State:** React useState and useReducer for component-specific state.`,
      },
      {
        id: "backend-integration",
        title: "Backend Integration",
        content: `Communication with the Java Spring Boot backend will be facilitated by a custom service layer wrapping either Axios or the native fetch API. This ensures all network requests are standardized and centralized.

- **API Client:** Axios or native fetch wrapped in a custom service layer.
- **Backend:** Java Spring Boot (REST APIs).`,
      },
    ],
  },
  {
    id: "layout-optimization",
    title: "3. Layout Optimization & UI/UX Principles",
    description: "Responsive design, component reusability, and performance strategies",
    subsections: [
      {
        id: "layout-strategies",
        title: "Layout Optimization Strategies",
        content: `Extensive use of CSS Grid is required for the main product display area to ensure perfect alignment and fluid resizing across varying screen dimensions. Flexbox will be utilized for navigation bars, toolbars, and internal component alignment where content dictates the sizing.

**Responsive Breakpoints:**
- Mobile (< 768px): Hidden sidebar, hamburger menu, 1-2 column product grid.
- Tablet (768px - 1024px): Collapsible sidebar, 3 column product grid.
- Desktop (> 1024px): Persistent sidebar, 4-5 column product grid (adjustable via UI controls).

**Performance Optimization:**
- Virtualization / Infinite Scroll: Implement windowing for the product grid if the catalog size per page is exceptionally large.
- Image Optimization: Lazy loading for all product images using the loading="lazy" attribute and modern formats (WebP) served via a CDN.`,
      },
      {
        id: "component-reusability",
        title: "Component Reusability (Atomic Design Approach)",
        content: `To maintain a scalable and maintainable codebase, components will be structured hierarchically following the Atomic Design methodology:

- **Atoms:** Buttons, Inputs, Badges, Icons, Typography elements.
- **Molecules:** Search Bar, Product Card, Breadcrumbs, Pagination Controls.
- **Organisms:** Header Navigation, Sidebar Filter Panel, Product Grid.
- **Templates:** Base Layout (Header + Main Content Area + Footer).
- **Pages:** Product Listing Page (PLP), Product Detail Page (PDP), Home Page.`,
      },
    ],
  },
  {
    id: "core-features",
    title: "4. Core Features & Page Specifications",
    description: "Global elements and Product Listing Page details",
    subsections: [
      {
        id: "global-elements",
        title: "Global Elements",
        content: `The application features several persistent global elements:

**Top Promo Banner:** A slim, dismissible banner at the very top for promotions (e.g., "Spend $75 or more to unlock FREE SHIPPING!").

**Mega Header:**
- Brand Logo: Left-aligned.
- Primary Navigation: Top-level categories (WOMEN, PLUS+CURVE, MEN, SPORT, KIDS).
- Secondary Navigation: Sub-categories (NEW IN, CLOTHING, SWIMWEAR, etc.) functioning as a sticky sub-header.
- Global Search: Prominent search bar with optional image search capability.
- User Actions: Locale selector, Order History, User Account, Wishlist, and Cart (with badge indicating item count).`,
      },
      {
        id: "product-listing-page",
        title: "Product Listing Page (PLP)",
        content: `The Product Listing Page is the core browsing experience, featuring a complex and data-rich layout:

**Page Header:** Displays the current category title (e.g., "NEW ARRIVALS") and total product count.

**Breadcrumbs:** Clear hierarchical navigation (e.g., Women > New Arrivals).

**Toolbar:**
- Sort By: Dropdown for sorting (Featured, Price: Low to High, Price: High to Low, Newest).
- Show Quantity: Items per page selector (e.g., 60, 120).
- View Toggle: Icons to switch between different grid densities (2, 3, 4, or 5 items per row).

**Sidebar Filter Panel (Left):**
- Search within current category.
- Accordion-style filter groups: Category, Size, Color, Price Range, Brand.

**Product Grid (Main Content):**
- Displays ProductCard components.
- Each card includes: High-quality image, promotional badge, hover effects, and Quick Add-to-Cart functionality.`,
      },
    ],
  },
  {
    id: "api-integration",
    title: "5. API Integration & Data Contracts",
    description: "RESTful endpoints and data contracts for Spring Boot backend",
    subsections: [
      {
        id: "product-catalog-api",
        title: "Product Catalog API",
        content: `**GET /api/v1/products**
- Query Params: category, size, color, sort, page, limit, search
- Response: Paginated list of product objects, total count, available filters (facets) based on current query.

**GET /api/v1/products/{id}**
- Response: Detailed product information, multiple image URLs, inventory status per size/color.`,
      },
      {
        id: "categories-api",
        title: "Categories & Navigation API",
        content: `**GET /api/v1/categories**
- Response: Hierarchical tree of categories for building the mega menu and sidebar.`,
      },
      {
        id: "cart-user-apis",
        title: "Cart & User APIs (Future Implementation)",
        content: `**GET /api/v1/cart**, **POST /api/v1/cart/items**
- Manage user shopping cart.

**POST /api/v1/auth/login**, **GET /api/v1/users/me**
- User authentication and profile management.`,
      },
    ],
  },
  {
    id: "non-functional-requirements",
    title: "6. Non-Functional Requirements",
    description: "Performance, accessibility, and SEO standards",
    subsections: [
      {
        id: "performance",
        title: "Performance",
        content: `**Core Web Vitals:** Aim for LCP (Largest Contentful Paint) < 2.5s, FID (First Input Delay) < 100ms, and CLS (Cumulative Layout Shift) < 0.1.

**Code Splitting:** Utilize React lazy and Suspense to split code by route, ensuring the initial bundle size remains small.

**Caching:** Leverage React Query to cache API responses and prevent redundant network requests during navigation.`,
      },
      {
        id: "accessibility",
        title: "Accessibility (a11y)",
        content: `**Semantic HTML:** Use proper HTML5 elements (<nav>, <main>, <aside>).

**ARIA Attributes:** Ensure complex components like the Mega Menu and Filter Accordions have appropriate ARIA roles and states.

**Keyboard Navigation:** All interactive elements (filters, product cards, cart) must be fully navigable via keyboard.`,
      },
      {
        id: "seo",
        title: "SEO",
        content: `**Meta Tags:** Use react-helmet-async to dynamically update page titles and meta descriptions based on the current category or product.

**Server-Side Rendering (Optional):** If SEO is highly critical, consider migrating Vite to a framework like Next.js or Remix in the future, or implement pre-rendering strategies.`,
      },
    ],
  },
  {
    id: "development-workflow",
    title: "7. Development Workflow",
    description: "Step-by-step implementation guide",
    subsections: [
      {
        id: "workflow-steps",
        title: "Implementation Steps",
        content: `1. **Environment Setup:** Initialize Vite React TS project, configure ESLint, Prettier, and Tailwind CSS.

2. **Component Library:** Build foundational UI components (Atoms & Molecules) in isolation (consider using Storybook).

3. **Layout Construction:** Develop the global Header, Footer, and standard page templates.

4. **PLP Implementation:** Build the Sidebar Filters, Product Grid, and Toolbar.

5. **State & API Integration:** Connect UI components to React Query hooks to fetch mock data, eventually swapping to the live Spring Boot API.

6. **Optimization & Testing:** Perform responsive testing, accessibility audits, and performance profiling.`,
      },
    ],
  },
];

export const getDocumentationIndex = (): Array<{ id: string; title: string }> => {
  return documentation.map((section) => ({
    id: section.id,
    title: section.title,
  }));
};

export const getSection = (sectionId: string): DocSection | undefined => {
  return documentation.find((section) => section.id === sectionId);
};

export const getAllSubsections = (): Array<{
  sectionId: string;
  sectionTitle: string;
  id: string;
  title: string;
}> => {
  const result: Array<{
    sectionId: string;
    sectionTitle: string;
    id: string;
    title: string;
  }> = [];

  documentation.forEach((section) => {
    section.subsections.forEach((subsection) => {
      result.push({
        sectionId: section.id,
        sectionTitle: section.title,
        id: subsection.id,
        title: subsection.title,
      });
    });
  });

  return result;
};
