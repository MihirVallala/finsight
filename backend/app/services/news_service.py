import yfinance as yf
from datetime import datetime
from loguru import logger


class NewsService:
    """
    Fetches financial news for stocks using yFinance.
    No API key needed — pulls from Yahoo Finance news feed.
    """

    def get_stock_news(self, symbol: str, limit: int = 10) -> list:
        """Get latest news headlines for a stock"""
        logger.info(f"Fetching news: {symbol}")
        try:
            ticker = yf.Ticker(symbol.upper())
            news = ticker.news

            articles = []
            for item in news[:limit]:
                articles.append({
                    "title": item.get("title", ""),
                    "publisher": item.get("publisher", ""),
                    "link": item.get("link", ""),
                    "published": datetime.fromtimestamp(
                        item.get("providerPublishTime", 0)
                    ).strftime("%Y-%m-%d %H:%M"),
                    "summary": item.get("summary", "")[:200]
                    if item.get("summary") else ""
                })

            logger.info(f"Found {len(articles)} articles for {symbol}")
            return articles

        except Exception as e:
            logger.error(f"News fetch failed for {symbol}: {e}")
            return []     