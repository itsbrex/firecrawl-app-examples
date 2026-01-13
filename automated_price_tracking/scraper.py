import os
from firecrawl import Firecrawl
from pydantic import BaseModel, Field
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Initialize Firecrawl client with API key from environment
app = Firecrawl(api_key=os.getenv("FIRECRAWL_API_KEY"))


class Product(BaseModel):
    """Schema for creating a new product"""

    url: str = Field(description="The URL of the product")
    name: str = Field(description="The product name/title")
    price: float = Field(description="The current price of the product")
    currency: str = Field(description="Currency code (USD, EUR, etc)")
    main_image_url: str = Field(description="The URL of the main image of the product")


def scrape_product(url: str):
    # Use v2 API scrape with JSON format for extraction
    doc = app.scrape(
        url,
        formats=[
            {
                "type": "json",
                "schema": Product,
                "prompt": "Extract product information including name, price, currency, and main image URL",
            }
        ],
    )

    # Extract the data from the document's json field
    extracted_data = doc.json if doc.json else {}

    # Add the scraping date to the extracted data
    extracted_data["timestamp"] = datetime.utcnow()

    return extracted_data


if __name__ == "__main__":
    product = "https://www.amazon.com/gp/product/B002U21ZZK/"

    print(scrape_product(product))
