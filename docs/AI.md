# AI Playbook for Engineers

## 1. The Art of the Prompt: Core Principles

The quality of the output is a direct reflection of the quality of the input. Vague prompts yield vague results.

### 1.1. Assign a Persona (Role-Playing)

Always start your prompt by giving the AI a role. This frames its knowledge and response style.

**Good Prompt:**
> "You are an expert in Next.js 14 and React server components. Your task is to..."

**Why it works:** It narrows the AI's focus to a specific domain, preventing it from giving outdated or irrelevant advice (e.g., solutions for the Next.js Pages Router).

### 1.2. Provide Rich Context

Provide all relevant information, including the goal, the language, the framework, existing code, and any constraints.

**Bad Prompt:**
> "My code doesn't work. Fix it."
> `(pastes 100 lines of code)`

**Good Prompt:**
> "You are a TypeScript and React expert. I am trying to create a custom hook `useDebounce` in my Next.js app. The goal is to delay the execution of a function until the user has stopped typing. The hook seems to be causing an infinite loop. Here is my current code. Please identify the issue and provide a corrected, performant version of the hook."
> `(pastes relevant hook code)`

### 1.3. Define the Output Format

Be explicit about what the final output should look like. This saves you significant time on reformatting.

**Good Prompt:**
> "Generate a list of three potential solutions. For each solution, provide a brief explanation, a code snippet, and a list of pros and cons in a markdown table."

---

## 2. Practical Prompts for Daily Tasks

### 2.1. Code Generation

**Generating a new component:**
> "You are a senior React developer specializing in ShadCN UI and Tailwind CSS. Create a responsive React component for a user profile card. It should accept props for `avatarUrl`, `name`, `username`, and `bio`. Use the `Avatar`, `Card`, and `Button` components from ShadCN. The card should include a "Follow" button. Provide the complete code in a single file."

**Writing a utility function:**
> "Write a TypeScript utility function called `formatDate` that takes an ISO 8601 date string and returns it in the format 'Month Day, Year' (e.g., 'June 15, 2024'). Use the `date-fns` library. Ensure the function handles invalid date inputs gracefully by returning an empty string."

### 2.2. Debugging and Error Analysis

**Analyzing an error message:**
> "I'm getting the following error in my Next.js application: `[Error message text]`. The error points to line 42 of this file: `[Paste file content]`. Based on the error and the code, what is the most likely cause, and how can I fix it?"

**Finding logical bugs:**
> "Review the following JavaScript function. It's supposed to calculate the total price of items in a shopping cart, including a 10% tax, but the result is consistently incorrect. Walk me through the code step-by-step (chain of thought), identify the logical error, and provide the corrected function."
> `(Paste function code)`

### 2.3. Refactoring and Optimization

**Improving code quality:**
> "You are a code quality expert. Refactor this JavaScript code to use modern ES6+ features like async/await instead of Promises, and destructuring. Also, identify any potential performance bottlenecks."
> `(Paste code)`

**Converting to TypeScript:**
> "Convert the following React class component to a functional component using TypeScript and hooks. Ensure all props and state are properly typed."
> `(Paste class component code)`

### 2.4. Documentation and Learning

**Explaining complex code:**
> "Explain this TypeScript code snippet like I'm a junior developer. Focus on the purpose of the generic type `<T>` and how the `useEffect` hook is managing side effects."
> `(Paste code)`

**Writing documentation:**
> "Generate JSDoc comments for the following function. Explain what the function does, what each parameter is for, and what it returns."
> `(Paste function code)`

**Learning a new concept:**
> "Compare and contrast server-side rendering (SSR) and static site generation (SSG) in the context of Next.js. Provide a simple analogy for each and a recommendation for when to use one over the other."

---

## 3. Advanced Tricks

- **Chain of Thought (CoT):** Ask the AI to "think step-by-step" or "explain its reasoning" before giving the final answer. This often leads to more accurate results, especially for complex problems, as it forces the AI to check its own logic.
- **Provide Examples (Few-shot Prompting):** If you need a specific format or style, give the AI one or two examples of the input and the desired output. This is one of the most effective ways to guide it.
- **Iterative Refinement:** Don't expect the perfect answer on the first try. Use follow-up prompts like "That's good, but can you make it more concise?" or "Now, can you add error handling for the network request?" to refine the output.
- **Negative Prompts:** Tell the AI what *not* to do. For example, "...do not use any external libraries" or "...do not use class components."
