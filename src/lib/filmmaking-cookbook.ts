export type CookbookStep = readonly [string, string];
export type VideoKit = { id: string; title: string; lesson: number; goal: string; output: string; needs: string; steps: CookbookStep[]; check: string[]; prompt: string; cost: string };
export type CookbookLesson = { title: string; goal: string; output: string; steps: CookbookStep[]; check: string[]; kits: string[] };

export const videoKits: Record<string, VideoKit> = {
  "tutorial": {
    "title": "Video tutorial",
    "lesson": 7,
    "goal": "Teach a process clearly with a screen recording, presenter footage, and timed graphics.",
    "output": "A tutorial with titles, callouts, captions, and chapter marks.",
    "needs": "A 1080p screen recording, clear microphone audio, and optional camera footage. Clap once at the start if you record on separate devices.",
    "steps": [
      [
        "Prepare the recording",
        "Put your original screen, camera, and audio files in footage/. Keep a backup of the originals."
      ],
      [
        "Set the teaching goal",
        "Open the extracted kit folder in your coding agent. Paste the prompt below and replace the capitalized fields. Add the client's brand guide if they have one."
      ],
      [
        "Review the edit plan",
        "Check which sentences stay, where the screen needs to be full size, and which explanations need a graphic. Correct missing teaching points before the edit."
      ],
      [
        "Inspect sample frames",
        "Check that the presenter and callouts never cover a menu, code sample, diagram, or other information the viewer needs."
      ],
      [
        "Watch and revise",
        "Watch the rendered video in renders/. Check speech, graphic timing, captions, and chapters. Give revision notes with timestamps."
      ]
    ],
    "check": [
      "A viewer can follow the demonstrated process without guessing a missing step.",
      "The screen stays readable and graphics appear with the relevant explanation.",
      "Captions match the final edit and music does not cover speech."
    ],
    "prompt": "Build my video. Set everything up for me.\n\nThis video is about: ONE SENTENCE\nWhat I want people to remember: ONE SENTENCE\nMy name: YOUR NAME\n\nShow me the plan before you cut anything.",
    "cost": "Your coding agent may require a paid account. Local editing and rendering do not use generation credits. Optional generated media or cloud services may cost extra.",
    "id": "tutorial"
  },
  "vlog": {
    "title": "Real-footage edit",
    "lesson": 9,
    "goal": "Turn footage from a day, trip, or event into a story for the intended audience.",
    "output": "A story edit with a cold open, B-roll, keyword cards, and a balanced sound mix.",
    "needs": "Your camera or phone clips, including spoken moments and B-roll. Keep the original filenames and timestamps.",
    "steps": [
      [
        "Gather every clip",
        "Copy all clips into footage/. Include imperfect takes and quiet B-roll. The gaps between recordings help the agent understand the day."
      ],
      [
        "Explain the story",
        "Open the extracted kit folder and paste the prompt below. Describe what happened and the unexpected turn that gives the story a payoff."
      ],
      [
        "Review the outline",
        "Check the proposed acts and selected clips. Confirm the story is accurate and the opening sets up an ending the footage supports."
      ],
      [
        "Watch the rough cut",
        "Look for cuts inside words, dead audio, repeated information, and B-roll that does not match the narration."
      ],
      [
        "Revise by timestamp",
        "Give notes such as \"1:17 remove this repeated explanation\" or \"5:22 hold the screen longer.\" Review the next export after each round."
      ]
    ],
    "check": [
      "The opening, story, and payoff make sense to someone who was not there.",
      "Cuts preserve complete words and the audio stays consistent between cameras.",
      "Titles and B-roll still align after the final revision."
    ],
    "prompt": "Cut my vlog. Set everything up for me.\n\nThe day was: ONE SENTENCE\nThe thing nobody expects: ONE SENTENCE\nMy name: YOUR NAME\n\nShow me the story outline before you cut anything.",
    "cost": "Your coding agent may require a paid account. Local editing and rendering do not use generation credits. Optional generated media or cloud services may cost extra.",
    "id": "vlog"
  },
  "promo": {
    "title": "Vertical ad",
    "lesson": 10,
    "goal": "Make a short vertical ad for a client's product and one specific offer.",
    "output": "A 20 to 30 second vertical ad with a cold open, beat-timed cuts, and one call to action.",
    "needs": "A product description, the customer benefit, the destination platform, and an optional music track you can use.",
    "steps": [
      [
        "Define the offer",
        "Write what the product does and what the customer gets. Add the client's logo, approved claims, and destination link to the brief."
      ],
      [
        "Choose the music",
        "Place a track with a clear drop in assets/, or ask the agent to generate one. Agree on a generation budget before requesting paid assets."
      ],
      [
        "Brief the agent",
        "Open the extracted kit folder and paste the prompt below. Choose one destination platform and state the required vertical format."
      ],
      [
        "Choose the opening shot",
        "Review both cold-open options before building the rest. Check product accuracy, natural movement, and whether the turn is clear."
      ],
      [
        "Review the finished ad",
        "Check cuts against the music, readable text, correct product details, and a final call to action that stays on screen long enough."
      ]
    ],
    "check": [
      "The export fills the required vertical frame without black bars.",
      "The offer, logo, and link match the client's brief.",
      "The opening leads into the product message and the final action is clear."
    ],
    "prompt": "Make my ad. Set everything up for me.\n\nProduct: ONE SENTENCE\nWhat people get: ONE SENTENCE\nLanguage: English\nWhere it runs: Reels / TikTok / YouTube Shorts\n\nShow me the cold-open options before you build the rest.",
    "cost": "Your coding agent and generated footage, voice, or music may cost money. Ask for a cost estimate before generation. Reuse approved assets; new or revised generations can incur charges.",
    "id": "promo"
  },
  "micro-drama": {
    "title": "Consistent micro-drama",
    "lesson": 8,
    "goal": "Create a short fictional series whose characters remain recognizable across shots and episodes.",
    "output": "A reusable cast and a first vertical episode of about 45 seconds.",
    "needs": "A wronged character, an opposing character, a short moral, and the story language. Start with one episode.",
    "steps": [
      [
        "Define the characters",
        "Choose non-human characters such as fruit, animals, or objects with faces. Write who is treated unfairly, who causes the problem, and what the story is about."
      ],
      [
        "Brief the series",
        "Open the extracted kit folder and paste the prompt below. Ask for the first episode only so you can test the process before a full season."
      ],
      [
        "Approve the reference sheets",
        "Check visible eyes and mouths, proportions, wardrobe, and relative size. Fix these sheets before generating any scenes."
      ],
      [
        "Build and compare the shots",
        "Reuse the same reference images and exact character descriptions. Compare every shot for identity, voice, setting, and continuity."
      ],
      [
        "Review the episode",
        "Check that each scene changes the situation, dialogue is not repeated, and the cliffhanger invites the next episode. Approve the result before expanding the series."
      ]
    ],
    "check": [
      "Each character keeps the same face, proportions, and identifying details.",
      "Dialogue is clear, spoken once, and audible over the music.",
      "The story has a clear conflict and a deliberate ending point."
    ],
    "prompt": "Build my series. Set everything up for me.\n\nThe wronged one: ONE SENTENCE\nThe villain in the family: ONE SENTENCE\nThe moral: ONE SHORT LINE\nLanguage: English\n\nShow me the character sheets before you make any episodes.",
    "cost": "Your coding agent and generated footage, voice, or music may cost money. Ask for a cost estimate before generation. Reuse approved assets; new or revised generations can incur charges.",
    "id": "micro-drama"
  },
  "launch": {
    "title": "Product launch film",
    "lesson": 10,
    "goal": "Introduce a client's product through a short narrated film that shows what it does.",
    "output": "A 20 to 30 second launch film with narration, music, and motion graphics.",
    "needs": "The customer problem, a short product description, one supported proof point, and product screenshots or a demo if available.",
    "steps": [
      [
        "Write the product brief",
        "Describe the pain, name the product in a few words, and choose one fact you can demonstrate. Include the client's visual guidelines."
      ],
      [
        "Start the project",
        "Open the extracted kit folder and paste the prompt below. Provide a product URL or local project path so the agent can work from real details."
      ],
      [
        "Choose the voice and script",
        "Listen to the voice options. Check pronunciation and keep the script short enough for the requested duration. Approve paid generation before it starts."
      ],
      [
        "Review the scene plan",
        "Follow the problem, reveal, proof, human moment, and final product lockup. Show the product working where possible."
      ],
      [
        "Check the export",
        "Watch with sound, then without it. Check narration timing, readable motion graphics, supported claims, and the final product name and action."
      ]
    ],
    "check": [
      "The film shows the product accurately and uses a supported proof point.",
      "Voice and music work together, with pauses where the script needs them.",
      "The final screen gives viewers enough time to read the name and next step."
    ],
    "prompt": "Make my launch film. Set everything up for me.\n\nThe pain: ONE SENTENCE\nThe product: FIVE WORDS\nThe proof: ONE NUMBER OR LINE\nWhere the code lives: PATH OR URL\n\nShow me the voice options first.",
    "cost": "Your coding agent and generated footage, voice, or music may cost money. Ask for a cost estimate before generation. Reuse approved assets; new or revised generations can incur charges.",
    "id": "launch"
  }
};

export const filmmakingCookbook: CookbookLesson[] = [
  {
    "title": "Choose your course project",
    "goal": "A client needs a video that reaches a specific audience and produces a clear result.",
    "output": "A one-page production brief.",
    "steps": [
      [
        "Choose a use case",
        "Pick a tutorial, real-footage story, micro-drama, ad, or product launch film."
      ],
      [
        "Define the audience and result",
        "Write who will watch, where the video will appear, and what they should understand or do afterward."
      ],
      [
        "List the available material",
        "Note footage, product images, brand assets, people, and locations you already have. Separate those from assets you need to create."
      ],
      [
        "Set the delivery requirements",
        "Record format, duration, deadline, budget, and the person who approves the work."
      ]
    ],
    "check": [
      "The brief names one audience, one purpose, and a concrete deliverable.",
      "You know what the client must supply and who signs off."
    ],
    "kits": []
  },
  {
    "title": "Plan the shots",
    "goal": "A client needs a sequence that communicates clearly before any AI generation begins.",
    "output": "A three-shot plan with framing, movement, lighting, and sound.",
    "steps": [
      [
        "Choose one moment",
        "Use the project brief from lesson 1. Pick an action or explanation that deserves a short sequence."
      ],
      [
        "Sketch three shots",
        "Plan a wide shot for context, a medium shot for the action, and a detail that matters to the story."
      ],
      [
        "Specify the craft",
        "For each shot, note camera position, movement, light direction, and the sound the viewer should hear."
      ],
      [
        "Check continuity",
        "Read the shots in order. Confirm screen direction, light, and sound connect, then identify what you will record or generate."
      ]
    ],
    "check": [
      "Each shot communicates something the viewer needs.",
      "The sequence is understandable without relying on decorative effects."
    ],
    "kits": []
  },
  {
    "title": "Write the hook and payoff",
    "goal": "A client needs viewers to understand the story and stay for its result.",
    "output": "A short script with a hook, a change, and a payoff.",
    "steps": [
      [
        "Name the character and problem",
        "Write who wants what and what stands in the way. For a product video, start with the customer's problem."
      ],
      [
        "Write the opening",
        "Give the viewer a specific question, problem, or situation in the first moments."
      ],
      [
        "Build the change",
        "Outline the plan, the stakes, and what changes. Remove scenes that repeat information."
      ],
      [
        "Read it aloud",
        "Time the script and check that the ending answers the opening. Revise anything that is difficult to say or understand."
      ]
    ],
    "check": [
      "The opening sets an expectation the ending fulfills.",
      "Each scene moves the story forward."
    ],
    "kits": []
  },
  {
    "title": "Test one generated shot",
    "goal": "A client needs a usable shot that matches the agreed visual direction.",
    "output": "An approved test shot and a reusable prompt.",
    "steps": [
      [
        "Choose a small test",
        "Take one shot from your plan. Define its subject, action, camera, lighting, duration, and format."
      ],
      [
        "Gather references",
        "Choose images that show the required identity, wardrobe, location, or product details."
      ],
      [
        "Generate and inspect",
        "Create a test within your budget. Review the beginning, middle, and end for geometry, movement, continuity, and unwanted text."
      ],
      [
        "Revise one issue at a time",
        "Change the part of the prompt tied to the failure. Save the accepted prompt and reference files with the shot."
      ]
    ],
    "check": [
      "The shot matches the brief and the requested aspect ratio.",
      "Important details remain consistent throughout the shot."
    ],
    "kits": []
  },
  {
    "title": "Choose tools for your project",
    "goal": "A client needs a reliable production plan with costs they can understand.",
    "output": "A tool list and a small completed test.",
    "steps": [
      [
        "List the production jobs",
        "Identify which jobs need writing, images, video, voice, music, editing, or quality checks."
      ],
      [
        "Match tools to the jobs",
        "Use the tools discussed in the lesson as starting points. Check current capabilities and pricing before choosing a paid service."
      ],
      [
        "Test the hardest requirement",
        "Try one representative shot or audio segment. Judge the actual output against the client's requirements."
      ],
      [
        "Record the decision",
        "Save the tool, expected cost, accepted test, and fallback for each essential job."
      ]
    ],
    "check": [
      "Every tool has a specific job in the project.",
      "The test meets the brief before you commit to a larger run."
    ],
    "kits": []
  },
  {
    "title": "Build your production loop",
    "goal": "A client needs a repeatable process that can identify and fix failures.",
    "output": "A brief, rules, review checklist, and one completed iteration.",
    "steps": [
      [
        "Write a small brief",
        "Specify one output, the input files, duration, format, and the client's non-negotiable requirements."
      ],
      [
        "Set the rules",
        "Write what the agent may change, what it must preserve, and which decisions need your review."
      ],
      [
        "Make one draft",
        "Use the matching kit from the practical lessons. Ask the agent to show its plan before it creates the draft."
      ],
      [
        "Review and repeat",
        "Inspect actual frames and listen to the audio. Write specific failures, fix them, and stop when the agreed checks pass."
      ]
    ],
    "check": [
      "Every review item can be checked against the real output.",
      "The agent knows which issues it can retry and which need a human decision."
    ],
    "kits": []
  },
  {
    "title": "Video tutorial",
    "goal": "Teach a process clearly with a screen recording, presenter footage, and timed graphics.",
    "output": "A tutorial with titles, callouts, captions, and chapter marks.",
    "steps": [
      [
        "Prepare the recording",
        "Put your original screen, camera, and audio files in footage/. Keep a backup of the originals."
      ],
      [
        "Set the teaching goal",
        "Open the extracted kit folder in your coding agent. Paste the prompt below and replace the capitalized fields. Add the client's brand guide if they have one."
      ],
      [
        "Review the edit plan",
        "Check which sentences stay, where the screen needs to be full size, and which explanations need a graphic. Correct missing teaching points before the edit."
      ],
      [
        "Inspect sample frames",
        "Check that the presenter and callouts never cover a menu, code sample, diagram, or other information the viewer needs."
      ],
      [
        "Watch and revise",
        "Watch the rendered video in renders/. Check speech, graphic timing, captions, and chapters. Give revision notes with timestamps."
      ]
    ],
    "check": [
      "A viewer can follow the demonstrated process without guessing a missing step.",
      "The screen stays readable and graphics appear with the relevant explanation.",
      "Captions match the final edit and music does not cover speech."
    ],
    "kits": [
      "tutorial"
    ]
  },
  {
    "title": "Consistent micro-drama",
    "goal": "Create a short fictional series whose characters remain recognizable across shots and episodes.",
    "output": "A reusable cast and a first vertical episode of about 45 seconds.",
    "steps": [
      [
        "Define the characters",
        "Choose non-human characters such as fruit, animals, or objects with faces. Write who is treated unfairly, who causes the problem, and what the story is about."
      ],
      [
        "Brief the series",
        "Open the extracted kit folder and paste the prompt below. Ask for the first episode only so you can test the process before a full season."
      ],
      [
        "Approve the reference sheets",
        "Check visible eyes and mouths, proportions, wardrobe, and relative size. Fix these sheets before generating any scenes."
      ],
      [
        "Build and compare the shots",
        "Reuse the same reference images and exact character descriptions. Compare every shot for identity, voice, setting, and continuity."
      ],
      [
        "Review the episode",
        "Check that each scene changes the situation, dialogue is not repeated, and the cliffhanger invites the next episode. Approve the result before expanding the series."
      ]
    ],
    "check": [
      "Each character keeps the same face, proportions, and identifying details.",
      "Dialogue is clear, spoken once, and audible over the music.",
      "The story has a clear conflict and a deliberate ending point."
    ],
    "kits": [
      "micro-drama"
    ]
  },
  {
    "title": "Real-footage edit",
    "goal": "Turn footage from a day, trip, or event into a story for the intended audience.",
    "output": "A story edit with a cold open, B-roll, keyword cards, and a balanced sound mix.",
    "steps": [
      [
        "Gather every clip",
        "Copy all clips into footage/. Include imperfect takes and quiet B-roll. The gaps between recordings help the agent understand the day."
      ],
      [
        "Explain the story",
        "Open the extracted kit folder and paste the prompt below. Describe what happened and the unexpected turn that gives the story a payoff."
      ],
      [
        "Review the outline",
        "Check the proposed acts and selected clips. Confirm the story is accurate and the opening sets up an ending the footage supports."
      ],
      [
        "Watch the rough cut",
        "Look for cuts inside words, dead audio, repeated information, and B-roll that does not match the narration."
      ],
      [
        "Revise by timestamp",
        "Give notes such as \"1:17 remove this repeated explanation\" or \"5:22 hold the screen longer.\" Review the next export after each round."
      ]
    ],
    "check": [
      "The opening, story, and payoff make sense to someone who was not there.",
      "Cuts preserve complete words and the audio stays consistent between cameras.",
      "Titles and B-roll still align after the final revision."
    ],
    "kits": [
      "vlog"
    ]
  },
  {
    "title": "Product launch film",
    "goal": "Introduce a client's product through a short narrated film that shows what it does.",
    "output": "A 20 to 30 second launch film with narration, music, and motion graphics.",
    "steps": [
      [
        "Write the product brief",
        "Describe the pain, name the product in a few words, and choose one fact you can demonstrate. Include the client's visual guidelines."
      ],
      [
        "Start the project",
        "Open the extracted kit folder and paste the prompt below. Provide a product URL or local project path so the agent can work from real details."
      ],
      [
        "Choose the voice and script",
        "Listen to the voice options. Check pronunciation and keep the script short enough for the requested duration. Approve paid generation before it starts."
      ],
      [
        "Review the scene plan",
        "Follow the problem, reveal, proof, human moment, and final product lockup. Show the product working where possible."
      ],
      [
        "Check the export",
        "Watch with sound, then without it. Check narration timing, readable motion graphics, supported claims, and the final product name and action."
      ]
    ],
    "check": [
      "The film shows the product accurately and uses a supported proof point.",
      "Voice and music work together, with pauses where the script needs them.",
      "The final screen gives viewers enough time to read the name and next step."
    ],
    "kits": [
      "launch",
      "promo"
    ]
  }
];
