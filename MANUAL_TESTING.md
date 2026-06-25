# Manual Testing Guide

This document describes how to manually verify the AI Brief Decoder extension in Chrome.

## Prerequisites

- Google Chrome (or Chromium) installed.
- The extension has been built:

  ```bash
  npm install
  npm run build
  ```

  This produces a loadable extension directory at `.output/chrome-mv3/`.

## Load the unpacked extension

1. Open Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked**.
5. Select the `.output/chrome-mv3/` directory inside this project.
6. Confirm the extension appears in the list with the name **AI Brief Decoder Extension**.

## Verify the popup

1. Click the extensions icon in the Chrome toolbar.
2. Click the **AI Brief Decoder Extension** icon.
3. Confirm the popup opens and displays the text **AI Brief Decoder Extension**.

## Check the console for errors

1. Right-click inside the popup and select **Inspect**.
2. In the DevTools window that opens, switch to the **Console** tab.
3. Confirm there are no error messages.

## Expected result

- The extension loads without Chrome showing any errors on the `chrome://extensions/` page.
- The popup opens and renders correctly.
- The popup console contains no errors.
