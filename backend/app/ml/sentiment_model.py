from transformers import pipeline
from loguru import logger
import yfinance as yf
from datetime import datetime


class SentimentAnalyzer:
    """
    Analyzes financial news sentiment using HuggingFace transformers.

    Uses FinBERT — a BERT model specifically fine-tuned on
    financial text. Much more accurate than general sentiment
    models for stock news because it understands financial language.

    Example:
    "Company beats earnings estimates by 20%" → POSITIVE (0.97)
    "SEC launches investigation into accounting fraud" → NEGATIVE (0.99)
    "Stock price remains stable amid market uncertainty" → NEUTRAL (0.84)
    """

    def __init__(self):
        logger.info("Loading FinBERT sentiment model...")
        try:
            self.analyzer = pipeline(
                "sentiment-analysis",
                model="ProsusAI/finbert",
                # FinBERT — specifically trained on financial news
                # Much better than generic sentiment models for stocks
                truncation=True,
                max_length=512
            )
            logger.info("FinBERT loaded successfully")
        except Exception as e:
            logger.warning(f"FinBERT failed to load, using fallback: {e}")
            # Fallback to general sentiment model
            self.analyzer = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                truncation=True,
                max_length=512
            )
            logger.info("Fallback sentiment model loaded")

    def analyze_text(self, text: str) -> dict:
        """Analyze sentiment of a single text"""
        try:
            result = self.analyzer(text[:512])[0]
            # Truncate to 512 tokens — model limit

            label = result["label"].upper()
            score = result["score"]

            # Normalize labels to POSITIVE/NEGATIVE/NEUTRAL
            if label in ["POSITIVE", "POS"]:
                sentiment = "POSITIVE"
            elif label in ["NEGATIVE", "NEG"]:
                sentiment = "NEGATIVE"
            else:
                sentiment = "NEUTRAL"

            return {
                "sentiment": sentiment,
                "score": round(float(score), 4),
                "text": text[:100] + "..." if len(text) > 100 else text
            }
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {"sentiment": "NEUTRAL", "score": 0.5, "text": text}

    def analyze_stock_news(self, symbol: str) -> dict:
        """
        Fetch and analyze all recent news for a stock.
        Returns overall sentiment and per-article breakdown.
        """
        logger.info(f"Analyzing sentiment for {symbol}")

        try:
            # Fetch news from Yahoo Finance
            ticker = yf.Ticker(symbol.upper())
            news = ticker.news[:15]
            # Analyze up to 15 articles

            if not news:
                return {
                    "symbol": symbol.upper(),
                    "overall_sentiment": "NEUTRAL",
                    "sentiment_score": 0.5,
                    "news_count": 0,
                    "headlines": []
                }

            analyzed_headlines = []
            sentiment_scores = {
                "POSITIVE": 0,
                "NEGATIVE": 0,
                "NEUTRAL": 0
            }

            for article in news:
                title = article.get("title", "")
                if not title:
                    continue

                # Analyze the headline
                result = self.analyze_text(title)
                sentiment_scores[result["sentiment"]] += 1

                analyzed_headlines.append({
                    "title": title,
                    "sentiment": result["sentiment"],
                    "score": result["score"],
                    "publisher": article.get("publisher", "Unknown"),
                    "published": datetime.fromtimestamp(
                        article.get("providerPublishTime", 0)
                    ).strftime("%Y-%m-%d %H:%M"),
                    "link": article.get("link", "")
                })

            # Calculate overall sentiment
            total = sum(sentiment_scores.values())
            if total == 0:
                overall = "NEUTRAL"
                overall_score = 0.5
            else:
                pos_ratio = sentiment_scores["POSITIVE"] / total
                neg_ratio = sentiment_scores["NEGATIVE"] / total

                if pos_ratio > 0.6:
                    overall = "BULLISH 📈"
                    overall_score = pos_ratio
                elif neg_ratio > 0.6:
                    overall = "BEARISH 📉"
                    overall_score = 1 - neg_ratio
                else:
                    overall = "NEUTRAL ➡️"
                    overall_score = 0.5

            logger.info(
                f"Sentiment for {symbol}: {overall} | "
                f"Articles: {len(analyzed_headlines)}"
            )

            return {
                "symbol": symbol.upper(),
                "overall_sentiment": overall,
                "sentiment_score": round(overall_score, 4),
                "news_count": len(analyzed_headlines),
                "positive_count": sentiment_scores["POSITIVE"],
                "negative_count": sentiment_scores["NEGATIVE"],
                "neutral_count": sentiment_scores["NEUTRAL"],
                "headlines": analyzed_headlines
            }

        except Exception as e:
            logger.error(f"Stock sentiment failed for {symbol}: {e}")
            raise   