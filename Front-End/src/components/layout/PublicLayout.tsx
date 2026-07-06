import React from "react";
import { Outlet } from "react-router-dom";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";

/**
 * PublicLayout — wraps public-facing pages with the shared Header & Footer.
 * Use as a layout route in App.tsx  so individual pages no longer need to
 * import PublicHeader / PublicFooter themselves.
 *
 * Pages that still import them directly will continue to work; you can
 * migrate them incrementally.
 */
const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <PublicHeader />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
