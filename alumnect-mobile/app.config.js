// Cho phép HTTP thường (cleartext) chỉ khi API đang trỏ tới địa chỉ http:// (bản dev).
// Khi deploy HTTPS, bản build tự động không bật cleartext.
const base = require('./app.json')

module.exports = () => {
  const cleartext = (process.env.EXPO_PUBLIC_API_URL || '').startsWith('http://')
  return {
    ...base.expo,
    plugins: [
      ...base.expo.plugins,
      ['expo-build-properties', { android: { usesCleartextTraffic: cleartext } }],
    ],
  }
}
