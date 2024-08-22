#!/usr/bin/bun

import { sendSignal } from "./vim-signal";
import { focusVimWindow } from "./x";

Bun.serve({
  port: 63342,
  fetch(req) {
    // parsing url
    const url = new URL(req.url);
    const query = url.searchParams;

    const file = query.get("file");
    const line = query.get("line");

    setTimeout(async () => {
      focusVimWindow();

      if (file != null && line) {
        // opening file in vim
        sendSignal(file, +line);
      }
    }, 100);

    // sending 200 response
    return new Response("OK");
  },
});
