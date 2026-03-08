# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Educational/benchmark project comparing key-existence lookup performance across different data structures and storage backends. All scripts use 10M generated items from `generated.data`.

## Commands

```bash
# Prerequisites: Docker services (MySQL, Redis, Memcached)
docker compose up -d

# Generate test data (10M items, writes to generated.data)
node bin/generate-data.mjs

# Populate databases
node bin/populate/populate-mysql.mjs      # MySQL
node bin/populate/populate-redis.mjs      # Redis
node bin/populate/populate-memcached.mjs  # Memcached

# Run benchmarks (each is a standalone script, run from project root)
node bin/benchmarks/benchmark-bloom.mjs            # Bloom filter only
node bin/benchmarks/benchmark-cascade-bloom.mjs    # Cascade Bloom filter
node bin/benchmarks/benchmark-map.mjs              # Map only
node bin/benchmarks/benchmark-mysql-no-index.mjs   # MySQL without index (very slow, only 10 queries)
node bin/benchmarks/benchmark-mysql-index.mjs      # MySQL with B-tree index
node bin/benchmarks/benchmark-mysql-handler.mjs    # MySQL HANDLER direct access
node bin/benchmarks/benchmark-redis.mjs            # Redis EXISTS
node bin/benchmarks/benchmark-memcached.mjs        # Memcached GET
```

No test framework or linter configured. No build step.

## Architecture

- **ES Modules** (`.mjs` files) with `"type": "commonjs"` in package.json — scripts run as ESM via the `.mjs` extension
- **src/BloomFilter.mjs** — Core Bloom filter using `@node-rs/xxhash` (xxh64) with double hashing scheme. `computeBloomFilterParams()` calculates optimal size/hash count from expected items and target FPR
- **src/CascadeBloomFilter.mjs** — Multi-level cascade that eliminates false positives by alternating positive/negative filter levels. Requires both positive and negative sets at construction time
- **bin/** — All executable scripts: `generate-data.mjs`, `populate/` (DB loaders), `benchmarks/` (performance tests). Benchmarks read `generated.data` from the project root
- **Docker services** — MySQL 9 (port 3306), Adminer (port 8888), Redis 7 (port 6379), Memcached (port 11211). DB credentials: root/password, database: mydb
