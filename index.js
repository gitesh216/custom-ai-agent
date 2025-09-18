import { ChatGroq } from "@langchain/groq";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import readline from "node:readline/promises";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import { MemorySaver } from "@langchain/langgraph";
import { threadId } from "node:worker_threads";

const checkpointer = new MemorySaver();

const webSearchTool = new TavilySearch({
  max_results: 5,
  topic: "general",
  // include_answer=False,
  // include_raw_content=False,
  // include_images=False,
  // include_image_descriptions=False,
  // search_depth="basic",
  // time_range="day",
  // include_domains=None,
  // exclude_domains=None
});

/**
 * Initialize Tool node
 */
const tools = [webSearchTool];
const toolNode = new ToolNode(tools);

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
}).bindTools(tools);

async function callModel(state) {
  // call the LLM using APIs
  console.log("Calling llm...");

  const response = await llm.invoke(state.messages);

  return { messages: [response] };
}

function shouldContinue(state) {
  // put your condition
  // whether to call a tool or end
  const lastMessage = state.messages[state.messages.length - 1];
  // console.log(state);
  if (lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return "__end__";
}

/**
 * Build the graph
 */
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

/**
 * Compile the graph
 */
const app = workflow.compile({ checkpointer });

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while (true) {
    const userInput = await rl.question("You: ");

    if (userInput === "exit") {
      break;
    }

    const finalState = await app.invoke(
      {
        messages: [{ role: "user", content: userInput }],
      },
      { configurable: { thread_id: "1" } }
    );

    const lastMessage = finalState.messages[finalState.messages.length - 1];

    console.log("AI: ", lastMessage.content);
  }
  rl.close();
}

main();
