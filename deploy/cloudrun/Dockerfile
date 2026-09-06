# 猿岛 ApeIsland 服务端容器模板（CloudBase Run / 云托管）
# 说明：仅含非密钥配置；所有密钥在云托管控制台配置为运行时环境变量。
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    APP_PROFILE=wechat-release \
    APP_PERSISTENCE=cloudbase \
    APP_DB_COLLECTION=ape_game_state \
    APP_ALLOW_ADMIN=0

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY dist ./dist
COPY configs ./configs

EXPOSE 8080

CMD ["node", "dist/server/src/index.js"]
