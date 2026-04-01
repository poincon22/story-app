import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: "No subscription found" });
    }

    const origin = req.headers.origin || req.headers.referer || "https://example.com";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: origin,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error("Portal error:", err.message);
    res.status(500).json({ error: "Erreur lors de l'ouverture du portail" });
  }
}
