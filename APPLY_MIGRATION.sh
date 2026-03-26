#!/bin/bash
# Script to apply employer migration
# Usage: ./APPLY_MIGRATION.sh

set -e

echo "🔍 Checking DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "   Please set it: export DATABASE_URL='postgresql://...'"
    exit 1
fi

echo "✅ DATABASE_URL found"

echo ""
echo "📋 Applying Migration 007: Add employer tables and fields..."
psql "$DATABASE_URL" -f database/migrations/007_add_employer_to_pvz_and_employees.sql

echo ""
echo "📋 Applying Migration 008: Import PVZ from CSV..."
psql "$DATABASE_URL" -f database/migrations/008_import_pvz_from_csv.sql

echo ""
echo "✅ Migration completed successfully!"
echo ""
echo "📊 Verification queries:"
echo "------------------------"
echo "Run this SQL to check PVZ distribution:"
echo ""
echo "SELECT e.name_short, COUNT(p.id) as pvz_count"
echo "FROM pvz_points p"
echo "JOIN employers e ON p.employer_id = e.id"
echo "GROUP BY e.name_short"
echo "ORDER BY pvz_count DESC;"
echo ""
