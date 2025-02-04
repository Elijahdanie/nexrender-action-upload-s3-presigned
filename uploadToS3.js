const fs = require("fs");
const axios = require('axios')
const FormData = require('form-data')

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
  jobuid,
  logger
) => {
  try {
    const resp = await axios.post(url, buffer, {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: contentTypeArg,
    });
    if (callbackUrl) {
      await axios.post(callbackUrl, {data:resp.data, jobuid:jobuid}, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log("file unlinking failed");
          console.log(err);
        }
      });
  } catch (error) {
    logger.log(
      `[nexrender-action-upload-s3-presigned] could not upload to s3 presigned url: ${url}, error: ${error}`
    );
    console.log(
      `could not upload to s3 presigned url: ${url}, error: ${error}`
    );
  }
};

const uploadToS3 = async (
  url,
  filePath,
  contentType,
  formdata,
  callBackUrl,
  jobuid,
  logger
) => {
  if (!formdata) {
    const buffer = fs.readFileSync(filePath);
    await putToPresignedUrl(url, buffer, contentType, logger);
  } else {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    Object.keys(formdata).forEach((key) => {
      formData.append(key, formdata[key]);
    });
    await PostToPresignedUrlWithFormData(
      url,
      formData,
      { ...formData.getHeaders() },
      callBackUrl,
      filePath,
      jobuid,
      logger
    );
  }
};

module.exports = uploadToS3;
