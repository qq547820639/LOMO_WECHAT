# 猿岛 ApeIsland 服务端容器模板（CloudBase Run / 云托管）
# 说明：仅含非密钥配置；APP_SECRET / APP_ADMIN_TOKEN 由 tools/src/package_server.ts
#       在构建产物（build/cloudrun/，不入库）中注入。生产建议在云托管控制台用环境变量覆盖。
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    APP_PROFILE=wechat-release \
    APP_DATA_DIR=/app/data \
    APP_ALLOW_ADMIN=0

COPY package.json ./
COPY dist ./dist
COPY configs ./configs

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["node", "dist/server/src/index.js"]
