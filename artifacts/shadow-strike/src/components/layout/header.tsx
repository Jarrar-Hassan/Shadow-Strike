import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Shield, Activity, FileText, Users, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";
import { cn } from "@/lib/utils";

export function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Overview", icon: Shield },
    { href: "/analyze", label: "Analyze", icon: Activity, requiresAuth: true },
    { href: "/reports", label: "Reports", icon: FileText, requiresAuth: true },
    { href: "/admin", label: "Admin", icon: Users, requiresAdmin: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
              <Shield className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              ShadowStrike
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.requiresAuth && !isAuthenticated) return null;
              if (link.requiresAdmin && !isAdmin) return null;
              
              const isActive = location === link.href;
              const Icon = link.icon;
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="font-medium text-foreground">{user?.email}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={logout} title="Log out" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsAuthOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
