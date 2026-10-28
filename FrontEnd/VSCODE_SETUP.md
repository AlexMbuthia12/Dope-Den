# VS Code Setup Guide

## Quick Start

### 1. Clone or Download the Project

```bash
# If using Git
git clone <your-repo-url> ecommerce-prd-docs
cd ecommerce-prd-docs

# Or download the ZIP and extract it
```

### 2. Open in VS Code

**Option A: Open the Workspace File (Recommended)**
```bash
code ecommerce-prd-docs.code-workspace
```

**Option B: Open the Folder**
```bash
code .
```

### 3. Install Dependencies

Open the integrated terminal in VS Code (`Ctrl + ~` or `Cmd + ~`) and run:

```bash
pnpm install
```

### 4. Start Development Server

In the VS Code terminal, run:

```bash
pnpm dev
```

The dev server will start at `http://localhost:3000`

---

## Project Structure

```
ecommerce-prd-docs/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Store.tsx          ← Home page (e-commerce layout)
│   │   │   ├── Documentation.tsx   ← PRD docs page (/docs route)
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── DocumentationContent.tsx
│   │   ├── lib/
│   │   │   └── documentation.ts    ← PRD content data
│   │   ├── App.tsx                 ← Routes definition
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   └── public/
├── server/
├── package.json
└── ecommerce-prd-docs.code-workspace
```

---

## Key Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | `Store.tsx` | E-commerce store layout (home page) |
| `/docs` | `Documentation.tsx` | PRD documentation |
| `/404` | `NotFound.tsx` | 404 page |

---

## Recommended VS Code Extensions

The workspace file includes recommendations for:

1. **Prettier** - Code formatter
2. **ESLint** - Linting
3. **Tailwind CSS IntelliSense** - CSS class suggestions
4. **MDX** - Markdown support
5. **TypeScript** - Enhanced TypeScript support

Install them by clicking the "Install" button in the Extensions panel when prompted.

---

## Development Workflow

### Making Changes

1. **Edit files** in `client/src/` (pages, components, styles)
2. **Save** - Prettier will auto-format on save
3. **Hot Reload** - Vite will automatically refresh the browser

### Adding New Pages

1. Create a new file in `client/src/pages/MyPage.tsx`
2. Add the route in `client/src/App.tsx`:
   ```tsx
   <Route path={"/my-page"} component={MyPage} />
   ```
3. The page will be automatically available at `/my-page`

### Updating PRD Content

1. Edit `client/src/lib/documentation.ts`
2. Update the `documentation` array with new sections/subsections
3. Changes will be reflected immediately in `/docs`

### Styling

- Use **Tailwind CSS** utility classes
- Global styles are in `client/src/index.css`
- Color scheme is defined in CSS variables (light/dark theme support)

---

## Debugging

### Browser DevTools

1. Press `F12` in the browser to open DevTools
2. Check the **Console** tab for errors
3. Use the **Network** tab to inspect API calls

### VS Code Debugger

The workspace includes a launch configuration for debugging. Press `F5` to start debugging.

---

## Building for Production

```bash
pnpm build
```

This creates an optimized production build in the `dist/` folder.

---

## Useful Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build locally
pnpm preview

# Format code with Prettier
pnpm format

# Type check
pnpm check
```

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
pnpm dev -- --port 3001
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Hot Reload Not Working

1. Save the file again
2. Refresh the browser manually (`Ctrl + R` or `Cmd + R`)
3. Restart the dev server: `pnpm dev`

---

## Next Steps

1. **Customize the store layout** - Edit `client/src/pages/Store.tsx`
2. **Update PRD documentation** - Edit `client/src/lib/documentation.ts`
3. **Add more pages** - Create new files in `client/src/pages/`
4. **Connect to backend** - Update API calls in components (currently using mock data)
5. **Deploy** - Use the Manus platform or export to GitHub

---

For more help, check the comments in the code files or refer to the official documentation:
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
