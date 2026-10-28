import { ShoppingCart, Heart, User, Globe, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { ReactNode } from "react";

type DefaultLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export default function DefaultLayout({ children, title, subtitle }: DefaultLayoutProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-transparent bg-transparent backdrop-blur-none">
        <div className="mx-auto max-w-[1600px] px-3 py-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
                <span className="text-sm font-bold">D</span>
              </div>
              <h1 className="hidden text-xl font-bold text-foreground sm:block">DopeDen</h1>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="icon" className="hidden h-9 w-9 sm:flex">
                <Globe size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="hidden h-9 w-9 sm:flex">
                <Clock size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="hidden h-9 w-9 sm:flex" onClick={() => setLocation("/profile")}>
                <User size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-foreground">
                <Heart size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-foreground">
                <ShoppingCart size={18} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  3
                </span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-0 pb-0 pt-0">
        {(title || subtitle) && (
          <div className="mb-8 pt-2">
            {title && <h2 className="mb-2 text-4xl font-bold">{title}</h2>}
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}