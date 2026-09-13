export type LessonVisualNotes = { intro: string; flow: string[]; figures: { title: string; alt: string; text: string; width: number; height: number }[] };

export const filmmakingVisuals: Record<string, LessonVisualNotes> = {
  "2": {
    "intro": "Turn the brief into visible decisions. These foundations apply whether you record the image, generate it, or combine both.",
    "flow": [
      "Brief",
      "Shot list",
      "Frame and light",
      "Record",
      "Edit",
      "Deliver"
    ],
    "figures": [
      {
        "title": "Choose the shot for its job",
        "alt": "Four views of the same person: wide, medium, close and macro.",
        "text": "A wide shot establishes the place. A medium shot connects a person to the action. A close shot emphasizes a reaction. A detail shot gives the viewer evidence. Build a short sequence that answers where, who and what matters, instead of changing the framing only for variety.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Shape the subject with light",
        "alt": "Key, fill and rim lighting diagram beside a portrait.",
        "text": "The key light gives the subject shape. Fill controls how much detail remains in the shadows. A rim light separates the subject from the background. Start with the key, inspect the face, then add only what the image needs. Keep the lighting direction consistent when you generate matching shots.",
        "width": 1600,
        "height": 832
      }
    ]
  },
  "3": {
    "intro": "A script gives every shot a purpose. Use the structure below to decide what the audience needs to understand and what they should do next.",
    "flow": [
      "Character",
      "Problem",
      "Plan",
      "Action",
      "Result"
    ],
    "figures": [
      {
        "title": "Make the change visible",
        "alt": "Eight story beats moving from context to a changed situation.",
        "text": "Start with a person in a specific situation and a problem the viewer can recognize. Show the guide or idea that makes action possible, then the steps and their result. The ending should demonstrate a change. For a short client film, combine beats without losing the connection between the problem and the outcome.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Give the opening a clear promise",
        "alt": "Examples of opening hooks from the storytelling class.",
        "text": "Choose an opening that raises a question the film can answer. A surprising result, a recognizable frustration or a concrete demonstration can earn attention. Write the final payoff before polishing the hook so the opening promises something the footage can actually deliver.",
        "width": 1600,
        "height": 832
      }
    ]
  },
  "4": {
    "intro": "Use AI where it serves the shot. Decide what must remain real, what can be generated and what needs to stay consistent across both.",
    "flow": [
      "Brief",
      "Reference",
      "Generate",
      "Compare",
      "Animate"
    ],
    "figures": [
      {
        "title": "From noise to an image",
        "alt": "Diffusion stages progressing from noise through shape and form to a detailed image.",
        "text": "The class visualizes generation as progressive refinement. Your prompt and references guide the result, but they do not guarantee exact details. Describe the subject, framing and light, then inspect the output against the brief. Treat the first image as a candidate to review before spending time animating it.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Carry a reference through the sequence",
        "alt": "Reference images used to preserve visual consistency.",
        "text": "Approve a reference before generating a sequence. Keep the same subject description, wardrobe, palette and light direction in later requests. Compare every new shot to that reference. If identity or product geometry drifts, fix the image first so the error does not spread into video.",
        "width": 1600,
        "height": 832
      }
    ]
  },
  "5": {
    "intro": "Build the smallest tool set that can deliver the brief. The map helps you separate production jobs from product names.",
    "flow": [
      "Identify the job",
      "Test one output",
      "Check the handoff",
      "Choose the tool"
    ],
    "figures": [
      {
        "title": "Choose by production task",
        "alt": "A map of nine tool roles in a video production workflow.",
        "text": "Break the job into writing, image creation, video, voice, music, editing and review before choosing tools. Assign one tool to each task you actually need. The names in the slide document the class setup. Check current capabilities and pricing before using the same setup for a client.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Connect the output to the next step",
        "alt": "Tools for 3D, review and editing in the class workflow.",
        "text": "A tool is useful when its output can be checked and handed to the next stage. Confirm the file format, resolution, timing information and editing requirements before running a large batch. Test one representative shot through the complete workflow, including the final export.",
        "width": 1600,
        "height": 832
      }
    ]
  },
  "6": {
    "intro": "An agent needs more than a prompt. It needs tools, rules, a way to inspect its work and a condition for stopping.",
    "flow": [
      "Inputs",
      "Act",
      "Inspect",
      "Revise",
      "Approve"
    ],
    "figures": [
      {
        "title": "Read the loop, including the way back",
        "alt": "An agent workflow with inputs, actions, checks and output.",
        "text": "Give the agent the brief, references, available tools and a clear output. After each action, compare the result to explicit checks. A failed check should send the work back to the stage that caused it. Set a revision limit and keep human approval at the final delivery step.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Compare revisions against the same target",
        "alt": "A source photograph and two generated revisions.",
        "text": "Keep the original and each revision visible together. Name the specific defect before asking for another attempt: framing, identity, color or an unwanted object. Preserve the parts that already pass. A revision should solve the stated problem without quietly introducing a new one.",
        "width": 1600,
        "height": 832
      }
    ]
  },
  "7": {
    "intro": "Start with a clear recording. The production kit helps turn that take into a tutorial with useful graphics, precise timing and a checked export.",
    "flow": [
      "Take + brief",
      "Transcribe",
      "Compose",
      "Check",
      "Revise",
      "Render"
    ],
    "figures": [
      {
        "title": "Build around the spoken words",
        "alt": "Tutorial flow from one take and brief through transcription, composition, review and render.",
        "text": "Transcribe the take before placing graphics. Anchor each overlay to the words it explains, then compose the footage, graphics and supporting images. If timing fails, return to the transcript anchors. If a visual rule fails, fix the composition and inspect new frames before rendering again.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Keep the presenter and the proof readable",
        "alt": "The same tutorial take before and after graphics are added.",
        "text": "Use the presenter as the continuous explanation and add a visual only when it helps the viewer understand a step. Leave faces and interface controls readable. Watch once without sound to check visual clarity, then listen without watching to check whether the explanation still makes sense.",
        "width": 1600,
        "height": 832
      }
    ]
  },
  "8": {
    "intro": "A recurring cast needs a repeatable visual reference. The workflow protects character identity while the story and camera change.",
    "flow": [
      "Story rules",
      "Cast sheets",
      "Shot plan",
      "Generate",
      "Check",
      "Assemble"
    ],
    "figures": [
      {
        "title": "Approve the cast before generating scenes",
        "alt": "Micro-drama workflow from rules and character sheets to generated clips, review and an episode.",
        "text": "Write the episode beats and approve the character sheets first. Generate the shots from those shared references, then review each clip for identity, action and continuity. Reject a failing shot before stitching the episode. Keep the accepted references for the next episode.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Use a character sheet as the shared reference",
        "alt": "Front, full-body and gesture references for the cast.",
        "text": "Record the details that identify each character: proportions, clothing, colors and distinguishing features. Use front and full-body views to make those details explicit. When a new shot changes one of them, correct it against the sheet instead of redefining the character in the next prompt.",
        "width": 1600,
        "height": 832
      }
    ]
  },
  "9": {
    "intro": "Let the recorded material lead. Use AI to help find, organize and package the story while keeping control of the edit.",
    "flow": [
      "Footage",
      "Transcript",
      "Story approval",
      "Edit",
      "Finish",
      "Review"
    ],
    "figures": [
      {
        "title": "Lock the story before decorating the cut",
        "alt": "Real-footage workflow connecting clips, transcription, story approval, edit decisions and finishing.",
        "text": "Inventory the footage, transcribe speech and propose a story from material that actually exists. Approve the selects and sequence before adding overlays, music or effects. Keep the edit decisions traceable to source clips so a client revision can change one section without rebuilding the whole film.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Finish the footage with a consistent treatment",
        "alt": "Recorded footage before and after a color treatment and lower-third.",
        "text": "Balance exposure and color across adjacent shots before applying a look. Add labels only where they identify something useful, then check contrast and safe placement. Listen for abrupt level changes between dialogue and music, and review the exported file rather than relying only on the timeline.",
        "width": 1600,
        "height": 832
      }
    ]
  },
  "10": {
    "intro": "Plan the message and timing before animating. The class connects a spoken narrative to a controlled sequence of scenes, graphics and sound.",
    "flow": [
      "Script",
      "Voice",
      "Art + sound",
      "Compose",
      "Check",
      "Mix + render"
    ],
    "figures": [
      {
        "title": "Let the voice set the timing",
        "alt": "Motion-graphics workflow from script and voice through artwork, composition, review and final mix.",
        "text": "Approve the script and voice before timing the scenes. Place music, artwork and sound effects around that structure, then compose the motion. Check layouts and sample frames before a full render. When the critic finds a problem, change the relevant scene and inspect it again.",
        "width": 1600,
        "height": 832
      },
      {
        "title": "Give each layer a distinct role",
        "alt": "A motion film structure with five acts, voice, music, sound effects and silence.",
        "text": "Use the voice to explain, the image to demonstrate and motion to direct attention. Music supports the pace; sound effects should mark meaningful events. Leave space around important words and transitions. If every layer demands attention at once, simplify the scene before adding more animation.",
        "width": 1600,
        "height": 832
      }
    ]
  }
};
