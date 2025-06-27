
import express from "express";
import cors from "cors";
import { BufferMemory } from "langchain/memory";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
// import ModelClient from "@azure-rest/ai-inference";
import { AzureChatOpenAI } from "@langchain/openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

import dotenv from "dotenv";
dotenv.config();


// const endpoint = "https://aistudioaiservices595832378663.services.ai.azure.com/models";
// const apiKey = "AAmH4gcG5oL9m1Qme7xlMmiAML7GaM5oBpxMfUTrlzksv7ZUn2gfJQQJ99BFACrIdLPXJ3w3AAAAACOGMEso";
// const modelName = "DeepSeek-V3-0324";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const pdfPath = path.join(projectRoot, 'data/employee_handbook.pdf');
const sessionMemories = {};
// const client = new ModelClient(endpoint, new AzureKeyCredential(apiKey));

const chatModel = new AzureChatOpenAI({
  azureOpenAIApiKey: process.env.AZURE_INFERENCE_SDK_KEY,
  azureOpenAIApiInstanceName: process.env.INSTANCE_NAME, // In target url: https://<INSTANCE_NAME>.services...
  azureOpenAIApiDeploymentName: process.env.DEPLOYMENT_NAME, // i.e "gpt-4o"
  azureOpenAIApiVersion: "2024-08-01-preview", // In target url: ...<VERSION>
  temperature: 1,
  maxTokens: 4096,
});




let pdfText = null; 
let pdfChunks = []; 
const CHUNK_SIZE = 800; 

async function loadPDF() {
  if (pdfText) return pdfText;

  if (!fs.existsSync(pdfPath)) return "PDF not found.";

  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer); 
  pdfText = data.text; 
  let currentChunk = ""; 
  const words = pdfText.split(/\s+/); 

  for (const word of words) {
    if ((currentChunk + " " + word).length <= CHUNK_SIZE) {
      currentChunk += (currentChunk ? " " : "") + word;
    } else {
      pdfChunks.push(currentChunk);
      currentChunk = word;
    }
  }
  if (currentChunk) pdfChunks.push(currentChunk);
  return pdfText;
}

function retrieveRelevantContent(query) {
  const queryTerms = query.toLowerCase().split(/\s+/) // Converts query to relevant search terms
    .filter(term => term.length > 3)
    .map(term => term.replace(/[.,?!;:()"']/g, ""));

  if (queryTerms.length === 0) return [];
  const scoredChunks = pdfChunks.map(chunk => {
    const chunkLower = chunk.toLowerCase(); 
    let score = 0; 
    for (const term of queryTerms) {
      const regex = new RegExp(term, 'gi');
      const matches = chunkLower.match(regex);
      if (matches) score += matches.length;
    }
    return { chunk, score };
  });
  return scoredChunks
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.chunk);
}

function getSessionMemory(sessionId) {
  if (!sessionMemories[sessionId]) {
    const history = new ChatMessageHistory();
    sessionMemories[sessionId] = new BufferMemory({
      chatHistory: history,
      returnMessages: true,
      memoryKey: "chat_history",
    });
  }
  return sessionMemories[sessionId];
}
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const useRAG = req.body.useRAG === undefined ? true : req.body.useRAG;
  const sessionId = req.body.sessionId || "default";

  let sources = [];

  const memory = getSessionMemory(sessionId);
  const memoryVars = await memory.loadMemoryVariables({});

  if (useRAG) {
    await loadPDF();
    sources = retrieveRelevantContent(userMessage);
  }

  // Prepare system prompt
  const systemMessage = useRAG
    ? {
        role: "system",
        content: sources.length > 0
          ? `You are a helpful assistant for Contoso Electronics. You must ONLY use the information provided below to answer.\n\n--- EMPLOYEE HANDBOOK EXCERPTS ---\n${sources.join('\n\n')}\n--- END OF EXCERPTS ---`
          : `You are a helpful assistant for Contoso Electronics. The excerpts do not contain relevant information for this question. Reply politely: \"I'm sorry, I don't know. The employee handbook does not contain information about that.\"`,
      }
    : {
        role: "system",
        content: "You are a helpful and knowledgeable assistant. Answer the user's questions concisely and informatively.",
      };

  try {
    // Build final messages array
    const messages = [
      systemMessage,
      ...(memoryVars.chat_history || []),
      { role: "user", content: userMessage },
    ];

    const response = await chatModel.invoke(messages);

    await memory.saveContext({ input: userMessage }, { output: response.content });

    res.json({ reply: response.content, sources });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Model call failed",
      message: err.message,
      reply: "Sorry, I encountered an error. Please try again."
    });
  }
});

// app.post("/chat", async (req, res) => {
//   const userMessage = req.body.message;
//   const useRAG = req.body.useRAG === undefined ? true : req.body.useRAG; 
//   let messages = [];
//   let sources = [];
//   if (useRAG) {
//     await loadPDF();
//     sources = retrieveRelevantContent(userMessage);
//     if (sources.length > 0) {
//       messages.push({ 
//         role: "system", 
//         content: `You are a helpful assistant answering questions about the company based on its employee handbook. 
//         Use ONLY the following information from the handbook to answer the user's question.
//         If you can't find relevant information in the provided context, say so clearly.
//         --- EMPLOYEE HANDBOOK EXCERPTS ---
//         ${sources.join('')}
//         --- END OF EXCERPTS ---`
//       });
//     } else {
//       messages.push({
//         role: "system",
//         content: "You are a helpful assistant. No relevant information was found in the employee handbook for this question."
//       });
//     }
//   } else {
//     messages.push({
//       role: "system",
//       content: "You are a helpful assistant."
//     });
//   }
//   messages.push({ role: "user", content: userMessage });


//     try {
//     const response = await chatModel.invoke(messages);
//     console.log("Raw model response:", response);
//     res.json({ reply: response.content });

// //     res.json({
// //   reply: typeof response.body.choices[0].message.content === "string"
// //     ? response.body.choices[0].message.content
// //     : JSON.stringify(response.body.choices[0].message.content, null, 2),
// //   sources: useRAG ? sources : []
// // });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       error: "Model call failed",
//       message: err.message,
//       reply: "Sorry, I encountered an error. Please try again."
//     });
//   }

// //   try {
// //     const response = await client.path("chat/completions").post({
// //       body: {
// //         messages,
// //         max_tokens: 4096,
// //         temperature: 1,
// //         top_p: 1,
// //         model: modelName,
// //       },
// //     });
// //     if (isUnexpected(response)) throw new Error(response.body.error || "Model API error");
// // //   console.log("Full API Response:\n", JSON.stringify(response.body, null, 2));
// // // console.log("Reply content (raw):", response.body.choices[0].message.content);

// // res.json({
// //   reply: typeof response.body.choices[0].message.content === "string"
// //     ? response.body.choices[0].message.content
// //     : JSON.stringify(response.body.choices[0].message.content, null, 2),
// //   sources: useRAG ? sources : []
// // });


// //   } catch (err) {
// //     res.status(500).json({ error: "Model call failed", message: err.message });
// //   }
// });


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI API server running on port ${PORT}`);
});


// import express from "express";
// import cors from "cors";
// import ModelClient from "@azure-rest/ai-inference";
// import { AzureKeyCredential } from "@azure/core-auth";
// import dotenv from "dotenv";

// dotenv.config();

// const endpoint = process.env.AZURE_INFERENCE_SDK_ENDPOINT;
// const apiKey = process.env.AZURE_INFERENCE_SDK_KEY;
// const modelName = "Llama-4-Maverick-17B-128E-Instruct-FP8";

// const app = express();
// app.use(cors());
// app.use(express.json());

// const client = new ModelClient(endpoint, new AzureKeyCredential(apiKey));

// app.post("/chat", async (req, res) => {
//   const userMessage = req.body.message;
//   const messages = [
//     { role: "system", content: "You are a helpful assistant." },
//     { role: "user", content: userMessage },
//   ];

//   try {
//     const response = await client.path("/chat/completions").post({
//       body: {
//         messages,
//         max_tokens: 2048,
//         temperature: 0.8,
//         top_p: 0.1,
//         presence_penalty: 0,
//         frequency_penalty: 0,
//         model: modelName,
//       },
//     });

//     let reply = "Sorry, I couldn't get a reply.";
//     if (
//       response &&
//       response.body &&
//       Array.isArray(response.body.choices) &&
//       response.body.choices[0] &&
//       response.body.choices[0].message &&
//       response.body.choices[0].message.content
//     ) {
//       reply = response.body.choices[0].message.content;
//     }
//     res.json({ reply });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Model call failed" });
//   }
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`AI API server running on port ${PORT}`);
// });