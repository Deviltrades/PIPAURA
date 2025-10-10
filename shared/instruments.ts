// Comprehensive instrument lists for trading

// Forex pairs - Majors first, then crosses, then exotics
export const forexMajors = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD"
];

export const forexCrosses = [
  "EUR/GBP", "EUR/JPY", "EUR/CHF", "EUR/AUD", "EUR/CAD", "EUR/NZD",
  "GBP/JPY", "GBP/CHF", "GBP/AUD", "GBP/CAD", "GBP/NZD",
  "AUD/JPY", "AUD/CHF", "AUD/CAD", "AUD/NZD",
  "NZD/JPY", "NZD/CHF", "NZD/CAD",
  "CAD/JPY", "CAD/CHF",
  "CHF/JPY"
];

export const forexExotics = [
  "USD/MXN", "USD/ZAR", "USD/TRY", "USD/SEK", "USD/NOK", "USD/DKK",
  "EUR/TRY", "EUR/SEK", "EUR/NOK", "EUR/DKK", "EUR/PLN", "EUR/HUF",
  "GBP/TRY", "GBP/SEK", "GBP/NOK", "GBP/DKK", "GBP/PLN", "GBP/ZAR",
  "AUD/MXN", "NZD/SGD", "USD/SGD", "USD/HKD", "USD/THB"
];

export const forexPairs = [...forexMajors, ...forexCrosses, ...forexExotics];

// Global Indices
export const indices = [
  "US500", "US100", "US30", "UK100", "GER40", "FRA40", "EU50", 
  "JP225", "HK50", "AUS200", "FTSE 100", "DAX", "CAC 40", 
  "Nikkei 225", "Hang Seng", "ASX 200"
];

// Cryptocurrency pairs
export const cryptos = [
  "BTC – Bitcoin",
  "ETH – Ethereum",
  "USDT – Tether",
  "BNB – Binance Coin",
  "SOL – Solana",
  "XRP – Ripple",
  "USDC – USD Coin",
  "DOGE – Dogecoin",
  "ADA – Cardano",
  "TON – Toncoin",
  "AVAX – Avalanche",
  "TRX – TRON",
  "SHIB – Shiba Inu",
  "DOT – Polkadot",
  "LINK – Chainlink",
  "LTC – Litecoin",
  "BCH – Bitcoin Cash",
  "UNI – Uniswap",
  "MATIC – Polygon",
  "ICP – Internet Computer",
  "NEAR – Near Protocol",
  "XLM – Stellar",
  "APT – Aptos",
  "FIL – Filecoin",
  "LDO – Lido DAO",
  "ARB – Arbitrum",
  "ETC – Ethereum Classic",
  "OP – Optimism",
  "HBAR – Hedera",
  "VET – VeChain",
  "AAVE – Aave",
  "INJ – Injective",
  "MKR – Maker",
  "RUNE – ThorChain",
  "ALGO – Algorand",
  "SAND – The Sandbox",
  "EGLD – MultiversX (ex-Elrond)",
  "GRT – The Graph",
  "RNDR – Render Token",
  "IMX – Immutable X",
  "MANA – Decentraland",
  "SNX – Synthetix",
  "QNT – Quant",
  "FLOW – Flow",
  "XTZ – Tezos",
  "AXS – Axie Infinity",
  "CRV – Curve DAO",
  "PENDLE – Pendle",
  "SEI – Sei Network",
  "KAS – Kaspa",
  "NEO – NEO",
  "CHZ – Chiliz",
  "KAVA – Kava",
  "COMP – Compound",
  "CAKE – PancakeSwap",
  "MINA – Mina Protocol",
  "RPL – Rocket Pool",
  "ENJ – Enjin Coin",
  "GALA – Gala Games",
  "BAT – Basic Attention Token",
  "BLUR – Blur",
  "SUI – Sui Network",
  "THETA – Theta Network",
  "DASH – Dash",
  "ZEC – Zcash",
  "CFX – Conflux",
  "DYDX – dYdX",
  "1INCH – 1inch Network",
  "LRC – Loopring",
  "STX – Stacks",
  "ROSE – Oasis Network",
  "WAVES – Waves",
  "GMX – GMX",
  "CVX – Convex Finance",
  "NEXO – Nexo",
  "IOTA – IOTA",
  "XDC – XDC Network",
  "CELR – Celer Network",
  "ENS – Ethereum Name Service",
  "BAND – Band Protocol",
  "HNT – Helium",
  "ZIL – Zilliqa",
  "TWT – Trust Wallet Token",
  "FET – Fetch.ai",
  "SKL – SKALE Network",
  "BSV – Bitcoin SV",
  "ANT – Aragon",
  "YFI – Yearn Finance",
  "OSMO – Osmosis",
  "BAL – Balancer",
  "COTI – COTI",
  "RSR – Reserve Rights",
  "ONDO – Ondo Finance",
  "OCEAN – Ocean Protocol",
  "JASMY – JasmyCoin",
  "CEL – Celsius",
  "AMP – Amp",
  "LUNA – Terra Classic",
  "PEPE – Pepe",
  "BONK – Bonk"
];

// Stock tickers
export const stocks = [
  // Technology
  "AAPL – Apple",
  "MSFT – Microsoft",
  "NVDA – Nvidia",
  "TSLA – Tesla",
  "AMZN – Amazon",
  "META – Meta Platforms",
  "GOOG – Alphabet Class C",
  "GOOGL – Alphabet Class A",
  "AMD – Advanced Micro Devices",
  "INTC – Intel",
  "NFLX – Netflix",
  "CRM – Salesforce",
  "ORCL – Oracle",
  "PYPL – PayPal",
  "SQ – Block (Formerly Square)",
  "SHOP – Shopify",
  "PLTR – Palantir",
  "UBER – Uber Technologies",
  "LYFT – Lyft",
  "SNOW – Snowflake",
  
  // Financial
  "JPM – JPMorgan Chase",
  "BAC – Bank of America",
  "C – Citigroup",
  "WFC – Wells Fargo",
  "GS – Goldman Sachs",
  "MS – Morgan Stanley",
  "COIN – Coinbase Global",
  "SCHW – Charles Schwab",
  "BLK – BlackRock",
  "AXP – American Express",
  
  // Industrial & Energy
  "CAT – Caterpillar",
  "BA – Boeing",
  "XOM – Exxon Mobil",
  "CVX – Chevron",
  "BP – BP plc",
  "SHEL – Shell plc",
  "RDSA – Royal Dutch Shell A",
  "GE – General Electric",
  "NEE – NextEra Energy",
  "ENPH – Enphase Energy",
  
  // Healthcare
  "JNJ – Johnson & Johnson",
  "PFE – Pfizer",
  "MRK – Merck & Co.",
  "ABBV – AbbVie",
  "LLY – Eli Lilly",
  "UNH – UnitedHealth Group",
  "CVS – CVS Health",
  "BMY – Bristol-Myers Squibb",
  "GILD – Gilead Sciences",
  "TMO – Thermo Fisher Scientific",
  
  // Consumer & Retail
  "WMT – Walmart",
  "COST – Costco",
  "HD – Home Depot",
  "NKE – Nike",
  "MCD – McDonald's",
  "KO – Coca-Cola",
  "PEP – PepsiCo",
  "DIS – Walt Disney",
  "SBUX – Starbucks",
  "TGT – Target",
  
  // Telecom & Utilities
  "VZ – Verizon",
  "T – AT&T",
  "CMCSA – Comcast",
  "TMUS – T-Mobile",
  "DUK – Duke Energy",
  "SO – Southern Company",
  "PCG – PG&E",
  "EXC – Exelon",
  "NRG – NRG Energy",
  "CEG – Constellation Energy",
  
  // Automotive & Transportation
  "F – Ford Motor",
  "GM – General Motors",
  "RIVN – Rivian",
  "LCID – Lucid Motors",
  "HON – Honeywell",
  "DE – Deere & Co.",
  "UPS – United Parcel Service",
  "FDX – FedEx",
  "DAL – Delta Air Lines",
  "AAL – American Airlines",
  
  // International
  "BABA – Alibaba Group (HK/US)",
  "TSM – Taiwan Semiconductor",
  "NIO – NIO Inc.",
  "JD – JD.com",
  "PDD – Pinduoduo",
  "TM – Toyota Motor Corp",
  "SONY – Sony Group",
  "RIO – Rio Tinto plc",
  "UL – Unilever plc",
  "SAP – SAP SE",
  "ASML – ASML Holding NV",
  "LVMH – LVMH Moët Hennessy Louis Vuitton",
  "SHEL – Shell plc",
  "BP – BP plc",
  "GLEN – Glencore plc",
  "HSBC – HSBC Holdings",
  "BARCL – Barclays plc",
  "NESN – Nestlé SA",
  "NOVN – Novartis AG",
  "ROG – Roche Holding AG"
];

// Futures - International stocks and ADRs
export const futures = [
  "BABA – Alibaba Group (HK/US)",
  "TSM – Taiwan Semiconductor",
  "NIO – NIO Inc.",
  "JD – JD.com",
  "PDD – Pinduoduo",
  "TM – Toyota Motor Corp",
  "SONY – Sony Group",
  "RIO – Rio Tinto plc",
  "UL – Unilever plc",
  "SAP – SAP SE",
  "ASML – ASML Holding NV",
  "LVMH – LVMH Moët Hennessy Louis Vuitton",
  "SHEL – Shell plc",
  "BP – BP plc",
  "GLEN – Glencore plc",
  "HSBC – HSBC Holdings",
  "BARCL – Barclays plc",
  "NESN – Nestlé SA",
  "NOVN – Novartis AG",
  "ROG – Roche Holding AG"
];

// Helper function to get instruments by type
export function getInstrumentsByType(type: string): string[] {
  switch (type) {
    case "FOREX":
      return forexPairs;
    case "INDICES":
      return indices;
    case "CRYPTO":
      return cryptos;
    case "STOCKS":
      return stocks;
    case "FUTURES":
      return futures;
    default:
      return [];
  }
}
