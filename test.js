import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = "https://aistudioaiservices595832378663.services.ai.azure.com/models";
const modelName = "DeepSeek-V3-0324";

export async function main() {

  const client = new ModelClient("https://aistudioaiservices595832378663.services.ai.azure.com/models", new AzureKeyCredential("AAmH4gcG5oL9m1Qme7xlMmiAML7GaM5oBpxMfUTrlzksv7ZUn2gfJQQJ99BFACrIdLPXJ3w3AAAAACOGMEso"));

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role:"system", content: "You are a helpful assistant." },
        { role:"user", content: "I am going to Paris, what should I see?" }
      ],
      max_tokens: 2048,
      temperature: 0.8,
      top_p: 0.1,
      presence_penalty: 0,
      frequency_penalty: 0,
      model: modelName
    }
  });

  if (response.status !== "200") {
    throw response.body.error;
  }
  console.log(response.body.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});


// import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
// import { AzureKeyCredential } from "@azure/core-auth";

// const token = process.env["GITHUB_TOKEN"];
// const endpoint = "https://models.github.ai/inference";
// const model = "deepseek/DeepSeek-V3-0324";

// export async function main() {

//   const client = ModelClient(
//     endpoint,
//     new AzureKeyCredential(token),
//   );

//   const response = await client.path("/chat/completions").post({
//     body: {
//       messages: [
//         { role:"system", content: "You are a helpful assistant." },
//         { role:"user", content: "What is the capital of France?" }
//       ],
//       temperature: 1.0,
//       top_p: 1.0,
//       max_tokens: 1000,
//       model: model
//     }
//   });

//   if (isUnexpected(response)) {
//     throw response.body.error;
//   }

//   console.log(response.body.choices[0].message.content);
// }

// main().catch((err) => {
//   console.error("The sample encountered an error:", err);
// });

