# 寶可夢大集結 OBS 直播勝敗紀錄器

這是一個中文介面的《寶可夢大集結》直播戰績工具，可放進 OBS 直播畫面，記錄勝場、敗場、總場次、勝率與連勝數。

## 功能

- 全中文操作介面
- 一鍵記錄「勝利」或「敗北」
- 自動計算總場次與勝率
- 顯示目前連勝數與最近 12 場戰績
- 撤銷上一場、重設戰績
- 自訂標題，例如「全角色一勝挑戰」
- 瀏覽器儲存紀錄
- 直播面板使用透明背景

## 建立 GitHub 網站

1. 登入 GitHub，建立新的 Repository，名稱可用 `pokemon-unite-obs-counter`。
2. 把本專案內的所有檔案上傳到 Repository 根目錄。
3. 開啟 **Settings → Pages**。
4. Source 選擇 **Deploy from a branch**。
5. Branch 選 `main`，資料夾選 `/ (root)`，按 Save。
6. 等待 GitHub Pages 部署完成。

## 加入 OBS

1. 在 OBS 的「來源」按 `＋`，選擇「瀏覽器」。
2. 直播面板網址填入：
   `https://你的GitHub帳號.github.io/pokemon-unite-obs-counter/?mode=overlay`
3. 寬度先設 `460`，高度先設 `360`，再按版面調整。
4. 在一般瀏覽器開啟控制台：
   `https://你的GitHub帳號.github.io/pokemon-unite-obs-counter/?mode=control`
5. 每場結束後，在控制台按「記錄勝利」或「記錄敗北」，OBS 面板會透過瀏覽器儲存同步更新。

## 注意事項

- 目前需要手動按下勝利或敗北，不會自動辨識遊戲結果。
- 紀錄保存在瀏覽器本機資料中；清除網站資料、換瀏覽器或換裝置可能導致紀錄消失。
- 本專案為粉絲自製工具，與 Pokémon、Nintendo、TiMi 或 YouTube 無官方關聯。
