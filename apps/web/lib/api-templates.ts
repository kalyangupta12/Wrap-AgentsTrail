// API Templates for popular services
// Providers can use these as starting points when creating their APIs

export interface ApiTemplate {
  id: string;
  name: string;
  provider: string;
  logo?: string;
  description: string;
  baseUrl: string;
  authType: "header" | "query" | "bearer";
  authHeader?: string;
  authQueryParam?: string;
  endpoints: ApiEndpointTemplate[];
  docsUrl: string;
}

export interface ApiEndpointTemplate {
  name: string;
  slug: string;
  description: string;
  path: string;
  method: "GET" | "POST";
  params?: { name: string; description: string; required: boolean }[];
  suggestedPrice: number;
  suggestedRateLimit: number;
  category: string;
}

export const API_TEMPLATES: ApiTemplate[] = [
  {
    id: "coinmarketcap",
    name: "CoinMarketCap",
    provider: "CoinMarketCap",
    description: "Cryptocurrency market data, prices, rankings, and more",
    baseUrl: "https://pro-api.coinmarketcap.com",
    authType: "header",
    authHeader: "X-CMC_PRO_API_KEY",
    docsUrl: "https://coinmarketcap.com/api/documentation/v1/",
    endpoints: [
      {
        name: "Latest Crypto Prices",
        slug: "crypto-prices",
        description: "Get latest cryptocurrency price quotes",
        path: "/v2/cryptocurrency/quotes/latest",
        method: "GET",
        params: [
          { name: "symbol", description: "Crypto symbol (e.g., BTC,ETH)", required: false },
          { name: "id", description: "CoinMarketCap ID", required: false },
          { name: "convert", description: "Currency to convert to (default: USD)", required: false },
        ],
        suggestedPrice: 0.001,
        suggestedRateLimit: 60,
        category: "crypto",
      },
      {
        name: "Crypto Listings",
        slug: "crypto-listings",
        description: "Get top cryptocurrencies by market cap",
        path: "/v1/cryptocurrency/listings/latest",
        method: "GET",
        params: [
          { name: "limit", description: "Number of results (default: 100)", required: false },
          { name: "sort", description: "Sort by: market_cap, price, volume_24h", required: false },
          { name: "convert", description: "Currency to convert to", required: false },
        ],
        suggestedPrice: 0.002,
        suggestedRateLimit: 30,
        category: "crypto",
      },
      {
        name: "Trending Cryptos",
        slug: "crypto-trending",
        description: "Get currently trending cryptocurrencies",
        path: "/v1/cryptocurrency/trending/latest",
        method: "GET",
        params: [
          { name: "limit", description: "Number of results", required: false },
          { name: "convert", description: "Currency to convert to", required: false },
        ],
        suggestedPrice: 0.001,
        suggestedRateLimit: 60,
        category: "crypto",
      },
      {
        name: "Top Gainers & Losers",
        slug: "crypto-gainers-losers",
        description: "Get top gaining and losing cryptocurrencies",
        path: "/v1/cryptocurrency/trending/gainers-losers",
        method: "GET",
        params: [
          { name: "limit", description: "Number of results", required: false },
          { name: "time_period", description: "1h, 24h, 7d, 30d", required: false },
        ],
        suggestedPrice: 0.001,
        suggestedRateLimit: 60,
        category: "crypto",
      },
      {
        name: "Crypto Metadata",
        slug: "crypto-info",
        description: "Get cryptocurrency metadata (logo, description, links)",
        path: "/v2/cryptocurrency/info",
        method: "GET",
        params: [
          { name: "symbol", description: "Crypto symbol", required: false },
          { name: "id", description: "CoinMarketCap ID", required: false },
        ],
        suggestedPrice: 0.001,
        suggestedRateLimit: 60,
        category: "crypto",
      },
      {
        name: "Historical OHLCV",
        slug: "crypto-ohlcv",
        description: "Get historical OHLCV data for charting",
        path: "/v2/cryptocurrency/ohlcv/historical",
        method: "GET",
        params: [
          { name: "symbol", description: "Crypto symbol", required: true },
          { name: "time_start", description: "Start date (ISO 8601)", required: false },
          { name: "time_end", description: "End date (ISO 8601)", required: false },
          { name: "interval", description: "hourly, daily, weekly, monthly", required: false },
        ],
        suggestedPrice: 0.005,
        suggestedRateLimit: 20,
        category: "crypto",
      },
    ],
  },
  {
    id: "openweathermap",
    name: "OpenWeatherMap",
    provider: "OpenWeather",
    description: "Weather data, forecasts, and historical weather",
    baseUrl: "https://api.openweathermap.org",
    authType: "query",
    authQueryParam: "appid",
    docsUrl: "https://openweathermap.org/api",
    endpoints: [
      {
        name: "Current Weather",
        slug: "weather-current",
        description: "Get current weather for a location",
        path: "/data/2.5/weather",
        method: "GET",
        params: [
          { name: "q", description: "City name (e.g., London,UK)", required: false },
          { name: "lat", description: "Latitude", required: false },
          { name: "lon", description: "Longitude", required: false },
          { name: "units", description: "metric, imperial, standard", required: false },
        ],
        suggestedPrice: 0.001,
        suggestedRateLimit: 60,
        category: "weather",
      },
      {
        name: "5-Day Forecast",
        slug: "weather-forecast",
        description: "Get 5-day weather forecast",
        path: "/data/2.5/forecast",
        method: "GET",
        params: [
          { name: "q", description: "City name", required: false },
          { name: "lat", description: "Latitude", required: false },
          { name: "lon", description: "Longitude", required: false },
          { name: "units", description: "metric, imperial, standard", required: false },
        ],
        suggestedPrice: 0.002,
        suggestedRateLimit: 30,
        category: "weather",
      },
      {
        name: "Air Pollution",
        slug: "weather-air-quality",
        description: "Get air quality and pollution data",
        path: "/data/2.5/air_pollution",
        method: "GET",
        params: [
          { name: "lat", description: "Latitude", required: true },
          { name: "lon", description: "Longitude", required: true },
        ],
        suggestedPrice: 0.001,
        suggestedRateLimit: 60,
        category: "weather",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    provider: "OpenAI",
    description: "AI models for text generation, embeddings, and more",
    baseUrl: "https://api.openai.com",
    authType: "bearer",
    docsUrl: "https://platform.openai.com/docs/api-reference",
    endpoints: [
      {
        name: "Chat Completion",
        slug: "ai-chat",
        description: "Generate chat completions with GPT models",
        path: "/v1/chat/completions",
        method: "POST",
        params: [
          { name: "model", description: "Model ID (e.g., gpt-4)", required: true },
          { name: "messages", description: "Array of messages", required: true },
          { name: "max_tokens", description: "Max tokens to generate", required: false },
        ],
        suggestedPrice: 0.01,
        suggestedRateLimit: 10,
        category: "ai",
      },
      {
        name: "Embeddings",
        slug: "ai-embeddings",
        description: "Generate text embeddings for semantic search",
        path: "/v1/embeddings",
        method: "POST",
        params: [
          { name: "model", description: "Model ID (e.g., text-embedding-3-small)", required: true },
          { name: "input", description: "Text to embed", required: true },
        ],
        suggestedPrice: 0.001,
        suggestedRateLimit: 60,
        category: "ai",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    provider: "Anthropic",
    description: "Claude AI models for text generation and analysis",
    baseUrl: "https://api.anthropic.com",
    authType: "header",
    authHeader: "x-api-key",
    docsUrl: "https://docs.anthropic.com/en/api",
    endpoints: [
      {
        name: "Claude Messages",
        slug: "claude-chat",
        description: "Generate responses with Claude models",
        path: "/v1/messages",
        method: "POST",
        params: [
          { name: "model", description: "Model ID (e.g., claude-3-opus)", required: true },
          { name: "messages", description: "Array of messages", required: true },
          { name: "max_tokens", description: "Max tokens to generate", required: true },
        ],
        suggestedPrice: 0.015,
        suggestedRateLimit: 10,
        category: "ai",
      },
    ],
  },
  {
    id: "coingecko",
    name: "CoinGecko",
    provider: "CoinGecko",
    description: "Free cryptocurrency data API",
    baseUrl: "https://api.coingecko.com/api/v3",
    authType: "header",
    authHeader: "x-cg-demo-api-key",
    docsUrl: "https://www.coingecko.com/en/api/documentation",
    endpoints: [
      {
        name: "Coin Price",
        slug: "cg-price",
        description: "Get simple price for coins",
        path: "/simple/price",
        method: "GET",
        params: [
          { name: "ids", description: "Coin IDs (e.g., bitcoin,ethereum)", required: true },
          { name: "vs_currencies", description: "Target currencies (e.g., usd,eur)", required: true },
          { name: "include_24hr_change", description: "Include 24h change", required: false },
        ],
        suggestedPrice: 0.0005,
        suggestedRateLimit: 100,
        category: "crypto",
      },
      {
        name: "Coin List",
        slug: "cg-coins",
        description: "List all supported coins",
        path: "/coins/list",
        method: "GET",
        params: [],
        suggestedPrice: 0.001,
        suggestedRateLimit: 30,
        category: "crypto",
      },
      {
        name: "Trending Coins",
        slug: "cg-trending",
        description: "Get trending coins on CoinGecko",
        path: "/search/trending",
        method: "GET",
        params: [],
        suggestedPrice: 0.0005,
        suggestedRateLimit: 60,
        category: "crypto",
      },
    ],
  },
  {
    id: "newsapi",
    name: "NewsAPI",
    provider: "NewsAPI.org",
    description: "News headlines and articles from worldwide sources",
    baseUrl: "https://newsapi.org",
    authType: "header",
    authHeader: "X-Api-Key",
    docsUrl: "https://newsapi.org/docs",
    endpoints: [
      {
        name: "Top Headlines",
        slug: "news-headlines",
        description: "Get top news headlines by country/category",
        path: "/v2/top-headlines",
        method: "GET",
        params: [
          { name: "country", description: "Country code (e.g., us, gb)", required: false },
          { name: "category", description: "business, tech, sports, etc.", required: false },
          { name: "q", description: "Search query", required: false },
        ],
        suggestedPrice: 0.002,
        suggestedRateLimit: 30,
        category: "data",
      },
      {
        name: "Search News",
        slug: "news-search",
        description: "Search news articles",
        path: "/v2/everything",
        method: "GET",
        params: [
          { name: "q", description: "Search query", required: true },
          { name: "from", description: "Start date", required: false },
          { name: "to", description: "End date", required: false },
          { name: "sortBy", description: "relevancy, popularity, publishedAt", required: false },
        ],
        suggestedPrice: 0.003,
        suggestedRateLimit: 20,
        category: "data",
      },
    ],
  },
  {
    id: "alpha-vantage",
    name: "Alpha Vantage",
    provider: "Alpha Vantage",
    description: "Stock market data, forex, and crypto",
    baseUrl: "https://www.alphavantage.co",
    authType: "query",
    authQueryParam: "apikey",
    docsUrl: "https://www.alphavantage.co/documentation/",
    endpoints: [
      {
        name: "Stock Quote",
        slug: "stock-quote",
        description: "Get real-time stock quote",
        path: "/query",
        method: "GET",
        params: [
          { name: "function", description: "GLOBAL_QUOTE", required: true },
          { name: "symbol", description: "Stock symbol (e.g., AAPL)", required: true },
        ],
        suggestedPrice: 0.002,
        suggestedRateLimit: 30,
        category: "finance",
      },
      {
        name: "Stock Time Series",
        slug: "stock-timeseries",
        description: "Get historical stock data",
        path: "/query",
        method: "GET",
        params: [
          { name: "function", description: "TIME_SERIES_DAILY", required: true },
          { name: "symbol", description: "Stock symbol", required: true },
          { name: "outputsize", description: "compact or full", required: false },
        ],
        suggestedPrice: 0.005,
        suggestedRateLimit: 20,
        category: "finance",
      },
    ],
  },
  {
    id: "custom",
    name: "Custom API",
    provider: "Custom",
    description: "Configure any REST API with custom settings",
    baseUrl: "",
    authType: "header",
    docsUrl: "",
    endpoints: [],
  },
];

export function getTemplateById(id: string): ApiTemplate | undefined {
  return API_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): ApiTemplate[] {
  return API_TEMPLATES.filter((t) =>
    t.endpoints.some((e) => e.category === category)
  );
}

export const API_CATEGORIES = [
  { id: "crypto", name: "Cryptocurrency", icon: "bitcoin" },
  { id: "weather", name: "Weather", icon: "cloud" },
  { id: "ai", name: "AI & ML", icon: "brain" },
  { id: "finance", name: "Finance", icon: "dollar-sign" },
  { id: "data", name: "Data & News", icon: "database" },
  { id: "general", name: "General", icon: "globe" },
];
