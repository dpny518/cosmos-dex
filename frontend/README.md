# Cosmos DEX Frontend

A modern React frontend for the Cosmos DEX built with Vite, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run start
```

### Build for Production
```bash
npm run build
```

## 🌐 Deployment to Cloudflare Pages

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy frontend"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub repository
   - Select the `cosmos-dex` repository

3. **Configure Build Settings**
   - **Framework preset**: Vite
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/dist`
   - **Root directory**: `/` (leave empty)

4. **Environment Variables**
   Add these environment variables in Cloudflare Pages settings:
   ```
   REACT_APP_CHAIN_ID=cosmoshub-4
   REACT_APP_CHAIN_NAME=Cosmos Hub
   REACT_APP_RPC_ENDPOINT=https://cosmos-rpc.polkachu.com
   REACT_APP_REST_ENDPOINT=https://cosmos-rest.polkachu.com
   REACT_APP_CONTRACT_ADDRESS=cosmos1svd8fpfwrf237qprqt33ajylg302s05neruqt37p3ju2qktkt6wqytq4ez
   REACT_APP_CODE_ID=250
   REACT_APP_DENOM=uatom
   REACT_APP_COIN_DECIMALS=6
   REACT_APP_COIN_MINIMAL_DENOM=uatom
   REACT_APP_COIN_DISPLAY_NAME=ATOM
   REACT_APP_GAS_PRICES=0.025uatom
   REACT_APP_GAS_ADJUSTMENT=1.3
   REACT_APP_APP_NAME=Cosmos DEX
   REACT_APP_APP_VERSION=1.0.0
   REACT_APP_ENVIRONMENT=production
   ```

5. **Deploy**
   - Click "Save and Deploy"
   - Your site will be available at `https://your-project.pages.dev`

### Method 2: Direct Upload

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload to Cloudflare Pages**
   - Go to Cloudflare Pages dashboard
   - Click "Upload assets"
   - Upload the `dist` folder contents

### Method 3: Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy**
   ```bash
   npm run build
   wrangler pages deploy dist --project-name cosmos-dex
   ```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Key Configuration Options

- **REACT_APP_CONTRACT_ADDRESS**: Your deployed contract address
- **REACT_APP_RPC_ENDPOINT**: Cosmos Hub RPC endpoint
- **REACT_APP_REST_ENDPOINT**: Cosmos Hub REST API endpoint
- **REACT_APP_CHAIN_ID**: Chain ID (cosmoshub-4 for mainnet)

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── main.tsx          # App entry point
├── _headers              # Cloudflare Pages headers
├── _redirects            # Cloudflare Pages redirects
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind CSS config
├── tsconfig.json         # TypeScript config
└── vite.config.ts        # Vite config
```

## 🎨 Features

### Core Features
- **Wallet Connection**: Keplr wallet integration
- **Token Swapping**: Intuitive swap interface
- **Liquidity Management**: Add/remove liquidity
- **Pool Creation**: Create new trading pairs
- **Portfolio Tracking**: View your positions

### UI/UX Features
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Toggle between light/dark themes
- **Real-time Updates**: Live price and balance updates
- **Toast Notifications**: User feedback system
- **Loading States**: Smooth loading indicators

### Technical Features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **CosmJS**: Cosmos blockchain interaction
- **React Router**: Client-side routing

## 🔒 Security

### Content Security Policy
The app includes a strict CSP header that only allows:
- Scripts from self and inline (required for React)
- Styles from self, inline, and Google Fonts
- Images from self, data URLs, and HTTPS
- Connections to Cosmos RPC/REST endpoints

### Headers
Security headers are configured in `_headers`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## 📊 Performance

### Optimization Features
- **Code Splitting**: Automatic chunk splitting
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Minified CSS/JS
- **Caching**: Long-term caching for static assets
- **Preloading**: Critical resource preloading

### Bundle Analysis
```bash
npm run build
npx vite-bundle-analyzer dist
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## 🔄 CI/CD

The project is configured for automatic deployment on Cloudflare Pages:

1. **Trigger**: Push to main branch
2. **Build**: `cd frontend && npm install && npm run build`
3. **Deploy**: Automatic deployment to Cloudflare Pages
4. **Preview**: Preview deployments for pull requests

## 📱 PWA Support

The app includes PWA manifest for mobile installation:
- Installable on mobile devices
- Offline support (coming soon)
- Native app-like experience

## 🌍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/cosmos-dex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/cosmos-dex/discussions)

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.
