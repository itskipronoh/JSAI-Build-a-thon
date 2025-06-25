// import ModelClient from "@azure-rest/ai-inference";
// import { AzureKeyCredential } from "@azure/core-auth";

// const endpoint = "https://kipronoyegon-resource.services.ai.azure.com/models";
// const modelName = "Llama-4-Maverick-17B-128E-Instruct-FP8";



// export async function main() {

//   const client = new ModelClient("https://kipronoyegon-resource.services.ai.azure.com/models", new AzureKeyCredential("lTibZSHPRpXYm2AjXn5sLgxlpoZ0sADJvYHLc8FmQrF3Fa6lKA9DJQQJ99BFACHYHv6XJ3w3AAAAACOG3xFg"));

//   const response = await client.path("/chat/completions").post({
//     body: {
//       messages: [
//         { role:"system", content: "You are a helpful assistant." },
//         { role:"user", content: "I am going to Paris, what should I see?" }
//       ],
//       max_tokens: 2048,
//       temperature: 0.8,
//       top_p: 0.1,
//       presence_penalty: 0,
//       frequency_penalty: 0,
//       model: modelName
//     }
//   });

//   if (response.status !== "200") {
//     throw response.body.error;
//   }
//   console.log(response.body.choices[0].message.content);
// }

// main().catch((err) => {
//   console.error("The sample encountered an error:", err);
// });



// Uncomment the following lines to run the main function


import express from "express";
import cors from "cors";
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = "https://aistudioaiservices595832378663.services.ai.azure.com/models";
const apiKey = "AAmH4gcG5oL9m1Qme7xlMmiAML7GaM5oBpxMfUTrlzksv7ZUn2gfJQQJ99BFACrIdLPXJ3w3AAAAACOGMEso";
const modelName = "DeepSeek-V3-0324";

const app = express();
app.use(cors());
app.use(express.json());

const client = new ModelClient(endpoint, new AzureKeyCredential(apiKey));

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: userMessage },
  ];

  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages,
        max_tokens: 2048,
        temperature: 0.8,
        top_p: 0.1,
        presence_penalty: 0,
        frequency_penalty: 0,
        model: modelName,
      },
    });

    let reply = "Sorry, I couldn't get a reply.";
    if (
      response &&
      response.body &&
      Array.isArray(response.body.choices) &&
      response.body.choices[0] &&
      response.body.choices[0].message &&
      response.body.choices[0].message.content
    ) {
      reply = response.body.choices[0].message.content;
    }
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Model call failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI API server running on port ${PORT}`);
});


