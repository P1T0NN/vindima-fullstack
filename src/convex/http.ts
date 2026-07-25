import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth/auth';
import { stripeWebhook } from './tables/orders/http/stripeWebhook';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

// Stripe Checkout settlement (`StripeSystemDesign.md` §8). The endpoint to register in each
// store's Stripe dashboard is `https://<deployment>.convex.site/stripe/webhook`, subscribed to
// `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and
// `checkout.session.async_payment_failed`.
http.route({ path: '/stripe/webhook', method: 'POST', handler: stripeWebhook });

export default http;
