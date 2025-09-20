# Finance News Analyzer Backend

A LangGraph-powered API for analyzing financial news sentiment and market impact using AI.

## Features

- **Sentiment Analysis**: Analyze the sentiment of financial news articles
- **Market Impact Assessment**: Evaluate potential market impact of news
- **LangGraph Workflows**: Structured AI workflows for complex analysis
- **FastAPI Backend**: RESTful API with automatic documentation
- **Async Processing**: High-performance async analysis

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py              # Configuration settings
│   ├── models.py              # Pydantic models
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py          # API endpoints
│   ├── graphs/
│   │   ├── __init__.py
│   │   └── finance_analyzer.py # LangGraph workflow
│   └── services/
│       ├── __init__.py
│       └── analysis_service.py # Analysis service
├── venv/                      # Virtual environment
├── main.py                    # FastAPI application
├── requirements.txt           # Python dependencies
├── env.example               # Environment variables template
└── README.md                 # This file
```

## Setup

### 1. Activate Virtual Environment

```bash
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:

```env
OPENAI_API_KEY=your_openai_api_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=start-hack-finance-news-analyzer
DEBUG=true
PORT=8000
```

### 4. Run the Application

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:

- **Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/api/v1/health`

## API Endpoints

### POST /api/v1/analyze

Analyze financial news articles for sentiment and market impact.

**Request Body:**

```json
{
  "articles": [
    {
      "title": "Market Analysis: Tech Stocks Rise",
      "content": "Technology stocks showed strong performance...",
      "source": "Financial Times",
      "published_at": "2024-01-15T10:00:00Z",
      "url": "https://example.com/article1"
    }
  ],
  "analysis_type": "sentiment",
  "focus_areas": ["technology", "market_outlook"]
}
```

**Response:**

```json
{
  "success": true,
  "result": {
    "sentiment": {
      "overall_sentiment": "positive",
      "confidence": 0.85,
      "sentiment_breakdown": {
        "market_outlook": 0.7,
        "company_performance": 0.8,
        "economic_conditions": 0.6
      }
    },
    "market_impact": {
      "impact_level": "medium",
      "affected_sectors": ["Technology", "Financial Services"],
      "key_insights": [
        "Interest rate changes may affect tech valuations",
        "Banking sector shows mixed signals"
      ]
    },
    "summary": "Analysis of 1 financial news articles shows positive sentiment with 85% confidence...",
    "recommendations": [
      "Monitor affected sectors closely",
      "Consider sentiment trends in investment decisions",
      "Stay updated on key market indicators"
    ],
    "confidence": 0.825
  },
  "processing_time": 2.34
}
```

## LangGraph Workflow

The analysis is powered by a LangGraph workflow that:

1. **Analyzes Sentiment**: Uses OpenAI to analyze the sentiment of news articles
2. **Assesses Market Impact**: Evaluates potential market implications
3. **Generates Final Analysis**: Combines results into comprehensive insights

## Development

### Adding New Analysis Types

1. Extend the `AnalysisRequest` model in `app/models.py`
2. Add new nodes to the LangGraph workflow in `app/graphs/finance_analyzer.py`
3. Update the service layer in `app/services/analysis_service.py`

### Environment Variables

- `OPENAI_API_KEY`: Required for OpenAI API access
- `LANGCHAIN_TRACING_V2`: Enable LangSmith tracing (optional)
- `LANGCHAIN_API_KEY`: LangSmith API key (optional)
- `LANGCHAIN_PROJECT`: LangSmith project name (optional)
- `DEBUG`: Enable debug mode
- `PORT`: Server port (default: 8000)

## Dependencies

- **LangGraph**: AI workflow orchestration
- **LangChain**: LLM framework
- **FastAPI**: Web framework
- **Pydantic**: Data validation
- **OpenAI**: Language model access

## License

MIT License
