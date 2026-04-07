# Cocapn Equipment Library

You route requests across 9 LLM providers. Your application code never handles API keys directly. This is a collection of standalone, zero-dependency modules that address common infrastructure problems encountered when moving an agent from demo to production.

**Live Instance:** https://cocapn-equipment.casey-digennaro.workers.dev

## Why This Exists
Agent projects often stall on operational infrastructure: failover, memory management, and data safety. This repository provides tested modules for these problems so you can focus on your agent's logic.

## Quick Start
1.  Fork this repository.
2.  Deploy it to Cloudflare Workers.
3.  Copy the specific module files you need into your own project. No package manager or framework is required.

You can test every module interactively at the live URL.

## What Makes This Different
1.  **No Framework:** Copy standalone JavaScript files, don't import a monolithic SDK.
2.  **Update Control:** You maintain your own fork. Integrate upstream changes only when you choose.
3.  **Zero Dependencies:** Each module has no npm dependencies. The code you read is the code that runs.

## Architecture
Built for Cloudflare Workers. Each module is a fully standalone ES module with zero runtime dependencies.

## Features
- **BYOK v2:** Route requests across 9 LLM providers. API keys are stored only as Cloudflare environment variables. Includes automatic failover.
- **Trust System:** Implements decaying trust scores to gate agent access to sensitive tools.
- **Crystal Graph:** Caches reasoning chains and final conclusions to reduce redundant LLM calls.
- **Dead Reckoning:** Runs initial reasoning with a capable model, then uses faster, cheaper models for similar subsequent tasks.
- **Keeper Memory:** Tiered agent memory (hot/warm/cold) with a configurable forgetting policy.
- **PII Dehydrate:** Scrubs personally identifiable information from text before sending it to an LLM, then rehydrates it in the response.
- **Boot Camp:** Gradually unlocks agent capabilities based on demonstrated performance.

## A Specific Limitation
The trust scoring system requires you to manually define and instrument the events that increase or decrease an agent's score. It does not automatically observe agent behavior.

## Configuration
API keys are stored exclusively as secrets in your Cloudflare Worker environment. They are never embedded in code, logs, or exposed in request payloads.

```plaintext
DEEPSEEK_API_KEY="your_key"
ANTHROPIC_API_KEY="your_key"
OPENROUTER_API_KEY="your_key"
```

## Contributing
This is fork-first open source. You own your deployment. If you build a robust, zero-dependency module that solves a common problem, open a pull request to contribute it back.

## License
MIT

Superinstance and Lucineer (DiGennaro et al.)

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>