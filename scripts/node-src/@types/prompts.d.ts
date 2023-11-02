import prompts from 'prompts';

declare module 'prompts' {
    interface PromptObject<T extends string = string> {
        input: string;
    }
}

export default prompts;
