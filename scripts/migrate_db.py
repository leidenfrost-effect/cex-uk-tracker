#!/usr/bin/env python3
"""Apply idempotent SQL migrations to the configured PostgreSQL database."""
from __future__ import annotations

import os
from pathlib import Path

import psycopg


def main() -> None:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL is required")
    migration_dir = Path(__file__).resolve().parents[1] / "db" / "migrations"
    migration_files = sorted(migration_dir.glob("*.sql"))
    if not migration_files:
        raise SystemExit(f"No migrations found in {migration_dir}")
    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            for migration in migration_files:
                print(f"Applying {migration.name}")
                cursor.execute(migration.read_text(encoding="utf-8"))
        connection.commit()
    print("Database migrations are up to date.")


if __name__ == "__main__":
    main()
