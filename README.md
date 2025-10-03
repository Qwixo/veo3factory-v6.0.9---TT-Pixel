# VEO 3 Factory - Static Landing Page

A beautiful landing page for the Viral Reels Factory automation system with integrated checkout.

## 🚀 Quick Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Configure Stripe (Required for Payments)
To enable the $97 Veo3Factory payments, you'll need to:

1. **Set up Stripe**:
   - Create a Stripe account at https://stripe.com
   - Get your API keys from the Stripe dashboard
   - Create a product for "Veo3Factory" at $97.00 and get the price ID

2. **Set up Supabase**:
   - Create a Supabase project at https://supabase.com
   - Deploy the edge functions for payment processing
   - Configure environment variables

3. **Update Configuration**:
   - Add your Supabase URL and keys to `.env`
   - Update `src/stripe-config.ts` with your actual Stripe price ID for Veo3Factory
   - Configure webhook endpoints in Stripe dashboard

### 3. View the Site
- **React App**: `/` - Full application with authentication and dashboard

## 🛠 Features

- ✅ Legal pages (Privacy, Terms, etc.)
- ✅ Smooth scrolling animations
- ✅ Image gallery with hover effects
- ✅ FAQ dropdown functionality
- ✅ Countdown timer
- ✅ Cookie consent management
- ✅ User authentication system
- ✅ Payment processing integration

### Design Features
- ✅ Modern gradient design
- ✅ Mobile-responsive layout
- ✅ Hover animations and micro-interactions
- ✅ Professional typography
- ✅ Optimized loading states

## 📁 Project Structure

```
├── index.html              # Main landing page
├── checkout.html           # Checkout page
├── thank-you.html          # Success page
├── privacy-policy.html     # Privacy policy
├── cookie-policy.html      # Cookie policy
├── legal-disclosure.html   # Legal disclosure
├── terms-conditions.html   # Terms & conditions
├── styles.css              # Main page styles
├── checkout-styles.css     # Checkout page styles
├── thank-you-styles.css    # Thank you page styles
├── legal-styles.css        # Legal pages styles
├── script.js               # Main page interactions
├── checkout-script.js      # Checkout functionality (demo)
├── cookie-consent.js       # Cookie management
├── src/                    # React application
│   ├── components/         # React components
│   ├── contexts/           # Authentication context
│   ├── lib/                # Utility libraries
│   └── stripe-config.ts    # Stripe product configuration
└── supabase/               # Supabase configuration
    ├── functions/          # Edge functions for payments
    └── migrations/         # Database schema
```

## 🎯 Demo Mode

The checkout system is currently in **demo mode**:
- Clicking "Complete Purchase" shows a 2-second loading animation
- Then redirects to the thank you page
- No actual payment processing occurs
- To enable real payments, follow the setup instructions above

## 🎨 Customization

### Colors
- Primary: `#FFD700` (Gold)
- Secondary: `#FFA500` (Orange)
- Background: `#000000` (Black)
- Text: `#FFFFFF` (White)

### Fonts
- Font Family: Inter (Google Fonts)
- Weights: 400, 600, 700, 800

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: 480px, 768px, 1200px
- Optimized for all screen sizes
- Touch-friendly interactions

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Browser Support
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📞 Support

For questions about implementation:
- Check browser console for any errors
- Verify all HTML files are properly linked
- Ensure CSS and JS files are loading correctly
- For Stripe integration, ensure all environment variables are set
- For Supabase integration, verify edge functions are deployed