import { Link } from "react-router-dom";
import { Heart, Trophy, Shield, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-forest-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⛳</span>
              </div>
              <span className="font-display font-bold text-lg">
                Fairway <span className="text-forest-400">For Good</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Every subscription supports a charity you love. Score, compete,
              and make a real difference — one round at a time.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
              <Heart size={12} className="text-red-400" />
              <span>10% of every subscription goes to charity</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/charities", label: "Charities" },
                { to: "/draws", label: "Monthly Draws" },
                { to: "/dashboard", label: "Dashboard" },
                { to: "/scores", label: "Score Entry" },
                { to: "/subscribe", label: "Subscribe" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-gray-400 hover:text-forest-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">
              Account
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/login", label: "Sign In" },
                { to: "/register", label: "Register" },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-gray-400 hover:text-forest-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2026 Fairway For Good. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Shield size={11} />
            <span>Secured & PCI-compliant payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
