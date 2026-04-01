import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { priceId, userId, userEmail } = req.body;
  if (!priceId || !userId || !userEmail) {
    return res.status(400).json({ error: "Missing priceId, userId or userEmail" });
  }

  try {
    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    // Create checkout session
    const origin = req.headers.origin || req.headers.referer || "https://example.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}?checkout=success`,
      cancel_url: `${origin}?checkout=cancel`,
      metadata: { supabase_user_id: userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ error: "Erreur lors de la creation de la session de paiement" });
  }
}
