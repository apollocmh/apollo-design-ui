# QRCode · G0-G14 执行计划

- G1-G3：docs/analysis/qr-code.md（薄壳 170 行 + rc 引擎 1476 行对拍；reuse 选型落定）
- G4：无用户分叉；strategy=reuse 落定为 vendor 同源 qrcodegen（候选 qrcode/qr-code-styling
  会破坏 byte 级 oracle）；U11 可访问性上游原样
- G5-G6：engine/（qrcodegen.js + .d.ts + utils.ts）/ QrCode.ts / style（1 Token）
- G7-G14：L1 15 / L3 12 / L4 8 / L5 4 demo（2 组）/ L6 9 / L7 9 / fixtures 3 → registry → verify:full
