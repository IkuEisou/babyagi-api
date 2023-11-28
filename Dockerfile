FROM node:19

#RUN npm install -g npm@10.2.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm i formidable @types/formidable form-data fs
# RUN npm exec openai migrate
COPY . .

RUN npm run build

# ENV OPENAI_API_KEY=""
# ENV PINECONE_API_KEY=""
# ENV PINECONE_ENVIRONMENT=""
# ENV NEXT_PUBLIC_TABLE_NAME="baby-agi-test-table"
# ENV NEXT_PUBLIC_USE_USER_API_KEY="false"
# ENV SERP_API_KEY=""

EXPOSE 3000

ENTRYPOINT [ "npm", "start" ]
