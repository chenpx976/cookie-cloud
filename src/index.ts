import axios from "axios";
import * as CryptoJS from "crypto-js";

interface Payload {
  uuid: string;
  password: string;
  endpoint?: string;
}

interface DecryptedData {
  cookie_data: string;
  local_storage_data: string;
}

class CookieManager {
  private payload: Payload;

  constructor(payload: Payload) {
    this.payload = payload;
  }

  async downloadCookie(): Promise<DecryptedData> {
    const { uuid, password, endpoint = "http://127.0.0.1:8088" } = this.payload;
    const formattedEndpoint =
      endpoint.trim().replace(/\/+$/, "") + "/get/" + uuid;

    const requestOptions: any = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      responseType: "json", // Or "text" if the response is not JSON.
    };

    const response = await axios(formattedEndpoint, requestOptions);

    const encrypted = response.data.encrypted;
    const decrypted = await this.cookieDecrypt(uuid, encrypted, password);
    return decrypted;
  }

  private async cookieDecrypt(
    uuid: string,
    encrypted: string,
    password: string
  ): Promise<DecryptedData> {
    const the_key = CryptoJS.MD5(uuid + "-" + password)
      .toString()
      .substring(0, 16);

    const decrypted = CryptoJS.AES.decrypt(encrypted, the_key).toString(
      CryptoJS.enc.Utf8
    );

    return JSON.parse(decrypted) as DecryptedData;
  }
}

export default CookieManager;