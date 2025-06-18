import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import fs from "fs";

// const token = process.env["GITHUB_TOKEN"];
const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
// const model = "openai/gpt-4.1";
const model = "meta/Llama-4-Maverick-17B-128E-Instruct-FP8";

export async function main() {
  const client = ModelClient(
    endpoint,
    new AzureKeyCredential(token),
  );

  // Read the image file as base64
  const imagePath = "contoso_layout_sketch.jpg";
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString("base64");

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Write HTML and CSS code for a web page based on the following hand-drawn sketch.",
            },
            {
              type: "image",
              image: imageBase64,
              mime_type: "image/jpeg"
            }
          ]
        }
      ],
      temperature: 1.0,
      top_p: 1.0,
      model: model,
      max_tokens: 1000,
    }
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  console.log(response.body.choices[0].message.content);
}

main().catch((err) => {
   console.error("The sample encountered an error:", err);
});
