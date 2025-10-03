export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  products: {
    veo3Factory: {
      id: 'prod_SleJcMKxzR2Ofo',
      priceId: 'price_1Rq70a1fqfaGAxK3iuKHpUZ7',
      name: 'Veo3Factory',
      price: 9700, // $97.00 in cents
      currency: 'usd',
      description: 'An automated system that creates, posts, and grows your social media.',
      mode: 'payment' as const
    }
  }
};

export const getStripeProductConfig = () => STRIPE_CONFIG.products.veo3Factory;