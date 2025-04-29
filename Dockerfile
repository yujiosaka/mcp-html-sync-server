######################
## production stage ##
######################
FROM oven/bun:1.2.10 AS development

# Set the working directory
WORKDIR /app

# Install Git
RUN apt-get update && apt-get install -y curl git

COPY package.json bun.lock ./

# Install dependencies
RUN bun install --ignore-scripts

# Initialize an empty Git repository
# for preventing Husky install to fail
RUN git init

COPY . .

# Run build
RUN bun run build

# Start the server
CMD ["bun", "run", "dev"]

######################
## production stage ##
######################
FROM oven/bun:1.2.10 AS production

# Set the working directory
WORKDIR /app

COPY --from=development /app/dist ./dist
COPY --from=development /app/public ./public
COPY --from=development /app/templates ./templates
COPY --from=development /app/package.json /app/bun.lockb ./

# Install dependencies
RUN bun install --production --ignore-scripts

# Set NODE_ENV to production for integration
ENV NODE_ENV=production

# Start the server
CMD ["bun", "dist/index.js"]