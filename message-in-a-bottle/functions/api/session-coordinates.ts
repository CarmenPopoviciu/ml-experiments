export async function onRequestGet({ request }) {
  let { latitude, longitude } = request.cf;

  console.log(`🌎 Incoming /session-coordinates request received from the following geographic coordinates:
    latitude: ${latitude}
    longitude: ${longitude}
  `);
  
	return new Response(JSON.stringify({ latitude, longitude }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}