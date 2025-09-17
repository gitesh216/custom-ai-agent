import readline from "node:readline/promises";

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  while(true) {
    const userInput = await rl.question("You: ");
    console.log("You said: ", userInput);
    if(userInput === "exit") {
      break;
    }
  }
  rl.close();
}

main();
