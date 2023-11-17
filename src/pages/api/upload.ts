import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File } from 'formidable'
import fs from 'fs'
import {parse} from 'csv-parse/sync'

const form = formidable({ multiples: true })

const isFile = (file: File | File[]): file is File => !Array.isArray(file) && file.filepath !== undefined

type Data = {
  message?: string
} | any[]

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<Data>
) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const fileContent: string = await(new Promise((resolve, reject) => {
      form.parse(req, (err, _fields, files) => {
        if (err) console.error(err);
        console.log(files.file)
        if(files.file !== undefined){
          // console.log(isFile(files.file[0]))
          // if (isFile(files.file[0])) {
            console.log("The Upload file is parsing...")
            const fileContentBuffer = fs.readFileSync(files.file[0].filepath)
            const fileContentReadable = fileContentBuffer.toString('utf8')

            resolve(fileContentReadable)
          // }
      }
        reject()
      })
    }))

    // Do whatever you'd like with the file since it's already in text
    const records = parse(fileContent, { columns: true, relax_quotes: true, escape: '\\', ltrim: true, rtrim: true, relax_column_count: true})
  
    res.status(200).json(records)
    // res.status(200).send({ message: 'ok' })
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