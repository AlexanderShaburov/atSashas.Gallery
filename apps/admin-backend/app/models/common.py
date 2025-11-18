from enum import Enum
from typing import Optional, Annotated
from pydantic import BaseModel, Field

# ----- Availability -----


class Availability(str, Enum):
    available = "available"
    reserved = "reserved"
    sold = "sold"
    privateCollection = "privateCollection"
    notForSale = "notForSale"


# ----- Dimensions -----


class UnitName(str, Enum):
    cm = "cm"
    inch = "in"


class Dimensions(BaseModel):
    width: float
    height: float
    unit: UnitName


# ----- Localized -----


class Localized(BaseModel):
    en: Optional[str] = None
    ru: Optional[str] = None
    it: Optional[str] = None
    es: Optional[str] = None
    pt: Optional[str] = None


# ----- Money -----


class CurrencyName(str, Enum):
    USD = "USD"
    EUR = "EUR"
    ILS = "ILS"
    GBP = "GBP"
    CHF = "CHF"
    JPY = "JPY"
    CNY = "CNY"
    CAD = "CAD"
    AUD = "AUD"


class Money(BaseModel):
    amount: float
    currency: CurrencyName


# ----- ISODate -----

ISODate = Annotated[str, Field(pattern=r"^\d{4}-\d{2}-\d{2}$")]


# ----- Images -----


class PreviewSources(BaseModel):
    avif: Optional[str] = None
    webp: Optional[str] = None
    jpeg: Optional[str] = None
