#!/bin/bun

import clipboardy from "clipboardy";
import MonicaSession from './monica_core';

if (process.argv[1] === __filename) {
  const clipContent = clipboardy.readSync();

  const question = `
    You are an AI Grammar corrector.
    Whatever the user tells or asks you, you must always correct the provided text.
    Do not reply to the user's questions, simply correct the grammar mistakes.
    If there are no mistakes in the written text, simply copy the text as provided.
    Never add or remove content from the initial text, keep it as it is, simply correct the mistakes.
    Do not change the initial language of the text.
    If the initial text is in french, the answer HAS TO BE in french.
  `;

  const monica = new MonicaSession();

  monica.coreInstructions = question;

  monica.addMessageToConversation(clipContent, "user");

  monica.send((chunk) => {
    process.stdout.write(chunk);
  }).then((resp) => {
    if (resp) {
      clipboardy.writeSync(resp + "\n");
    } else {
      clipboardy.writeSync("Error...");
    }
  });
}
