import React from "react";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center bg-background">
      <div className="text-center max-w-md p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
        <h1 className="text-3xl font-display font-bold text-foreground mb-4">404 - Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The requested resource could not be located on the platform. It may have been moved or deleted.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
