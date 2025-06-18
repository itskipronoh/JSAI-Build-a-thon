
// import ModelClient from "@azure-rest/ai-inference";
// import { AzureKeyCredential } from "@azure/core-auth";
// import dotenv from "dotenv";

// dotenv.config();

// const client = new ModelClient(
//   process.env.AZURE_INFERENCE_SDK_ENDPOINT,
//   new AzureKeyCredential(process.env.AZURE_INFERENCE_SDK_KEY)
// );

// var messages = [
//   { role: "system", content: "You are an helpful assistant" },
//   { role: "user", content: "What are 3 things to see in Seattle?" }
// ];

// var response = await client.path("chat/completions").post({
//   body: {
//     messages: messages,
//     max_tokens: 4096,
//     temperature: 1,
//     top_p: 1,
//     model: "gpt-4o",
//   },
// });

// // console.log(response.body.choices[4].message.content);
// console.log(JSON.stringify(response.body, null, 2));

import { AzureOpenAI } from "openai";
import dotenv from "dotenv";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

dotenv.config();

const endpoint = process.env["AZURE_OPENAI_ENDPOINT"] || "https://kipro-mc23zt3v-swedencentral.openai.azure.com/";
const apiVersion = "2025-01-01-preview";
const deployment = "gpt-4.1-2"; // Make sure this matches your Azure deployment name

const credential = new DefaultAzureCredential();
const scope = "https://cognitiveservices.azure.com/.default";
const azureADTokenProvider = getBearerTokenProvider(credential, scope);

const client = new AzureOpenAI({ endpoint, azureADTokenProvider, apiVersion, deployment });

const messages = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "What are 3 things to see in Seattle?" }
];

async function runChat() {
  try {
    const response = await client.chat.completions.create({
      messages: messages,
      max_tokens: 800,
      temperature: 1,
      top_p: 1,
      model: deployment, // optional since deployment is passed above
    });

    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error("Error:", err);
  }
}

runChat();
