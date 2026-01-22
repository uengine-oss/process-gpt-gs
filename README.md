# process-gpt-vue3

# Run

### with Docker Compose
start docker compose
```
cd docker-compose
docker-compose up -d
```
stop docker compose
```
docker-compose down
```

### Local Development Setup

#### Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: Version 16 or higher (required for Vue 3 and Vite)
- **Java**: Version 8 (JDK 1.8) or higher (required for Spring Boot Gateway)
- **Maven**: Required for building and running the Gateway service
- **Python**: Required for microservices (check each service's repository for the specific Python version requirement)
- **Supabase CLI**: Required for local Supabase development

#### Setup Steps

To set up the local development environment, follow these steps:

1. **Start Supabase**
   ```bash
   supabase start
   ```
   This will use the `supabase/` directory in this project. Navigate to http://localhost:54323 to access the Supabase console.

2. **Start the Vue.js frontend**
   ```bash
   npm install
   npm run dev
   ```

3. **Start the Gateway service**
   ```bash
   cd gateway
   mvn spring-boot:run
   ```
   The gateway service will be available at http://localhost:8088

4. **Start other microservices**
   
   The following microservices need to be started. Note that `process-gpt-completion` is required and must be running for the system to function properly.

   **Required Service:**
   - **[process-gpt-completion](https://github.com/uengine-oss/process-gpt-completion)**: Core backend service (required)
     - This service is located in a separate repository
     - `polling-service` is located within the completion service's internal directory

   **Optional Services** (located in separate repositories):
   - **[process-gpt-memento](https://github.com/uengine-oss/process-gpt-memento)**: Document-based RAG service
   - **[process-gpt-crewai-action](https://github.com/uengine-oss/process-gpt-crewai-action)**: CrewAI-based agent orchestration service for action execution
   - **[process-gpt-crewai-deep-research](https://github.com/uengine-oss/process-gpt-crewai-deep-research)**: CrewAI-based agent orchestration service for deep research tasks
   - **[process-gpt-openai-deep-research](https://github.com/uengine-oss/process-gpt-openai-deep-research)**: OpenAI-based agent service for deep research tasks
   - **[process-gpt-browser-use](https://github.com/uengine-oss/process-gpt-browser-use)**: Browser automation service with Spring Gateway routing
   - **[process-gpt-a2a-orch](https://github.com/uengine-oss/process-gpt-a2a-orch)**: Agent-to-Agent(A2A) service
   - **[process-gpt-react-voice-agent](https://github.com/uengine-oss/process-gpt-react-voice-agent)**: Voice chat service

   Each service should be started from its respective repository directory. Refer to each service's documentation for specific setup and run instructions.

# Install

### supabase Initial Script

#### Easy way:
This project uses the `supabase/` directory for local development. Using CLI and docker :  https://supabase.com/docs/guides/cli/getting-started
```
supabase start
```
This will use the existing `supabase/` directory configuration. Navigate to:

http://localhost:54323


#### Complex way:

```sh
# Get the code
git clone --depth 1 https://github.com/supabase/supabase

# Go to the docker folder
cd supabase/docker

# Copy the fake env vars
cp .env.example .env

# Pull the latest images
docker compose pull

# Start the services (in detached mode)
docker compose up -d
```

### Process GPT Initial Script
```sh
# 해당 PW값은 .env의 ANON_KEY 참고.

docker run -p 8080:8080 -e DB_URL=http://localhost:8000 -e DB_PW=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```


#### Don't forget to set the OPENAI_API_KEY for configuration:

- navigate to the supabase console:
http://localhost:54323

- find the configuration table and set the OPENAI_API_KEY field as value set:
```
{
  "key": "sk-..."
}
```
