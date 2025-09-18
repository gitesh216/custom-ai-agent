import { ChatGroq } from "@langchain/groq";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import readline from "node:readline/promises";

/**
 * 1. Define node function
 * 2. Build the graph
 * 3. Compile and invoke the graph
*/

/**
 * Initialize the LLM
*/
const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  maxTokens: undefined,
  maxRetries: 2,
});


async function callModel(state) {
  // call the LLM using APIs
  console.log("Calling llm...");

  const response = await llm.invoke(state.messages);

  return {messages: [response]};
}

/**
 * Build the graph
 */
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");


/**
 * Compile the graph
 */
const app = workflow.compile();


async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while(true) {
    const userInput = await rl.question("You: ");

    if(userInput === "exit") {
      break;
    }

    const finalState = await app.invoke({
      messages: [{ role: "user", content: userInput }]
    });

    const lastMessage = finalState.messages[finalState.messages.length - 1];

    console.log("AI: ", lastMessage.content);
  }
  rl.close();
}

main();
