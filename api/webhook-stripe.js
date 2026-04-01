import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vercel: disable body parsing to get raw body for signature verification
export const config = {
  api: { bodyParser: false },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function updateUserPlan(customerId, plan) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (data) {
    await supabaseAdmin
      .from("profiles")
      .update({ plan })
      .eq("id", data.id);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription") {
          await updateUserPlan(session.customer, "premium");
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        if (sub.status === "active") {
          await updateUserPlan(sub.customer, "premium");
        } else if (sub.status === "past_due" || sub.status === "unpaid") {
          // Keep premium for now, Stripe will retry payment
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await updateUserPlan(sub.customer, "free");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err.message);
  }

  res.json({ received: true });
}
