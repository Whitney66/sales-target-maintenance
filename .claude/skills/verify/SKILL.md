# sales-target-maintenance verification

This is a static HTML/CSS/JS prototype. Verify UI changes by serving the repo directory and driving it in a real browser.

## Launch

Use a temporary local server from the repo root, for example a small Node `http.createServer` serving `index.html`, `script.js`, `styles.css`, and `test-data/*`.

## Browser handle

Microsoft Edge and Chrome are installed on this Windows environment. Edge works headlessly with Chrome DevTools Protocol:

- executable: `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`
- useful flags: `--headless=new --remote-debugging-port=<port> --user-data-dir=<temp-dir> --window-size=1500,1000`

Connect to `http://127.0.0.1:<debug-port>/json`, then use the tab's `webSocketDebuggerUrl` to evaluate DOM interactions and capture screenshots via `Page.captureScreenshot`.

## Flows to drive

- Load `/index.html` and inspect the filter row and table header.
- Click `#addBtn` to open the add/edit modal.
- For dropdown placeholder changes, read visible text from `[data-form-line]`.
- For add modal multi-select behavior, check group/employee checkboxes in the custom dropdowns, dispatch bubbling `change`, fill month/amount, click `#saveBtn`, and confirm added table rows/toast.
- For validation probes, open a fresh add modal and click `#saveBtn` with empty fields; `#formTip` should show the first missing field.
