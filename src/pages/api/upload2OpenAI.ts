import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { getUserApiKey } from '@/utils/settings';
// New (i.e., OpenAI NodeJS SDK v4)
import OpenAI from "openai";

const form = formidable({ multiples: true })

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const response = await(new Promise((resolve, reject) => {
      form.parse(req, (err, _fields, files) => {
        if (err) console.error(err);
        if(files.file !== undefined){
            let openAIApiKey = process.env.OPENAI_API_KEY || getUserApiKey();
            console.info(`process.env.OPENAI_API_KEY : ${process.env.OPENAI_API_KEY}`)
            const { openaikey } = _fields;
            if(openaikey !==  undefined) openAIApiKey = openaikey[0]
            console.info(`UserOpenAIApiKey : ${openAIApiKey}`)
            try {
              let filePath = files.file[0].filepath.toString();
              const openai = new OpenAI({
                apiKey: openAIApiKey,
              });
              const response = openai.files.create({
                file: fs.createReadStream(filePath),
                purpose: "assistants",
              });
              // console.log(response);
            resolve(response)
          } catch (error) {
            console.error(error);
          }
        }
        reject()
      })
    }))
    res.status(200).json(response);
  } catch (err) {
    console.error(err)
    res.status(400).send({ message: 'Bad Request'})
  }
}

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
}

export default handler