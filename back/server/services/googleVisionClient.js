import vision from "@google-cloud/vision";
import path from "path";

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.resolve("google-vision-key.json"),
});

export default client;
