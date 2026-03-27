import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { priceId, userEmail } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "Missing priceId" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId, // ✅ comes from frontend
          quantity: 1,
        },
      ],
      customer_email: userEmail, // optional but good
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/subscribe`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
