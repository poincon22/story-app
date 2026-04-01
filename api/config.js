export default function handler(req, res) {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    stripePriceMonthly: process.env.STRIPE_PRICE_MONTHLY || "",
    stripePriceYearly: process.env.STRIPE_PRICE_YEARLY || "",
  });
}
