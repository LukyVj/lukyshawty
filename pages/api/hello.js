// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
const { encode } = require("blurhash");
const { createCanvas, loadImage } = require("canvas");

const getImageData = (image) => {
  const canvas = createCanvas(image.width, image.height);
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
};

const encodeImageToBlurhash = async (imageUrl, res, start) => {
  const image = await loadImage(imageUrl);
  const imageData = getImageData(image);

  await res.json({
    hash: encode(imageData.data, imageData.width, imageData.height, 4, 4),
    processed_in_ms: Date.now() - start,
  });
};

export default async (req, res) => {
  if ((res.statusCode = 200)) {
    res.setHeader("Content-Type", "application/json");

    console.log(`Request ➡️ ${req.originalUrl}`);
    req.setTimeout(2147483647);
    var start = Date.now();

    try {
      await encodeImageToBlurhash(req.originalUrl.split("/?q=")[1], res, start);
    } catch (err) {
      console.log(err);
    }

    if (req.method === "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "PUT, POST, PATCH, DELETE, GET"
      );
      return res.status(200).json({});
    }

    res.json({ name: "John Doe" });
  }
};
