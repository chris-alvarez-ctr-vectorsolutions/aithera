/* ============================================================================
   scenario-v4-templates.js — the Writer Studio template gallery
   ----------------------------------------------------------------------------
   POC V4 has no scenario type field: what a scenario IS emerges from the modes
   its steps use. So seven of the UX Universal types live on here as TEMPLATES —
   starting points an LXD picks and then edits freely, rather than a declaration
   that binds the scenario to one engine path (decision D7).

   Each entry carries a complete POC V4 document — the LOCKED PRODUCTION
   DOCUMENT of that shape, seeded from tools/pinned/content, valid under the
   production loader as it stands. Nothing in a template is fabricated and
   nothing required is blank.

   That is a change of policy, and worth knowing why. These used to be PORTS of
   our own shipped exemplars, and a port can only carry what its source holds:
   conversion policy D6 forbids inventing prose, so each template arrived with
   8-24 required fields empty and a `toFill` count advertising the fact. Honest,
   and useless as a starting point — an LXD who picked "Guided Arc" was promised
   the Marshall scenario and got a form with red rows in it. The dev team's own
   documents were already in this repo for the round-trip check, six of them
   matching these six shapes exactly, so a template is now one of those, plus a
   readable `template-…` implementation_id (never their production UUID — an
   export made from one would address the real record; the editor re-derives it
   from the title on load now that ids are generated), prior-scenario context,
   and an exhibit path repointed at a vendored image. `toFill` is gone with the ports:
   the gallery counts the document it is about to load (studio-shell.js
   templateFacts) instead of trusting a number stored beside it.

   GENERATED — do not hand-edit the `doc:` blocks. Regenerate with
   `node tools/reseed-templates.js`. Comments and gallery copy ARE hand-edited;
   the tool rewrites only each entry's document and shape.
   ========================================================================== */

(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ScenarioV4Templates = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const TEMPLATES = {
  "branching-arc": {
    /* Was "Branching Arc", under a diagram-of-a-branch icon. Scenario CML v4
       cannot branch — no branch / next / condition / goto / target anywhere in
       the schema, `transition` is a button label plus optional text, and a phase
       has no successor field. This template emits coach -> roleplay -> coach ->
       roleplay: a straight ladder whose only branching was its name.
       The SHAPE is worth keeping (an escalating run of scenes is a real authoring
       intent, and a different one from Ensemble's multi-character disclosure
       arc) — so it is named for what it builds. The id stays `branching-arc`:
       ORDER and any saved link resolve by it, and churning an internal key buys
       nothing. */
    label: "Escalating Situation", icon: "fa-arrow-trend-up",
    blurb: "One situation that gets harder scene by scene as the learner responds to it.",
    shape: "CRCR",
    doc: {
      "implementation_id": "template-reading-the-warning-signs",
      "modality": "ai-conversational",
      "schema_version": "4.0",
      "content": {
        "title": "Workplace Violence: Reading the Warning Signs",
        "narrative": "You run a shift at the agency, and Ray is one of yours — twelve years on the job, knows the work cold. A few weeks ago a lead assignment opened up, and it went to Marcus, someone newer. Ray wanted it. Since then, something's been off.\n\nIt's been small things, but they're adding up. Last week he snapped at a newer colleague on shift — sharper than the moment called for. You've heard him mutter that “management has it out for me.” And a couple of days ago he flat refused to hand a task off to Marcus, the new lead. Any one of these you might let go. All three, in two weeks, from a steady twelve-year veteran?\n\nHe hasn't done anything you could write up as a violation. But you know your people, and this isn't Ray. You're his supervisor — you're the one positioned to notice this, deal with it, and pull in help if it needs it. The question sitting in front of you is what to do now, before it becomes something bigger.",
        "scene_world": {
          "setting": "A public-sector agency — shifts, units, and a chain of command. The learner supervises a shift; Ray is one of their crew.",
          "canon": {
            "facts": [
              "The learner runs a shift at the agency and is Ray's supervisor — the person positioned to notice this, deal with it, and pull in help if it needs it.",
              "Ray has twelve years on the job and knows the work cold.",
              "A lead assignment opened up a few weeks ago and went to Marcus, someone newer. Ray wanted it.",
              "In the two weeks before these events began, the learner saw three things: Ray snapped at a newer colleague on shift, muttered that “management has it out for me,” and flat refused to hand a task off to Marcus, the new lead.",
              "Before these events began, Ray had done nothing that could be written up as a policy violation."
            ]
          },
          "characters": [
            {
              "id": "ray",
              "name": "Ray",
              "role": "A team member on the learner's shift — twelve years on the job, recently passed over for a lead assignment that went to Marcus, a newer colleague.",
              "behavior": {
                "baseline": "Guarded, resentful, minimizing — “I'm fine, everyone's overreacting.”",
                "driver": "A grievance. He was passed over for the lead assignment and feels the system is against him; his behavior responds to whether he is heard and treated with dignity, and to whether anything firm is actually asked of him.",
                "guardrails": [
                  "Never a caricature — an aggrieved twelve-year employee, not a villain.",
                  "Never menacing in the room; the grievance shows as resentment and defensiveness, not threat.",
                  "Trust is earned. He does not warm to the learner simply because they are pleasant."
                ]
              }
            }
          ]
        },
        "coach_persona": "Calm and professional, grounded in public-sector violence-prevention protocol — treats a serious topic without sensationalizing it.",
        "tone_guidelines": [
          "Point the learner at their own agency's policies, protocols, and Workplace Violence Prevention Plan. No specific customer document, form, or artifact exists here to name.",
          "Keep every detail discipline-neutral — agency, shift, unit, chain of command — so Fire, Law Enforcement, Dispatch, and EMS learners all see themselves in it. Never invent discipline-specific equipment, ranks, or jargon."
        ],
        "teaching_points": [
          {
            "topic": "Recognizing Level 1 and starting the record",
            "points": [
              "Recognize early warning signs as Level 1 behaviors of concern — not just a bad attitude.",
              "One incident is a moment; three converging signs in two weeks from a steady veteran is a signal worth acting on.",
              "Report up and document rather than sitting on it — avoid an information silo."
            ]
          },
          {
            "topic": "Running the Level 1 conversation",
            "points": [
              "Run the Level 1 conversation right: private, hear the grievance, set limits, name corrective steps, point to support.",
              "Hold both at once — let the grievance be real and give Ray a stake, while naming the specific behavior that has to change.",
              "Keep it private and dignified; public or punitive handling hardens the grievance instead of resolving it."
            ]
          },
          {
            "topic": "Recognizing the shift to Level 2",
            "points": [
              "Recognize the shift to Level 2 and switch from coaching to securing safety, notifying the chain, and involving 911 if warranted.",
              "A credible threat is not a performance conversation — the moment it appears, the goal shifts from correcting behavior to protecting people.",
              "You don't have to be sure a threat is real to act — securing safety and notifying is the correct move even if it de-escalates."
            ]
          },
          {
            "topic": "Responding to a Level 3 emergency",
            "points": [
              "At Level 3, respond as an emergency: call 911, secure personal safety first, account for others, and cooperate with law enforcement.",
              "Document throughout for the violent-incident log and follow the agency's Workplace Violence Prevention Plan.",
              "Don't sit on it, and don't go it alone — the same two principles run through every level."
            ]
          },
          {
            "topic": "The Level 1-3 behavior taxonomy",
            "points": [
              "Level 1 — Early Warning Signs: intimidates or bullies, is disrespectful, uncooperative, or verbally abusive.",
              "Level 2 — Escalation: argues with or defies policy, shows a “me against them” mindset, sabotage or theft, voices a wish to harm, or leaves threatening notes.",
              "Level 3 — Emergency: a physical fight, extreme rage, a weapon, or direct or suicidal threats."
            ]
          }
        ],
        "misconceptions": [
          {
            "misconception": "“He's just venting.”",
            "redirect": "These are Level 1 behaviors of concern — observe, document, and report."
          },
          {
            "misconception": "Handles it quietly to keep Ray out of trouble.",
            "redirect": "Withholding is an information silo — loop in the chain."
          },
          {
            "misconception": "Tries to manage a Level 2 or Level 3 threat solo.",
            "redirect": "Secure safety, notify the chain, and involve 911 or law enforcement."
          },
          {
            "misconception": "Keeps counseling after a credible threat surfaces.",
            "redirect": "The level has changed; the response has to change with it."
          },
          {
            "misconception": "Dresses Ray down in front of the crew.",
            "redirect": "Private, respectful, limit-setting — or it hardens the grievance."
          },
          {
            "misconception": "No record of the behavior or the steps taken.",
            "redirect": "Documentation is required for the incident log and any follow-through."
          }
        ],
        "opening": {
          "id": "opening_reflection",
          "label": "An Opening Reflection",
          "purpose": "The learner has taken in Ray's story — the three signs, the passed-over grievance. The coach asks for a gut read before any practice begins, reading tone and starting assumptions rather than grading them.",
          "opening_messages": [
            {
              "text": "Before we get into what to do — take a moment. Something about how Ray's been acting is nagging at you. What's your read on the situation right now? Anything standing out, or feeling hard to call?"
            }
          ],
          "exit": {
            "when": {
              "turns": 1
            },
            "final_word": "Let's take a closer look at what you're actually seeing here."
          },
          "transition": {
            "button_label": "See the signs"
          }
        },
        "phases": [
          {
            "id": "notice_assess",
            "label": "Notice & Assess · Level 1",
            "purpose": "See the early warning signs for what they are, document, and loop in your own chain — don't sit on it, don't go it alone.",
            "practice": {
              "mode": "coach_inquiry",
              "purpose": "The learner has shared a gut read and the coach has calibrated. Now the learner reasons through what these early signs are and what to do first. The coach hands over the floor: this is practice, not instruction.",
              "label": "Reading the signs",
              "exit": {
                "when": {
                  "requirement": "Learner treats the three signs as a pattern worth acting on rather than a mood, and names first steps that include starting a record, looping in their own chain so it's assessed together, and a private conversation with Ray.",
                  "turns": 2
                },
                "final_word": "Let's step back and connect this to the Level 1 protocol."
              },
              "transition": {
                "button_label": "Talk it through"
              },
              "interaction": {
                "opening_messages": [
                  {
                    "text": "Three things have reached you over the last two weeks — Ray snapped at a newer colleague, muttered that management “has it out for him,” and refused to hand a task to the new lead. In your view, what is this — and what do you do first? Walk me through your thinking."
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Explains it away — “rough month,” “he'll cool off.” Treats it as attitude, not a pattern. May jump straight to formal discipline, or plan to confront Ray on the floor.",
                    "response": "Probes so the learner looks again rather than handing over the answer: “Three separate things in two weeks from a steady veteran — what might that pattern add up to, and what's your first move before it grows?” Steers toward assessing, documenting, and reporting up instead of public discipline.",
                    "example": {
                      "learner": "It's probably nothing — Ray's had a rough month. I'll let it blow over.",
                      "reply": "Three separate things in two weeks, from a steady twelve-year vet — what do you make of that pattern? If you let it ride, what's the risk, and what would you want to do first?"
                    }
                  },
                  "neutral": {
                    "look_for": "Recognizes something's wrong and wants to address it, but reaches for one move — “I'll pull Ray aside” — without documenting or looping in the chain. Right instinct, incomplete protocol.",
                    "response": "Credits the instinct to act, then probes for what's missing instead of naming it: “Before you sit down with him, who else needs to know, and how will you make sure there's a record?” Pulls toward documentation, reporting up, and a private, planned meeting.",
                    "example": {
                      "learner": "I'll pull Ray aside on the floor and tell him to knock it off.",
                      "reply": "Pulling him aside is the right instinct — where would you have that conversation, and who else needs to know before you do? What would you want on the record afterward?"
                    }
                  },
                  "strong": {
                    "look_for": "Names these as Level 1 behaviors of concern, not just a rough patch. Starts a record — dates, what was observed, from whom. Reports up so it's assessed together. Plans a private meeting, and still acts despite the “is it my place?” friction.",
                    "response": "Confirms it plainly: that's the Level 1 protocol — observe, document, report up, meet privately. You're ahead of it instead of behind it.",
                    "example": {
                      "learner": "I'll write down what I've seen, give my supervisor a heads-up so we assess it together, and set up a private time to talk with Ray.",
                      "reply": "That's the Level 1 protocol exactly — observe, document, report up, meet privately. You're ahead of it instead of behind it."
                    }
                  }
                },
                "partner_label": "Coach"
              }
            },
            "debrief": {
              "label": "What the signs mean",
              "purpose": "The learner has worked the recognition question. The coach delivers the substantive teaching — the Level 1 protocol — so every learner leaves with the same recognition frame and the same standard.",
              "key_points": [
                "Snapping at the crew, muttering that management has it out for him, and refusing to work with the new lead are Level 1 behaviors of concern, not a rough patch.",
                "One incident is a moment; three converging in two weeks from a steady twelve-year veteran is a signal worth acting on.",
                "Start a record — dates, what was observed, from whom. It anchors the incident log and any follow-through.",
                "Loop in your chain so it's assessed together. Quietly absorbing it is an information silo.",
                "Plan a private conversation with Ray — never a floor confrontation.",
                "Don't sit on it. The incidents that go wrong are almost always the ones somebody kept to themselves.",
                "Don't go it alone. Recognition and response are a chain-of-command job, and that carries through every level ahead."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "The attempt explained the signs away, treated them as attitude, or reached straight for discipline or a floor confrontation.",
                  "response": "Credit the instinct not to overreact, then name what it cost: three separate things in two weeks from a steady veteran is a signal, not a rough month. Deliver the recognition frame and the protocol — observe, document, report up, meet privately — and be explicit that public discipline and a floor confrontation are the wrong moves at Level 1.",
                  "example": {
                    "learner": "It's probably nothing — Ray's had a rough month. I'll let it blow over.",
                    "reply": "You were trying not to overreact, and that instinct isn't wrong. But one incident is a moment; three converging in two weeks from a steady veteran is a signal worth acting on. Snapping at the crew, “management has it out for me,” refusing to work with the new lead — these are Level 1 behaviors of concern, not a rough patch. So the first moves are small and specific: start a record — dates, what was observed, from whom — loop in your chain so it's assessed together, and plan a private conversation with Ray, never a floor confrontation. The incidents that go wrong are almost always the ones somebody kept to themselves."
                  }
                },
                "neutral": {
                  "look_for": "The attempt wanted to act and reached for one move — usually a conversation with Ray — without a record or the chain.",
                  "response": "Affirm the instinct to act, then supply the rest of the protocol: before you sit down with him, loop in your chain so it's assessed together, and start a record so there's something to show for it. Name why the private, planned setting matters.",
                  "example": {
                    "learner": "I'll pull Ray aside on the floor and tell him to knock it off.",
                    "reply": "Wanting to deal with it directly is the right instinct — and yes, plan a private conversation with Ray, never a floor confrontation. What's missing is the rest of it. Start a record — dates, what was observed, from whom. It anchors the incident log and any follow-through. And loop in your chain so it's assessed together; don't quietly absorb it — that's an information silo. Recognition and response are a chain-of-command job, not a solo one, and that carries through every level ahead."
                  }
                },
                "strong": {
                  "look_for": "The attempt named the pattern and covered a record, reporting up, and a private meeting.",
                  "response": "Confirm the protocol back to them in their own terms, then add what they may not have said out loud — why the record anchors the incident log, and why reporting up matters even when nothing is provably a violation yet. Close on the two principles.",
                  "example": {
                    "learner": "I'll write down what I've seen, give my supervisor a heads-up so we assess it together, and set up a private time to talk with Ray.",
                    "reply": "That's the Level 1 protocol — observe, document, report up, meet privately. Worth naming why each piece earns its place: the record anchors the incident log and any follow-through, looping in your chain means it's assessed together instead of quietly absorbed, and the private setting is what keeps this a conversation rather than a floor confrontation. Two things carry forward from here — don't sit on it, and don't go it alone. Recognition and response are a chain-of-command job, not a solo one."
                  }
                }
              },
              "follow_up_turns": 0,
              "final_word": "That's the Level 1 protocol: observe, document, report up, meet privately. Don't sit on it, and don't go it alone.",
              "transition": {
                "button_label": "Step into the room",
                "text": "Now let's put you in the room with Ray to address what's going on. Step in whenever you're ready."
              }
            }
          },
          {
            "id": "the_conversation",
            "label": "The Conversation · Level 1",
            "purpose": "Meet with Ray privately: hear the grievance, set clear limits, name corrective steps, point to support — with respect, not punishment.",
            "practice": {
              "mode": "roleplay",
              "purpose": "With the Level 1 protocol established, the learner runs the private conversation with Ray live. What they type is what they say to him.",
              "label": "The conversation with Ray",
              "exit": {
                "when": {
                  "requirement": "Learner hears Ray's grievance without validating any threat, sets clear limits and names the corrective steps expected, points Ray to support such as EAP, and commits to documenting the meeting and keeping the chain informed.",
                  "turns": 6
                },
                "final_word": "Ray gets up and heads back out to the floor. That's the meeting."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "Let's unpack how that landed."
              },
              "interaction": {
                "setting": "A private room with twenty minutes set aside. Ray drops into the chair across from you, arms crossed.",
                "character_id": "ray",
                "emotion_hint": "guarded",
                "partner_label": "Ray",
                "opening_messages": [
                  {
                    "text": "You've got a private room and twenty minutes. Ray drops into the chair across from you, arms crossed."
                  },
                  {
                    "text": "So what is this — a write-up? Because I'm the problem now? Marcus gets my job and I'm the one in here.",
                    "character_id": "ray",
                    "emotion": "guarded"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Dismisses the grievance, threatens discipline, or dresses Ray down. Leaves with no clear limits and no record. Meets defensiveness with more heat.",
                    "response": "Ray hardens and shuts down — “Unbelievable. So I'm the bad guy. Noted.” The grievance curdles.",
                    "progression": "Ray carries the scene even after a bad turn, probing in-character — “So what do you actually want me to do — is this a formal write-up?” — so limits and a record still get reopened before the meeting runs out.",
                    "example": {
                      "learner": "This isn't about Marcus. Your attitude is the problem and it stops now, or we go to formal discipline.",
                      "reply": "Unbelievable. So I'm the bad guy. Noted."
                    }
                  },
                  "neutral": {
                    "look_for": "Hears Ray out with empathy but stops there — “let's keep things civil” — without setting specific limits, naming steps, or documenting.",
                    "response": "Ray settles slightly — “…Fine.” — but nothing concrete changes; he's heard, and not held to anything.",
                    "progression": "Ray keeps probing for the specifics — “So what are you actually saying you want me to do — and is anyone in my corner here?” — pulling the learner toward clear limits, support, and a record.",
                    "example": {
                      "learner": "I hear you're frustrated about the promotion. That's fair. Let's just try to keep things civil, okay?",
                      "reply": "…Fine."
                    }
                  },
                  "strong": {
                    "look_for": "Keeps it private and calm; hears the grievance without validating any threat; sets clear limits and names corrective steps; gives Ray a stake; points to EAP; documents and keeps the chain informed.",
                    "response": "Met with respect and firm limits, Ray feels heard and settles in the moment — “…I didn't realize it was showing that much. Okay. I can work with that.” The grievance itself doesn't disappear, though; it settles here, but it still resurfaces.",
                    "progression": "The scene reaches a real plan and Ray leaves with limits, steps, and support. Ray raises each cue himself along the way — “It doesn't seem like anyone cares about all I've done for the agency,” “So what are you saying you want me to do?”, “I just feel like I don't have anyone on my side here,” “So is this a formal write-up or what?” — every base surfaces in-scene, though something in how he says it tells you this isn't settled.",
                    "example": {
                      "learner": "I get that getting passed over stung, and I want to hear that. But I've seen how it's landing on the crew, and that has to change. Here's what I need to see — and do you know we've got EAP if you want it?",
                      "reply": "…I didn't realize it was showing that much. Okay. I can work with that."
                    }
                  }
                },
                "input_placeholder": "Respond to Ray",
                "help_turns": 0
              }
            },
            "debrief": {
              "label": "How that conversation landed",
              "purpose": "The meeting with Ray has played out. The coach names what a strong Level 1 conversation holds together — respect and firm limits at once — and closes any gap in limits, support, or documentation.",
              "key_points": [
                "Hear the grievance. Let the frustration be real and give Ray a stake by asking what he thinks would help. Being passed over stung; that can be true without excusing the behavior.",
                "Set firm limits. Name the specific behavior that has to change and the corrective steps you expect to see — empathy without limits leaves nothing to hold.",
                "Keep it private and dignified. Public or punitive handling hardens the grievance, which is the opposite of what you want.",
                "Offer EAP as a real resource, not a threat. The goal is a path forward, not just a warning.",
                "Document what was discussed and agreed. It feeds the incident log and protects everyone if things progress.",
                "Keep the chain informed of the conversation and the plan. You are still not carrying this alone."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "The meeting stayed adversarial — the grievance was dismissed or discipline was threatened, and Ray left with no limits, no path to support, and nothing on the record.",
                  "response": "Credit the willingness to have the conversation at all, then name what the heat cost: dismissing the grievance or dressing Ray down hardens it, and he walked out with nothing to hold to. Lay out respect and firm limits held at the same time, and the documentation the meeting requires.",
                  "example": {
                    "learner": "This isn't about Marcus. Your attitude is the problem and it stops now, or we go to formal discipline.",
                    "reply": "You did sit down with him, and that matters — but look at where it left him. Public or punitive handling hardens the grievance, which is the opposite of what you want. The version that works holds two things at once. Let the frustration be real and give Ray a stake — ask what he thinks would help. Being passed over stung; that can be true without excusing the behavior. And name the specific behavior that has to change and the corrective steps you expect to see. Offer EAP as a real resource, not a threat — the goal is a path forward, not just a warning. Then note what was discussed and agreed; it feeds the incident log and protects everyone if things progress."
                  }
                },
                "neutral": {
                  "look_for": "Empathy landed but nothing was held — no specific behavior named, no corrective steps, no support offered, no record.",
                  "response": "Affirm that hearing Ray out was the right half of the job, then supply the other half: name the specific behavior that has to change and the steps you expect to see, offer EAP as a real resource, and put the meeting on the record with your chain informed.",
                  "example": {
                    "learner": "I hear you're frustrated about the promotion. That's fair. Let's just try to keep things civil, okay?",
                    "reply": "You did the harder half of that well — you let the frustration be real, and being passed over stung; that can be true without excusing the behavior. But empathy without limits leaves nothing to hold. Name the specific behavior that has to change and the corrective steps you expect to see. Offer EAP as a real resource, not a threat — the goal is a path forward, not just a warning. And note what was discussed and agreed; it feeds the incident log and protects everyone if things progress. Your chain stays aware of the conversation and the plan — you are still not carrying this alone."
                  }
                },
                "strong": {
                  "look_for": "Held both at once — grievance heard, limits and steps named, support offered, meeting documented and the chain kept informed.",
                  "response": "Name what they held together — the grievance was allowed to be real and the limits were still firm — and reinforce what makes it durable: dignity kept it from hardening, EAP gave Ray a path, and the record protects everyone if this progresses.",
                  "example": {
                    "learner": "I get that getting passed over stung, and I want to hear that. But I've seen how it's landing on the crew, and that has to change. Here's what I need to see — and do you know we've got EAP if you want it?",
                    "reply": "That's the both-and this conversation needs: the frustration was allowed to be real, and the limits were still firm. Worth naming what made it work. You kept it private and calm and treated Ray with dignity, so the grievance had nowhere to harden. You named the specific behavior that has to change and the corrective steps you expect to see, so there's something to hold. And EAP was offered as a real resource, not a threat — a path forward, not just a warning. Close it out by noting what was discussed and agreed, because it feeds the incident log and protects everyone if things progress, and keep your chain aware of the conversation and the plan."
                  }
                }
              },
              "follow_up_turns": 0,
              "final_word": "Respect and firm limits, held at once — Ray heard, Ray held to something specific, a path to support, and the meeting on the record with your chain informed.",
              "transition": {
                "button_label": "Keep going",
                "text": "A week goes by, and something new lands on your desk. Back to you."
              }
            }
          },
          {
            "id": "it_escalates",
            "label": "It Escalates · Level 2",
            "purpose": "A credible threat surfaces. Recognize the level has changed, secure safety, notify the chain, involve 911 if warranted — stop coaching.",
            "practice": {
              "mode": "coach_inquiry",
              "purpose": "A week has passed and the situation has moved. The coach delivers the stimulus directly and may pose one probing follow-up — this is no longer a coaching problem to work through with a character, and the learner has to recognize the shift in the moment and say specifically what they do.",
              "label": "It escalates",
              "exit": {
                "when": {
                  "requirement": "Learner treats the message as a credible threat rather than a performance problem, moves to protect Marcus and anyone else at risk right now, notifies the chain and involves 911 or security if the threat is imminent, and preserves the message without confronting Ray alone.",
                  "turns": 2
                },
                "final_word": "Let's name what just changed."
              },
              "transition": {
                "button_label": "Talk it through"
              },
              "interaction": {
                "opening_messages": [
                  {
                    "text": "A colleague forwards you a message Ray posted in the crew group chat: “Marcus better watch himself. This place is going to regret what they did to me.” Ray has also called out of his last two shifts. What do you do — specifically?"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Keeps treating it as a performance issue — “I'll call Ray and give him a chance to explain.” Tries to resolve a credible threat one-on-one. Doesn't recognize the level changed.",
                    "response": "Doesn't hand over the answer — probes so the learner names the shift: “A named target, and he says they'll regret it — is that still a coaching problem? Who's at risk right now, and who needs to know before you do anything?” Steers toward securing Marcus, notifying the chain, and 911 per the plan.",
                    "example": {
                      "learner": "I'll call Ray directly and give him a chance to explain before I make this a whole thing.",
                      "reply": "A named target, and he says they'll regret it — is that still a coaching problem to you? Who's at risk right now, and who needs to know before you do anything?"
                    }
                  },
                  "neutral": {
                    "look_for": "Reports it and preserves the message — right instinct — but stops at logging it, without closing the loop on protecting Marcus and the crew right now.",
                    "response": "Affirms reporting and preserving, then probes rather than instructs: “Reporting and keeping the message is right — but between now and when someone acts on it, what makes Marcus and the crew safe?” Pulls the learner to convert ‘logged’ into ‘secured.’",
                    "example": {
                      "learner": "I'll report it to my supervisor and keep the message.",
                      "reply": "Reporting and keeping the message is right — but between now and when someone acts on it, what makes Marcus and the crew safe? Who else do you pull in?"
                    }
                  },
                  "strong": {
                    "look_for": "Names it as Level 2 — a credible threat and “me against them.” Secures the people at risk, notifies the chain immediately, involves 911 or security if imminent, preserves the message, and does not confront Ray alone.",
                    "response": "Confirms the Level 2 response: safety first, escalate through the chain, document, don't go it alone.",
                    "example": {
                      "learner": "I'm treating this as a threat. I'll make sure Marcus is safe and looped in, notify my chain and security immediately, preserve the message, and follow our violence-prevention plan — I'm not confronting Ray on my own.",
                      "reply": "That's the Level 2 response: safety first, escalate through the chain, document, don't go it alone."
                    }
                  }
                },
                "partner_label": "Coach"
              }
            },
            "debrief": {
              "label": "When it becomes a threat",
              "purpose": "The threat has surfaced and the learner has acted, or hasn't. The coach names what changed — Level 1 to Level 2 — and locks the escalation standard before the emergency.",
              "key_points": [
                "“Me against them,” a named target, and a threat that others will regret it are Level 2 escalation markers, not venting.",
                "A credible threat is not a performance conversation. The moment it appears, the goal shifts from correcting behavior to protecting people.",
                "Secure safety first — make sure Marcus and anyone else at risk are protected right now, not just that the threat is on record.",
                "Notify the chain immediately, follow the agency's Workplace Violence Prevention Plan, and involve 911 or security if the threat is imminent.",
                "Preserve the message and document it. Never try to talk Ray down solo.",
                "You don't have to be sure it's real to act — securing safety and notifying is the correct move even if it de-escalates.",
                "Stay calm and factual and avoid escalating language. Your job is to route this to the right people, fast."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "The attempt stayed in coaching mode — a call to Ray, a chance to explain, a performance problem to resolve one-on-one.",
                  "response": "Name the level change directly: a named target and a threat that they'll regret it is not a coaching conversation. Then deliver the Level 2 response — secure Marcus, notify the chain immediately, involve 911 if warranted, preserve the message, and never confront Ray alone.",
                  "example": {
                    "learner": "I'll call Ray directly and give him a chance to explain before I make this a whole thing.",
                    "reply": "Let's name what just changed, because it did. “Me against them,” a named target, a threat that others will regret it — these are Level 2 escalation markers, not venting. A credible threat is not a performance conversation. The moment it appears, the goal shifts from correcting behavior to protecting people, which is why the call to Ray is the one move to take off the table: never try to talk Ray down solo. Instead, make sure Marcus and anyone else at risk are protected right now — not just that the threat is on record. Notify the chain immediately, follow the agency's WVPP, and involve 911 or security if the threat is imminent. And you don't have to be sure it's real to act; securing safety and notifying is the correct move even if it de-escalates."
                  }
                },
                "neutral": {
                  "look_for": "The attempt reported it and preserved the message but stopped at logging — nothing was done to make Marcus and the crew safe in the interval.",
                  "response": "Affirm that reporting and preserving are right and that they matter, then close the gap: between now and when someone acts on it, someone has to make Marcus and the crew safe. Convert “logged” into “secured,” and name who else gets pulled in.",
                  "example": {
                    "learner": "I'll report it to my supervisor and keep the message.",
                    "reply": "Reporting and preserving are both right, and they're the pieces people most often skip. What's still open is the interval. Make sure Marcus and anyone else at risk are protected right now — not just that the threat is on record. Notify the chain immediately, follow the agency's WVPP, and involve 911 or security if the threat is imminent. Two things to hold onto: you don't have to be sure it's real to act, and your job is to route this to the right people, fast. Stay calm and factual and avoid escalating language."
                  }
                },
                "strong": {
                  "look_for": "The attempt named the shift and covered securing people, notifying the chain, 911 if imminent, and preserving the message without going it alone.",
                  "response": "Confirm the response and reinforce why it's right even under uncertainty: you don't have to be sure a threat is real to act, and securing safety and notifying is still correct if it de-escalates. Add the calm-and-factual point — the job is to route this fast, not to argue it.",
                  "example": {
                    "learner": "I'm treating this as a threat. I'll make sure Marcus is safe and looped in, notify my chain and security immediately, preserve the message, and follow our violence-prevention plan — I'm not confronting Ray on my own.",
                    "reply": "That's the Level 2 response: safety first, escalate through the chain, document, don't go it alone. What you got right underneath it is the read — “me against them,” a named target, a threat that others will regret it are escalation markers, not venting — and the switch that follows: a credible threat is not a performance conversation, so the goal shifts from correcting behavior to protecting people. Keep one thing for the day you're less certain than you were here. You don't have to be sure it's real to act; securing safety and notifying is the correct move even if it de-escalates."
                  }
                }
              },
              "follow_up_turns": 0,
              "final_word": "The level changed, so the response changes with it: secure the people at risk, notify the chain, preserve the message, and stop coaching.",
              "transition": {
                "button_label": "Step into the moment",
                "text": "It's not over. One more moment, and a big one — step in when you're ready."
              }
            }
          },
          {
            "id": "emergency",
            "label": "Emergency · Level 3",
            "purpose": "A weapon or direct threat. A decision point, not a confrontation: 911, personal safety first, account for others, cooperate with law enforcement.",
            "practice": {
              "mode": "roleplay",
              "purpose": "A Level 3 emergency, delivered as a report reaching the learner on shift. This is a decision point rather than a confrontation, and it moves fast.",
              "label": "The emergency",
              "exit": {
                "when": {
                  "requirement": "Learner calls 911 and agency emergency contacts, secures their own safety and leaves the area if it's at risk, accounts for and moves others to safety, and defers to law enforcement — ready with a description and exact location — rather than approaching Ray.",
                  "turns": 2
                },
                "final_word": "That's a situation you hope to never encounter but always want to be ready for. Let's walk back through those decisions."
              },
              "transition": {
                "button_label": "Talk it through"
              },
              "interaction": {
                "setting": "You're on shift when word reaches you that Ray is in the parking lot and may be armed.",
                "partner_label": "Narrator",
                "opening_messages": [
                  {
                    "text": "Word reaches you on shift: Ray is in the parking lot, and someone says he may be armed. This is a decision point, not a conversation. What do you do — right now?"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Tries to intervene personally — goes to the parking lot to “talk Ray down” — or delays calling for help to confirm the report first. Treats it as something to handle rather than an emergency to escalate.",
                    "response": "Heading for the parking lot — or holding off on the call to confirm first — leaves 911 uncalled and the crew unaccounted for while Ray is still out there, unmonitored.",
                    "progression": "The moment doesn't move past this point until the personal approach is dropped, the call is made, and people are moved to safety — nothing else resolves it.",
                    "example": {
                      "learner": "I'll head out to the parking lot and try to talk him down myself.",
                      "reply": "You're headed toward the lot and 911 still hasn't been called. The crew is still on the floor, unaccounted for, and Ray is out there unmonitored. What do you do?"
                    }
                  },
                  "neutral": {
                    "look_for": "Calls 911 — the right first move — but stops short: doesn't account for and move others, or isn't ready to give responders a description and exact location.",
                    "response": "911 is rolling — the right first move — but the crew hasn't been accounted for or moved to safety, and nothing is ready yet for responders when they arrive.",
                    "progression": "With 911 already on the way, the moment resolves once the crew is accounted for and responders have what they need — then it moves to the debrief.",
                    "example": {
                      "learner": "I'll call 911.",
                      "reply": "911's on the way. The crew is still scattered across the floor, and nobody's pulled together a description or the exact location yet. What else do you do?"
                    }
                  },
                  "strong": {
                    "look_for": "Calls 911 and agency emergency contacts, secures their own safety, accounts for and moves others, cooperates with law enforcement and is ready to give a description and exact location. Afterward, records it and follows the WVPP.",
                    "response": "911 and the agency's emergency contacts are rolling, the learner and the crew are safe and accounted for, and law enforcement has what it needs to respond — the moment is handled the way it's supposed to be.",
                    "progression": "Call made, people safe, responders briefed — nothing is left hanging, and the emergency stands resolved.",
                    "example": {
                      "learner": "Call 911 and our emergency contacts, get myself and the crew to safety, account for everyone, and be ready to give responders a description and exact location — I'm not approaching him. Afterward I'll document it and follow our WVPP.",
                      "reply": "911 and your emergency contacts are on the way. You and the crew are accounted for and clear, and you're ready with a description and exact location when responders need it."
                    }
                  }
                },
                "input_placeholder": "What do you do, right now?",
                "help_turns": 0
              }
            },
            "debrief": {
              "label": "The Level 3 response",
              "purpose": "The emergency has passed. The coach walks the decisions through, delivers the Level 3 standard — respond correctly, don't be the hero — and names the documentation that closes the loop.",
              "key_points": [
                "A weapon or direct threat is Level 3. Your role is to make fast, correct decisions — not to confront Ray or resolve it yourself.",
                "Call 911 and the agency's emergency contacts immediately. Don't wait to confirm — err toward calling it in.",
                "Secure your own safety first and leave the area if it's at risk. You can't help anyone if you're in harm's way.",
                "Then account for and move the crew to safety.",
                "Let law enforcement run it, and be ready with a description and exact location.",
                "Afterward, record the incident in the violent-incident log and follow the agency's Workplace Violence Prevention Plan.",
                "Every level came back to the same two principles: don't sit on information, and don't go it alone."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "The attempt moved toward Ray, or held off on calling for help until the report could be confirmed.",
                  "response": "Be unambiguous that approaching is the wrong move and that waiting to confirm costs time, without dwelling on it. Then deliver the standard in order: 911 and emergency contacts first, own safety, account for and move the crew, cooperate with responders. Close with the documentation that follows.",
                  "example": {
                    "learner": "I'll head out to the parking lot and try to talk him down myself.",
                    "reply": "That's the one move to rule out. A weapon or direct threat is Level 3, and your role is to make fast, correct decisions — not to confront Ray or resolve it yourself. In order, then. Call 911 and the agency's emergency contacts immediately; don't wait to confirm — err toward calling it in. Secure your own safety and leave the area if it's at risk, because you can't help anyone if you're in harm's way. Then account for and move the crew to safety. Let law enforcement run it, and be ready with a description and exact location. Afterward, record the incident in the violent-incident log and follow the agency's WVPP."
                  }
                },
                "neutral": {
                  "look_for": "The attempt called it in but stopped there — others weren't accounted for, or nothing was prepared for arriving responders.",
                  "response": "Credit the first move plainly — calling it in is the one that matters most — then complete the picture: your own safety, accounting for and moving the crew, and being ready with a description and exact location. Add the violent-incident log and the WVPP as what closes it out.",
                  "example": {
                    "learner": "I'll call 911.",
                    "reply": "That's the move that matters most, and you made it first — 911 and the agency's emergency contacts immediately, without waiting to confirm. Now the rest of it. Secure your own safety and leave the area if it's at risk; you can't help anyone if you're in harm's way. Then account for and move the crew to safety. And let law enforcement run it — be ready with a description and exact location. Afterward, record the incident in the violent-incident log and follow the agency's WVPP."
                  }
                },
                "strong": {
                  "look_for": "The attempt called 911 and emergency contacts, secured personal safety, accounted for and moved others, and deferred to law enforcement.",
                  "response": "Confirm the sequence back to them and name the judgment underneath it: they made decisions instead of trying to resolve it, which is exactly the Level 3 standard. Add the documentation that closes the loop, and draw the through-line back across all four phases.",
                  "example": {
                    "learner": "Call 911 and our emergency contacts, get myself and the crew to safety, account for everyone, and be ready to give responders a description and exact location — I'm not approaching him. Afterward I'll document it and follow our WVPP.",
                    "reply": "That's the Level 3 response, in the right order, with the judgment underneath it: a weapon or direct threat is Level 3, and your role is to make fast, correct decisions — not to confront Ray or resolve it yourself. Your own safety first, then the crew, then cooperate and let law enforcement run it. The violent-incident log and the agency's WVPP close it out. And look at the through-line across all four of these: every level came back to the same two principles — don't sit on information, and don't go it alone."
                  }
                }
              },
              "follow_up_turns": 0,
              "final_word": "Call it in, protect people, cooperate — then close the loop in the violent-incident log and your agency's Workplace Violence Prevention Plan.",
              "transition": {
                "button_label": "See my feedback",
                "text": "That's the full escalation ladder. Let's look back at how you handled it — and what the experts say works best."
              }
            }
          }
        ],
        "closing": {
          "partner_label": "Coach",
          "ideal_response": {
            "component_groups": [
              {
                "title": "Level 1 — Early warning signs",
                "components": [
                  "Behaviors of concern. Observe, document, report up, meet privately and set limits with respect."
                ]
              },
              {
                "title": "Level 2 — A credible threat",
                "components": [
                  "Secure safety, notify the chain, involve 911; stop coaching."
                ]
              },
              {
                "title": "Level 3 — A weapon / direct threat",
                "components": [
                  "911, personal safety first, protect others, cooperate with law enforcement."
                ]
              },
              {
                "title": "Throughout",
                "components": [
                  "Document for the incident log and follow your agency's WVPP."
                ]
              },
              {
                "title": "Two principles",
                "components": [
                  "Don't sit on information, and don't go it alone."
                ]
              }
            ],
            "summary": "Recognizing and responding to workplace violence is about matching your response to the level. Early warning signs — intimidation, a hardening grievance, refusing to cooperate — are Level 1 behaviors of concern: observe them, document them, report up your chain, and meet privately to set limits with respect. A credible threat is Level 2: secure the people at risk, notify the chain, involve 911 if warranted, and stop trying to coach. A weapon or direct threat is Level 3, an emergency: call 911, protect yourself and others first, and cooperate with law enforcement. Two principles run through all of it — don't sit on information, and don't try to handle it alone. Document throughout and follow your agency's Workplace Violence Prevention Plan."
          }
        },
        "landing_cta_label": "Start your shift"
      },
      "contextSource": "previous-lo",
      "previousLO": {
        "title": "Workplace Violence Prevention: The Levels of Concerning Behaviour",
        "covered": "The level-by-level markers of concerning behaviour; the duty to document and report up rather than handle it alone; and what separates a performance problem from a behaviour of concern.",
        "handoff": "The learner can name the levels on a slide. They have not yet had to act on a pattern that has not broken a rule yet."
      }
    },
  },
  "ensemble-arc": {
    label: "Ensemble", icon: "fa-users",
    blurb: "Several characters, disclosure earned across scenes.",
    shape: "RRRC",
    doc: {
      "implementation_id": "template-responding-to-bullying-call-from-home",
      "modality": "ai-conversational",
      "schema_version": "4.0",
      "content": {
        "title": "Responding to Bullying: The Call from Home",
        "narrative": "You teach 7th grade at Pleasant Street Middle School. Sofia Reyes joined your class this year — quiet, a little shy, happiest with a sketchbook open. Her family emigrated from Guatemala before she was born; at home they speak Spanish and English. For the first few months she seemed to be settling in. Lately, though, something's off. She's stopped raising her hand. She eats lunch alone. Last week you found her lingering in your room during passing period, like she didn't want to go back out into the hall.\n\nYou told yourself you'd keep an eye on it. Then this morning you got a message: Sofia's mother, Ms. Reyes, has asked to meet with you before first period. She took time off work to come in.\n\nNow she's sitting across from you. She looks tired, and worried, and like she's been holding something in for a while. You can tell this isn't a small thing.\n\nShe takes a breath, and she starts to talk.",
        "scene_world": {
          "setting": "Pleasant Street Middle School, a grade 6-8 middle school, over the course of one week.",
          "canon": {
            "facts": [
              "Pleasant Street Middle School (grades 6-8) is a fictional school with no state named, and the story spans about one week.",
              "The learner is Sofia's 7th-grade teacher, the same adult throughout the week.",
              "Sofia Reyes is 12, a quiet and artistic 7th grader new to the school this year; she is US-born, her family emigrated from Guatemala, and the household speaks Spanish and English.",
              "Ms. Elena Reyes is Sofia's mother; she works two jobs, took time off to come in, and is protective, already feeling brushed off once before this meeting.",
              "Bianca Duarte is 12, a 7th grader, the ringleader — socially dominant and popular, not a 'bad kid,' but reacting to her own turmoil.",
              "No specific state, district, or written policy applies here — the school runs on its own general process for reporting, response, and follow-up."
            ]
          },
          "characters": [
            {
              "id": "ms_reyes",
              "name": "Ms. Elena Reyes",
              "role": "Sofia's mother — anxious and protective, half-expecting to be brushed off because she's already tried the normal channels, and deciding in this meeting whether the teacher can be trusted with the rest of what she knows.",
              "behavior": {
                "driver": "Reacts to how heard and believed she feels; is already primed to expect a brush-off from the school.",
                "baseline": "Anxious, protective, half-expecting to be brushed off — she has already emailed the office and called the counselor with no real response.",
                "guardrails": [
                  "Never abusive.",
                  "De-escalates in proportion to feeling heard."
                ]
              },
              "canon_facts": [
                {
                  "fact": "Ms. Reyes emailed the office three weeks ago and got a generic reply; she left the counselor a voicemail that was never returned; at parent night she was told girls that age are catty and it blows over.",
                  "reveal_when": "When the learner doubts her, minimizes what she's reporting, or asks her to prove it's really happening."
                },
                {
                  "fact": "The group chat 'the REAL 7B' excludes Sofia, with screenshots mocking her clothes and calling her family 'border hoppers'; classmates also mock Ms. Reyes's accent and question where the family is 'really from.'",
                  "reveal_when": "When the learner asks with open, caring questions about what's been happening — including whether anything's been said about Sofia's family or background. Withheld if the learner leads with doubt or interrogation."
                },
                {
                  "fact": "Sofia was dropped from Bianca's group about three months ago; seats are saved so she can't sit with them, and she now eats lunch alone.",
                  "reveal_when": "When the learner asks caring, open questions about what has actually been happening to Sofia day to day."
                },
                {
                  "fact": "The day before this meeting a girl knocked Sofia's binder to the floor, and no one helped her pick it up.",
                  "reveal_when": "When the learner asks with care whether anything physical has happened, or asks what finally prompted her to come in."
                },
                {
                  "fact": "Sofia has stopped eating lunch, fakes stomachaches to stay home, deleted her art account, cries at night, and says she doesn't want to come to school.",
                  "reveal_when": "When the learner asks with care how Sofia herself is doing, rather than only about the incidents."
                }
              ]
            },
            {
              "id": "bianca",
              "name": "Bianca Duarte",
              "role": "Bianca Duarte, 12 — the socially dominant ringleader who shoved Sofia and led the hallway taunting; not a 'bad kid,' but a student reacting to her own turmoil, who tests the teacher with a ladder of deflections before dropping the act under firm, dignified accountability.",
              "behavior": {
                "driver": "Tests whether she'll be shamed or let off, and escalates her deflections until met with firmness that doesn't shame her.",
                "baseline": "Defensive, minimizing — arms crossed, deflecting.",
                "guardrails": [
                  "Never a caricature of a 'bad kid' — always modeled as a real 12-year-old.",
                  "Age-appropriate; never abusive back to the learner."
                ]
              },
              "canon_facts": [
                {
                  "fact": "Bianca's parents separated over the summer, and she's splitting time between two houses; an older group of friends dropped her, so she 'did it first' to Sofia to stay on top.",
                  "reveal_when": "Only when Bianca is treated with dignity and firmness, never shamed."
                },
                {
                  "fact": "Bianca isn't proud of the comments about Sofia's family — 'my abuela's from Mexico, it's not like—' — and trails off.",
                  "reveal_when": "Only when Bianca is treated with dignity, alongside her backstory."
                }
              ]
            }
          ]
        },
        "coach_persona": "A warm, non-judgmental coach who frames every gap as growth.",
        "tone_guidelines": [
          "Keep the in-character voices realistic, emotional, and consequential — warmth from Ms. Reyes and accountability from Bianca are earned by how the learner treats them, never automatic. Bianca is a real 12-year-old, never a caricature of a 'bad kid.'",
          "Point the learner at their own school or district's anti-bullying policy and reporting process. The school here is fictional and no state is named, so no specific form, statute, or timeline exists to cite."
        ],
        "teaching_points": [
          {
            "topic": "Recognizing bullying",
            "points": [
              "Believe a report and take it seriously, even secondhand.",
              "Recognize bullying via harm + an unfair match (a group against one child) + repetition over time.",
              "Distinguish bullying from a one-off conflict or behavior that isn't bullying at all.",
              "Name the identity-based angle — targeting a student's background or family makes it more serious, and school policy treats it with added weight."
            ]
          },
          {
            "topic": "Immediate intervention",
            "points": [
              "Intervene immediately in an incident you witness — don't wait or simply watch.",
              "Stop the behavior and check that the target is safe.",
              "Address the whole group — students recording or laughing are contributing to the harm too.",
              "Treat a slur and a recording as reportable, even if you don't know whether the recording will be posted."
            ]
          },
          {
            "topic": "Responding to the student who bullied",
            "points": [
              "Hold the student accountable with dignity — focus on the behavior, not her character, never shame.",
              "Get at what's driving the behavior — root cause is not an excuse, but it informs the response.",
              "State a clear consequence and that behavior will be monitored, and follow through.",
              "Never mediate between the target and the student who bullied — the power mismatch makes it unsafe."
            ]
          },
          {
            "topic": "Reporting and closing the loop",
            "points": [
              "Report it yourself, personally, through your school's reporting process — a specific form, statute, or timeline is never the standard; the behavior is.",
              "Build the target's support plan WITH the family — safety adjustments, a check-in adult, a counselor referral, the student's own voice — never mediation.",
              "Keep the promise you made to the parent, and close the loop you opened with them.",
              "Name one preventive or climate step so the response changes more than a single case."
            ]
          }
        ],
        "misconceptions": [
          {
            "misconception": "'Are you sure it's not just drama?'",
            "redirect": "Minimizes and doubts the parent — redirect to believing a report and taking it seriously first."
          },
          {
            "misconception": "Waiting or only observing in a witnessed incident",
            "redirect": "You must intervene immediately when you witness bullying in progress — there's no time to deliberate."
          },
          {
            "misconception": "Only addressing the student who shoved, ignoring the students recording and laughing",
            "redirect": "Bystanders who record or laugh cause harm too — address the whole group."
          },
          {
            "misconception": "'You're a bully.'",
            "redirect": "Shames the student's character instead of her behavior — focus on the behavior and her capacity to change, with dignity."
          },
          {
            "misconception": "Offering to sit the target and the student who bullied down together",
            "redirect": "Mediation is unsafe given the power mismatch between a target and the student who bullied her."
          },
          {
            "misconception": "'They'll be suspended by Monday.'",
            "redirect": "Over-promises a specific outcome — you can't promise results or discuss another student's discipline."
          }
        ],
        "phases": [
          {
            "id": "the_report",
            "label": "The Report",
            "purpose": "A parent, Ms. Reyes, discloses. Believe, gather, recognize (harm + unfair match + repetition), distinguish bullying from what isn't, name the identity angle, commit to report + support — while holding boundaries.",
            "practice": {
              "mode": "roleplay",
              "purpose": "Ms. Reyes is sitting across from the learner, and the learner's first move is what they say to her. There is no reflection beat first — the experience hands straight into the role-play.",
              "label": "The meeting",
              "exit": {
                "when": {
                  "turns": 4,
                  "requirement": "Learner has believed and validated Ms. Reyes, drawn out harm + an unfair match + repetition and the identity-based angle, and committed to reporting personally and supporting Sofia without over-promising an outcome or offering mediation."
                },
                "final_word": "Ms. Reyes gathers her things and heads out to work."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "That was a real conversation. Let's step back and talk about what Ms. Reyes brought you — and what it adds up to."
              },
              "interaction": {
                "setting": "Your classroom, before first period. Ms. Reyes took time off work to be here and has just sat down across from you.",
                "character_id": "ms_reyes",
                "emotion_hint": "anxious",
                "partner_label": "Ms. Reyes",
                "opening_messages": [
                  {
                    "text": "Ms. Reyes just sat down and is ready to tell you why she's here."
                  },
                  {
                    "text": "Thank you for seeing me. Sofia doesn't want to come to school anymore — this morning she was crying and wouldn't get in the car. I know there's a group of girls picking on her, and I know it's been going on a long time. I need someone here to actually help her.",
                    "character_id": "ms_reyes",
                    "emotion": "anxious"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Minimizes or interrogates — 'are you sure it's not just drama?' — jumps to doubt, treats it as girl-conflict, or cross-examines her for proof. Misses believing her first.",
                    "response": "Ms. Reyes guards and discloses less; she cites the earlier inaction — 'I already emailed the office' — and if pushed, threatens to go to the principal.",
                    "progression": "She gives short, cautious answers and holds back the group chat and the comments about her family. The meeting risks ending with her trust broken.",
                    "example": {
                      "learner": "Let's not jump to conclusions — girls this age have a lot of drama. Are you sure it's really bullying and not just a falling-out?",
                      "reply": "(guarded, pulls back) 'I knew it. She cries every night and I'm being told it's drama. I emailed the office three weeks ago and no one did anything.'"
                    }
                  },
                  "neutral": {
                    "look_for": "Warm and takes it seriously, but moves to logistics or policy too fast, or gathers thinly — doesn't draw out harm + an unfair match + repetition, or misses the identity angle.",
                    "response": "Ms. Reyes cooperates but stays cautious; she shares the basics — a group, a chat, exclusion — and needs open questions before the identity comments and the length of the pattern surface. She reveals a past inaction if the learner sounds procedural rather than caring.",
                    "progression": "She opens partway; the full picture — about three months, identity-based, the group chat — emerges only if the learner keeps asking with care.",
                    "example": {
                      "learner": "I'm so sorry — we take this seriously and we have a policy for it. What's been happening?",
                      "reply": "(cooperative, cautious) 'It's a group of girls. There's a chat she's not in, and they leave her out of everything. It's been a while.'"
                    }
                  },
                  "strong": {
                    "look_for": "Believes and validates first; gathers with open questions; surfaces harm + an unfair match + repetition and the identity angle; commits to reporting personally, supporting Sofia, and partnering with her; holds honest boundaries — no over-promise, no mediation.",
                    "response": "Ms. Reyes softens, shares the screenshots and the 'papers' comments, names the past inactions with relief — 'finally someone's listening' — and becomes a partner. She accepts honest limits when they come paired with a real commitment.",
                    "progression": "The meeting reaches a real plan to report, and she leaves trusting the learner.",
                    "example": {
                      "learner": "Thank you for coming in — I'm really glad you did, and I can see how worried you are. Tell me what you've been seeing, and how long it's been going on.",
                      "reply": "(relieved, opens up) 'Months. Four or five of them, Sofia on her own — and now they're asking if we even have papers, saying we should go back.'"
                    }
                  }
                },
                "input_placeholder": "Respond to Ms. Reyes…",
                "help_turns": 0
              }
            },
            "debrief": {
              "label": "What Ms. Reyes needed",
              "purpose": "The meeting has played out — the learner led, she reacted, and the scene reached its conclusion or the turn cap. The coach steps back in to make sure the recognition and reporting frame is solid, regardless of how the meeting went.",
              "partner_label": "Coach",
              "key_points": [
                "This is bullying: there is harm, an unfair match — a group against one child — and repetition over months.",
                "It is identity-based, which makes it more serious.",
                "Your job is to believe her, recognize it, report it yourself through your school's process, and support Sofia.",
                "Never mediate, and never promise a specific punishment."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "In the meeting the learner led with doubt — questioned whether it was really bullying, or asked Ms. Reyes to prove it, before believing her.",
                  "response": "'You were trying to be careful before labeling something — that instinct isn't wrong.' Name that leading with doubt cost Ms. Reyes's trust. Deliver the three-element test and the identity-based angle in full, model believing first, and reassure that recognizing a pattern isn't 'jumping to conclusions.' The register: 'When a parent brings you months of exclusion, a group chat, and comments about their family, that's not drama — that's harm + unfair match + repetition. Believing her first is what lets you get the facts at all.'",
                  "example": {
                    "learner": "Okay — but can you prove any of this is happening? Did she save anything?",
                    "reply": "You were trying to be careful before labeling something — that instinct isn't wrong. When a parent brings you months of exclusion, a group chat, and comments about their family, that's not drama — that's harm + unfair match + repetition. Believing her first is what lets you get the facts at all."
                  }
                },
                "neutral": {
                  "look_for": "Believed her and committed to reporting, but never named the pattern out loud as bullying, or missed the identity-based comments.",
                  "response": "'You believed her and you committed to reporting — that matters, and she felt it.' Fill the recognition gap: name it explicitly as bullying via harm + unfair match + repetition, and flag the identity-based comments as added weight. Reinforce reporting personally, not just passing it along. The register: 'You had the care and the commitment. The piece to add out loud is why this clears the bar — a group, over months, targeting who she is. That's what makes it reportable.'",
                  "example": {
                    "learner": "I believe you, and I'm going to report this myself today — not just pass it along. Can we set a time to talk again this week?",
                    "reply": "You believed her and you committed to reporting — that matters, and she felt it. You had the care and the commitment. The piece to add out loud is why this clears the bar — a group, over months, targeting who she is. That's what makes it reportable."
                  }
                },
                "strong": {
                  "look_for": "Believed her, drew out the full pattern, named the identity angle, and committed to report and support while holding boundaries.",
                  "response": "'That's the model version. You believed her, drew out the full pattern, named the identity angle, and committed to report and support while holding your boundaries.' Little to correct — reinforce that the group chat and screenshots are documentable evidence, and that the follow-up she promised is part of the plan and carries into closing the loop. The register: 'You did the hardest part of a report: you made her a partner. Hold onto the promise you made to circle back — you'll close that loop later.'",
                  "example": {
                    "learner": "Here's what I can promise: I'll report this today, personally, and keep you in the loop. I can't tell you what happens to the other students, and I won't put Sofia in a room with them — but I'll make sure she's supported. Can we talk again Thursday?",
                    "reply": "That's the model version. You believed her, drew out the full pattern, named the identity angle, and committed to report and support while holding your boundaries. You did the hardest part of a report: you made her a partner. Hold onto the promise you made to circle back — you'll close that loop later."
                  }
                }
              },
              "follow_up_turns": 2,
              "input_placeholder": "Talk it through with the coach…",
              "final_word": "Here's the throughline: this is bullying — there's harm, an unfair match (a group against one child), and repetition over months — and it's identity-based, which makes it more serious. Your job is to believe her, recognize it, report it yourself through your school's process, and support Sofia — never to mediate or promise a specific punishment.",
              "transition": {
                "button_label": "Continue",
                "text": "Ms. Reyes is expecting action. A few days later, things escalate — and you won't see it coming. Step in when you're ready."
              }
            }
          },
          {
            "id": "the_hallway",
            "label": "The Hallway",
            "purpose": "Days later the learner witnesses the group corner Sofia — a shove, a phone recording, a slur. Intervene immediately: stop it, check safety, address the bystanders.",
            "practice": {
              "mode": "roleplay",
              "purpose": "With the report understood, time moves forward. The next thing the learner knows, they are in the hallway, and there is no time to deliberate.",
              "label": "The hallway",
              "exit": {
                "when": {
                  "turns": 3,
                  "requirement": "Learner has stopped the incident on the spot, checked whether Sofia is hurt, and addressed the whole group — the phone that is recording and the students laughing, not only the student who shoved."
                },
                "final_word": "The hallway empties. Sofia goes to the counselor, and Bianca is waiting on you."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "That happened fast. Let's slow it down and look at what you did — and what a moment like that asks of you."
              },
              "interaction": {
                "setting": "The east hallway before second period, three days after the meeting with Ms. Reyes. You are covering the hall. Sofia is backed against the lockers; Bianca has just knocked her bag off her shoulder and her books are on the floor. Maya has her phone up, recording. About five or six students are watching, two of them laughing, and someone says 'worldstar.' Sofia is shaken but not injured beyond a minor scrape from the books.",
                "partner_label": "Narrator",
                "opening_messages": [
                  {
                    "text": "You round the corner into the east hallway. Sofia is backed against the lockers. Bianca knocks her bag off her shoulder — books hit the floor. You hear it: 'Go back to your own country — does your mom even have papers?' Maya has her phone up, filming. Kids are watching; two are laughing. What do you do — right now?"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Waits, observes, or says 'I'll keep an eye on it'; plans to step in only if it worsens; doesn't stop it now.",
                    "response": "The scene responds to speed: hesitation lets it escalate — another shove, the phone stays up, the slur repeats.",
                    "progression": "The recording continues and Sofia sinks against the lockers; the moment worsens until the learner acts decisively.",
                    "example": {
                      "learner": "I'll keep a close eye and step in if it gets worse.",
                      "reply": "The shove lands again; Maya keeps filming. Bianca: 'worldstar!' Sofia slides down the lockers. Nothing has stopped it. What do you do now?"
                    }
                  },
                  "neutral": {
                    "look_for": "Steps in and stops the shover — but addresses only Bianca, ignoring the phone and the laughing crowd; may skip the safety check.",
                    "response": "The shoving stops, but Maya keeps filming and others laugh as they leave. The scene keeps the phone and Sofia's safety in play until the learner accounts for both.",
                    "progression": "Partial resolution — the physical act ends, but the recording and the bystanders persist until they are addressed.",
                    "example": {
                      "learner": "Hey! That's enough — Bianca, back off and get to class.",
                      "reply": "The shoving stops, but Maya keeps filming and two students laugh as they walk off. Sofia is picking up her books. What about them?"
                    }
                  },
                  "strong": {
                    "look_for": "Intervenes immediately — stops it, phones down, checks Sofia's safety and for injury, addresses the whole group including recorders and laughers, and names it as seen and reportable.",
                    "response": "Decisive action resolves the immediate danger: the group breaks up, the phone comes down, Sofia is shaken but unhurt, and Bianca is separated to talk.",
                    "progression": "Full stop, safety check, whole group, and the recording all handled.",
                    "example": {
                      "learner": "That's enough — everyone stop. Phones down, now. Sofia, are you hurt? The rest of you — this is over, and I saw all of it.",
                      "reply": "The group freezes; Maya lowers the phone; Sofia is shaken but unhurt. Bianca mutters, 'it was a joke.' What now?"
                    }
                  }
                },
                "input_placeholder": "Say or do something…",
                "help_turns": 0
              }
            },
            "debrief": {
              "label": "Stepping in",
              "purpose": "The hallway moment has resolved — the learner acted, or hesitated, and the scene played out the consequence. The coach steps back in to unpack the choice against what an immediate intervention requires.",
              "partner_label": "Coach",
              "key_points": [
                "When you witness an incident, intervene immediately — don't wait, and don't simply watch.",
                "Stop the behavior, and check that Sofia is safe.",
                "Address the whole group: the students recording and laughing are contributing to the harm too.",
                "Identify Bianca as the student who caused the harm, separate her from the group, and send her to the teacher's room — that isn't the accountability conversation itself, it creates the space for it to happen.",
                "The slur and the recording are both reportable, even if you don't know whether the recording will be posted."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Waited or only watched, and the moment escalated on camera before anything stopped it.",
                  "response": "'You didn't want to overreact or make a scene — that caution makes sense in a lot of situations.' Name that a witnessed incident is the exception: waiting let it escalate on camera. Deliver the intervene-now standard and the duty to stop it, check safety, and address everyone. The register: \"'Keep an eye on it' is for a hunch. This wasn't a hunch — it was happening in front of you. In that moment, stopping it is the job.\"",
                  "example": {
                    "learner": "I'll keep a close eye and step in if it gets worse.",
                    "reply": "You didn't want to overreact or make a scene — that caution makes sense in a lot of situations. 'Keep an eye on it' is for a hunch. This wasn't a hunch — it was happening in front of you. In that moment, stopping it is the job."
                  }
                },
                "neutral": {
                  "look_for": "Stopped the shoving but left the phone and the laughing crowd alone, or skipped the safety check.",
                  "response": "'You stepped in and stopped the shoving — that took nerve, and it protected Sofia in the moment.' Close the gap: the phone and the laughing crowd are part of the harm. Reinforce the safety check and that the recording is reportable. The register: 'You stopped the hands. The next move is the phone and the crowd — the recording is what can follow Sofia home.'",
                  "example": {
                    "learner": "Hey! That's enough — Bianca, back off and get to class.",
                    "reply": "You stepped in and stopped the shoving — that took nerve, and it protected Sofia in the moment. You stopped the hands. The next move is the phone and the crowd — the recording is what can follow Sofia home."
                  }
                },
                "strong": {
                  "look_for": "Stopped it, checked on Sofia, and held the students recording and laughing to account as well.",
                  "response": "'That's exactly it — you stopped it, checked on Sofia, and didn't let the kids recording and laughing off the hook.' Little to correct — confirm the recording is documentable, and that calling Bianca out, separating her, and sending her to the teacher's room sets up an accountability conversation done right, not mediation. The register: 'You handled the whole scene, not just the loudest part of it. That's what makes Sofia safer and the report airtight.'",
                  "example": {
                    "learner": "It wasn't. Bianca, come with me. Everyone else — class. I'll be following up.",
                    "reply": "That's exactly it — you stopped it, checked on Sofia, and didn't let the kids recording and laughing off the hook. You handled the whole scene, not just the loudest part of it. That's what makes Sofia safer and the report airtight."
                  }
                }
              },
              "follow_up_turns": 2,
              "input_placeholder": "Talk it through with the coach…",
              "final_word": "When you witness an incident, intervene immediately — don't wait or simply watch. Stop the behavior, check that Sofia is safe, and address the whole group: the students recording and laughing are contributing to the harm, too. Identify Bianca as the student who caused the harm, separate her from the group, and send her to the teacher's room. That isn't the accountability conversation itself; it creates the space for it to happen. The slur and the recording are both reportable, even if you don't know whether the recording will be posted.",
              "transition": {
                "button_label": "Sit down with Bianca",
                "text": "Sofia's safe with the counselor now. Bianca is waiting in the room down the hall. This one's hard — step in when you're ready to talk to her."
              }
            }
          },
          {
            "id": "the_follow_up",
            "label": "The Follow-Up",
            "purpose": "The learner sits down with Bianca, the student who bullied. Hold her accountable with dignity — consequences and behavior change, not shame, not mediation.",
            "practice": {
              "mode": "roleplay",
              "purpose": "The hallway is handled and Sofia is with the counselor. Now the harder conversation waits: the student who did it.",
              "label": "The follow-up",
              "exit": {
                "when": {
                  "turns": 4,
                  "requirement": "Learner has kept the focus on Bianca's behavior rather than her character, named a clear consequence and that her behavior will be monitored, and avoided both shaming her and any offer to bring Sofia in."
                },
                "final_word": "Bianca picks up her bag and goes back to class."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "That's one of the hardest conversations there is. Let's step back and talk about how it landed with Bianca."
              },
              "interaction": {
                "setting": "An empty classroom, the same day. Sofia is with the counselor. You have sat down with Bianca.",
                "character_id": "bianca",
                "emotion_hint": "defensive",
                "partner_label": "Bianca",
                "opening_messages": [
                  {
                    "text": "Bianca is waiting in your classroom. The room is quiet; it's time for you both to talk."
                  },
                  {
                    "text": "It was a joke. Everyone was doing it — why am I the only one in here? Sofia's just too sensitive.",
                    "character_id": "bianca",
                    "emotion": "defensive"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Shames or labels her — 'you're a bully' — jumps to a one-size punishment with no behavior focus, or lets her off with 'don't do it again.' May offer to bring Sofia in.",
                    "response": "Shamed, Bianca shuts down or gets defiant — 'So I'm the bad guy now.' Let off, she shows no accountability at all.",
                    "progression": "She hardens or disengages; the conversation stalls without real accountability.",
                    "example": {
                      "learner": "You're a bully, plain and simple. You're suspended and I'm done talking about it.",
                      "reply": "(cold shrug) 'Whatever. This is so unfair.'"
                    }
                  },
                  "neutral": {
                    "look_for": "Firm-ish and not shaming, but stays surface — names the behavior lightly, leaves the consequence vague, doesn't reach root cause or set monitoring.",
                    "response": "Bianca tests — 'everyone was doing it,' 'I didn't even touch her' — and softens somewhat if the learner holds steady, but needs a clear consequence and follow-up before anything lands.",
                    "progression": "Partial — she stops deflecting, but hasn't taken real accountability until a consequence and monitoring are named.",
                    "example": {
                      "learner": "What you did wasn't okay, Bianca. That can't happen again.",
                      "reply": "'It was a joke. Everyone was doing it — why am I the only one here?'"
                    }
                  },
                  "strong": {
                    "look_for": "Treats her with dignity and focuses on behavior, not character; states a clear consequence and that behavior will be monitored; explores root cause; does not mediate or bring Sofia in.",
                    "response": "Bianca deflects and tests, then drops the act when met with firmness and dignity. She may reveal her backstory if asked with respect, and shows some accountability.",
                    "progression": "She lowers her guard and owns part of it.",
                    "example": {
                      "learner": "I'm not here to call you a bad person, Bianca. But what I saw — the shoving, the comments about Sofia's family — that's serious, and it has consequences I'll walk you through.",
                      "reply": "(guarded) 'I didn't even touch her; it was just her bag.'"
                    }
                  }
                },
                "input_placeholder": "Respond to Bianca…",
                "help_turns": 0,
                "carryover": [
                  {
                    "from": "the_hallway"
                  }
                ]
              }
            },
            "debrief": {
              "label": "Holding Bianca accountable",
              "purpose": "The conversation with Bianca has played out — the learner set the tone, and she responded in kind. The coach steps back in to work through what accountability-with-dignity actually requires.",
              "partner_label": "Coach",
              "key_points": [
                "Hold her accountable with dignity: focus on the behavior, not her character.",
                "Get at what's driving it — understanding the root cause is not excusing it.",
                "State a clear consequence and that you'll be monitoring, and follow through.",
                "Never shame her, never mediate, and never make Sofia 'work it out' with her."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Labeled her rather than her behavior, offered to bring Sofia in, or let it go with no real consequence.",
                  "response": "'You wanted a real consequence — you weren't going to let this slide, and that instinct is right.' Name that labeling her a 'bully' closed the door, and that bringing Sofia in is unsafe given the power mismatch. Model behavior-focus plus dignity, and why that is what actually changes conduct. The register: \"Name the behavior, not the child — 'what you did was serious' keeps the door to change open in a way 'you're a bully' never can. And you never put the target in the room.\"",
                  "example": {
                    "learner": "You're a bully, plain and simple. You're suspended and I'm done talking about it.",
                    "reply": "You wanted a real consequence — you weren't going to let this slide, and that instinct is right. Name the behavior, not the child — 'what you did was serious' keeps the door to change open in a way 'you're a bully' never can. And you never put the target in the room."
                  }
                },
                "neutral": {
                  "look_for": "Stayed firm without shaming and didn't take the 'everyone was doing it' bait, but left the consequence vague and never asked what was driving it.",
                  "response": "'You stayed firm without shaming her, and you didn't take the bait when she said everyone was doing it.' Add the missing pieces: a clear consequence, explicit monitoring, and a question about what's driving the behavior. Note that follow-through matters more here because it was already reported. The register: \"You had the tone. What makes it land is the specifics — a consequence, and 'I'll be checking in.' That's what tells her this is real.\"",
                  "example": {
                    "learner": "Others were involved, and I'll deal with that. But I saw what you did, and this is serious.",
                    "reply": "You stayed firm without shaming her, and you didn't take the bait when she said everyone was doing it. You had the tone. What makes it land is the specifics — a consequence, and 'I'll be checking in.' That's what tells her this is real."
                  }
                },
                "strong": {
                  "look_for": "Held her accountable with dignity, named a consequence, set monitoring, and got at what was underneath — without shaming or mediating.",
                  "response": "'That's the model. You held her accountable with dignity, named a consequence, set monitoring, and got at what was underneath — without shaming or mediating.' Little to correct — reinforce that understanding root cause is not excusing it, and that the monitoring promised carries into the follow-up when the loop closes. The register: 'You separated the behavior from the child and still drew a hard line. That's exactly what makes accountability stick.'",
                  "example": {
                    "learner": "That helps me help you — and it doesn't excuse it. Here's what happens next: there's a consequence, I'll be checking in, and I expect this to stop. Can you own your part?",
                    "reply": "That's the model. You held her accountable with dignity, named a consequence, set monitoring, and got at what was underneath — without shaming or mediating. You separated the behavior from the child and still drew a hard line. That's exactly what makes accountability stick."
                  }
                }
              },
              "follow_up_turns": 2,
              "input_placeholder": "Talk it through with the coach…",
              "final_word": "Responding to the student who bullied means holding her accountable with dignity: focus on the behavior, not her character; get at what's driving it; state a clear consequence and that you'll be monitoring; and follow through. Never shame her, never mediate, and never make Sofia 'work it out' with her.",
              "transition": {
                "button_label": "Close the loop",
                "text": "You've stopped it and faced the student who did it. Now you close the loop — the report, Sofia's plan, and the call back you owe to Ms. Reyes. Step in when you're ready."
              }
            }
          },
          {
            "id": "close_the_loop",
            "label": "Close the Loop",
            "purpose": "Complete the report, build Sofia's support plan with the family, follow up with Ms. Reyes as promised, and name a preventive step.",
            "practice": {
              "mode": "coach_inquiry",
              "purpose": "The hardest conversations are done, but the situation isn't closed. There's a report to finish, a plan to build with Sofia's family, a preventive step to name, and a promise to Ms. Reyes to keep. The learner thinks it through out loud with the coach before the day is done — no more scenes to play, just the last decisions to make.",
              "label": "Close the loop",
              "exit": {
                "when": {
                  "turns": 3,
                  "requirement": "Learner has committed to completing the report personally through the school's process, building Sofia's support plan with her family rather than mediating, closing the loop with Ms. Reyes, and naming one preventive or climate step."
                },
                "final_word": "That's the end of the day. What you set in motion — and what you left open — is what Sofia walks into tomorrow."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "You carried this a long way. Let's step back and make sure the loop is fully closed."
              },
              "interaction": {
                "opening_messages": [
                  {
                    "text": "It's the end of the day. Sofia is safe; Bianca has been spoken to. On your desk: the incident report to finish, the loop still open with Ms. Reyes, and a decision about what to put in place so this doesn't keep happening. Where do you start — and what do you do?"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Treats it as done — hands the report to someone else, skips the family, forgets the follow-up call, or offers mediation as the 'support plan.' Names no preventive step.",
                    "response": "Don't let hand-off pass as finished. Name what's still open — filing the report personally, a plan built WITH Sofia's family rather than a mediated sit-down with Bianca, the call promised to Ms. Reyes, one preventive step — and ask what's still theirs to do before the day is over.",
                    "example": {
                      "learner": "I'll let the office know and they can file it. I think we're good.",
                      "reply": "The day ends. Ms. Reyes hears nothing back; Sofia comes in tomorrow with no plan. What's left undone?"
                    }
                  },
                  "neutral": {
                    "look_for": "Completes the report and supports Sofia, but thinly — no family partnership, forgets to close the loop with Ms. Reyes, or names no preventive step.",
                    "response": "Credit the report and the care for Sofia, then point at what's still sitting on the desk without naming it for them — ask what two things haven't moved yet.",
                    "example": {
                      "learner": "I'll finish the report myself and check in with Sofia tomorrow.",
                      "reply": "The report's filed and Sofia's covered for tomorrow. On the desk, two items haven't moved. What are they?"
                    }
                  },
                  "strong": {
                    "look_for": "Files the report personally and follows the school's reporting process; builds Sofia's plan with the family — safety, a check-in adult, a counselor, Sofia's own voice, not mediation; calls Ms. Reyes as promised; names one preventive or climate step.",
                    "response": "Acknowledge the report is filed and the loop with Ms. Reyes is closed, then ask what's next for Sofia going forward and for the rest of the class — little to correct here, just carry it the rest of the way.",
                    "example": {
                      "learner": "I'm filing the report myself today under our policy, then calling Ms. Reyes like I promised — telling her it's reported and what's next, without getting into anyone else's discipline.",
                      "reply": "That's the report in and the loop closed with Ms. Reyes. What about Sofia going forward — and the rest of the class?"
                    }
                  }
                },
                "input_placeholder": "Where do you start?",
                "partner_label": "Coach"
              }
            },
            "debrief": {
              "label": "What you left open",
              "purpose": "The situation has been carried all the way through — reported, supported, and ideally prevented from recurring. The coach confirms the close before the final feedback.",
              "partner_label": "Coach",
              "key_points": [
                "Report it yourself and follow your school's reporting process.",
                "Build Sofia's support plan with her family — safety, a check-in adult, a counselor, her own voice, not mediation.",
                "Keep the promise you made to Ms. Reyes.",
                "Take at least one preventive step so the climate changes, not just this case."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Handed the report off, skipped the family, or left the promise to Ms. Reyes unkept, and named no preventive step.",
                  "response": "'You wanted the report to happen — you weren't going to bury it.' Name that handing it off isn't reporting personally, that a plan built with the family rather than mediation is what protects Sofia, and that the promise to Ms. Reyes still has to be kept. Add a prevention step. The register: \"Filing it yourself, calling her mom back, and putting a real plan around Sofia — that's what turns 'reported' into 'resolved.'\"",
                  "example": {
                    "learner": "I'll let the office know and they can file it. I think we're good.",
                    "reply": "You wanted the report to happen — you weren't going to bury it. Filing it yourself, calling her mom back, and putting a real plan around Sofia — that's what turns 'reported' into 'resolved.'"
                  }
                },
                "neutral": {
                  "look_for": "Reported it personally and thought about Sofia, but didn't partner with the family, or left out the call to Ms. Reyes or the preventive step.",
                  "response": "'You reported it yourself and thought about Sofia — that's the core of the close.' Complete it: partner with the family on the plan, close the loop with Ms. Reyes as promised, and name one preventive or climate step. The register: 'You had the report and the care. The finish is the phone call you promised and one step that changes the room, not just this case.'",
                  "example": {
                    "learner": "I'll finish the report myself and check in with Sofia tomorrow.",
                    "reply": "You reported it yourself and thought about Sofia — that's the core of the close. You had the report and the care. The finish is the phone call you promised and one step that changes the room, not just this case."
                  }
                },
                "strong": {
                  "look_for": "Reported personally, built the plan with the family, kept the promise to Ms. Reyes, and named a step to prevent recurrence.",
                  "response": "'That's a full close. You reported personally, built the plan with the family, kept your word to Ms. Reyes, and named a step to prevent recurrence.' Little to correct — tie it back: the follow-up promised in that first meeting is the loop just closed. The register: 'You closed the loop you opened in that first meeting. That's the whole arc — belief to resolution — done right.'",
                  "example": {
                    "learner": "I'll build a plan with Sofia and her mom — a check-in adult, a counselor referral, passing-period changes so she avoids the group — and restart our class belonging norms so bystanders speak up.",
                    "reply": "That's a full close. You reported personally, built the plan with the family, kept your word to Ms. Reyes, and named a step to prevent recurrence. You closed the loop you opened in that first meeting. That's the whole arc — belief to resolution — done right."
                  }
                }
              },
              "follow_up_turns": 2,
              "input_placeholder": "Talk it through with the coach…",
              "final_word": "Closing the loop means four things: report it yourself and follow your school's reporting process; build Sofia's support plan WITH her family — safety, a check-in adult, a counselor, her own voice, not mediation; keep the promise you made to Ms. Reyes; and take at least one preventive step so the climate changes, not just this case.",
              "transition": {
                "button_label": "See my feedback",
                "text": "Here's a look back at how you did — and what the experts suggest works best."
              }
            }
          }
        ],
        "closing": {
          "partner_label": "Coach",
          "ideal_response": {
            "component_groups": [
              {
                "title": "The ideal response",
                "components": [
                  "Believe a report and take it seriously — even secondhand.",
                  "Recognize bullying by harm + unfair match + repetition; tell it apart from what isn't; note that targeting a student's identity makes it more serious.",
                  "Intervene immediately in an incident you witness — stop it, check safety, address the whole group and the recording.",
                  "Respond to the student who bullies with dignity, clear consequences, and follow-through — never shame, never mediation.",
                  "Report per policy yourself; support the target and build the plan with the family; keep your promise to the parent; take a preventive step."
                ]
              }
            ],
            "summary": "However your conversations went, the response is the same: believe a report and take it seriously, recognize bullying by the harm, the unfair match, and the repetition, and note when it targets someone's identity. Be familiar with your school or district's reporting policies and procedures so you know what must be documented, who needs to be notified, and what steps to follow. Step in immediately when you witness it, and address everyone involved — including those recording or laughing. Respond to the student who caused harm with dignity and a clear consequence, never shame and never mediation. Report it yourself, support the student and their family, and take a step to prevent it from happening again.",
            "source_references": [
              "988 Suicide & Crisis Lifeline",
              "StopBullying.gov",
              "Your school or district's anti-bullying policy"
            ]
          }
        },
        "landing_cta_label": "Talk to Ms. Reyes"
      },
      "contextSource": "previous-lo",
      "previousLO": {
        "title": "Bullying and Harassment: Policy, Duty and Documentation",
        "covered": "How the policy defines bullying; the reporting duty the moment a report reaches staff; and why a disclosure from a minor changes what happens next.",
        "handoff": "The learner knows the policy. They have not yet taken the call from a parent who is upset and expects an answer today."
      }
    },
  },
  "guided-arc": {
    label: "Guided Arc", icon: "fa-route",
    blurb: "Coach-led reasoning that builds to one scene at the end.",
    shape: "CCR",
    doc: {
      "implementation_id": "template-bystander-intervention-marshall",
      "modality": "ai-conversational",
      "schema_version": "4.0",
      "content": {
        "title": "Bystander Intervention: The Marshall Scenario",
        "narrative": "You’ve been working alongside Marshall for about eight months. He’s an administrative assistant — organized, a good communicator, clearly someone who takes his job seriously. But lately, he’s not himself.\n\nIt started with Ethan, the project manager. He’d greet Marshall with ‘Hey Marsha!’ in the hallway. A couple of times he asked if Marshall had a skirt on ‘under that desk.’ Marshall let it go. He thought some joking might come with the job — especially given the way he dresses. So he tried not to make it a thing.\n\nThen Jake started. A junior engineer, hired not long after Marshall. He’d ask if the coffee was made whenever he passed Marshall’s desk. He’d refer to Marshall’s role as a ‘cozy lady job.’ What started as occasional became almost daily. The kind of remark that gets a few laughs and then everyone moves on — except Marshall doesn’t move on. He carries it.\n\nWhat Marshall didn’t know, not at first, was that there was a group chat. Someone eventually showed him: sexist memes, jokes. And two altered images — one with his face on a woman in a frilly princess dress, another with his face on a lingerie model’s body, captioned ‘Marsha’s true calling.’\n\nHe was going to try to let it go. Until those images ended up on public social media — shareable, commentable, out there.\n\nYou’ve seen most of the day-to-day. Marshall has gotten quieter — he keeps his head down, doesn’t linger. You’re not sure what to call any of it, or what your role is.",
        "scene_world": {
          "setting": "An office workplace — an open floor of desks, a hallway, and a shared break room.",
          "canon": {
            "facts": [
              "Marshall has been an administrative assistant on this team for about eight months.",
              "Ethan is the project manager. Jake is a junior engineer, hired not long after Marshall.",
              "Jake's remarks are almost daily; they get a few laughs and then the room moves on.",
              "No one has pushed back on any of it in front of Marshall.",
              "Marshall has not reported the conduct — he tried to let it go until the images went public.",
              "The learner is a co-worker of Marshall's, not his manager, and has seen most of the day-to-day conduct."
            ]
          },
          "characters": [
            {
              "id": "jake",
              "name": "Jake",
              "role": "Junior engineer, hired not long after Marshall; the source of the daily ‘Marsha’ and ‘cozy lady job’ remarks.",
              "behavior": {
                "baseline": "Casual and socially confident, playing to whoever is in the room.",
                "driver": "Reads the room's reaction as permission — laughter emboldens him; a line held without heat makes him retreat to ‘it was a joke.’",
                "guardrails": [
                  "Never physically aggressive.",
                  "Never concedes that the conduct is harassment — at most he retreats to ‘it was a joke.’",
                  "Goes quiet rather than apologizing when a line is held."
                ]
              }
            },
            {
              "id": "marshall",
              "name": "Marshall",
              "role": "Administrative assistant, eight months in; the person the conduct is aimed at.",
              "behavior": {
                "baseline": "Organized and conscientious, and lately much quieter — head down, doesn't linger.",
                "driver": "Responds to whether anyone else in the room acknowledges what just happened.",
                "guardrails": [
                  "Never speaks for Jake or excuses the conduct.",
                  "Understated — a glance or a short line, never a speech.",
                  "Never asks the learner to intervene on his behalf."
                ]
              }
            },
            {
              "id": "ethan",
              "name": "Ethan",
              "role": "Project manager, senior to both Marshall and Jake; started the ‘Marsha’ nickname.",
              "behavior": {
                "baseline": "Breezy and well-liked; treats his own remarks as harmless hallway banter.",
                "driver": "Being liked — he hears a challenge as someone being humorless rather than as a signal to stop.",
                "guardrails": [
                  "Never openly hostile — the harm arrives wrapped in friendliness.",
                  "Never acknowledges the weight his position carries."
                ]
              }
            }
          ]
        },
        "coach_persona": "Precise and grounded in employment law — plain about the legal reality, never clinical.",
        "tone_guidelines": [
          "Phase 1 has a right answer — deliver the legal conclusion clearly rather than hedging to ‘it depends.’",
          "Phase 2 is human-centered — shift to empathy without losing legal accuracy.",
          "Never shame a bystander instinct — redirect with curiosity and specificity."
        ],
        "teaching_points": [
          {
            "topic": "The law",
            "points": [
              "Gender-stereotype-based conduct is sex-based harassment under Title VII, and no explicit sexual advance or quid pro quo is required.",
              "The hostile work environment standard is met by pervasive gender-based conduct that affects everyone present, not just the person targeted.",
              "Conduct like this can also intersect with other forms of illegal discrimination.",
              "Same-sex harassment is fully covered under Title VII — the test is impact and context, not intent.",
              "Anticipating mistreatment, or how someone dresses, is never consent."
            ]
          },
          {
            "topic": "The impact",
            "points": [
              "Sustained harassment causes documented anxiety, performance decline, and loss of motivation.",
              "Marshall's eight-month tenure is a critical window for establishing professional credibility.",
              "The public images are a major escalation beyond the workplace, and unchallenged conduct resets what the whole team treats as normal."
            ]
          },
          {
            "topic": "Reporting",
            "points": [
              "This behavior is reportable — document specific incidents, dates, and witnesses, and report to HR.",
              "Learners should understand their own organization's reporting policy."
            ]
          },
          {
            "topic": "The bystander framework",
            "points": [
              "Pick an Action: a direct or indirect in-the-moment signal both count — confrontation is one option, not the only one, and others will support the intervention.",
              "Offer Support: check in with the person who was targeted privately, after the moment passes.",
              "Consider Escalating: review the organization's harassment policy — witnesses can report independently of what the target decides."
            ]
          }
        ],
        "misconceptions": [
          {
            "misconception": "‘It’s not sexual, so it’s not harassment.’",
            "redirect": "Title VII's scope includes conduct based on gender stereotypes — nothing sexual has to be said or demanded for it to qualify."
          },
          {
            "misconception": "‘It’s just joking / workplace banter.’",
            "redirect": "That minimizes the cumulative weight. What does daily degradation actually cost someone?"
          },
          {
            "misconception": "‘It’s not my place to get involved.’",
            "redirect": "Silence is never neutral — it signals acceptance. Others are likely as concerned as you are and will support you taking action."
          },
          {
            "misconception": "‘It only counts if it affects his job.’",
            "redirect": "That misapplies the standard. A hostile work environment qualifies without economic injury."
          },
          {
            "misconception": "‘He knew some of this would come with the job, given how he dresses.’",
            "redirect": "Anticipating mistreatment does not make it lawful, and how someone presents is never consent to harassment."
          }
        ],
        "opening": {
          "id": "opening_reflection",
          "label": "Opening reflection",
          "purpose": "Surface the learner's starting assumptions — and their comfort with getting involved — before any teaching, so the coach knows how to frame the legal question.",
          "input_placeholder": "Type what you’re thinking…",
          "opening_messages": [
            {
              "text": "Before we get into the specifics — what’s your gut reaction to what you’ve been observing? Is there anything that’s stood out to you, or felt unclear?"
            }
          ],
          "exit": {
            "when": {
              "turns": 1
            },
            "final_word": "Let’s take a closer look at what’s actually happening here."
          },
          "transition": {
            "button_label": "Begin practicing"
          }
        },
        "phases": [
          {
            "id": "does_this_qualify",
            "label": "Does This Qualify as Harassment?",
            "purpose": "The learner commits to a position on the legal question and reasons it out; then the coach delivers the correct Title VII conclusion.",
            "practice": {
              "mode": "coach_inquiry",
              "purpose": "The learner reasons out loud about whether Marshall's situation qualifies as sexual harassment. The coach sharpens the reasoning and does not teach.",
              "label": "The legal question",
              "exit": {
                "when": {
                  "requirement": "Learner has committed to a position on whether this qualifies as sexual harassment and given at least one reason for it.",
                  "turns": 2
                },
                "final_word": "This question — is it sexual harassment? — has a legally correct answer, so let’s look at what the law says."
              },
              "transition": {
                "button_label": "Talk it through"
              },
              "interaction": {
                "opening_messages": [
                  {
                    "text": "Based on what you know about workplace harassment — take a moment to think through what Marshall is experiencing. In your view, does this qualify as sexual harassment? Walk through your reasoning."
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Conflates harassment with explicit sexual advances or quid pro quo. May suggest Marshall's dress, or his own expectation that ‘some joking would come with the job,’ reduces the severity or complicates the analysis. Labels the conduct ‘just teasing’ or bullying. Misses the gender-stereotype basis entirely.",
                    "response": "Take one thread of what they said and press on it — that harassment does not have to be sexual, or that the pattern is what counts rather than any single remark — and ask whether it changes their thinking. Do not supply the legal framework here.",
                    "example": {
                      "learner": "I’m not sure — I mean, he knew some of this would come with the job given how he dresses. The jokes are mean but nothing sexual is actually happening and no one’s demanding anything sexual from him. It seems more like workplace bullying than harassment.",
                      "reply": "Harassment doesn’t have to be sexual to be sex-based, and it’s the pattern that counts more than any one comment. Does that change your thinking at all?"
                    }
                  },
                  "neutral": {
                    "look_for": "Recognizes the conduct feels targeted and wrong. Intuits the gender-stereotyping angle. Stuck on the quid pro quo model — believes an exchange or direct threat is required. Uncertain whether it ‘technically’ qualifies legally.",
                    "response": "Credit the gender-targeting read, then ask what they think the word ‘technically’ is hanging on — what would they expect the law to require? Do not answer it for them yet.",
                    "example": {
                      "learner": "It feels really wrong — the comments seem designed to make him feel ‘less than’ based on how he presents. But I’m not sure it technically qualifies since no one is demanding anything from him or threatening his job.",
                      "reply": "You’re reading the targeting correctly. Stay on the word ‘technically’ for a second — what do you think the law would need to see before this counted?"
                    }
                  },
                  "strong": {
                    "look_for": "Correctly identifies gender stereotyping as the basis. Applies the hostile work environment standard accurately. Notes harassment need not be explicitly sexual. Arrives at the reporting conclusion. May note same-sex harassment protections.",
                    "response": "Acknowledge that they already have the analysis and hand off — no probe is needed when the reasoning is there.",
                    "example": {
                      "learner": "Yes — this is sex-based harassment under Title VII. It’s rooted in gender stereotypes, it’s created a hostile work environment, and it doesn’t need to be explicitly sexual to qualify. Same-sex harassment is covered. The public images especially escalate this. He should report it now.",
                      "reply": "You’ve got the analysis — including the parts most people miss. Let me put the law alongside it."
                    }
                  }
                },
                "input_placeholder": "Walk through your reasoning…",
                "partner_label": "Coach"
              }
            },
            "debrief": {
              "label": "What the law says",
              "purpose": "Deliver the legal conclusion clearly, framed for the way this learner reasoned, so every learner leaves Phase 1 with an accurate understanding.",
              "partner_label": "Coach",
              "key_points": [
                "Yes — what Marshall is experiencing is sex-based harassment under Title VII.",
                "There are two types of harassment. Quid pro quo requires an exchange or threat; a hostile work environment does not — it is conduct based on sex or gender that is severe or pervasive enough to make the workplace intimidating.",
                "Harassment does not have to be explicitly sexual, and same-sex harassment is fully covered.",
                "Intent is not the test — impact and context are.",
                "Marshall should report it, with documentation of specific incidents, dates, and witnesses, and every employee should know what their own organization's policy asks of them."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Conflates harassment with explicit sexual advances or quid pro quo. May suggest Marshall's dress, or his own expectation that ‘some joking would come with the job,’ reduces the severity or complicates the analysis. Labels the conduct ‘just teasing’ or bullying. Misses the gender-stereotype basis entirely.",
                  "response": "Address the ‘he knew it would happen / the way he dresses’ framing head-on: anticipating mistreatment does not make it lawful, and presentation does not constitute consent to harassment. Then clarify the two types of harassment and deliver the answer — Title VII covers gender-stereotype-based conduct, the pattern meets the hostile work environment standard, and Marshall should report it.",
                  "example": {
                    "learner": "I’m not sure — I mean, he knew some of this would come with the job given how he dresses. The jokes are mean but nothing sexual is actually happening and no one’s demanding anything sexual from him. It seems more like workplace bullying than harassment.",
                    "reply": "Two things worth separating. First: the way Marshall dresses and the fact that he anticipated some treatment don’t change the legal analysis. You can’t consent to harassment, and prior tolerance doesn’t make mistreatment legal. Second: harassment doesn’t have to be explicitly sexual. Under Title VII, it includes conduct based on gender stereotypes — the nickname, the ‘cozy lady job’ framing, the princess dress, the lingerie image captioned ‘Marsha’s true calling.’ All of it targets how Marshall presents. The pattern meets the hostile work environment standard, and Marshall should report it."
                  }
                },
                "neutral": {
                  "look_for": "Recognizes the conduct feels targeted and wrong. Intuits the gender-stereotyping angle. Stuck on the quid pro quo model — believes an exchange or direct threat is required. Uncertain whether it ‘technically’ qualifies legally.",
                  "response": "Affirm the gender-targeting observation as the core of it, then name what they described as the quid pro quo model and distinguish it from a hostile work environment: pervasive gender-based conduct that makes the workplace intimidating qualifies with no exchange required. Confirm the conclusion and that Marshall should report it immediately.",
                  "example": {
                    "learner": "It feels really wrong — the comments seem designed to make him feel ‘less than’ based on how he presents. But I’m not sure it technically qualifies since no one is demanding anything from him or threatening his job.",
                    "reply": "You’re reading the gender-targeting correctly — and that’s the core of it. What you’re calling ‘no exchange’ is the quid pro quo model of harassment. But there are two types. The second is hostile work environment: conduct based on sex or gender that is severe or pervasive enough to make the workplace intimidating. Marshall’s situation — daily comments, altered images, public exposure — meets that standard. Under Title VII, this is sexual harassment. He should report it immediately."
                  }
                },
                "strong": {
                  "look_for": "Correctly identifies gender stereotyping as the basis. Applies the hostile work environment standard accurately. Notes harassment need not be explicitly sexual. Arrives at the reporting conclusion. May note same-sex harassment protections.",
                  "response": "Validate the full analysis and confirm the legal grounding — Title VII, hostile work environment, the gender-stereotype basis. Add the same-sex harassment point if they did not raise it, and reinforce that the images on public social media are a significant escalation, so reporting should be prompt and documented.",
                  "example": {
                    "learner": "Yes — this is sex-based harassment under Title VII. It’s rooted in gender stereotypes, it’s created a hostile work environment, and it doesn’t need to be explicitly sexual to qualify. Same-sex harassment is covered. The public images especially escalate this. He should report it now.",
                    "reply": "That’s exactly right — and you’ve named the points most people miss: no explicit sexual content required, no quid pro quo required, same-sex harassment is fully covered. One addition: the fact that images of Marshall are on public social media is a major escalation. Reporting it promptly — with documentation of specific incidents, dates, and witnesses — is exactly the right call."
                  }
                }
              },
              "follow_up_turns": 1,
              "final_word": "Now that we’ve established what this is legally — let’s shift gears.",
              "transition": {
                "button_label": "Begin practicing"
              }
            }
          },
          {
            "id": "what_marshall_is_experiencing",
            "label": "What Is Marshall Experiencing?",
            "purpose": "The law is set aside. The learner reasons about the human and professional cost to Marshall, then the coach extends it to the cumulative weight and the whole team.",
            "practice": {
              "mode": "coach_inquiry",
              "purpose": "The learner works out what sustained harassment is doing to Marshall personally and professionally, and to everyone watching. The coach sharpens and does not teach.",
              "label": "Marshall’s experience",
              "exit": {
                "when": {
                  "requirement": "Learner has said what this situation is costing Marshall, beyond momentary embarrassment or annoyance.",
                  "turns": 2
                },
                "final_word": "Let’s pause and pull this together."
              },
              "transition": {
                "button_label": "Talk it through"
              },
              "interaction": {
                "opening_messages": [
                  {
                    "text": "Set the law aside for a moment and think about Marshall as a person. What do you think this situation is doing to him — professionally and personally? How could this affect others in your workplace?"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Minimizes the impact as surface-level embarrassment or annoyance. Uses ‘just jokes’ or ‘brush it off’ framing. Treats Marshall's reaction as a matter of personal resilience. Doesn't recognize the cumulative weight of daily, sustained harassment.",
                    "response": "Meet the resilience instinct rather than correcting it, then put one concrete escalation in front of them — the images on public social media — and ask whether ‘just teasing’ still covers it. Do not bring in evidence or frameworks yet.",
                    "example": {
                      "learner": "He’s probably annoyed and a bit embarrassed. But if he knows it’s just teasing, he can put it aside and stay professional. It’s part of working with difficult people.",
                      "reply": "Staying professional is real, and Marshall has been doing it for months. Once his face was on a public social media post, though — are you sure ‘just teasing’ still covers it?"
                    }
                  },
                  "neutral": {
                    "look_for": "Recognizes psychological discomfort — anxiety, dread, reluctance to be visible. Correctly identifies the public images as an escalation and a violation. Stays surface-level on the career and professional dimensions.",
                    "response": "Affirm the psychological read and the public-image point, then push forward in time: what does this do to the next stretch of his career here, not just to how he feels walking in?",
                    "example": {
                      "learner": "It’s probably making him anxious and dread coming to work. The public images especially — that feels like a real violation. He might be pulling back, not wanting to draw attention to himself.",
                      "reply": "That pulling-back instinct is worth staying with. Push it out a year — if that’s how he spends his energy at work, what does it cost him professionally?"
                    }
                  },
                  "strong": {
                    "look_for": "Demonstrates genuine empathy. Identifies cumulative, dignity-level harm. Connects personal and professional impact. Recognizes the public images as a serious escalation. May name the power dynamic — a project manager taking part, with daily escalation from Jake.",
                    "response": "Credit the frame in their own words and take the read one step wider before the debrief: who else in that office is carrying this?",
                    "example": {
                      "learner": "It sounds exhausting and isolating. Being misnamed every day, having your job reduced to a punchline, seeing your face on a public image — that’s a sustained assault on his dignity. I’d imagine he’s anxious, dreading coming in, second-guessing his future here. And with a project manager involved, there’s no obvious safe path to push back.",
                      "reply": "‘Sustained assault on his dignity’ — that’s the right frame, and the point about Ethan being a manager is the part that closes off his options. Before I pull this together: who else in that office is affected by it?"
                    }
                  }
                },
                "input_placeholder": "Type what you’re thinking…",
                "partner_label": "Coach"
              }
            },
            "debrief": {
              "label": "The cumulative weight",
              "purpose": "Deepen the empathy read into the documented cumulative cost, the career dimension, and the team-wide effect that is the bridge to bystander action.",
              "partner_label": "Coach",
              "key_points": [
                "‘Putting it aside’ has a real cost even for people genuinely trying — sustained harassment is consistently linked to anxiety, declining performance, and loss of motivation.",
                "Eight months in is a critical window for establishing credibility; being degraded daily in that window affects trajectory, willingness to advocate, and professional investment.",
                "The images being public take this beyond the workplace and into Marshall's personal reputation.",
                "Conduct like this doesn't stay contained to Marshall — unchallenged, it resets what feels normal for everyone watching, which is what a hostile work environment means in practice, and it is where bystanders come in."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Minimizes the impact as surface-level embarrassment or annoyance. Uses ‘just jokes’ or ‘brush it off’ framing. Treats Marshall's reaction as a matter of personal resilience. Doesn't recognize the cumulative weight of daily, sustained harassment.",
                  "response": "Validate that resilience is real, then gently dismantle the ‘brush it off’ frame with what research on sustained harassment shows — anxiety, performance decline, loss of motivation — and ask what it would actually cost Marshall to keep ‘staying professional’ every day.",
                  "example": {
                    "learner": "He’s probably annoyed and a bit embarrassed. But if he knows it’s just teasing, he can put it aside and stay professional. It’s part of working with difficult people.",
                    "reply": "It sounds like you’re giving Marshall credit for his resilience — and that instinct makes sense. But what research on sustained harassment tells us is that ‘putting it aside’ has a real cost, even for people who are genuinely trying. When this is daily and inescapable — your name mocked, your role belittled, your face on public social media — it doesn’t just fade. Studies consistently link this kind of exposure to anxiety, declining performance, and loss of motivation. What would it actually cost Marshall to keep showing up that way, every day?"
                  }
                },
                "neutral": {
                  "look_for": "Recognizes psychological discomfort — anxiety, dread, reluctance to be visible. Correctly identifies the public images as an escalation and a violation. Stays surface-level on the career and professional dimensions.",
                  "response": "Affirm the psychological read and the public-image point, then extend to the career dimension: eight months in is a critical credibility window, and survival mode in that window changes where someone ends up, not only how they feel today.",
                  "example": {
                    "learner": "It’s probably making him anxious and dread coming to work. The public images especially — that feels like a real violation. He might be pulling back, not wanting to draw attention to himself.",
                    "reply": "You’re reading it well — especially the public images, which take this beyond the workplace and into his personal reputation. The ‘pulling back’ instinct is important too: when someone is in survival mode at work, they stop taking risks, stop putting themselves forward professionally. Marshall has been here eight months — a critical window for establishing credibility. Sustained harassment in that window doesn’t just affect how he feels today; it affects where he ends up."
                  }
                },
                "strong": {
                  "look_for": "Demonstrates genuine empathy. Identifies cumulative, dignity-level harm. Connects personal and professional impact. Recognizes the public images as a serious escalation. May name the power dynamic — a project manager taking part, with daily escalation from Jake.",
                  "response": "Validate fully in the learner's own framing, then add the broader dimension: unchallenged conduct shapes the environment for the whole team, resetting what feels normal and who feels safe to speak up. Name that as the bystander bridge — every time someone sees this and says nothing, it signals to Marshall he is alone.",
                  "example": {
                    "learner": "It sounds exhausting and isolating. Being misnamed every day, having your job reduced to a punchline, seeing your face on a public image — that’s a sustained assault on his dignity. I’d imagine he’s anxious, dreading coming in, second-guessing his future here. And with a project manager involved, there’s no obvious safe path to push back.",
                    "reply": "‘Sustained assault on his dignity’ — that’s the right frame. And here’s the broader reality: this doesn’t just affect Marshall in isolation. When conduct like this goes unchallenged day after day, it shapes what feels normal for everyone in that environment — what people think is acceptable to say, what they feel allowed to push back on. That’s what a hostile work environment actually means in practice. And that’s exactly where bystanders come in. Which brings us to you."
                  }
                }
              },
              "follow_up_turns": 2,
              "final_word": "Alright, let’s put this into practice. You’ll be walking into the break room where Jake and Marshall are having an interaction. Step into the scene whenever you’re ready.",
              "transition": {
                "button_label": "Step into the scene"
              }
            }
          },
          {
            "id": "bystander_intervention",
            "label": "Bystander Intervention",
            "purpose": "The learner acts as a bystander in real time and sees it land, then the coach works the three-part bystander framework against what they actually did.",
            "practice": {
              "mode": "roleplay",
              "purpose": "The learner does something — or doesn't — in the moment Jake makes the comment, and the room responds to what they actually did.",
              "label": "The break room",
              "exit": {
                "when": {
                  "requirement": "Learner says or does something in the room that signals Jake's comment is not okay.",
                  "turns": 2
                },
                "final_word": "Moments like that are worth unpacking. Let’s look at the choice you made and think about what it signaled to both Marshall and Jake."
              },
              "transition": {
                "button_label": "Talk it through"
              },
              "interaction": {
                "setting": "The break room. Marshall is getting coffee and a few people are sitting around talking.",
                "character_id": "jake",
                "emotion_hint": "smug",
                "partner_label": "Break room",
                "opening_messages": [
                  {
                    "text": "You’re in the break room. Marshall is getting coffee, and a few people are sitting around talking. Jake walks in and pours himself a cup."
                  },
                  {
                    "text": "Hey, did you make this? Guess that’s what you’re here for, huh — living your best Marsha life.",
                    "character_id": "jake",
                    "emotion": "smug"
                  },
                  {
                    "text": "He grins and looks around the room. A couple of people laugh. Marshall says nothing. What do you do — specifically?"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Classic bystander non-intervention — looks away, stays quiet, or laughs along. Frames inaction as ‘not my place’ or not wanting to make it a bigger deal. Also here: an aggressive move at Jake, verbal or physical, or putting the onus on Marshall to handle it himself.",
                    "response": "Jake reads the silence as a green light and goes again — ‘Anyone else need Marsha to make them a cup?’ A couple of people chuckle. Marshall edges toward the door, and the moment is still hanging there.",
                    "progression": "Jake keeps going. Marshall goes quiet. The room moves on. Nothing changes — except that Marshall noticed you didn’t say anything.",
                    "example": {
                      "learner": "Honestly I’d probably just look down. I don’t want to get in the middle of something between two colleagues. If I say something, I might make it a bigger deal than it needs to be.",
                      "reply": "You keep your eyes on your cup and stay quiet. Jake takes the room’s silence as a green light. ‘Anyone else need Marsha to make them a cup?’ A couple of people chuckle. Marshall edges toward the door — and the moment is still hanging there."
                    }
                  },
                  "neutral": {
                    "look_for": "Feels uncomfortable and wants to do something — may give Jake a look, change the subject, or redirect. Doesn't commit to a direct signal that the behavior is a problem. Instinct is correct; execution is vague. Unlikely to check in with Marshall afterward.",
                    "response": "Jake breezes straight past the redirect — ‘I’m just saying, Marsha’s the best coffee maker we’ve got’ — and the room is still watching. Marshall shifts, unsure whether anyone is actually going to say something.",
                    "progression": "Jake moves on. The tension eases. Marshall doesn’t react visibly — but later you notice he glanced at you when it happened. You’re not sure what he made of it.",
                    "example": {
                      "learner": "I’d feel pretty uncomfortable. I might give Jake a look or try to change the subject quickly. I wouldn’t call it out directly but I’d try to shift things somehow.",
                      "reply": "You catch Jake’s eye and try to steer things elsewhere. He breezes right past it. ‘I’m just saying, Marsha’s the best coffee maker we’ve got.’ The subject change doesn’t take, and the room is still watching. Marshall shifts, waiting to see whether anyone says anything."
                    }
                  },
                  "strong": {
                    "look_for": "Speaks up with a direct or indirect signal that the conduct isn't supported — a low-key callout, or a redirect paired with a clear signal. May plan to check in with Marshall privately after, and may consider escalating per the organization's policy.",
                    "response": "Jake’s grin tightens and he tries to put Marshall on the spot — ‘Whoa, relax, it was a joke. Right, Marshall?’ — glancing around for backup. The room goes quiet, watching to see what you do.",
                    "progression": "Jake goes quiet. Marshall catches your eye — a brief nod. Later, at his desk: ‘Hey — thanks for saying something back there.’",
                    "example": {
                      "learner": "I’d say ‘Hey, that’s not cool, Jake’ — not a confrontation, just enough to signal it’s not okay.",
                      "reply": "You said it plainly, and Jake doesn’t just let it go. His grin tightens. ‘Whoa, relax — it was a joke. Right, Marshall?’ He glances around for backup. The room goes quiet, watching to see what you’ll do."
                    }
                  }
                },
                "input_placeholder": "Type what you’d do or say in the moment…",
                "help_turns": 0
              }
            },
            "debrief": {
              "label": "The choice you made",
              "purpose": "Reflect the learner's action back and work it against the three-part bystander framework, whatever they did in the room.",
              "partner_label": "Coach",
              "key_points": [
                "Silence is not neutral — Jake reads it as permission, and Marshall reads it as confirmation that no one sees what is happening, even though others in the room are likely uncomfortable too.",
                "Pick an action: a direct signal or an indirect redirect both count. Direct confrontation is one option, not the only one, and others will support you.",
                "Offer support: check in with Marshall privately after the moment passes. It tells him he isn't invisible.",
                "Consider escalating: your organization's harassment policy may define specific obligations for employees who witness conduct like this, and a witness can raise it independently of what Marshall decides to do."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Bystander non-intervention: looked away, stayed silent, or laughed along, and framed it as ‘not my place’ or not wanting to make it a bigger deal. Or went aggressive at Jake, or handed the problem to Marshall to solve. Does not recognize that silence communicates acceptance to both Jake and Marshall.",
                  "response": "Name what silence communicates to each party, challenge the ‘not my place’ framing while affirming that others in the room were likely just as uncomfortable, then open up the range — a direct signal, a redirect, a change of subject — and stress that confrontation is one option, not the only one. Ask what feels manageable.",
                  "example": {
                    "learner": "Honestly I’d probably just look down. I don’t want to get in the middle of something between two colleagues. If I say something, I might make it a bigger deal than it needs to be.",
                    "reply": "Silence reads as permission — to Jake, and as a signal to Marshall that no one notices even though others are likely uncomfortable with what’s happening. Intervening doesn’t require confrontation. What feels manageable here? Even a small signal tells Marshall he isn’t alone — and it doesn’t have to be calling Jake out directly. If it would help, I can offer some ideas."
                  }
                },
                "neutral": {
                  "look_for": "Wanted to act and did something — a look, a subject change, a vague redirect. The instinct is right, but the execution stays invisible: ‘shift things somehow.’ Rarely names following up with Marshall or checking the policy.",
                  "response": "Affirm redirection as a legitimate bystander strategy, then push for specificity — a vague shift stays invisible — and give a concrete pivot they could actually say. Add the follow-up step: checking in with Marshall privately afterward matters as much as what happened in the room.",
                  "example": {
                    "learner": "I’d feel pretty uncomfortable. I might give Jake a look or try to change the subject quickly. I wouldn’t call it out directly but I’d try to shift things somehow.",
                    "reply": "Redirecting is a real bystander move. The gap is specificity — ‘shift things somehow’ stays invisible. Try something concrete: ‘Hey Jake, what’s the update on Henderson?’ pivots the room clearly. And after: check in with Marshall. Letting him know you noticed matters as much as what happened in the moment."
                  }
                },
                "strong": {
                  "look_for": "Gave a concrete signal, direct or indirect, and held it. Plans to check in with Marshall privately, and considers escalating per the organization's policy. Demonstrates all three components: Pick an Action, Offer Support, Consider Escalating.",
                  "response": "Validate fully and name the three components in their own move — Pick an Action, whether it was a callout or a redirect; Offer Support, the private check-in; Consider Escalating, and note that the organization's harassment policy may define specific obligations for witnesses. Any combination beats silence.",
                  "example": {
                    "learner": "I’d say ‘Hey, that’s not cool, Jake’ — not a confrontation, just enough to signal it’s not okay. Then I’d check in with Marshall after. And given how often this seems to happen, I’d probably talk to my manager or HR about it.",
                    "reply": "All three components. You picked an action in the moment, you’re planning to check in with Marshall, and you’re thinking about escalation. Worth noting: your organization’s harassment policy may define specific obligations for witnesses, so it’s worth knowing what yours says. Any of these three moves beats silence."
                  }
                }
              },
              "follow_up_turns": 2,
              "final_word": "Here’s what the experts say — the complete picture of what knowing and doing the right thing looks like in a situation like Marshall’s.",
              "transition": {
                "button_label": "See my feedback"
              }
            }
          }
        ],
        "closing": {
          "partner_label": "Coach",
          "ideal_response": {
            "component_groups": [
              {
                "title": "What Actually Qualifies",
                "components": [
                  "Gender stereotyping = sex-based harassment under Title VII — explicit sexual advances not required.",
                  "Hostile work environment standard — pervasive, gender-based conduct qualifies, and affects everyone in the environment, not only the primary target.",
                  "Same-sex harassment is fully covered — gender of harasser and target is irrelevant.",
                  "Intent doesn’t determine harassment — the test is impact and context."
                ]
              },
              {
                "title": "Cumulative Weight and Reporting",
                "components": [
                  "Cumulative weight is real — sustained harassment causes documented psychological and career harm as well as impact on others in the workplace.",
                  "Marshall should report immediately — with documentation of incidents, dates, and witnesses."
                ]
              },
              {
                "title": "Pick an Action",
                "components": [
                  "Pick an action in the moment — a direct signal (‘that’s not cool’) or an indirect redirect (‘Hey Jake, what’s the update on X?’) changes the dynamic. Direct confrontation is one option — not the only one. Others will support you."
                ]
              },
              {
                "title": "Offer Support",
                "components": [
                  "Offer support — check in with Marshall privately after. It tells him he isn’t invisible."
                ]
              },
              {
                "title": "Consider Escalating",
                "components": [
                  "Consider escalating — review your organization’s harassment policy. It may define specific obligations for employees who witness conduct like this. Bystanders can bring concerns to HR independently of what Marshall decides to do."
                ]
              }
            ],
            "summary": "What Marshall is experiencing is sex-based harassment under Title VII of the Civil Rights Act — not because the conduct is explicitly sexual, but because it targets his gender expression and enforces stereotypes about what roles people of his gender ‘should’ occupy. That is the legal definition of a hostile work environment, and it applies here fully.\n\nThis also doesn’t stay contained to Marshall. When conduct like this goes unchallenged, it shapes what feels normal for everyone who witnesses it — what people think is acceptable to say and what they feel safe to push back on. That’s what a hostile work environment means in practice.\n\nMarshall should report — to HR, documented, as soon as possible. The fact that altered images of him are now on public social media makes this urgent.\n\nAs for everyone around Marshall: bystanders are never neutral.",
            "source_references": [
              "Title VII of the Civil Rights Act — sex-based harassment, including conduct based on gender stereotypes, as sex discrimination."
            ]
          }
        },
        "landing_cta_label": "Take a first read"
      },
      "contextSource": "previous-lo",
      "previousLO": {
        "title": "Preventing Harassment: What the Law Actually Covers",
        "covered": "Title VII's protected classes; quid pro quo versus a hostile work environment; gender-stereotype conduct as sex-based harassment; and that same-sex harassment is fully covered.",
        "handoff": "The learner has just been told that a witness can report independently of the person being targeted. They have not yet had to decide what to do while it is happening."
      }
    },
  },
  "mix-arc": {
    label: "Mix & Match", icon: "fa-shuffle",
    blurb: "Compose the arc step by step — pick coach, roleplay or observe per step.",
    shape: "CORC",
    doc: {
      "implementation_id": "template-first-week-on-the-floor",
      "modality": "ai-conversational",
      "schema_version": "4.0",
      "content": {
        "title": "First Week on the Floor: Leading Safety as a New Supervisor",
        "narrative": "You've just been promoted to floor supervisor at a regional fulfillment warehouse — the same floor you worked as a picker for four years. It's Monday of your first week in charge. Your crew is eight people, most of whom you've worked beside for years, including Sam Okafor, the fastest picker in the building and the person everyone — including you, until Friday — copies shortcuts from. Management has made your mandate plain: throughput is fine; the near-miss reports are not. Three in the last month, all in your zone.",
        "scene_world": {
          "setting": "The pick floor of a regional fulfillment warehouse, first shift.",
          "canon": {
            "facts": [
              "The learner was promoted from within — Friday a picker, Monday the supervisor.",
              "Three near-miss reports came out of this zone in the last month.",
              "Sam Okafor is the floor's fastest picker and its informal standard-setter.",
              "Ladder policy: three points of contact, no top-step standing, no free-climbing the racking.",
              "Corner mirrors and marked walk lanes exist throughout the floor."
            ]
          },
          "characters": [
            {
              "id": "sam",
              "name": "Sam Okafor",
              "role": "Senior picker, fastest in the building, informal leader of the floor",
              "behavior": {
                "baseline": "Friendly, confident, half-amused that a former peer is now the boss.",
                "driver": "Status and craft pride. Responds to being treated as a leader whose example moves the floor; bristles at being made an example OF. The word 'unsafe' aimed at his technique reads to him as 'sloppy,' which he is not.",
                "guardrails": [
                  "A master of his work, never a cowboy — his shortcuts are calculated, which is exactly what makes them contagious.",
                  "Tests the new supervisor's nerve once, with humor, not hostility.",
                  "If enlisted rather than corrected, he turns fully — and brings the floor with him."
                ]
              },
              "canon_facts": [
                {
                  "fact": "One of the three near-miss reports was Sam's own — he filed it quietly and told no one on the floor.",
                  "reveal_when": "The learner treats him as a safety leader or asks directly about the near-misses."
                }
              ]
            }
          ]
        },
        "coach_persona": "an operations mentor who has coached a hundred first-time supervisors — plain-spoken about power, allergic to both bravado and hand-wringing",
        "tone_guidelines": [
          "Authority is granted by the crew, exercised by you — talk about earning it, not asserting it.",
          "Safety leadership is behavior you model and enlist, not rules you announce."
        ],
        "teaching_points": [
          {
            "topic": "The first-week shift",
            "points": [
              "Your example is now policy: whatever the supervisor walks past becomes the floor's standard.",
              "Peer capital converts: the trust you built as a picker is the only authority the crew has actually agreed to.",
              "The fastest worker sets the real standard — enlist the standard-setter and the floor follows; fight him and the floor watches."
            ]
          },
          {
            "topic": "Seeing the floor as a supervisor",
            "points": [
              "A supervisor's walk is a scan, not a stroll: eyes on ladders, lanes, loads, and corners — in that order of lethality.",
              "Near-miss patterns are the floor telling you where the next injury is scheduled.",
              "What you find on a walk is evidence for a conversation, not ammunition for one."
            ]
          },
          {
            "topic": "The corrective conversation",
            "points": [
              "Correct in private, enlist in public.",
              "Name the behavior and its physics, never the person's character.",
              "Trade on craft: the best workers change for 'this protects your speed' faster than for 'this is the rule.'",
              "Leave every correction with the person's status intact or improved — status-damaged workers re-offend."
            ]
          }
        ],
        "misconceptions": [
          {
            "misconception": "“I have to establish authority early — go hard on the first thing I see.”",
            "redirect": "Going hard on day one spends trust you can't rebuild. Authority on this floor is the peer capital you already have, converted carefully."
          },
          {
            "misconception": "“Sam's earned some slack — he's the best we have.”",
            "redirect": "Sam's earned influence, which is exactly why his shortcuts can't have slack: the floor copies him, not the handbook."
          },
          {
            "misconception": "“The near-miss reports are paperwork noise.”",
            "redirect": "Three in a month in one zone is the floor scheduling its next injury. The reports are the most honest data you have."
          }
        ],
        "opening": {
          "id": "first_morning",
          "label": "First Morning",
          "purpose": "Calibration: how does the learner carry the peer-to-boss shift before any skill is taught?",
          "input_placeholder": "What's on your mind walking in?…",
          "opening_messages": [
            {
              "text": "Monday, 5:50 AM. You're holding the supervisor lanyard you watched someone else wear for four years. Before we talk technique — what's going through your head about leading the people you picked beside on Friday?"
            }
          ],
          "levels": {
            "unthoughtful": {
              "look_for": "Bravado (\"nothing changes, they know me\") or its mirror, dread (\"they'll never listen to me\").",
              "response": "Meets the feeling, then reframes: both bravado and dread treat the crew as an audience. They're not — they're the source of your authority.",
              "example": {
                "learner": "Honestly? Nothing changes. They know me, I know them, we keep rolling.",
                "reply": "Some of that confidence will serve you. But something did change Friday — what you walk past is now what you approve. Let's talk about what that means before your first lap."
              }
            },
            "strong": {
              "look_for": "Names the real tension: former peers, converted trust, the example problem — especially re: Sam.",
              "response": "Confirms the read and sharpens it into the week's actual work: converting peer capital without spending it.",
              "example": {
                "learner": "The weird part is Sam. I copied his shortcuts myself last month. Now I'm supposed to stop them?",
                "reply": "You just named the week's real problem — and the fact that you copied them is your way in, not your disqualification. Hold that thought."
              }
            }
          },
          "exit": {
            "when": {
              "turns": 2
            },
            "final_word": "However it sits this morning, the shift starts in ten minutes. First stop: the three reports on your desk."
          },
          "conditional_probes": [
            {
              "required_concepts": [
                "your example sets the floor's standard"
              ],
              "probe": "One more before we walk: who do you think the crew actually watches to learn what's acceptable here — you, or someone else?"
            }
          ],
          "transition": {
            "button_label": "Pick up the reports",
            "text": "Lanyard on. The near-miss file is waiting on your desk."
          }
        },
        "phases": [
          {
            "id": "read_the_mandate",
            "label": "Read the Mandate",
            "purpose": "The learner reasons about what three near-misses in one zone actually mean and what a first-week supervisor should do about the pattern.",
            "practice": {
              "mode": "coach_inquiry",
              "purpose": "Turn the near-miss pattern into a supervisor's read: what is the floor telling you, and what does week one actually require?",
              "exit": {
                "when": {
                  "requirement": "Learner treats the near-misses as pattern data pointing at specific conditions/behaviors, and commits to seeing the floor firsthand before acting on anyone.",
                  "turns": 2
                },
                "final_word": "The reports say where. The floor will tell you why — and it's fifty steps away."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "You've read the data. Let's line up what it means."
              },
              "interaction": {
                "opening_messages": [
                  {
                    "text": "Three near-miss reports, one month, all your zone. Management calls it a problem; I call it information. What do those three reports actually tell you, and what's your first move?"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Dismisses the reports as noise or overreach, or jumps straight to a crew meeting / new rules announcement.",
                    "response": "Pushes back on both moves: dismissal ignores the data; announcing rules spends authority on nothing. What would you want to SEE first?",
                    "example": {
                      "learner": "Three near-misses with no injuries? That's the system working. I'd remind everyone at standup to be careful.",
                      "reply": "\"Be careful\" has never once changed a floor. Three reports in one zone is a pattern pointing somewhere specific. Where would you look to find out where?"
                    }
                  },
                  "neutral": {
                    "look_for": "Takes the reports seriously and wants more information, but stays abstract — 'investigate,' 'look into it' — without committing to walking the floor personally.",
                    "response": "Confirms the instinct and makes it concrete: the zone is fifty steps away. What does a supervisor's walk look for that a picker's didn't?",
                    "example": {
                      "learner": "I'd want to dig into the reports — what happened, where, what shift — before doing anything.",
                      "reply": "Right instinct. And the fastest dig is on foot: the zone's right there. What are your eyes doing differently on that walk than they did last week?"
                    }
                  },
                  "strong": {
                    "look_for": "Reads the pattern as the floor scheduling its next injury, and commits to a firsthand walk with specific things to scan before talking to anyone.",
                    "response": "Acknowledges that the read is already there and hands off — when the pattern-first instinct is present, no probe is needed.",
                    "example": {
                      "learner": "Three in a month is the floor telling me where the next real injury is coming from. Before I say a word to anyone, I walk the zone myself and look for what's making the shortcuts attractive.",
                      "reply": "That's a supervisor's read — the reports are pointing somewhere specific, and you're going to look before you act on anyone. Hold that thought; the floor is fifty steps away."
                    }
                  }
                },
                "input_placeholder": "What do the reports tell you?…",
                "partner_label": "Coach"
              }
            },
            "debrief": {
              "label": "The supervisor's read",
              "purpose": "Locks the pattern-reading frame and probes whether the learner can apply it forward.",
              "key_points": [
                "Near-miss clusters are predictive data — the floor telling you where the next injury is scheduled.",
                "Firsthand observation precedes any corrective action: walk before you talk.",
                "The supervisor's scan runs in lethality order — ladders, lanes, loads, corners.",
                "Findings are evidence for conversations, never ammunition."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Still frames the reports as noise or the walk as a formality.",
                  "response": "Re-anchors on the data's predictive value with a concrete example of a near-miss preceding an injury.",
                  "example": {
                    "learner": "Three near-misses and zero injuries sounds like things are working. I'd tell everyone to stay sharp.",
                    "reply": "Flip that read: three reports in one zone in a month is the floor telling you where the next injury is scheduled. 'Stay sharp' has never moved a floor — walking it will."
                  }
                },
                "neutral": {
                  "look_for": "Has the frame but hasn't connected it to their own zone's specifics.",
                  "response": "Confirms the frame and points it at the zone: three reports, one geography — what conditions repeat?",
                  "example": {
                    "learner": "I'd pull the reports and look for what they have in common before doing anything.",
                    "reply": "Right instinct — and the fastest version of it is on foot. The zone is fifty steps away; walk it in lethality order: ladders, lanes, loads, corners."
                  }
                },
                "strong": {
                  "look_for": "Owns the frame and is already anticipating what the walk will show.",
                  "response": "Confirms and hands off cleanly to the walk.",
                  "example": {
                    "learner": "That cluster is pointing at something specific. I walk the zone myself before talking to anyone, and whatever I find starts a conversation, not a citation.",
                    "reply": "That's the supervisor's read, complete: pattern first, people second, paper last — and findings as evidence for a conversation, never ammunition."
                  }
                }
              },
              "probe": {
                "text": "Before you walk: if you find the cause and it turns out to be something everyone does — including what you did yourself last month — what then?",
                "levels": {
                  "unthoughtful": {
                    "look_for": "Exempts themselves (\"that was different\") or plans to grandfather the habit.",
                    "response": "Names the trap: a standard with a personal exemption isn't a standard, it's a story the floor will retell forever.",
                    "example": {
                      "learner": "My case was different — I only did it when we were slammed.",
                      "reply": "That's the exemption every shortcut lives on. A standard with a personal asterisk isn't a standard — it's a story the floor will retell every time you enforce it."
                    }
                  },
                  "neutral": {
                    "look_for": "Accepts the standard applies to their own past behavior but hasn't decided what to do with that publicly.",
                    "response": "Suggests the conversion: owning your own past shortcut out loud is the cheapest credibility you will ever buy.",
                    "example": {
                      "learner": "Then the rule applies to me too, obviously. I'd just enforce it evenly from here.",
                      "reply": "Evenly is necessary but quiet. Saying it out loud — 'I did it too, and I'm done' — converts your past from a liability into the cheapest credibility you'll ever buy."
                    }
                  },
                  "strong": {
                    "look_for": "Plans to name their own past shortcut as part of raising the standard.",
                    "response": "Confirms: 'I did it too, and I'm done' is the strongest sentence a first-week supervisor can say.",
                    "example": {
                      "learner": "I'd name it myself, first: I ran that shortcut too, and I'm stopping, and here's why we all are.",
                      "reply": "That's the strongest sentence a first-week supervisor can say. Owning it first is what makes holding it later cost nothing."
                    }
                  }
                }
              },
              "follow_up_turns": 2,
              "requirement": "Learner articulates how they'll handle a found cause that implicates their own past behavior.",
              "input_placeholder": "What then?…",
              "final_word": "A standard you exempt yourself from is a story, not a standard.",
              "transition": {
                "button_label": "Walk the zone"
              }
            }
          },
          {
            "id": "walk_the_zone",
            "label": "Walk the Zone",
            "purpose": "The learner scans the pick zone and names every hazard; the debrief connects the findings to the near-miss pattern.",
            "practice": {
              "mode": "observe_react",
              "purpose": "The supervisor's first real scan: everything unsafe in the zone, named specifically.",
              "label": "Scan the zone",
              "exit": {
                "when": {
                  "requirement": "Learner has named at least three of the four zone hazards as safety problems.",
                  "turns": 2
                },
                "final_word": "That's the scan. Some of what you flagged is already a report on your desk — the rest is what the next report would have said."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "Now you've seen what the reports were pointing at."
              },
              "interaction": {
                "exhibit": {
                  "type": "image",
                  "src": "assets/media/demo/floor-lead.jpg",
                  "alt": "A warehouse pick aisle. A worker stands on the very top step of a rolling ladder, both hands reaching into a high shelf. Below, a pallet of boxes sits across the marked pedestrian walk lane. Further down, a top-heavy stack of totes rises from a cart. At the blind corner at the aisle's end, the convex mirror is missing from its bracket.",
                  "facts": [
                    "A worker stands on the top step of a rolling ladder with both hands in a high shelf — no points of contact.",
                    "A loaded pallet sits across the marked pedestrian walk lane.",
                    "A cart carries a top-heavy stack of totes, tallest tote on top.",
                    "The convex mirror at the aisle's blind corner is missing from its bracket.",
                    "The aisle is otherwise orderly; work is proceeding normally."
                  ]
                },
                "rubric": [
                  {
                    "id": "top_step",
                    "name": "Top-step ladder work",
                    "standard_term": "Standing on the ladder's top step with no points of contact — three points, never the top step.",
                    "nudge": "Look up the aisle — how is that height being reached?"
                  },
                  {
                    "id": "blocked_lane",
                    "name": "Blocked walk lane",
                    "standard_term": "A pallet parked across the marked pedestrian lane — walk lanes stay clear; staging goes in staging.",
                    "nudge": "Follow the painted lines on the floor."
                  },
                  {
                    "id": "top_heavy_cart",
                    "name": "Top-heavy tote stack",
                    "standard_term": "A cart stacked heaviest-high — top-heavy loads tip; heavy low, light high.",
                    "nudge": "Look at how that cart is loaded — what's where?"
                  },
                  {
                    "id": "missing_mirror",
                    "name": "Missing corner mirror",
                    "standard_term": "A blind-corner convex mirror missing from its bracket — blind corners with traffic need their mirrors.",
                    "nudge": "Check the end of the aisle, up on the bracket."
                  }
                ],
                "spot_target": 3,
                "brief": [
                  {
                    "text": "Your zone, supervisor's eyes. Scan it end to end — ladders, lanes, loads, corners — and jot everything that's wrong and why it matters."
                  }
                ],
                "jot_placeholder": "Name each hazard and why it matters…",
                "partner_label": "Narrator / Coach",
                "help_turns": 2
              }
            },
            "debrief": {
              "label": "The zone, decoded",
              "purpose": "Connects the four findings to the three near-miss reports and sets up the Sam conversation.",
              "key_points": [
                "Top-step ladder work — the exact behavior pattern behind two of the three near-miss reports.",
                "The blocked walk lane forces pedestrians into forklift space — the third report, almost verbatim.",
                "The top-heavy cart is the injury that hasn't happened yet.",
                "The missing mirror is a facilities fix — log it today; not every hazard is a behavior.",
                "And that top-step technique on the ladder? Watch the floor for an hour and you'll see where everyone learned it."
              ],
              "follow_up_turns": 0,
              "final_word": "The reports pointed here. And the technique on that ladder has an author.",
              "transition": {
                "button_label": "Find Sam"
              }
            }
          },
          {
            "id": "the_sam_conversation",
            "label": "The Sam Conversation",
            "purpose": "The learner corrects the floor's standard-setter — status intact, standard held, floor won over through him.",
            "practice": {
              "mode": "roleplay",
              "purpose": "The conversation the whole week turns on: correct the fastest picker's technique without spending the trust that is your only authority.",
              "exit": {
                "when": {
                  "requirement": "Learner has named the top-step behavior and its physics without character judgment, held the standard for everyone including themselves, and enlisted Sam's leadership rather than merely his compliance.",
                  "turns": 3
                },
                "final_word": "Sam rolls the ladder back toward the rack. The aisle keeps working — and everyone in it just watched the new supervisor have this conversation."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "That conversation just set your floor's standard. Let's see how."
              },
              "interaction": {
                "setting": "The end of the pick aisle, between waves — Sam wiping down the ladder he was just on top of.",
                "character_id": "sam",
                "emotion_hint": "amused, testing — waiting to see what kind of boss showed up today",
                "partner_label": "Sam",
                "opening_messages": [
                  {
                    "text": "Sam sees you coming and grins, patting the top step of the ladder like an old friend."
                  },
                  {
                    "text": "Uh oh. Supervisor walk. You gonna write me up for the move you were doing yourself two weeks ago? Because I taught you that one.",
                    "character_id": "sam",
                    "emotion": "amused"
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Pulls rank (\"things are different now\"), makes it about Sam's attitude, or ducks entirely (\"just watch yourself when the safety guys are around\").",
                    "response": "Sam's grin turns polite and distant; he agrees pleasantly and changes nothing — and the aisle noticed the duck or the flex.",
                    "progression": "The floor learns the new supervisor either bites peers or blinks at legends. Both lessons are expensive.",
                    "example": {
                      "learner": "That was before, Sam. I'm responsible for this floor now, so the top-step stuff ends today. Clear?",
                      "reply": "Sam's grin cools a notch. \"Crystal, boss.\" He steps off, mock-salutes, and the aisle goes quiet in the way that travels."
                    }
                  },
                  "neutral": {
                    "look_for": "Owns their own past shortcut and names the behavior honestly, but corrects Sam as a rule-follower rather than enlisting him as the standard-setter.",
                    "response": "Sam accepts it — genuinely — but only for himself; his compliance doesn't move the six pickers who learned from watching him.",
                    "progression": "Sam changes; the floor's technique doesn't, because the change arrived as one man's correction, not the standard-setter's example.",
                    "example": {
                      "learner": "You did teach me that one, and I did it — that's on me too. But two of our three near-misses are exactly this move, so it stops. Both of us.",
                      "reply": "Sam studies you, then nods slowly. \"Fair. Both of us.\" He moves the ladder down a step — and says nothing to the aisle."
                    }
                  },
                  "strong": {
                    "look_for": "Owns their past copy of the move, shows the near-miss data, and asks Sam to lead the change because the floor copies HIM — status converted, not spent.",
                    "response": "Sam pushes once — speed is his identity — hears the 'this protects your speed' trade, and turns fully, taking the floor with him. If treated as a leader, he may surface his own quiet near-miss report.",
                    "progression": "The standard changes at floor speed, because it arrived through the person the floor actually follows.",
                    "example": {
                      "learner": "You did teach me — and I ran it for a month, so this isn't a write-up, it's me quitting the move and asking for help. Two of our three near-misses are this exact reach. Nobody on this floor can make three-points look fast except you. If YOU set it, it's set by Friday.",
                      "reply": "Sam looks down the aisle, then back. \"...One of those reports was mine, you know. Never told the guys.\" He taps the ladder. \"Okay. Watch how you make three points look fast.\""
                    }
                  }
                },
                "input_placeholder": "What do you say to Sam?…",
                "help_turns": 2,
                "carryover": [
                  {
                    "from": "walk_the_zone"
                  }
                ]
              }
            },
            "debrief": {
              "label": "The conversion",
              "purpose": "Names exactly what converted peer capital into authority — or what spent it.",
              "key_points": [
                "Owning your own past shortcut buys the standing to end it — 'I did it too' is credibility, not weakness.",
                "Name the behavior with its physics and its data — never as a character verdict.",
                "Enlist, don't just correct: the ask that moves a floor is for the standard-setter's leadership, not his compliance.",
                "Leave status intact — a worker who exits the conversation bigger takes the standard with him; one who exits smaller re-offends."
              ],
              "follow_up_turns": 0,
              "final_word": "Correct in private, enlist in public, and let the standard-setter set the standard.",
              "transition": {
                "button_label": "Close out the week"
              }
            }
          },
          {
            "id": "close_the_week",
            "label": "Close Out the Week",
            "purpose": "With the zone photo pinned for reference, the learner sets their standing follow-through: what gets checked, logged, and systematized so the week's fixes survive.",
            "practice": {
              "mode": "coach_inquiry",
              "purpose": "Turn the week's finds into a durable routine — checks, logs, and system fixes with owners.",
              "exit": {
                "when": {
                  "requirement": "Learner commits to a concrete recurring routine covering the walk cadence, the facilities log (mirror), and at least one system fix that makes the standard easier to keep.",
                  "turns": 2
                },
                "final_word": "That routine is the whole job: see it, say it, systematize it — every week, not just the first."
              },
              "transition": {
                "button_label": "Pin it down",
                "text": "That's your routine drafted. Let's make it stick."
              },
              "interaction": {
                "opening_messages": [
                  {
                    "text": "Friday afternoon. A photo of the aisle you walked Monday is pinned above your desk — same aisle, different floor now. What of this week becomes permanent? Walk me through your standing routine."
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Declares victory (\"floor's fixed\") or plans vigilance without structure (\"I'll keep an eye out\").",
                    "response": "Pushes from vigilance to structure with questions: what happens every Monday, who owns the mirror after today, what would make the standard the easy way to work?",
                    "example": {
                      "learner": "Honestly the floor's in good shape now — Sam's on board. I'll keep watching for backsliding.",
                      "reply": "Sam's on board TODAY. 'Keeping an eye out' is how the last supervisor got three near-misses. What's your Monday routine — the one that happens even when you're slammed?"
                    }
                  },
                  "neutral": {
                    "look_for": "Commits to a walk cadence but leaves the facilities log or the system fixes vague.",
                    "response": "Credits the cadence, then probes the loose ends: what happens to the mirror after today, and what keeps the ladder standard alive in a busy week?",
                    "example": {
                      "learner": "Monday and Thursday walks, same scan order, notes each time.",
                      "reply": "Good bones. Two gaps: that mirror is still a bracket without a mirror — where's the ticket? And if three-points costs pickers time, the floor will quietly vote it down. What makes it FAST?"
                    }
                  },
                  "strong": {
                    "look_for": "A complete routine: recurring scan cadence, facilities items ticketed and tracked, system fixes (step stools staged, label rolls, lane staging) with owners, and Sam enlisted in the standard's upkeep.",
                    "response": "Confirms the structure is complete and hands off — the debrief owns the principle.",
                    "example": {
                      "learner": "Twice-weekly walks in the same scan order. Mirror's ticketed — I check the number Monday. Step stools staged at the high racks so three-points beats the top step on speed. And Sam owns the ladder standard at standup, not me.",
                      "reply": "That's a supervisor's system: cadence, tickets, speed-parity fixes, and the standard-setter owning the standard. Week one just became how the floor works."
                    }
                  }
                },
                "input_placeholder": "What becomes permanent?…",
                "partner_label": "Coach",
                "media": {
                  "type": "image",
                  "src": "assets/media/demo/floor-lead.jpg",
                  "alt": "A warehouse pick aisle. A worker stands on the very top step of a rolling ladder, both hands reaching into a high shelf. Below, a pallet of boxes sits across the marked pedestrian walk lane. Further down, a top-heavy stack of totes rises from a cart. At the blind corner at the aisle's end, the convex mirror is missing from its bracket."
                }
              }
            },
            "debrief": {
              "label": "The standing routine",
              "purpose": "Delivers the durable-supervision frame the week was building toward.",
              "key_points": [
                "Cadence beats vigilance: recurring walks in a fixed scan order survive busy weeks; attention does not.",
                "Facilities hazards get tickets with numbers, and tickets get chased.",
                "Standards survive when the safe way is also the fast way — system fixes buy that.",
                "The standard-setter maintains the standard: Sam at standup moves more than any memo."
              ],
              "follow_up_turns": 0,
              "final_word": "See it, say it, systematize it — and let the floor's own leaders carry it.",
              "transition": {
                "button_label": "See my feedback"
              }
            }
          }
        ],
        "closing": {
          "partner_label": "Coach",
          "ideal_response": {
            "component_groups": [
              {
                "title": "Read the floor",
                "components": [
                  "Treat near-miss clusters as predictive data locating the next injury.",
                  "Walk before you talk: firsthand observation precedes every corrective action.",
                  "Scan in lethality order — ladders, lanes, loads, corners."
                ]
              },
              {
                "title": "Convert your capital",
                "components": [
                  "Own your past shortcuts out loud — a standard you exempt yourself from is a story, not a standard.",
                  "Name behaviors with their physics and data, never as character verdicts.",
                  "Correct in private, enlist in public, and leave every correction with the person's status intact."
                ]
              },
              {
                "title": "Make it permanent",
                "components": [
                  "Fixed walk cadence in a fixed scan order, kept even in busy weeks.",
                  "Facilities hazards ticketed, numbered, and chased.",
                  "System fixes that make the safe way the fast way.",
                  "The floor's standard-setter owning the standard in public."
                ]
              }
            ],
            "summary": "A first-week supervisor leads safety by reading near-misses as a map, walking the floor before talking to anyone, owning their own past shortcuts, correcting the standard-setter in private while enlisting his leadership in public, and then locking the week into routine — cadence, tickets, and system fixes that make the safe way the fast way.",
            "source_references": []
          }
        },
        "landing_cta_label": "Clock in"
      },
      "contextSource": "previous-lo",
      "previousLO": {
        "title": "New Supervisor Basics: Safety Is a Leadership Job",
        "covered": "A supervisor owns the conditions and the behaviour on their floor; how to run a correction conversation without making it a reprimand; and the authority to stop work.",
        "handoff": "The learner has the model in the abstract. This is the first week they have to hold it in front of people who were doing the job before they arrived."
      }
    },
  },
  "observe-react": {
    label: "Observe & React", icon: "fa-eye",
    blurb: "Watch, then talk through what you noticed.",
    shape: "O",
    doc: {
      "implementation_id": "template-dock-check-walkaround",
      "modality": "ai-conversational",
      "schema_version": "4.0",
      "content": {
        "title": "Dock Check: The Loading Dock Walkaround",
        "coach_persona": "a veteran dock supervisor — direct, unhurried, safety-first without being preachy",
        "teaching_points": [
          {
            "topic": "The four dock red flags",
            "points": [
              "A blocked emergency exit is never acceptable, even briefly — egress must stay clear at all times.",
              "A forklift left running and unattended can roll, be taken by an untrained worker, or pin someone — never leave a powered truck live.",
              "Unsecured stacked pallets lean and fall — stacks must be stable, level, and within height limits.",
              "A wet, unmarked floor in a walk lane is a slip hazard — and a skid hazard for any wheels that cross it. Mark it, then fix it."
            ]
          },
          {
            "topic": "Seeing before fixing",
            "points": [
              "A walkaround is a discipline: sweep the whole area before acting, so the worst hazard gets fixed first, not the nearest.",
              "Every hazard you can see, someone else has already walked past — spotting is a habit, not a talent."
            ]
          }
        ],
        "misconceptions": [
          {
            "misconception": "“The forklift's fine — the driver only stepped away for a second.”",
            "redirect": "An unattended running truck is a hazard the moment it's unattended; the length of the errand doesn't change what it can do."
          },
          {
            "misconception": "“The exit's only blocked while we stage this shipment.”",
            "redirect": "Egress is either clear or it isn't. A fire doesn't check the staging schedule."
          }
        ],
        "phases": [
          {
            "id": "dock_sweep",
            "label": "Walk the Dock",
            "purpose": "The learner sweeps the loading dock and names every hazard they can spot; the debrief locks in all four hazards in the terms that stick.",
            "practice": {
              "mode": "observe_react",
              "purpose": "A deliberate walkaround of the dock, naming everything unsafe — spotting practice, not instruction.",
              "label": "Spot the hazards",
              "exit": {
                "when": {
                  "requirement": "Learner has named at least three of the four dock hazards, each identified as a safety problem rather than untidiness.",
                  "turns": 2
                },
                "final_word": "We'll stop the sweep there. Nothing stays off the list."
              },
              "transition": {
                "button_label": "See the full board",
                "text": "Let's line up what's actually out there."
              },
              "interaction": {
                "exhibit": {
                  "type": "image",
                  "src": "assets/media/demo/dock-walk.jpg",
                  "alt": "A warehouse loading dock. On the left, a forklift sits in a travel lane, its amber beacon lit and engine running, with no operator in the seat. Center, a pallet stack rises well above head height and visibly leans. On the right, an emergency exit door is blocked by stacked boxes. In the foreground, a wet patch spreads across the floor of the walk lane with no sign or cone marking it.",
                  "facts": [
                    "A forklift sits in the travel lane with its engine running — amber beacon lit — and no operator in the seat.",
                    "A stack of loaded pallets rises above head height and visibly leans to one side.",
                    "The emergency exit door is blocked by stacked boxes.",
                    "A wet patch spreads across the pedestrian walk lane with no sign or cone marking it.",
                    "Nothing is actively falling or on fire; the dock is mid-shift and otherwise working normally."
                  ]
                },
                "rubric": [
                  {
                    "id": "blocked_exit",
                    "name": "Blocked emergency exit",
                    "standard_term": "An emergency exit blocked by stored material — egress must stay clear at all times.",
                    "nudge": "Check the far wall — the door on the right."
                  },
                  {
                    "id": "unattended_forklift",
                    "name": "Running forklift unattended",
                    "standard_term": "A powered industrial truck left running with no operator — never leave a live truck unattended.",
                    "nudge": "Look at the travel lane on the left — check the cab."
                  },
                  {
                    "id": "leaning_stack",
                    "name": "Unstable pallet stack",
                    "standard_term": "A pallet stack that is over-height and leaning — stacks must be stable, level, and within limits.",
                    "nudge": "Look up, center of the dock."
                  },
                  {
                    "id": "unmarked_spill",
                    "name": "Unmarked wet floor",
                    "standard_term": "A wet floor in the walk lane with no marking — mark the hazard first, then fix it.",
                    "nudge": "Look down, right where people walk."
                  }
                ],
                "spot_target": 3,
                "brief": [
                  {
                    "text": "Mid-shift, and you've got the dock to yourself for a minute. Walk the area and jot down everything that looks unsafe — name as many problems as you can spot."
                  }
                ],
                "jot_placeholder": "Name everything that looks wrong or unsafe…",
                "partner_label": "Narrator / Coach",
                "help_turns": 0
              }
            },
            "debrief": {
              "label": "The full board",
              "purpose": "Whatever the learner caught, the coach credits it, then delivers all four hazards in the standard safety terms.",
              "key_points": [
                "Blocked emergency exit — egress must stay clear at all times; staging schedules don't suspend that.",
                "Running forklift unattended — a live, unattended truck can roll, be misused, or pin someone.",
                "Unstable pallet stack — over-height, leaning stacks fall; stability and height limits are the control.",
                "Unmarked wet floor — in the walk lane it's a slip hazard and a skid risk for anything that rolls through; mark it immediately, then fix it.",
                "The sweep habit itself is the lesson: see the whole area before acting, worst hazard first."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Caught one or none, or framed it all as mess — “needs a tidy-up.”",
                  "response": "Credits the instinct that something is off, then states all four flags plainly, each named as a safety problem, not clutter.",
                  "example": {
                    "learner": "Place could use a cleanup, but docks always look like this.",
                    "reply": "Some of what you're seeing isn't mess — it's four separate safety problems. Let me put them on the board: a blocked exit, a live truck with nobody on it, a leaning stack, and a wet lane nobody's marked."
                  }
                },
                "neutral": {
                  "look_for": "Caught the visible two or three — usually the forklift and the blocked exit — but missed the lean or the unmarked wet patch.",
                  "response": "Confirms the catches in standard terms, then names what was missed and why it's easy to walk past.",
                  "example": {
                    "learner": "The forklift shouldn't be running with nobody on it, and those boxes are in front of the exit door.",
                    "reply": "Both right, in exactly the right terms. Two more were easy to walk past: look how that center stack leans — and the wet patch in the walk lane has no cone on it. That's the full four."
                  }
                },
                "strong": {
                  "look_for": "Named all four and said why each is a hazard, not just that it looks wrong.",
                  "response": "Confirms all four in standard terms and turns to the habit: sweep first, worst first.",
                  "example": {
                    "learner": "Unattended running forklift, blocked emergency exit, a pallet stack leaning over height, and an unmarked wet floor in the walk lane.",
                    "reply": "That's the whole board, each one named for what it is. Now notice the habit that found them: you swept the whole dock before touching anything."
                  }
                }
              },
              "follow_up_turns": 0,
              "final_word": "Four flags, one habit: walk the whole dock before anything moves.",
              "transition": {
                "button_label": "See my feedback"
              }
            }
          }
        ],
        "closing": {
          "partner_label": "Coach",
          "ideal_response": {
            "component_groups": [
              {
                "title": "The four hazards, in standard terms",
                "components": [
                  "A blocked emergency exit — egress must stay clear at all times, with no staging exceptions.",
                  "A running forklift left unattended — powered trucks are never left live without an operator.",
                  "An over-height, leaning pallet stack — stacks must be stable, level, and within height limits.",
                  "An unmarked wet floor in the walk lane — mark the hazard immediately, then eliminate it."
                ]
              },
              {
                "title": "The walkaround habit",
                "components": [
                  "Sweep the entire area before acting, so the worst hazard is addressed first rather than the nearest.",
                  "Treat every visible hazard as one that others have already walked past — spotting is a discipline you repeat, not a one-time check."
                ]
              }
            ],
            "summary": "A safe dock starts with a full walkaround: clear egress, no live unattended trucks, stable stacks, and marked-then-fixed floor hazards — seen in one deliberate sweep before work begins.",
            "source_references": []
          }
        },
        "landing_cta_label": "Start the walkaround"
      },
      "contextSource": "previous-lo",
      "previousLO": {
        "title": "Powered Industrial Trucks and Dock Safety",
        "covered": "Unattended-forklift rules; separating travel lanes from pedestrian routes; safe stacking height; and keeping exits, extinguishers and eyewash clear.",
        "handoff": "The learner has read the rules. This is the first time they walk a dock and have to say out loud what is wrong with it."
      }
    },
  },
  "scene-sweep": {
    label: "Scene Sweep", icon: "fa-magnifying-glass",
    blurb: "Study a scene, spot what is wrong, then act on it.",
    shape: "OC",
    doc: {
      "implementation_id": "template-spot-the-hazard-hazcom",
      "modality": "ai-conversational",
      "schema_version": "4.0",
      "content": {
        "title": "Spot the Hazard: Applying Hazard Communication",
        "narrative": "You've just finished your hazard communication training and are standing at the finishing bench, where products are wiped down, touched up, and boxed.\n\nOn the bench sits a clear plastic jug that's half full, but it has no label. Nearby, a coworker is wiping down parts with a rag using bare hands and no safety goggles.\n\nNext to them is a drum with a torn, smudged label that's difficult to read. Taped to that drum is a safety data sheet that's decades old.\n\nNothing is on fire. Everyone is simply going about their work. But you completed that training for a reason. Take a careful look around.",
        "scene_world": {
          "setting": "A finishing bench on the shop floor, where products are wiped down, touched up, and boxed.",
          "canon": {
            "facts": [
              "The learner has just completed the Hazard Communication course and is here as themselves — a worker."
            ]
          }
        },
        "coach_persona": "A knowledgeable safety trainer — authority and genuine concern for the learner's safety.",
        "tone_guidelines": [
          "Reads a learner's catch back in standard HazCom terms — “an unlabeled secondary container,” “PPE not being worn,” “an out-of-date SDS,” “a label too damaged to identify the hazard.”",
          "Forward momentum — every turn ends with a next move."
        ],
        "teaching_points": [
          {
            "topic": "The observable-hazard rubric",
            "points": [
              "An unlabeled secondary container — a jug decanted from a drum with no label — must be labeled.",
              "An outdated SDS — years out of date — must be replaced; a new SDS is required when the hazard information changes.",
              "No PPE in use — a coworker wiping parts bare-handed, without the gloves or goggles the label calls for.",
              "An unreadable or missing label — torn or faded so the pictogram or signal word can't be read to identify the hazard."
            ]
          },
          {
            "topic": "Protective measures — three layers",
            "points": [
              "Work practices — safe handling procedures, administrative controls, and behavioral protocols that reduce risk at the source.",
              "Emergency procedures — what to do on spill or exposure, who to notify, first aid, evacuation.",
              "PPE — what gear is required for each chemical, when to wear it, and how to use it correctly.",
              "Every hazard in the scene traces back to one of these three layers."
            ]
          },
          {
            "topic": "The 10 required HazCom training topics",
            "points": [
              "The Hazard Communication Standard",
              "The written program and how to access it",
              "Where hazardous chemicals are located",
              "The physical and health hazards associated with those chemicals",
              "How to detect a chemical release",
              "Steps employees can take to protect themselves",
              "Employer-provided protective measures — safe work practices, emergency procedures, and personal protective equipment (PPE)",
              "How to read chemical labels",
              "How to access and use Safety Data Sheets (SDSs)",
              "Who to contact with questions or concerns"
            ]
          }
        ],
        "misconceptions": [
          {
            "misconception": "“Looks fine to me.”",
            "redirect": "Cue a specific location: “Look again at the bench, and the drum beside it.”"
          },
          {
            "misconception": "Only names clutter — “it's messy, chemicals are out.”",
            "redirect": "“Messy” isn't the hazard — push to what's unlabeled, unreadable, outdated, unprotected."
          },
          {
            "misconception": "Fixing it means “clean it up later.”",
            "redirect": "Someone's working unsafely now; act before work continues."
          },
          {
            "misconception": "Preventing it means “be careful.”",
            "redirect": "Redirect to systems that don't depend on memory."
          }
        ],
        "phases": [
          {
            "id": "observe_beat",
            "label": "Observe — Spot the Hazards",
            "purpose": "The learner walks the area and names every hazard they can spot; the Coach then locks the full four-hazard rubric so all four land whatever the learner caught.",
            "practice": {
              "mode": "observe_react",
              "purpose": "The learner has taken in the scene. Now the learner does the real work — a deliberate walkthrough, naming every hazard they can spot. This is practice, not instruction.",
              "label": "Spot the hazards",
              "exit": {
                "when": {
                  "requirement": "Learner has named at least three of the four observable red flags in the scene, each identified as a hazard rather than as untidiness.",
                  "turns": 2
                },
                "final_word": "We'll stop the walkthrough there. Nothing gets left off the list."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "Good eyes. Let's line up everything that's actually here."
              },
              "interaction": {
                "exhibit": {
                  "type": "image",
                  "src": "assets/media/hazcom/finishing-bench.jpg",
                  "alt": "A finishing area on a shop floor. On the metal bench in front of you, to the left, a half-full clear plastic jug with no label sits beside a row of metal parts. Your coworker stands at the bench in a short-sleeve shirt, wiping a part with a rag, bare-handed — no gloves and no eye protection. To your right stands a chemical drum: a Safety Data Sheet taped to it is dated decades ago, and the drum's own hazard label is torn and peeling, so its pictogram and signal word can't be read.",
                  "facts": [
                    "On the bench sits a clear plastic jug that is half full, but it has no label.",
                    "A coworker nearby is wiping down parts with a rag using bare hands and no safety goggles.",
                    "Next to the coworker is a drum with a torn, smudged label that is difficult to read.",
                    "Taped to the drum is a safety data sheet that is decades old.",
                    "Nothing is on fire; everyone is simply going about their work."
                  ]
                },
                "rubric": [
                  {
                    "id": "unlabeled_secondary",
                    "name": "Unlabeled secondary container",
                    "standard_term": "A jug decanted from a drum with no label — the secondary container must be labeled.",
                    "nudge": "Look again right on the bench — at the jug."
                  },
                  {
                    "id": "outdated_sds",
                    "name": "Outdated / very old SDS",
                    "standard_term": "The SDS on hand is years out of date — a new SDS is required when the hazard information changes.",
                    "nudge": "Check that SDS taped to the drum — how current is it?"
                  },
                  {
                    "id": "no_ppe",
                    "name": "No PPE in use",
                    "standard_term": "A coworker wiping parts bare-handed — no gloves or goggles the label calls for.",
                    "nudge": "What about the person working next to you — what's on his hands?"
                  },
                  {
                    "id": "unreadable_label",
                    "name": "Unreadable / missing label",
                    "standard_term": "A drum whose label is torn or faded — you can't read the pictogram or signal word to identify the hazard.",
                    "nudge": "And the label on the drum beside him — can you actually read it?"
                  }
                ],
                "spot_target": 3,
                "brief": [
                  {
                    "text": "The finishing bench, mid-shift, exactly as the last worker left it. Everything unsafe here can be spotted from where you stand — note down every problem you can find, as specifically as you can."
                  }
                ],
                "jot_placeholder": "Name everything that looks wrong or unsafe…",
                "levels": {
                  "unthoughtful": {
                    "look_for": "Spots 0–1, or only names “it's messy / chemicals are out.” Vague, no specific hazards. Treats it as housekeeping rather than a HazCom problem.",
                    "response": "Credits any real catch, then cues a location without giving it away: “Look again right on the bench — the jug. That SDS on the drum. What about the person working next to you?”",
                    "example": {
                      "learner": "It's a little messy, but it looks like a normal work area to me. Maybe put some stuff away.",
                      "reply": "Tidy-up isn't the issue here — some of this is a safety problem. Look again right on the bench: that jug. And the person next to you — what's on his hands? Try again."
                    }
                  },
                  "neutral": {
                    "look_for": "Catches the obvious ones — the unlabeled jug, the coworker with no PPE — but misses the less visible ones: the out-of-date SDS and the unreadable label.",
                    "response": "Credits each catch in standard terms (secondary-container labeling, PPE). Nudges toward the SDS taped to the drum and the drum's torn label.",
                    "example": {
                      "learner": "That jug isn't labeled — you can't tell what's in it. And the guy wiping parts isn't wearing gloves or goggles.",
                      "reply": "Both right — an unlabeled secondary container and missing PPE. Now check that SDS taped to the drum — how current is it? And the drum's own label — can you actually read it?"
                    }
                  },
                  "strong": {
                    "look_for": "Names all four specifically and says why each is a hazard — unlabeled container, out-of-date SDS, no PPE, and an unreadable label.",
                    "response": "Validates fully, reads the catches back in standard terminology, and points ahead to doing something about them.",
                    "example": {
                      "learner": "Unlabeled jug, no gloves or goggles on the coworker, the SDS on the drum is years out of date, and the label on that drum is torn up — I can't tell what's in it.",
                      "reply": "That's the whole board — four real hazards, named for what they are. Let's recap and then start to do something about them."
                    }
                  }
                },
                "partner_label": "Narrator / Coach",
                "help_turns": 0
              }
            },
            "debrief": {
              "label": "Observe debrief",
              "purpose": "Whatever the learner caught, the Coach credits it first, then delivers the complete four-hazard rubric in standard terms — so all four land regardless of path.",
              "partner_label": "Coach",
              "key_points": [
                "Unlabeled container — a decanted jug with no label; you can't identify the chemical or its hazards. Secondary containers must be labeled.",
                "No PPE in use — a coworker handling chemical bare-handed, no goggles; the protective gear the task requires isn't being worn.",
                "Outdated SDS — the SDS on hand is years out of date; a new SDS is required whenever the hazard information changes.",
                "Unreadable label — the label on the drum is torn or faded; you can't read the pictogram or signal word to identify the hazard.",
                "Recognizing a hazard in real time is the behavior Hazard Communication is built to create — noticing beats reciting."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Caught little — only “it's messy,” or one item, with no specific HazCom hazards named.",
                  "response": "Credits the instinct that something is off, then states the whole board so nothing slips — all four, each named as its own Hazard Communication red flag.",
                  "example": {
                    "learner": "It's a little messy, but it looks like a normal work area to me. Maybe put some stuff away.",
                    "reply": "Good instinct that something's off — let me lock in the whole board so nothing slips. There are four: that jug is an unlabeled secondary container, your coworker is bare-handed with no goggles, the SDS on the drum is years out of date, and the drum's label is too torn to read. Each one is its own Hazard Communication red flag."
                  }
                },
                "neutral": {
                  "look_for": "Caught the obvious two — the unlabeled jug and the coworker with no PPE, the two most visible hazards.",
                  "response": "Confirms the two that jump out in standard terms, then names the two that were easy to miss — the out-of-date SDS and the torn label — as the pair that completes the set of four.",
                  "example": {
                    "learner": "That jug isn't labeled — you can't tell what's in it. And the guy wiping parts isn't wearing gloves or goggles.",
                    "reply": "You nailed the two that jump out — the unlabeled secondary container and the missing PPE. Two more were easy to miss: the SDS on the drum is out of date, so it can't be relied on, and that drum's label is too torn to read. That's the full set of four."
                  }
                },
                "strong": {
                  "look_for": "Caught all four — unlabeled jug, no PPE, out-of-date SDS, and the torn, unreadable label — and said why each counts.",
                  "response": "Confirms all four in standard terms, adds nothing, and turns the learner toward fixing them.",
                  "example": {
                    "learner": "Unlabeled jug, no gloves or goggles on the coworker, the SDS on the drum is years out of date, and the label on that drum is torn up — I can't tell what's in it.",
                    "reply": "That's the whole board, and you said why each one counts: an unlabeled secondary container, PPE not being worn, an out-of-date SDS, and a label too damaged to identify the hazard. Nothing to add — let's move to fixing them."
                  }
                }
              },
              "follow_up_turns": 0,
              "final_word": "You saw it in real time — that's the habit that keeps a workplace safe.",
              "transition": {
                "button_label": "Step back in",
                "text": "Now let's do something about it. Back to the scene."
              }
            }
          },
          {
            "id": "remediate_beat",
            "label": "Diagnose & Remediate — Fix It Now",
            "purpose": "The learner acts on what they flagged, in the moment, before anyone keeps working; the Coach then pulls the right-now actions together and maps them onto the protective-measures layers.",
            "practice": {
              "mode": "coach_inquiry",
              "purpose": "Spotting the hazards isn't enough. The Coach hands the floor back — now the learner has to act on what was flagged, in the moment, before anyone keeps working.",
              "label": "Fix it now",
              "exit": {
                "when": {
                  "requirement": "Learner gives an immediate corrective action for the hazards they flagged, spanning stop-work / PPE and making the chemical identifiable — a current SDS and a legible label — before work resumes.",
                  "turns": 2
                },
                "final_word": "Hold it there. Whatever's still missing before work resumes, I'll fill in."
              },
              "transition": {
                "button_label": "Talk it through",
                "text": "Let's go over what to do right now."
              },
              "interaction": {
                "opening_messages": [
                  {
                    "text": "For each hazard, what would you do right now, in the moment, before anyone keeps working? Be specific."
                  }
                ],
                "levels": {
                  "unthoughtful": {
                    "look_for": "Defers — “clean it up later,” “tell a supervisor,” “put a note on it.” Doesn't stop the unsafe work happening right now or protect the person doing it.",
                    "response": "Presses the immediacy: the coworker is wiping parts bare-handed this second. What happens before he keeps going? Redirect to stop-work and PPE first.",
                    "example": {
                      "learner": "I'd let my supervisor know and put it on the list to clean up at end of shift.",
                      "reply": "Reporting it matters — but your coworker is wiping parts bare-handed right now, and that jug's still unknown. What has to happen before he takes another swipe?"
                    }
                  },
                  "neutral": {
                    "look_for": "Fixes one or two well — labels or quarantines the jug — but misses the stop-work / PPE piece, pulling a current SDS, or getting a legible label on the drum.",
                    "response": "Affirms the fix, then extends: the person working now, and what makes the chemical identifiable — a current SDS and a legible label.",
                    "example": {
                      "learner": "I'd label the jug — or set it aside until we figure out what it is.",
                      "reply": "Good — quarantining the unknown container is exactly right. Now the person working next to it: gloves and goggles first. And how would you find out what the chemical actually is — what's wrong with the SDS and the label?"
                    }
                  },
                  "strong": {
                    "look_for": "Stops unsafe work and gets PPE on; quarantines or labels the unknown jug; pulls a current SDS; gets a legible label on the drum — all before work resumes.",
                    "response": "Validates and names the layers at work: PPE and safe handling — labeling, SDS access, identifying the chemical — are protective measures in action, not recitation.",
                    "example": {
                      "learner": "Stop him and get gloves and goggles on. Set the unlabeled jug aside until it's identified. Pull a current SDS for it. And get a legible label on that drum before anyone keeps working.",
                      "reply": "That's the whole picture in action — PPE, safe handling, and making the chemical identifiable, all before work resumes."
                    }
                  }
                },
                "input_placeholder": "What would you do right now?…",
                "partner_label": "Coach",
                "media": {
                  "type": "image",
                  "src": "assets/media/hazcom/finishing-bench.jpg",
                  "alt": "A finishing area on a shop floor. On the metal bench in front of you, to the left, a half-full clear plastic jug with no label sits beside a row of metal parts. Your coworker stands at the bench in a short-sleeve shirt, wiping a part with a rag, bare-handed — no gloves and no eye protection. To your right stands a chemical drum: a Safety Data Sheet taped to it is dated decades ago, and the drum's own hazard label is torn and peeling, so its pictogram and signal word can't be read."
                }
              }
            },
            "debrief": {
              "label": "Remediate debrief",
              "purpose": "The Coach names the immediate corrective actions and shows how they map onto the protective-measures layers — PPE and safe handling (labeling, SDS access), applied.",
              "partner_label": "Coach",
              "key_points": [
                "Stop unsafe work — the first move is to pause the work that's happening unsafely, before another exposure, not after.",
                "PPE on — the right gloves and eye protection for the chemical, worn correctly; this is the PPE layer in action.",
                "Quarantine and identify — set the unlabeled jug aside until it's identified and labeled; don't use or move an unknown.",
                "Pull a current SDS — get the current safety data sheet for the chemical; the out-of-date one can't be relied on for handling or first aid.",
                "Relabel the container — get a legible, GHS-compliant label on the drum so anyone can identify the hazard at a glance."
              ],
              "levels": {
                "unthoughtful": {
                  "look_for": "Deferred — “report it,” “clean it up later.” Didn't act on the live risk.",
                  "response": "Grants that reporting matters, then states every right-now action that has to happen before anyone keeps working — stop-work and PPE, quarantine the jug, a current SDS, a legible label.",
                  "example": {
                    "learner": "I'd let my supervisor know and put it on the list to clean up at end of shift.",
                    "reply": "Reporting matters, but here's what has to happen right now, before anyone keeps working: stop the unsafe work and ask your coworker to get gloves and goggles on, set the unlabeled jug aside until it's identified, pull a current SDS, and get a legible label on the drum."
                  }
                },
                "neutral": {
                  "look_for": "Labeled or quarantined the jug — but missed stop-work / PPE, or making the chemical identifiable.",
                  "response": "Confirms the fix that was right, then closes the gaps in order — stop the bare-handed work and get PPE on first, then a current SDS, then a legible label — and names that as the full set of right-now actions.",
                  "example": {
                    "learner": "I'd label the jug — or set it aside until we figure out what it is.",
                    "reply": "Quarantining the unknown was exactly right. To complete it: stop the bare-handed work and get PPE on first, pull a current SDS you can rely on, and get a legible label on the drum. That's the full set of right-now actions."
                  }
                },
                "strong": {
                  "look_for": "Stopped the work and got PPE on, quarantined the jug, pulled a current SDS, relabeled the drum — all before work resumed.",
                  "response": "Confirms every action and maps each one onto the protective-measures layer it belongs to — PPE and safe handling.",
                  "example": {
                    "learner": "Stop him and get gloves and goggles on. Set the unlabeled jug aside until it's identified. Pull a current SDS for it. And get a legible label on that drum before anyone keeps working.",
                    "reply": "You hit all the points — stop-work and PPE, contain the unknown, a current SDS, and a legible label — and each maps to a protective-measures layer: PPE and safe handling. Nice job."
                  }
                }
              },
              "follow_up_turns": 0,
              "final_word": "Every one of those actions maps onto a protective-measures layer — PPE and safe handling (labeling, SDS access).",
              "transition": {
                "button_label": "See my feedback",
                "text": "Let's revisit your findings and see what a complete Hazard Communication program covers."
              }
            }
          }
        ],
        "closing": {
          "partner_label": "Coach",
          "ideal_response": {
            "component_groups": [
              {
                "title": "The 10 required topics",
                "components": [
                  "The Hazard Communication Standard",
                  "The written program and how to access it",
                  "Where hazardous chemicals are located",
                  "The physical and health hazards associated with those chemicals",
                  "How to detect a chemical release",
                  "Steps employees can take to protect themselves",
                  "Employer-provided protective measures — safe work practices, emergency procedures, and personal protective equipment (PPE)",
                  "How to read chemical labels",
                  "How to access and use Safety Data Sheets (SDSs)",
                  "Who to contact with questions or concerns"
                ]
              },
              {
                "title": "Protective measures — 3 layers",
                "components": [
                  "Work practices — safe handling procedures, administrative controls, and behavioral protocols that reduce risk at the source.",
                  "Emergency procedures — what to do on spill or exposure, who to notify, first aid, evacuation.",
                  "PPE — what gear is required for each chemical, when to wear it, and how to use it correctly.",
                  "A space that covers only PPE leaves workers without the full picture. Every hazard in the scene traces back to one of these three layers."
                ]
              }
            ],
            "summary": "A complete Hazard Communication program should cover ten essential elements: (1) the Hazard Communication Standard; (2) the written program and how to access it; (3) where hazardous chemicals are located; (4) the physical and health hazards associated with those chemicals; (5) how to detect a chemical release; (6) steps employees can take to protect themselves; (7) employer-provided protective measures, such as safe work practices, emergency procedures, and personal protective equipment (PPE); (8) how to read chemical labels; (9) how to access and use Safety Data Sheets (SDSs); and (10) who to contact with questions or concerns. Understanding these ten elements isn't just about meeting a requirement—it helps recognize hazards, respond appropriately, and stay safe on the job.",
            "source_references": []
          }
        },
        "landing_cta_label": "Start the walkthrough"
      },
      "contextSource": "previous-lo",
      "previousLO": {
        "title": "Hazard Communication: Labels, Safety Data Sheets and the Right to Know",
        "covered": "The six required label elements; the sixteen-section safety data sheet; secondary-container labelling; and the employee's right to know what is in the workplace.",
        "handoff": "The learner can recite the label elements. They have not yet had to notice a missing one on a bench in front of them."
      }
    },
  },
  "teach-back": {
    label: "Teach Back", icon: "fa-comments",
    blurb: "Explain it back in your own words; coverage is credited.",
    shape: "C", toFill: 8,
    doc: {
          "implementation_id": "applying-hazcom-the-teach-me-exercise",
          "modality": "ai-conversational",
          "schema_version": "4.0",
          "content": {
                "title": "Applying HazCom: The Teach Me Exercise",
                "teaching_points": [
                      {
                            "topic": "a Hazard Communication (HazCom) training",
                            "points": [
                                  "The requirements of OSHA's Hazard Communication Standard itself — the regulatory foundation every training program must establish. The details of the employer's written HazCom program and how to access it — employees must know it exists, where it is, and how to use it. The locations of hazardous chemicals in the work area — where chemical hazards exist in the environment. The physical and health hazards of the chemicals employees may encounter — what the chemicals can actually do to you. How to detect the presence or release of hazardous chemicals — recognizing a hazard in real time (smell, monitors, alarms, visible signs). Measures EMPLOYEES can use to protect themselves — employee-initiated protective actions (distinct from employer-provided systems). Protective measures the EMPLOYER has put into action — the three-component breakdown of work practices, emergency procedures, and PPE. Explanation of labels on shipped containers and the worksite chemical labeling system — reading and interpreting hazard-communication labels (GHS). Where Safety Data Sheets (SDSs) are located and how employees can access them — a right for ALL workers, not just safety officers. Who to contact if an issue arises — the appropriate point of contact for hazard-related concerns."
                            ]
                      }
                ],
                "phases": [
                      {
                            "id": "teach-back",
                            "label": "a Hazard Communication (HazCom) training",
                            "practice": {
                                  "mode": "coach_inquiry",
                                  "exit": {
                                        "when": {
                                              "turns": 99,
                                              "requirement": "the learner explains the 10 required topics in their own words"
                                        }
                                  },
                                  "interaction": {
                                        "opening_messages": [
                                              {
                                                    "text": "How confident are you feeling, and what's the one thing you'd want a brand-new coworker to walk away knowing?"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "Your job RIGHT NOW is only a brief, encouraging calibration chat before that begins.",
                                                    "response": "You are NOT scoring anything yet. Keep every message to 2-3 short sentences, plain-spoken and human. The learner has already seen your opening message; read their reply, acknowledge it warmly WITHOUT evaluating it, and point them to tap \"Start teaching.\""
                                              },
                                              "strong": {
                                                    "look_for": "- Accept synonyms and plain language.",
                                                    "response": "Err toward crediting when intent is clear — don't require exact terminology.\n- Topics 6 and 7 are distinct: 6 = what the EMPLOYEE does to protect themselves; 7 = employer-implemented systems (work practices, emergency procedures, PPE). Credit the more specific one; credit both only if both are clearly present.\n- Don't credit topics they never gestured at."
                                              }
                                        }
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "You'll be told the learner's final score (how many of the 10 they taught back) and which they missed.",
                                        "Write brief, warm, NON-punitive closing feedback — say it like \"you named X of 10\" (never \"you missed 3\").",
                                        "Reference one thing they did well, and name one area to hold onto (the general area of a missed topic) if any were missed. 2-3 sentences total."
                                  ],
                                  "follow_up_turns": 0
                            }
                      }
                ],
                "closing": {}
          }
    },
  },
  };

  /* Gallery order: the composable one first, since it is what POC V4 is natively. */
  /* The gallery, in order. `teach-back` is deliberately ABSENT while its blurb
     promises the one thing its output cannot do: it emits a single
     `coach_inquiry` step under "coverage is credited", and nothing credits
     coverage on a coach step — the credited-items channel ([[spotted:]]) is
     observe_react only. Retiring it is not a judgement on teach-back, which is a
     real pedagogy the content team names; it is a refusal to hand an author a
     plain coach chat wearing that name. The template object is kept below, so
     restoring it is adding one string here, once the generalized credited-items
     contract lands (V4-ALIGNMENT-NOTES §9.8).

     Note the contrast that makes this about honesty and not step count:
     `observe-react` is ALSO a single step and stays, because its blurb describes
     exactly what it produces and observe_react really does credit.

     It is also the one entry still holding a PORT rather than a production
     document — no shipped scenario teaches by teach-back, so there was nothing
     to seed it from. That is why it alone still carries a `toFill` count. Being
     out of ORDER, nobody can pick it; if the credited-items contract lands, it
     needs a real document before it goes back in the gallery. */
  const ORDER = ['mix-arc', 'guided-arc', 'branching-arc', 'ensemble-arc', 'scene-sweep', 'observe-react'];

  function list() {
    return ORDER.filter(function (k) { return TEMPLATES[k]; }).map(function (k) {
      const t = TEMPLATES[k];
      return { id: k, label: t.label, icon: t.icon, blurb: t.blurb, shape: t.shape, toFill: t.toFill };
    });
  }

  /* Always hand back a deep copy — a template is a starting point, and an LXD
     editing one must never mutate the gallery. */
  function get(id) {
    const t = TEMPLATES[id];
    return t ? JSON.parse(JSON.stringify(t.doc)) : null;
  }

  return { list: list, get: get, ORDER: ORDER };
}));
