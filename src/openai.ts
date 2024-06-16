import OpenAI from 'openai';
import { TextContentBlock } from 'openai/resources/beta/threads/messages';

export interface ChartInformation {
  src: string;
  description: string;
}

interface ReturnObject {
  id: string;
  file_id: string;
  description: string;
}
const openai = new OpenAI({
  apiKey: '',
  dangerouslyAllowBrowser: true
});

const assistant = await openai.beta.assistants.create({
  instructions: 'You are an expert in analyzing csv file using python.',
  model: 'gpt-4o',
  tools: [{ type: 'code_interpreter' }],
  temperature: 0.2
});

export async function generateChart(csvFile: File) {
  const file = await openai.files.create({
    file: csvFile,
    purpose: 'assistants'
  });

  const prompt = `
  Step-1: Generate three different charts for data visualization based on the attached csv file.
  Step-2: After each chart is generated, output a short text description for it. The description should stick to the following format:
  <Title>Line chart of values over time</Title>
  <Description>This line charts shows......</Description>
   `;

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: 'user',
        content: prompt,
        attachments: [
          {
            file_id: file.id,
            tools: [{ type: 'code_interpreter' }]
          }
        ]
      }
    ]
  });

  const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: assistant.id
  });

  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    const message = messages.data[0];
    const responseArray: ChartInformation[] = [];
    if (message.role === 'assistant') {
      const textContent = <TextContentBlock>message.content[0];
      if (textContent.type === 'text') {
        const text = textContent.text.value;
        const jsonList: ReturnObject[] = extractJsonObject(text);
        for (let item of jsonList) {
          let src = await idToSrc(item.file_id);
          const response: ChartInformation = {
            src: src,
            description: text
          };
          responseArray.push(response);
        }
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
  async function idToSrc(id: string) {
    const imageFile = await openai.files.content(id);
    const imageData = await imageFile.arrayBuffer();
    let binary = '';
    let bytes = new Uint8Array(imageData);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:image/png;base64,' + window.btoa(binary);
  }

  function extractJsonObject(jsonString: string): ReturnObject[] {
    try {
      // Remove the leading and trailing backticks and the 'json' label if present
      const cleanedString = jsonString
        .trim()
        .replace(/^```json/, '')
        .replace(/```$/, '')
        .trim();

      // Parse the JSON string
      const jsonObject = JSON.parse(cleanedString);
      return jsonObject;
    } catch (error) {
      console.error('Failed to parse JSON string:', error);
      return [];
    }
  }
}
