import express from "express";
import * as dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

dotenv.config();

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY, // Keep using environment variable for API key
});

const router = express.Router();

router.route("/").post(async (req, res) => {
  try {
    const { prompt } = req.body;

    // Update the model and contents as per the new code structure
    const contents = prompt + " futuristic scifi city with lots of greenery"; // Use the prompt from the request

    const aiResponse = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation", // New model
      contents: contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE], // Ensure it returns both text and image
      },
    });

    let imageBase64 = null;
    let textResponse = "";

    // Loop through the response parts to get either text or image
    for (const part of aiResponse.candidates[0].content.parts) {
      if (part.text) {
        textResponse = part.text;
      } else if (part.inlineData) {
        imageBase64 = part.inlineData.data;
      }
    }

    // If image is generated, save it as a file and send the response with the image
    if (imageBase64) {
      const buffer = Buffer.from(imageBase64, "base64");
      const imagePath = "gemini-native-image.png";
      fs.writeFileSync(imagePath, buffer);
      console.log("Image saved as gemini-native-image.png");
      res.status(200).json({ photo: imageBase64, text: textResponse });
    } else {
      res.status(404).json({ message: "No image generated" });
    }
  } catch (error) {
    console.error(
      "Error generating image:",
      error.response?.data || error.message
    );
    res.status(500).json({
      message: error?.response?.data?.error?.message || "Something went wrong",
      error: error.response?.data || error.message,
    });
  }
});

export default router;
