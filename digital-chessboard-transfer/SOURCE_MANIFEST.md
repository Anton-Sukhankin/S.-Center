# Манифест исходного снимка

Манифест фиксирует происхождение runtime-файлов переносимого пакета на момент его формирования. SHA-256 исходника и копии совпал для каждой строки.

| Исходник AIShtab | Файл в пакете | SHA-256 |
| --- | --- | --- |
| `src/features/digital-chessboard/digital-chessboard.js` | `src/feature/digital-chessboard.js` | `15dc7b8f3308a00ad664daacedd04f31d35831dc1af46193b421c128418471f0` |
| `src/features/digital-chessboard/digital-chessboard.css` | `src/feature/digital-chessboard.css` | `45cfd3cdc2f294031f3b3fa55458952086da7e9626fbf31996e54db19b7c50f2` |
| `src/data/construction-objects-data.js` | `src/data/construction-objects-data.js` | `562c7cc7016672e752e5f5747679d089ce4e6e6ca5d1d4a0cc1ca8b5635b6667` |
| `src/data/digital-chessboard-data.js` | `src/data/digital-chessboard-data.js` | `d85ad1c2d8f7f06f55937fbb9f0930618ee9ba634e7ad70078e42e6cdcb75880` |
| `src/components/construction-object-selector/construction-object-selector.js` | `src/components/construction-object-selector/construction-object-selector.js` | `fcdfff8120718abcfd9543d1965843af76017997afcc3495d20fe0f6863d280d` |
| `src/components/construction-object-selector/construction-object-selector.css` | `src/components/construction-object-selector/construction-object-selector.css` | `63474f13bfef8ec575153cf65c6629d3434bc5d10148371474e2e6b350f2eb5a` |

`index.html`, `package.json`, `src/host/`, `scripts/`, `README.md` и `MIGRATION.md` созданы специально как переносимая оболочка и не заявляются побайтными копиями файлов основного прототипа.
