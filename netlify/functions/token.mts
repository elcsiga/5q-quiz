import type { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const apiKey = Netlify.env.get('API_KEY');
  console.log('Api key: ' + apiKey);

  const re = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    body: JSON.stringify({
      session: {
        "type": "realtime",
        "model": "gpt-realtime"
      }
    }),
    headers:{
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
  });

  const data = await re.json();
  const token = data.value;

  console.log('Token:' + token);

  return Response.json({ token });
}

export const config: Config = {
  path: "/api/token"
};
