# cookie cloud

base project https://github.com/easychen/CookieCloud

## Install

```bash
npm install cookie-cloud
```

## Usage

```tsx
// use example
import CookieManager from 'cookie-cloud';
const cookie = new CookieManager(config);
export const getLoginData = async (domain: string) => {
  const cookieObj: any = await cookie.getCookes(domain);
  const xxx_token = cookie.getCookieByName(cookieObj.cookie_data_str, 'xxx_token');
  return {
    xxx_token,
    cookie_data_str: cookieObj.cookie_data_str,
  };
};
```

### config example

recommend use [dot-config-next](https://www.npmjs.com/package/dot-config-next)

```tsx
// use config
const config = {
  uuid: "your_uuid_here",
  password: "your_password_here",
  endpoint: "http://your_endpoint_here",
};
// or
// use dot-config
import ConfigManager from 'dot-config-next';
const config = new ConfigManager('cookie-cloud').readConfig();
```
