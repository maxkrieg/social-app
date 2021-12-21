### Social app starter

Template social app modeled after reddit, which can be built upon and extended into different types of social platforms that need the same foundational things like user management, registration, login, etc.

### How to run in development

1. Install dependencies
    ```bash
    npm install
    ```


2. Start DB and Redis docker containers
    ```bash
    docker-compose up -d
    ```

3. Run typescript compiler in watch mode
    ```bash
    npm run watch
    ```

4. In new terminal, start web server
    ```bash
    npm run start:dev
    ```

Web server runs on port 4000.  Connects to Postgres exposed on 5432, redis exposed on 6379.  Graphql playground located at: `http://localhost:4000/graphql`.

