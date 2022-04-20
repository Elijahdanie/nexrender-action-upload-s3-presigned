const fs = require("fs");
const axios = require("axios");

const putToPresignedUrl = async (url, buffer, contentTypeArg, logger) => {
  try {
    const params = new URL(url);
    const contentType = params.searchParams.get("Content-Type");
    if (!contentTypeArg && !contentType) {
      throw new Error(`invalid presigned url, missing content-type`);
    }
    await axios.put(url, buffer, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: { "Content-Type": contentType ?? contentTypeArg },
    });
  } catch (error) {
    logger.log(
      `[nexrender-action-upload-s3-presigned] could not upload to s3 presigned url: ${url}, error: ${error.message}`
    );
    console.log(error);
  }
};

const PostToPresignedUrlWithFormData = async (
  url,
  buffer,
  contentTypeArg,
  callbackUrl,
  filePath,
  logger
) => {
  try {
    const resp = await axios.post(url, buffer, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: contentTypeArg,
    });
    if (resp.status !== 200) {
      logger.log(
        `[nexrender-action-upload-s3-presigned] could not upload to s3 presigned url: ${url}, error: ${resp.status}`
      );
      console.log(
        `could not upload to s3 presigned url: ${url}, error: ${resp.status}`
      );
    }
    if (callbackUrl) {
      await axios.post(callbackUrl, resp.data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (resp.status === 200)
      {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.log("file unlinking failed");
            console.log(err);
          }
        });
      }
    }
  } catch (error) {
    logger.log(
      `[nexrender-action-upload-s3-presigned] could not upload to s3 presigned url: ${url}, error: ${resp.status}`
    );
    console.log(
      `could not upload to s3 presigned url: ${url}, error: ${resp.status}`
    );
  }
};

const uploadToS3 = async (
  url,
  filePath,
  contentType,
  formdata,
  callBackUrl,
  logger
) => {
  if (!formdata) {
    const buffer = fs.readFileSync(filePath);
    await putToPresignedUrl(url, buffer, contentType, logger);
  } else {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(finalInput));
    Object.keys(formdata).forEach((key) => {
      formData.append(key, formdata[key]);
    });
    await PostToPresignedUrlWithFormData(
      url,
      formData,
      { ...formData.getHeaders() },
      callBackUrl,
      filePath,
      logger
    );
  }
};

module.exports = uploadToS3;
