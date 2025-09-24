from transformers import pipeline

model = pipeline(
    "sentiment-analysis",
    model="mrm8488/distilroberta-finetuned-financial-news-sentiment-analysis"
)

print(
    model(
        """
       The S&P 500
 took a pause from its recent gains on Tuesday as doubts about the sustainability of the artificial intelligence bull trend worried investors.

The broad market index closed down 0.6% at 6,656.92, after reaching a new all-time intraday high earlier in the session and posting a record close on Monday. The Nasdaq Composite
 fell nearly 1% to settle at 22,573.47, with the losses led by AI names like Nvidia
, Oracle
 and Amazon
. The Dow Jones Industrial Average
 finished 88.76 points, or 0.2%, lower at 46,292.78.

Nvidia shares fell 2.8% a day after the chipmaker announced a $100 billion investment in OpenAI, which boosted its stock and the whole equity market. Some investors were rethinking the deal between customer and supplier for its resemblance to events seen in the dot-com bubble. Investors also raised questions about whether there is enough energy to power the growth plans by the two marquee AI companies.

Oracle, which is up more than 50% in three months because of an optimistic AI sales forecast, was off by 4.4%.


        """
    )
)

