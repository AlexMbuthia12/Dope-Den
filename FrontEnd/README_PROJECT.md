# E-Commerce PRD Documentation Site

A modern, interactive documentation platform for your e-commerce frontend PRD, combined with a live e-commerce store layout showcase.

## 🎯 What's Inside

This project contains **two main experiences**:

### 1. **E-Commerce Store Layout** (Home Page - `/`)
A fully functional e-commerce store interface featuring:
- **Promo banner** with free shipping offer
- **Mega header** with logo, search, and user actions
- **Category navigation** (NEW IN, CLOTHING, SWIMWEAR, etc.)
- **Sidebar filters** (Category, Size, Color)
- **Product grid** with 4 columns (responsive)
- **40% OFF badges** and "Quick Add" buttons
- **Sort & view controls** (Sort by Featured, Show 60/120, Grid toggle)

### 2. **PRD Documentation** (`/docs`)
A searchable, team-friendly technical reference featuring:
- **7 main sections** covering the entire PRD
- **Sidebar navigation** with collapsible sections
- **Global search** with section filtering
- **Light/Dark theme toggle**
- **Copy-to-clipboard** for code blocks
- **"On this page"** quick links for subsections

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **pnpm** (or npm/yarn)
- **VS Code** (optional but recommended)

### Installation

```bash
# 1. Navigate to the project directory
cd ecommerce-prd-docs

# 2. Install dependencies
pnpm install

# 3. Start the development server
pnpm dev
```

The site will be available at `http://localhost:3000`

---

## 📂 Project Structure

```
ecommerce-prd-docs/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Store.tsx              ← E-commerce home page
│   │   │   ├── Documentation.tsx      ← PRD docs page
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx             ← Global header
│   │   │   ├── Sidebar.tsx            ← Docs navigation
│   │   │   └── DocumentationContent.tsx
│   │   ├── lib/
│   │   │   └── documentation.ts       ← PRD content
│   │   ├── App.tsx                    ← Routes
│   │   └── index.css                  ← Global styles
│   ├── index.html
│   └── public/
├── ecommerce-prd-docs.code-workspace  ← VS Code workspace
├── VSCODE_SETUP.md                    ← VS Code guide
└── README_PROJECT.md                  ← This file
```

---

## 🔗 Routes

| URL | Page | Description |
|-----|------|-------------|
| `/` | Store | E-commerce store layout showcase |
| `/docs` | Documentation | PRD documentation with search |

---

## 🎨 Design Features

### Store Page
- **Responsive layout** (mobile, tablet, desktop)
- **Sidebar filters** with checkboxes and size grid
- **Product cards** with hover effects
- **Quick Add buttons** on hover
- **Discount badges** (40% OFF)
- **Sort & view controls**

### Documentation Page
- **Sticky header** with search bar
- **Collapsible sidebar** navigation
- **Dark/Light theme toggle**
- **Copy-to-clipboard** for code blocks
- **"On this page"** quick navigation
- **Professional typography** (Inter + JetBrains Mono)

---

## 🛠 Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool with HMR
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **React Router (Wouter)** - Routing
- **Lucide React** - Icons

---

## 📝 Editing the Content

### Update the Store Layout
Edit `client/src/pages/Store.tsx` to modify:
- Product data
- Categories
- Filter options
- Layout structure

### Update PRD Documentation
Edit `client/src/lib/documentation.ts` to modify:
- Section titles and descriptions
- Subsection content
- Add new sections

---

## 🌙 Theme Support

The site includes a **light/dark theme toggle** in the header. Customize colors in:
- `client/src/index.css` - CSS variables for colors

---

## 📦 Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Format code with Prettier
pnpm format

# Type check
pnpm check
```

---

## 🔧 VS Code Integration

### Open in VS Code

```bash
code ecommerce-prd-docs.code-workspace
```

### Recommended Extensions
- Prettier (esbenp.prettier-vscode)
- ESLint (dbaeumer.vscode-eslint)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)

See `VSCODE_SETUP.md` for detailed setup instructions.

---

## 🚀 Next Steps

1. **Customize the store** - Edit product data in `Store.tsx`
2. **Update PRD content** - Edit sections in `documentation.ts`
3. **Add more pages** - Create new files in `client/src/pages/`
4. **Connect to backend** - Replace mock data with API calls
5. **Deploy** - Build and deploy to your hosting platform

---

## 📚 Documentation

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [TypeScript Documentation](https://www.typescriptlang.org)

---

## 📄 License

This project is created for your e-commerce frontend reference and documentation.

---

## 💡 Tips

- **Hot Reload**: Changes to files are automatically reflected in the browser
- **Search**: Use the search bar on the `/docs` page to find specific PRD sections
- **Theme**: Toggle between light and dark themes using the icon in the header
- **Mobile**: The layout is fully responsive and works on all devices

---

For questions or issues, refer to `VSCODE_SETUP.md` for troubleshooting tips.
