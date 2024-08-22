#!/bin/bun

import fs from "fs";
import path from "path";
import { Database } from "bun:sqlite";

type Note = {
  id: number;
  guid: string;
  mid: number;
  mod: number;
  usn: number;
  tags: string;
  flds: string;
  sfld: string;
  csum: number;
  flags: number;
  data: string;
};

type Card = {
    id: number;
    nid: number; // Note Id
    did: number; // Deck Id
    ord: number;
    mod: number;
    usn: number;
    type: number;
    queue: number;
    due: number;
    ivl: number;
    factor: number;
    reps: number;
    lapses: number;
    left: number;
    odue: number;
    odid: number;
    flags: number;
    data: string;
};

type Deck = {
  id: number;
  name: string;
  mtime_secs: number;
  usn: number;
  common: number;
  kind: number;
};

type JoinedData = {
  note_id: number,
  fields: string,
  deck_id: number,
  deck_name: string,
  modified_date: number
}

const DB_PATH = path.join(
  process.env["HOME"] || "~",
  ".local/share/Anki2/User 1/collection.anki2"
);

if (!fs.existsSync(DB_PATH)) {
  console.error(`File ${DB_PATH} not found`);
  process.exit(1);
}

const db = new Database(DB_PATH);

let notes = [] as JoinedData[];

const query = `
  SELECT
    notes.id as note_id,
    notes.flds as fields,
    notes.mid as modified_date,
    decks.id as deck_id,
    decks.name as deck_name
  FROM
    notes
      inner join cards on notes.id = cards.nid
        inner join decks on decks.id = cards.did;
`

try {
  notes = db.query<JoinedData, []>(query).all();
} catch (e) {
  console.error(e);
  process.exit(1);
}

for (const note of notes) {
  // console.log(note);
  console.log(note.fields.split("\u001f"));
  console.log(note.deck_name);
  console.log(new Date(note.modified_date).toISOString());
  console.log("--------------------");
}
