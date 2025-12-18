import axios from 'axios';

export default async (request, context) => {
  try {
    console.log('Api key: ' + process.env.API_KEY);
    const response = await axios.post(
      'https://api.openai.com/v1/realtime/client_secrets',
      {
        session: {
          "type": "realtime",
          "model": "gpt-realtime"
        }
      },
      {
        headers: {
          'Authorization': 'Bearer ' + process.env.API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const token = response.data.value;
    console.log('Token (serverless):' + token);

    return Response.json({ token });
  } catch (error) {
    console.log(error);
    return Response.json({ error: 'Failed fetching data' }, { status: 500 });
  }
};


