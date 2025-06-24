# Accretion Solana Data Reverser

🔗 **[Live Tool: https://sdr.accretion.xyz/](https://sdr.accretion.xyz/)**

A browser-based reverse engineering tool for analyzing hex data with deep Solana blockchain integration. Perfect for examining raw binary data, Solana account structures, and discovering patterns in blockchain data.

## 🚀 Features

### Core Functionality
- **Interactive Hexdump Viewer** - Clickable byte-level visualization with color-coded highlighting
- **Smart Suggestions** - AI-powered pattern detection with confidence scoring
- **Multi-format Decoding** - Support for integers, floats, strings, timestamps, and Solana-specific types
- **Visual Feedback** - Color-coded byte states (green=decoded, blue=staged, blue+glow=max confidence)

### Solana Integration
- **Account Analysis** - Direct Solana account fetching and analysis
- **Pubkey Detection** - Automatic detection of valid Solana public keys with existence verification
- **Program Recognition** - Built-in database of known Solana programs
- **Account Information** - Display of SOL balance, owner, executable status, and account type
- **External Links** - Quick access to Solscan and recursive account analysis
- **Discriminator Detection** - Automatic identification of 8-byte account discriminators

### Advanced Features
- **Confidence Scoring** - Zero-byte analysis for maximum confidence detection (≤20 zeros = 100% confidence)
- **RPC Configuration** - User-configurable Solana RPC endpoints with timeout and batching options
- **Inline Editing** - Click-to-edit names for accepted decodings
- **Deep Linking** - URL parameters for automatic account loading
- **Batch Processing** - Efficient RPC batching for multiple account lookups

## 🛠️ Usage

### Getting Started
1. **Configure RPC** - On first load, configure your Solana RPC endpoint
2. **Input Data** - Paste hex data or enter a Solana account address
3. **Analyze** - Press Enter or click "Process Data"
4. **Explore** - Click bytes to stage selections, accept suggestions, and decode patterns

### Data Input Formats
```
Hex Data: 38 6d 97 6a bf f6 01 a2 30 93 3c 25 74 e6 26 96
Solana Account: DJtaJXMUtFmypygj4k3NbfVxxjsbhnYBwAuAjv9GEQ6P
URL Parameter: ?account=DJtaJXMUtFmypygj4k3NbfVxxjsbhnYBwAuAjv9GEQ6P
```

### Keyboard Shortcuts
- **Enter** - Process data input
- **Escape** - Cancel inline editing
- **Click** - Stage bytes, accept suggestions, edit names

## 🔧 Configuration

### RPC Settings
- **Endpoint** - Your Solana RPC URL (Helius, QuickNode, Alchemy, etc.)
- **Timeout** - Request timeout in milliseconds (1000-30000ms)
- **Batching** - Enable for paid RPC endpoints, disable for free endpoints

### Supported RPC Providers
- [Helius](https://helius.xyz/) - Recommended for advanced features
- [QuickNode](https://quicknode.com/) - Reliable with good performance
- [Alchemy](https://alchemy.com/) - Enterprise-grade infrastructure
- Solana Public RPC - Free but rate-limited

## 🏗️ Technical Details

### Architecture
- **Frontend Only** - Pure HTML/CSS/JavaScript, no backend required
- **Real-time Analysis** - Live suggestions as you input data
- **Persistent Settings** - LocalStorage for RPC configuration
- **Error Handling** - Comprehensive RPC error management with user-friendly messages

### Supported Data Types
- **Integers** - u8, u16, u32, u64, i8, i16, i32, i64 (little & big endian)
- **Floats** - f32, f64 (IEEE 754)
- **Strings** - UTF-8, ASCII with validation
- **Timestamps** - Unix timestamps with human-readable conversion
- **Booleans** - Single byte true/false values
- **Solana Types** - Public keys, discriminators, account data

### Confidence System
- **100%** - Verified Solana accounts with ≤20 zero bytes (blue glow)
- **95%** - Base confidence for verified accounts
- **90%+** - High confidence patterns (🔥 icon)
- **80%+** - Medium confidence patterns (✨ icon)
- **70%+** - Low confidence patterns (💡 icon)

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub repository
2. Connect to Vercel
3. Deploy automatically (no configuration needed)

### Other Static Hosts
Works on any static hosting platform:
- GitHub Pages
- Netlify
- AWS S3
- Cloudflare Pages

## 🔒 Security

- **Client-Side Only** - No server-side data processing
- **RPC Privacy** - User-configured endpoints, not hardcoded
- **No Data Storage** - Analysis happens locally in browser
- **CORS Handling** - Robust error handling for RPC connectivity

## 🤝 Contributing

This tool is designed for security research and blockchain analysis. When contributing:

1. **Defensive Focus** - Only security analysis and defensive tools
2. **No Malicious Code** - Refuse any offensive security features
3. **User Privacy** - Maintain client-side processing
4. **Documentation** - Update README for new features

## 📝 License

Open source - feel free to fork, modify, and deploy your own instance.

## 🆘 Support

For issues, feature requests, or questions:
- Check browser console for RPC connectivity issues
- Ensure RPC endpoint supports your usage requirements
- Verify account addresses are valid base58 Solana pubkeys

---

**Built for the Solana ecosystem** 🌞 | **Powered by browser technology** 🌐 | **No installation required** ⚡