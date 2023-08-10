#!/usr/bin/env node

const fse = require('fs-extra');
const path = require('path');
const CookieManager = require('../dist/cookie-cloud.cjs.development').default;
console.log('custom-debug:CookieManager', CookieManager);
// config 放在 ~/.config/cookie-cloud/config.json
const configPath = path.join(process.env.HOME, '.config/cookie-cloud/config.json');
fse.ensureFileSync(configPath);
const config = fse.readJsonSync(configPath, { throws: false }) || fse.writeJsonSync(configPath, {
  uuid: '',
  password: '',
  endpoint: 'http://127.0.0.1:8088'
});
console.log('custom-debug:config', config);

const cookieManager = new CookieManager(config);

// domain 从命令行参数获取
const domain = process.argv[2];
(async () => {
  const cookie = await cookieManager.getCookes(domain);
  require('fs').writeFileSync('./cookie.json', JSON.stringify(cookie, null, 2));
  console.log('custom-debug:cookie', cookie);
})();
