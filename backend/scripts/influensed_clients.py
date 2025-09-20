# Simple LangGraph example with OpenAI
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

# Load environment variables
load_dotenv()
# Simple LangGraph example with OpenAI
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

# Load environment variables
load_dotenv()
news_article = """
(Kitco News) – A week dominated by central bank rate decisions delivered plenty of highs and lows for precious metals markets – and decent gains for gold – but it also may have placed the yellow metal at a crossroads as rate cut optimism gives way once again to data dependence.

Spot gold kicked off the week trading at $3,670 per ounce, and after a quick retest of support near $3,630, the yellow metal trended sideways until North American traders woke up Monday morning and drove the price from $3,638 at 8:15 am Eastern all the way to $3,684 just four hours later.

This established a new elevated range that saw spot gold dip no lower than $3,675 per ounce on its way to a new all-time high of $3,707 at 10:00 a.m. Tuesday morning. 

What followed was the first sharp drop for gold prices, albeit only down to $3,680 per ounce, but the Asian and European sessions saw spot drop as low as $3,660 per ounce by 6:45 a.m. Wednesday morning. 

Once again, the American trading session bought gold all the way back up to the edge of $3,690 per ounce ahead of the highly anticipated Fed rate decision at 2:00 p.m. As is often the case, traders who bought the rumor of a 25-basis-point cut immediately sold the news, driving gold all the way down to support at $3,650 just 45 minutes after the announcement, and to an overnight low of $3,637 per ounce. 

Now the roles were reversed, with European traders driving gold back up to $3,671 before North American traders took it all the way down to the weekly low just below $3,630 per ounce at Thursday’s market open. 

But most of the drama had been squeezed from precious metals markets at this point, and Thursday and Friday saw gold move steadily higher, with a final push just shy of $3,690 per ounce heading into the weekly close"""

portfolios = """
Alisa: Gold-20%, US FX-60%, Gold-20%; Max: Silver-50%, EU(incl. UK and CH) Equities-50%"""
markets =  "FX (USD, CHF, EUR, JPY), Gold, Global Government Bonds, Global Corporate bonds, USA Equities, Emerging Markets, EU(incl. UK and CH) Equities, Japan Equities"
prompt = f"""
You are a financial analyst that can analyze news articles and market impact.

Client portfolios: {portfolios}
News Article: {news_article}

Markets: {markets}

Return only the names of the clients that you are more than 80% sure to be heavily(portfoilo price could potentially change by more than 5%) affected by the news article.
"""

# Initialize the OpenAI model
model = ChatOpenAI(
    model="gpt-4o-mini",
    api_key=os.getenv("OPENAI_API_KEY"),
    temperature=0.1
)

# Create the agent
agent = create_react_agent(
    model=model,
    tools=[],  # No tools needed for this analysis
    prompt="You are a financial analyst that can analyze news articles and market impact."
)

# Run the agent
result = agent.invoke(
    {"messages": [{"role": "user", "content": prompt}]}
)

print("Agent response:")
print(result["messages"][-1].content)
