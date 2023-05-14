import axios from "axios";

export const fetchImage = async (url: string) => {
  const { headers, data: imgBuffer } = await axios.get<Buffer>(url, {
    responseType: "arraybuffer",
  });

  return `data:${headers["content-type"] as string};base64,${imgBuffer.toString(
    "base64"
  )}`;
};
