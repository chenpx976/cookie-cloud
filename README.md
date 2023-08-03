# cookie cloud

```

// Example usage:
const payload: Payload = {
  uuid: "your_uuid_here",
  password: "your_password_here",
  endpoint: "http://your_endpoint_here",
};

const cookieManager = new CookieManager(payload);
cookieManager.downloadCookie().then((decryptedData) => {
  console.log(decryptedData);
});

```