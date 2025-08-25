# Cursor 一键接入清单

- [ ] 解压 `aidjmix-autoplaylist-api-ts.zip` 或 `aidjmix-autoplaylist-python.zip`
- [ ] VSCode/Cursor 打开项目根目录
- [ ] (TS) `npm i && npm run dev` 看控制台端口
- [ ] (Py) `pip install -r requirements.txt` 后跑示例命令
- [ ] 前端新增 `AidjPlaylistClient.ts` 并调用 `requestAutoPlaylist(...)`
- [ ] 订阅 `UnifiedEventBus` 的 `automix:plan` / `automix:error`
- [ ] 把 m3u 交给你的网页电台后台（或直接写入播放队列）
