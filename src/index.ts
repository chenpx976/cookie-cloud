import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import * as _ from 'lodash';
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
    if (!payload.uuid) {
      throw Error('uuid is required');
    }
    this.payload = payload;
  }

  async getCookes(domain = ''): Promise<any> {
    if (!domain) {
      throw Error('domain is required');
    }
    const { cookie_data }: any = await this.downloadCookie();
    /**
{
  "cookie_data": {
    "alipay.com": [
      {
        "name": "x5sec",
        "value": "7b22617365727665723b32223a223233333b7d",
        "domain": ".xxxx.com",
        "path": "/",
        "expires": 1630848000,
        "size": 23,
        "httpOnly": false,
        "secure": false,
        "session": false,
        "sameSite": "no_restriction",
        "storeId": "0",
        "id": 1
      },
    ],
  },
}
     */
    // 处理 cookie_data 数据, 生成 cookie 字符串, 用于设置 cookie
    const cookie_data_str = Object.keys(cookie_data)
      .map((domainKey): string => {
        const cookies = cookie_data[domainKey];
        // 如果 cookies 中的 name 有重复的, 优先判断重复的里面有没有 domain 是 domain 的 否则保留第一个
        const cookieGroup = _.groupBy(_.orderBy(cookies, 'name'), 'name');
        return Object.keys(cookieGroup)
          .map(cookieNameKey => {
            const cookieItemArr = cookieGroup[cookieNameKey];
            let cookieItem = cookieItemArr[0];
            if (cookieItemArr.length > 1) {
              cookieItem =
                cookieItemArr.find(item => item.domain === domain) ||
                cookieItem;
            }
            return cookieItem;
          })
          .map((cookie: { name: any; value: any }) => {
            const { name, value } = cookie;
            return `${name}=${value}`;
          })
          .join('; ');
      })
      .join('; ');
    return { cookie_data_str, cookie_data };
  }

  async downloadCookie(): Promise<DecryptedData> {
    const { uuid, password, endpoint = 'http://127.0.0.1:8088' } = this.payload;
    const formattedEndpoint =
      endpoint.trim().replace(/\/+$/, '') + '/get/' + uuid;

    const requestOptions: any = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      responseType: 'json', // Or "text" if the response is not JSON.
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
    const the_key = CryptoJS.MD5(uuid + '-' + password)
      .toString()
      .substring(0, 16);

    const decrypted = CryptoJS.AES.decrypt(encrypted, the_key).toString(
      CryptoJS.enc.Utf8
    );

    return JSON.parse(decrypted) as DecryptedData;
  }
}

export default CookieManager;
