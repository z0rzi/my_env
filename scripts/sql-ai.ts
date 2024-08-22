#!/bin/bun

import { $ } from "bun";
import { Client } from "pg";
import Copilot from "./copilot/copilot";
import prompts from "prompts";

const args = process.argv.slice(2);

let host = "localhost";
let port = "5432";
let user = "postgres";
let password = "";
let db = "";

function usageError(): string {
  console.error(
    "Usage: sql-ai.ts [-h host] [-p port] [-U user] [-P password] <database>"
  );
  process.exit(1);
}

function shiftArg(): string {
  const nextArg = args.shift();
  if (!nextArg || nextArg.startsWith("-")) {
    return usageError();
  }
  return nextArg;
}

while (args.length > 0) {
  const arg = args.shift();
  if (arg === "-h") host = shiftArg();
  else if (arg === "-p") port = shiftArg();
  else if (arg === "-U") user = shiftArg();
  else if (arg === "-P") password = shiftArg();
  else db = arg || "";
}

if (!db) {
  console.log("Database name not provided");
  usageError();
}

if (!password) {
  console.log("Password not provided");
  usageError();
}

console.log(`pg_dump --section=pre-data -h ${host} -p ${port} -U ${user} --dbname=${db} 2> /dev/null`);

const res =
  await $`pg_dump --section=pre-data -h ${host} -p ${port} -U ${user} --dbname=${db}`
    .text()
    .catch((err) => {
      console.log(err);
      process.exit(1);
    });

// Cleaning up the db structure

let dbStructure = res
  .replace(/--.*\n/g, "")
  .replace(/\n+/g, " ")
  .replace(/;/g, ";\n")
  .replace(/ +/g, " ")
  .replace(/\n +/g, "\n")
  .replace(/COMMENT ON.*/g, " ")
  .replace(/CREATE EXTENSION.*/g, " ")
  .replace(/SELECT.*/g, " ")
  .replace(/\n.*OWNER TO.*/g, " ")
  .replace(/ALTER SCHEMA.*/g, " ")
  .replace(/GRANT.*/g, " ")
  .replace(/REVOKE.*/g, " ")
  .replace(/SET.*/g, " ")
  .replace(/\n\s*/g, "\n");

const matches = dbStructure.match(/\n.*ATTACH PARTITION .*/g);
if (matches) {
  matches.forEach((match) => {
    match = match.trim();
    const tableName = match.match(/ATTACH PARTITION ([\w.]+)/)![1];

    dbStructure = dbStructure.replace(
      new RegExp(`\n.*${tableName}.*;`, "g"),
      ""
    );
  });
}

function parseAiAnswer(answer: string) {
  // Only keeping code blocks
  const codeBlocks = answer.split(/```\w*/).filter((_, i) => i % 2 === 1);

  if (codeBlocks.length === 0) {
    return "";
  }

  return codeBlocks[0].trim();
}

const conv = new Copilot();

conv.coreInstructions = `You are a postgres database administrator with 20 years experience in writing sql code. Your role is to create sql commands from human language.\nAlways wrap your sql code in code blocks.\n\n Here is the structure of the database: \`\`\`sql${dbStructure}\`\`\``;

const sql = new Client({ host, port: +port, user, password, database: db });
sql.connect();

while (true) {
  const { command } = await prompts({
    input: "",
    type: "text",
    name: "command",
    initial: "",
    message: "",
  });

  if (!command) break;

  let sqlCommand = "";

  const firstWord = command.split(" ")[0];
  if (firstWord.length > 3 && firstWord === firstWord.toUpperCase()) {
    // The user directly entered a SQL command
    sqlCommand = command;
    conv.addMessageToConversation(
      "Executed command:\n```sql\n" + sqlCommand + "\n```",
      "system"
    );
  } else {
    // The AI has to generate the SQL command
    const aiRes = await conv.ask(command);
    sqlCommand = parseAiAnswer(aiRes);
    if (!sqlCommand) {
      console.log("AI didn't generate any code...");
      continue;
    }
  }

  if (sqlCommand.toUpperCase().startsWith("SELECT")) {
    console.log(sqlCommand);
    const time = Date.now();
    const { rows } = await sql.query(sqlCommand);
    const timeTaken = Date.now() - time;
    console.table(rows);
    console.log(`Time taken: ${timeTaken / 1000}s`);
    continue;
  }

  const { runSql } = await prompts({
    input: "",
    type: "confirm",
    name: "runSql",
    initial: "y",
    message: sqlCommand,
  });

  if (runSql) {
    try {
      await sql.query(sqlCommand);
      console.log("Command executed successfully");
    } catch (e) {
      console.error("Error executing command", e);
    }
  }
}

sql.end();
