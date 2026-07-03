// Stripe payment integration
import Stripe from "stripe";
import { Request, Response } from "express";
import { storage } from "./storage";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-05-28.basil" })
  : null;

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "price_placeholder";
const APP_URL = process.env.APP_URL || "https://www.covelligent.com";

// Create Stripe checkout session for Pro subscription
export async function createCheckoutSession(req: Request, res: Response) {
  if (!stripe) {
    return res.status(503).json({ message: "Payments not configured yet. Add STRIPE_SECRET_KEY to environment." });
  }

  const { userId, email, name } = req.body;
  if (!userId || !email) return res.status(400).json({ message: "userId and email required" });

  try {
    // Create or retrieve Stripe customer
    let customerId: string | undefined;
    const existingSub = await storage.getSubscription(Number(userId));
    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({ email, name });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      success_url: `${APP_URL}/#/app?upgraded=true`,
      cancel_url: `${APP_URL}/#/pricing?canceled=true`,
      metadata: { userId: String(userId) },
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId: String(userId) },
      },
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ message: err.message });
  }
}

// Create billing portal session (manage subscription)
export async function createPortalSession(req: Request, res: Response) {
  if (!stripe) return res.status(503).json({ message: "Payments not configured" });

  const { userId } = req.body;
  const sub = await storage.getSubscription(Number(userId));
  if (!sub?.stripe_customer_id) return res.status(404).json({ message: "No subscription found" });

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${APP_URL}/#/app`,
    });
    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// Webhook handler — keeps subscription status in sync
export async function handleWebhook(req: Request, res: Response) {
  if (!stripe) return res.status(503).json({ message: "Payments not configured" });

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
    } else {
      event = req.body as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const obj = event.data.object as any;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const userId = Number(obj.metadata?.userId);
      if (!userId) break;
      await storage.upsertSubscription({
        user_id: userId,
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.id,
        status: obj.status,
        plan: obj.status === "active" || obj.status === "trialing" ? "pro" : "free",
        current_period_end: new Date(obj.current_period_end * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
      if (obj.status === "active" || obj.status === "trialing") {
        await storage.updateUserPlan(userId, "pro");
      }
      break;
    }
    case "customer.subscription.deleted": {
      const userId = Number(obj.metadata?.userId);
      if (!userId) break;
      await storage.upsertSubscription({
        user_id: userId,
        stripe_customer_id: obj.customer,
        stripe_subscription_id: obj.id,
        status: "canceled",
        plan: "free",
        current_period_end: null,
        created_at: new Date().toISOString(),
      });
      await storage.updateUserPlan(userId, "free");
      break;
    }
  }

  res.json({ received: true });
}
