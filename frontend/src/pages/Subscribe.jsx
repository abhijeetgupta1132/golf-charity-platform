import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import { Check, Shield, Zap, Star } from "lucide-react";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: 9.99,
    period: "/month",
    priceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
    features: [
      "Full platform access",
      "Enter monthly prize draws",
      "10%+ to your chosen charity",
      "Score tracking (5 rolling)",
      "Winner verification access",
    ],
    cta: "Start Monthly",
    highlight: false,
  },
  {
    id: "yearly",
    name: "Annual",
    price: 99,
    period: "/year",
    monthly: 8.25,
    priceId: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID,
    features: [
      "Everything in Monthly",
      "2 months free (save £20.88)",
      "Priority draw entry",
      "Exclusive annual badge",
      "Early feature access",
    ],
    cta: "Start Annual",
    highlight: true,
    badge: "Best Value",
  },
];

export default function Subscribe() {
  const { user, profile, isSubscribed, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(null);

  async function handleSubscribe(plan) {
    setLoading(plan.id);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          userEmail: user.email,
          plan: plan.id,
        }),
      });
      const { url, sessionId } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        // Demo mode fallback — simulate subscription
        await supabase.from("subscriptions").upsert(
          {
            user_id: user.id,
            plan: plan.id,
            status: "active",
            stripe_subscription_id: `demo_${Date.now()}`,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + (plan.id === "yearly" ? 365 : 30) * 86400000,
            ).toISOString(),
            amount: plan.price,
          },
          { onConflict: "user_id" },
        );
        await refreshProfile();
        toast.success(`Subscribed to ${plan.name} plan! (Demo mode)`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  const currentPlan = profile?.subscriptions?.[0];

  return (
    <div className="min-h-screen bg-cream pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="section-tag mx-auto">Membership</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-charcoal">
            Pick your plan
          </h1>
          <p className="mt-4 text-gray-500 max-w-lg mx-auto">
            Every plan includes charity contributions, prize draw entries, and
            full platform access.
          </p>
        </div>

        {isSubscribed && (
          <div className="bg-forest-50 border border-forest-200 rounded-2xl p-4 mb-8 flex items-center gap-3 text-sm text-forest-700">
            <Check size={16} className="text-forest-600" />
            You're already on the{" "}
            <strong className="capitalize">{currentPlan?.plan}</strong> plan,
            renewing{" "}
            {new Date(currentPlan?.current_period_end).toLocaleDateString(
              "en-GB",
            )}
            . Upgrading will prorate the difference.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl border-2 p-8 relative ${
                plan.highlight
                  ? "border-forest-500 bg-forest-950 text-white shadow-xl shadow-forest-900/20"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h2
                  className={`font-display text-xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-charcoal"}`}
                >
                  {plan.name}
                </h2>
                <div className="flex items-end gap-1">
                  <span
                    className={`font-display text-5xl font-bold ${plan.highlight ? "text-white" : "text-charcoal"}`}
                  >
                    £{plan.price}
                  </span>
                  <span
                    className={`text-sm mb-2 ${plan.highlight ? "text-forest-300" : "text-gray-500"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                {plan.monthly && (
                  <div
                    className={`text-sm mt-1 ${plan.highlight ? "text-forest-300" : "text-gray-500"}`}
                  >
                    Just £{plan.monthly}/month
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check
                      size={15}
                      className={`mt-0.5 shrink-0 ${plan.highlight ? "text-forest-400" : "text-forest-600"}`}
                    />
                    <span
                      className={
                        plan.highlight ? "text-forest-100" : "text-gray-600"
                      }
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loading === plan.id}
                className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  plan.highlight
                    ? "bg-forest-500 hover:bg-forest-400 text-white shadow-lg shadow-forest-900/30"
                    : "bg-charcoal hover:bg-gray-800 text-white"
                }`}
              >
                {loading === plan.id ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={15} /> {plan.cta}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Shield,
              label: "Secure Payments",
              desc: "PCI-compliant via Stripe",
            },
            {
              icon: Star,
              label: "Cancel Anytime",
              desc: "No lock-in, no questions",
            },
            {
              icon: Check,
              label: "100% Transparent",
              desc: "See exactly where your money goes",
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card text-center p-5">
              <Icon size={20} className="text-forest-600 mx-auto mb-2" />
              <div className="font-medium text-sm text-charcoal mb-1">
                {label}
              </div>
              <div className="text-xs text-gray-500">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
