import { ShoppingCart, User, Home, Menu, X, ShieldCheck, Truck, RefreshCw, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, type ReactNode } from "react";

type DefaultLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export default function DefaultLayout({ children, title, subtitle }: DefaultLayoutProps) {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/40 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setLocation("/")}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <span className="text-base font-black tracking-wider">D</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              DopeDen
            </h1>
          </div>

          <nav className="hidden sm:flex items-center gap-1.5 lg:gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg"
              onClick={() => setLocation("/")}
            >
              <Home size={17} className="text-indigo-500" />
              <span>Home</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg"
              onClick={() => setLocation("/profile")}
            >
              <User size={17} className="text-violet-500" />
              <span>Profile</span>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg relative"
              onClick={() => setLocation("/cart")}
            >
              <ShoppingCart size={17} className="text-pink-500" />
              <span>Cart</span>
              <span className="absolute -top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm shadow-indigo-600/40">
                3
              </span>
            </Button>
          </nav>

          <div className="flex sm:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-slate-700 dark:text-slate-300"
              onClick={() => setLocation("/cart")}
              aria-label="Cart"
            >
              <ShoppingCart size={20} className="text-pink-500" />
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                3
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-700 dark:text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 py-4 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600"
                onClick={() => { setMobileMenuOpen(false); setLocation("/"); }}
              >
                <Home size={18} className="text-indigo-500" />
                <span>Home</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600"
                onClick={() => { setMobileMenuOpen(false); setLocation("/profile"); }}
              >
                <User size={18} className="text-violet-500" />
                <span>Profile</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600"
                onClick={() => { setMobileMenuOpen(false); setLocation("/cart"); }}
              >
                <ShoppingCart size={18} className="text-pink-500" />
                <span>Cart (3)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* CONTENT BODY */}
      <div className="flex-1">
        {(title || subtitle) && (
          <div className="mb-8 pt-24 px-4 sm:px-6 lg:px-8">
            {title && <h2 className="mb-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h2>}
            {subtitle && <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        )}

        {children}
      </div>

      {/* Added comprehensive responsive footer per requirements */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Footer Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Truck size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Fast Delivery</h4>
                <p className="text-xs text-slate-500">Countrywide shipping</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Secure Payments</h4>
                <p className="text-xs text-slate-500">100% protected checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <RefreshCw size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Easy Returns</h4>
                <p className="text-xs text-slate-500">Hassle-free exchange policy</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <HeartHandshake size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">24/7 Support</h4>
                <p className="text-xs text-slate-500">Dedicated assistance</p>
              </div>
            </div>
          </div>

          {/* Footer Links & Branding */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm">
                  D
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">DopeDen</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Your premier destination for exclusive drops, premium streetwear, footwear, and curated seasonal style.
              </p>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Quick Links</h5>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => setLocation("/")} className="hover:text-indigo-600 transition-colors">Home Store</button></li>
                <li><button onClick={() => setLocation("/cart")} className="hover:text-indigo-600 transition-colors">Shopping Cart</button></li>
                <li><button onClick={() => setLocation("/profile")} className="hover:text-indigo-600 transition-colors">My Profile & Admin</button></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Categories</h5>
              <ul className="space-y-2 text-xs">
                <li><span className="hover:text-indigo-600 cursor-pointer">Apparel & Hoodies</span></li>
                <li><span className="hover:text-indigo-600 cursor-pointer">Footwear & Sneakers</span></li>
                <li><span className="hover:text-indigo-600 cursor-pointer">Accessories & Gear</span></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Stay Updated</h5>
              <p className="text-xs text-slate-500 mb-3">Subscribe for exclusive releases and deals of the month.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Enter your email" className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">Join</button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
            <p>© {new Date().getFullYear()} DopeDen. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <span className="hover:underline cursor-pointer">Privacy Policy</span>
              <span className="hover:underline cursor-pointer">Terms of Service</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}