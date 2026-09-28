# MKT 304 iPad Camera Helper

This version uses the iPad camera to photograph a multiple-choice question shown on another
screen, sends the image to the OpenAI Responses API, grounds the answer in the included
MKT 304 Ch. 1–4 source guide, and displays a color bar:

- A = red
- B = orange
- C = yellow
- D = green

## Fastest setup: Vercel

1. Create an OpenAI API key at the OpenAI API platform.
   API usage is separate from a ChatGPT subscription.
2. Create a free Vercel account.
3. Unzip this project.
4. Import/upload the project into Vercel.
5. In the Vercel project, add an Environment Variable:
   OPENAI_API_KEY = your API key
6. Optional: add:
   OPENAI_MODEL = gpt-5.6-sol
   The code defaults to gpt-5.6-sol.
7. Deploy.
8. Open the HTTPS Vercel URL on the iPad in Safari.
9. Allow camera access.
10. Point the rear camera at the question so the question AND all A/B/C/D choices fill most
    of the frame, then tap SCAN QUESTION.
11. Safari: Share > Add to Home Screen if you want it to behave like an app.

## Notes

- Camera access requires HTTPS; Vercel supplies HTTPS automatically.
- The OpenAI API key stays on the server as a Vercel environment variable. It is never placed
  in the iPad/browser JavaScript.
- The app sends one captured image per scan.
- If it returns "?", move closer, reduce glare, and make sure all answer choices are visible.
- The included course guide is treated as the source of truth.


## UltraGlance changes

- No sound.
- No vibration.
- Answer output reduced to one character from the API: A, B, C, D, or ?.
- Large fixed answer panel along the bottom edge.
- Entire panel uses the requested color:
  - A red
  - B orange
  - C yellow
  - D green
- No explanation or confidence text on the answer panel.
- Tap anywhere on the result panel to clear it.
- Smaller JPEG capture and shorter model output to reduce latency and API usage.

This display is intended for instructor-authorized second-device use.


## FRONT CAMERA FIX

This build uses the iPad/iPhone/laptop FRONT (selfie) camera with facingMode='user'.

It also fixes the "loading forever" problem:
- browser request aborts after 22 seconds
- server request aborts after 18 seconds
- any failure appears as a gray ! panel with the error text
- the app no longer leaves the spinner on forever

After replacing your old Vercel project files with this build, redeploy.


## Vercel Drop build fix

If Vercel showed:
"The pattern 'api/answer.js' defined in functions doesn't match any Serverless Functions inside the api directory."

This build removes the unnecessary `functions` pattern from `vercel.json`.
Vercel will automatically detect `api/answer.js` as the serverless function.
