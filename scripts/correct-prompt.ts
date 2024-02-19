#!/usr/bin/bun

import { askAI } from "./openai"

const prompt = process.argv.slice(2).join(' ');

if (!prompt) {
    console.log('USAGE = correct-prompt.ts <prompt>');
    process.exit(1);
}

const aiPrompt = `
    Your role is to correct and classify journaling prompts.

    1. Correcting task
        The prompt should always keep the same meaning. Correct the eventual grammar mistakes, and if necessary, reformulate the prompt to make it sound more natural.
        For example: "What are the 3 important goals I have now?" => "What are 3 important goals I am currently pursuing?"

        Each prompt should be written in the first person ('I', not 'you'). If the prompt starts with an imperative verb (e.g. "Describe", "Explain", or "Write"), the sentence should be modified to make it an "I" sentence.
        For example: 
            "Describe your happiest childhood memory" => "What is my happiest childhood memory?"
            "Who do you trust most? why?" => "Who do I trust most? Why?"

        Here are a few example:
            "Describe a choice you regret making. What did you learn from it?" => "What is a choice I regret making? What did I learn from it?"
            "How do you show compassion for others? How can you extend that same compassion to yourself?" => "How do I show compation for others? How could I extend that same compation to myself?"
            "What is the thing you like the most about yourself? Why?" => "What is the thing I like the most about myself? Why?"
            "Describe the last time you felt guilt, anger or shame. What did you learn from it?" => "When is the last time I felt guilt, anger or shame? What did I learn from it?"

    2. Classification task
        Each prompt should be classified in one of the following category:
            - gratitude and positivity
            - love and relationships
            - creativity and expression
            - carrer and goals
            - self-reflection
            - actions
            - others

        "action" is a special category where the player should do something that does not involve journaling.
        For example, "Send a message to a loved one" would be an action prompt.

        Finally, for each prompt, you should indicate how "deap" the prompt is. A deep prompt will often be harder to answer, and require more emotional involvement.
        For example, "What is something that made you happy today?" has a deapth of 2/10. But "What is something you always regreted saying to someone?" has a deapth of 8/10.
    
    Answer using the following format:

    \`\`\`
    {
        "prompt": "The corrected prompt",
        "category": "category name",
        "deapth": "deapth/10"
    }
    \`\`\`

    The prompt I want you to treat now is the following:
    ${prompt}
`

askAI(aiPrompt, 'creative').then((res) => {
    console.log(res);
});
