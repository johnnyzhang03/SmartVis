import OpenAI from 'openai';
import {
  TextContentBlock,
  ImageFileContentBlock
} from 'openai/resources/beta/threads/messages';
import {
  extractTitleContent,
  extractDescriptionContent,
  extractPythonCode
} from './util';

export interface ChartInformation {
  src: string;
  title: string;
  description: string;
}

let fileName = '';

const openai = new OpenAI({
  apiKey: '',
  dangerouslyAllowBrowser: true
});

const assistant = await openai.beta.assistants.retrieve(
  'asst_SBAKRxzUiVlQxJbHR6RHtkxN'
);

const thread = await openai.beta.threads.create();

export async function generateChart(csvFile: File) {
  fileName = csvFile.name;
  const file = await openai.files.create({
    file: csvFile,
    purpose: 'assistants'
  });

  const prompt = `
  Step-1: Generate three different charts for data visualization based on the attached csv file.
  Step-2: After each chart is generated, output a short text description for it. The description should stick to the following format:
  <Title>Title of the chart</Title>
  <Description>This line charts shows......</Description>
   `;

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: prompt,
    attachments: [
      {
        file_id: file.id,
        tools: [{ type: 'code_interpreter' }]
      }
    ]
  });

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistant.id
  });

  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const responseArray: ChartInformation[] = [];
    for (let message of messages.data) {
      if (message.role === 'assistant' && message.content.length === 2) {
        // Get image src from the response
        const imageContent = <ImageFileContentBlock>message.content[0];
        const src = await getSrcFromFileId(imageContent.image_file.file_id);

        // Get title and description from the response
        const textContent = <TextContentBlock>message.content[1];
        const text = textContent.text.value;
        const title = extractTitleContent(text);
        const description = extractDescriptionContent(text);

        // Put the information together
        const response: ChartInformation = {
          src: src,
          title: title,
          description: description
        };
        responseArray.push(response);
      }
    }
    return responseArray;
  } else {
    return run.status;
  }

  /**
   * Inputs OpenAI File object's id
   * Returns src needed in img label
   */
  async function getSrcFromFileId(id: string) {
    const imageFile = await openai.files.content(id);
    const imageData = await imageFile.arrayBuffer();
    let binary = '';
    let bytes = new Uint8Array(imageData);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:image/png;base64,' + window.btoa(binary);
  }
}

export async function generateCode(index: number) {
  const prompt = `
  Please output the Python for generating the ${index + 1}-th$ chart.
  The Python code should contain necessary import like import pandas as pd.
  Also it should contain 
  `;

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: prompt
  });

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistant.id
  });

  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const message = messages.data[0];
    const textContent = <TextContentBlock>message.content[0];
    let code = textContent.text.value;
    code = extractPythonCode(code, fileName);
    return code;
  } else {
    return run.status;
  }
}
