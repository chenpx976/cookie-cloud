import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import * as _ from 'lodash';
import ConfigManger from 'dot-config-next';

interface Payload {
  uuid?: string;
  password?: string;
  endpoint?: string;
  // 自动刷新 cookie 的时间间隔
  refreshInterval?: number;
  cookie_data?: CookiesData;
  lastUpdateTime?: number;
}
type Cookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  session: boolean;
  sameSite: 'no_restriction' | 'strict' | 'lax' | 'none'; // You can add more possible values if there are other 'sameSite' values
  storeId: string;
  id: number;
};

type CookiesData = {
  [key: string]: Cookie[];
};

interface DecryptedData {
  cookie_data: CookiesData;
  local_storage_data: string;
}

class CookieManager {
  private configManager?: ConfigManger;
  private get config(): Payload {
    return {
      refreshInterval: 1000 * 60 * 10,
      endpoint: 'http://127.0.0.1:8088',
      ...(this.configManager?.readConfig() || {}),
    };
  }
  constructor(payload: Payload) {
    const configManager = new ConfigManger('cookie-cloud', {
      uuid: '',
      refreshInterval: 1000 * 60 * 10,
      cookie_data: {},
      lastUpdateTime: 0,
    });
    this.configManager = configManager;
    this.configManager.updateConfig(payload);
    if (!this.config?.uuid) {
      throw Error('uuid is required');
    }
  }

  async downloadCookie(refresh = true): Promise<DecryptedData> {
    const {
      uuid = '',
      password = '',
      endpoint = 'http://127.0.0.1:8088',
      cookie_data,
      refreshInterval,
      lastUpdateTime = 0,
    } = this.config;
    // 如果 refresh 为 false, 从本地读取 cookie, 并且判断是否过期
    if (!refresh && refreshInterval && cookie_data) {
      const now = new Date().getTime();
      if (now - lastUpdateTime < refreshInterval) {
        console.log('从本地读取 cookie');
        return { cookie_data, local_storage_data: '' };
      }
    }

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
    // 更新 cookie_data
    this.configManager?.updateConfig({
      cookie_data: decrypted.cookie_data,
      lastUpdateTime: new Date().getTime(),
    });
    return decrypted;
  }

  async getCookes(domain = '', refresh = true): Promise<any> {
    if (!domain) {
      throw Error('domain is required');
    }
    const { cookie_data }: any = await this.downloadCookie(refresh);
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
