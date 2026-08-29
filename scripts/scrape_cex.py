#!/usr/bin/env python3
"""Compatibility entrypoint for the validated full catalog synchronizer."""
import asyncio

from scrape_all_cex import main


if __name__ == "__main__":
    asyncio.run(main())
