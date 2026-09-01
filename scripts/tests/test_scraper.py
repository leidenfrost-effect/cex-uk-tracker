import unittest
from datetime import datetime, timezone
from decimal import Decimal

from scripts.scrape_all_cex import (
    ValidationError,
    parse_tcmb_xml,
    platform_matches_category,
    transform_item,
    validate_catalog,
)


class ScraperTests(unittest.TestCase):
    def test_dynamic_category_matching(self):
        self.assertTrue(platform_matches_category("PS5", "Playstation5 Games"))
        self.assertTrue(platform_matches_category("XBOX_SX", "Xbox Series X Software"))
        self.assertFalse(platform_matches_category("XBOX_ONE", "Playstation5 Games"))

    def test_transform_uses_real_stock_and_never_invents_quantity(self):
        game = transform_item({
            "boxId": "123", "boxName": "Example", "sellPrice": 12,
            "categoryName": "Playstation5 Games", "outOfStock": 0, "cannotBuy": 0,
            "imageUrls": {},
        }, "PS5")
        self.assertIsNotNone(game)
        self.assertTrue(game["in_stock"])
        self.assertIsNone(game["stock_count"])

        counted = transform_item({
            "boxId": "124", "boxName": "Counted", "sellPrice": 9,
            "ecomQuantity": 2, "collectionQuantity": 3, "outOfStock": 0, "cannotBuy": 0,
        }, "PS5")
        self.assertEqual(counted["stock_count"], 5)

    def test_cross_platform_duplicate_fails_closed(self):
        shared = {"id": "same"}
        with self.assertRaises(ValidationError):
            validate_catalog({"PS5": [shared], "PS4": [shared]}, min_items=1)

    def test_transform_preserves_cex_filter_facets(self):
        game = transform_item({
            "boxId": "125", "boxName": "Facet Example", "sellPrice": 20,
            "categoryFriendlyName": "Playstation5 Games", "inStockStore": 1, "inStockOnline": 0,
            "collectionStores": ["London - W1 Tottenham Crt Rd"], "Developer": ["Example Studio"],
            "Genre": ["Action", "Adventure"], "PEGI Certificate": ["16+"], "popularityScore": 7.5,
        }, "PS5")
        self.assertEqual(game["category_name"], "Playstation5 Games")
        self.assertTrue(game["in_stock_store"])
        self.assertFalse(game["in_stock_online"])
        self.assertEqual(game["stores"], ["London - W1 Tottenham Crt Rd"])
        self.assertEqual(game["developer"], "Example Studio")
        self.assertEqual(game["genres"], ["Action", "Adventure"])
        self.assertEqual(game["age_rating"], "16+")
        self.assertEqual(game["popularity_score"], 7.5)

    def test_tcmb_forex_selling_is_divided_by_unit(self):
        payload = b'''<Tarih_Date Date="08/28/2026">
          <Currency CurrencyCode="GBP"><Unit>2</Unit><ForexSelling>131.0982</ForexSelling></Currency>
        </Tarih_Date>'''
        observed = datetime(2026, 8, 28, tzinfo=timezone.utc)
        result = parse_tcmb_xml(payload, observed)
        self.assertEqual(result.source_date, "2026-08-28")
        self.assertEqual(result.rate, Decimal("65.5491"))
        self.assertEqual(result.observed_at, observed)


if __name__ == "__main__":
    unittest.main()
