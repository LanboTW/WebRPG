# 劍影江湖 WebRPG

武俠題材的 2D 橫捲動作 RPG，手機與電腦都能玩。使用 PixiJS v8 + TypeScript + Vite，部署在 GitHub Pages。

線上版：https://lanbotw.github.io/WebRPG/

## 目前進度：里程碑 1（角色展示）

- 角色全部由程式繪製成向量圖，有漸層、陰影、高光和描邊，並以高 DPI 渲染
- 自製骨架動畫系統，類似 Spine：
  - 以骨骼世界矩陣驅動各個部位的 slot
  - 關鍵影格與程序動畫可以並用
  - 切換動作時交叉淡入
- 物理擺動（Verlet 鏈）：馬尾、鬢髮、髮帶、腰帶、衣襬、廣袖、劍穗
- 動作：待機、奔跑、三連斬（含劍光拖尾和擊中火花）、受傷
- 換裝：3 套服裝、3 把兵器、3 種頭飾，都會改變外觀
- 畫質分高／中／低三檔，會自動偵測；文字集中在 i18n 語言檔

完整規格見 [SPEC.md](SPEC.md)。

## 開發

```bash
npm install
npm run dev
```

推上 `main` 分支後，GitHub Actions 會自動建置並部署到 Pages。

### 除錯參數

- `?view=full|half|face`：鏡頭
- `?outfit=qinglan|chixia|xuanye`、`?weapon=qingfeng|chixiao|hanshuang`、`?head=ribbon|jadepin|phoenix`：預設裝備
- `?anim=run|attack|hurt`：開場動作
- 主控台可用 `advance(秒)` 手動推進模擬時間，`resume()` 恢復播放

## 結構

```
src/engine/     骨架、動畫、物理鏈、繪圖工具
src/character/  女劍客：部位繪製、動作、裝備資料
src/showcase/   展示頁：竹林背景、UI
src/fx/         特效
src/i18n/       語言檔
```
