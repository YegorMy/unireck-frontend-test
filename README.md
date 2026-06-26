# AI Brief Decoder Extension

**English** · [Русский](./README.ru.md)

A minimal Chrome extension built with [WXT](https://wxt.dev/), React, and TypeScript.

## Package Manager

This project uses **npm**.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

This starts WXT in development mode and produces an unpacked extension output.

## Manual Testing

See [MANUAL_TESTING.md](./MANUAL_TESTING.md) for step-by-step instructions on loading the built extension in Chrome and verifying the popup.

## Build

```bash
npm run build
```

## Typecheck

```bash
npm run typecheck
```

## Project Structure

- `entrypoints/popup/` — popup HTML, React mount, and root component.
- `components/` — placeholder for feature UI components.
- `lib/` — placeholder for the typed API client.
