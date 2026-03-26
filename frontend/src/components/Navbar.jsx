import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  X,
  ChevronDown,
  Trophy,
  Heart,
  BarChart2,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setDropdownOpen(false);
  }, [location]);

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  }

  const navLinks = [
    { to: "/charities", label: "Charities", icon: Heart },
    { to: "/draws", label: "Draws", icon: Trophy },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-forest-600 rounded-full flex items-center justify-center group-hover:bg-forest-700 transition-colors">
              <span className="text-white font-display font-bold text-sm">
                ⛳
              </span>
            </div>

            <span
              className={`font-display font-bold text-lg transition ${
                scrolled ? "text-charcoal" : "text-white"
              }`}
            >
              Fairway <span className="text-green-400">For Good</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-forest-600 ${
                  location.pathname === to
                    ? "text-forest-600"
                    : scrolled
                      ? "text-gray-700"
                      : "text-white"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    scrolled ? "text-gray-700" : "text-white"
                  } hover:text-forest-600`}
                >
                  <div className="w-7 h-7 bg-forest-100 rounded-full flex items-center justify-center">
                    <User size={14} className="text-forest-700" />
                  </div>
                  Account
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-forest-50 hover:text-forest-700 transition-colors"
                    >
                      <BarChart2 size={14} /> Dashboard
                    </Link>

                    <Link
                      to="/scores"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-forest-50 hover:text-forest-700 transition-colors"
                    >
                      <Trophy size={14} /> My Scores
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-forest-600 hover:bg-forest-50 transition-colors font-medium"
                      >
                        <Shield size={14} /> Admin Panel
                      </Link>
                    )}

                    <hr className="my-1 border-gray-100" />

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors ${
                    scrolled ? "text-gray-700" : "text-white"
                  } hover:text-forest-600`}
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="bg-green-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-green-600 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile button */}
          <button
            className={`md:hidden p-2 rounded-xl transition-colors ${
              scrolled
                ? "text-gray-700 hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            }`}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden bg-white rounded-2xl shadow-xl border border-gray-100 mt-2 p-4 animate-fade-in">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-gray-700 hover:text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
              >
                <Icon size={15} /> {label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-gray-700 hover:text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
                >
                  <BarChart2 size={15} /> Dashboard
                </Link>

                <Link
                  to="/scores"
                  className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-gray-700 hover:text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
                >
                  <Trophy size={15} /> My Scores
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
                  >
                    <Shield size={15} /> Admin Panel
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors mt-2"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link
                  to="/login"
                  className="border text-center text-sm py-2 rounded-lg"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="bg-green-500 text-white text-center text-sm py-2 rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
