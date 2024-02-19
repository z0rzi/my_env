import prompts from "prompts";
import CopilotSession from "./copilot";

const copilot = new CopilotSession();

while (true) {
  const { question } = await prompts({
    type: "text",
    name: "question",
    message: "User",
  });

  if (!question) {
    break;
  }

  const answer = await copilot.ask(question);

  console.log('Copilot > ', answer);
}
