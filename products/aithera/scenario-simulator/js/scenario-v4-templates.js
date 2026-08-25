/* ============================================================================
   scenario-v4-templates.js — the Writer Studio template gallery
   ----------------------------------------------------------------------------
   POC V4 has no scenario type field: what a scenario IS emerges from the modes
   its steps use. So seven of the UX Universal types live on here as TEMPLATES —
   starting points an LXD picks and then edits freely, rather than a declaration
   that binds the scenario to one engine path (decision D7).

   Each entry carries a complete POC V4 document, ported from that type's shipped
   exemplar. `toFill` is how many required fields the template still needs a
   human to author — deliberately non-zero: the porting tool omits what it
   cannot source rather than seeding placeholder prose (D6), so these are honest
   starting points, not finished scenarios.

   GENERATED — do not hand-edit. Regenerate with the scratchpad tool
   regenerate-templates.js after any port change.
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
       has no successor field. This template emits coach_inquiry -> roleplay ->
       roleplay -> roleplay: a straight ladder whose only branching was its name.
       The SHAPE is worth keeping (an escalating run of scenes is a real authoring
       intent, and a different one from Ensemble's multi-character disclosure
       arc) — so it is named for what it builds. The id stays `branching-arc`:
       ORDER and any saved link resolve by it, and churning an internal key buys
       nothing. */
    label: "Escalating Situation", icon: "fa-arrow-trend-up",
    blurb: "One situation that gets harder scene by scene as the learner responds to it.",
    shape: "CRRR", toFill: 24,
    doc: {
          "implementation_id": "reading-the-warning-signs",
          "modality": "ai-conversational",
          "schema_version": "4.0",
          "content": {
                "title": "Reading the Warning Signs",
                "narrative": "You are a shift supervisor at a public-sector agency — Ray’s direct supervisor, the person positioned to notice, address, and escalate. You run a shift at the agency, and Ray is one of yours — twelve years on the job, knows the work cold. A few weeks ago a lead assignment opened up, and it went to Marcus, someone newer. Ray wanted it. Since then, something’s been off.\n\nIt’s been small things, but they’re adding up. Last week he snapped at a newer colleague on shift — sharper than the moment called for. You’ve heard him mutter that “management has it out for me.” And a couple of days ago he flat refused to hand a task off to Marcus, the new lead. Any one of these you might let go. All three, in two weeks, from a steady twelve-year veteran?\n\nHe hasn’t done anything you could write up as a violation. But you know your people, and this isn’t Ray. You’re his supervisor — you’re the one positioned to notice this, deal with it, and pull in help if it needs it. The question sitting in front of you is what to do now, before it becomes something bigger.",
                "scene_world": {
                      "canon": {
                            "facts": [
                                  "The setting is a public-sector agency, kept deliberately neutral — agency, shift, unit, chain of command — so Fire, Law Enforcement, Dispatch, and EMS all fit. No state is named.",
                                  "Ray: twelve years on the job, knows the work cold. A few weeks ago a lead assignment went to Marcus, someone newer. Ray wanted it.",
                                  "The three signs, over two weeks: Ray snapped at a newer colleague on shift; he has muttered that “management has it out for me”; he flat refused to hand a task off to Marcus, the new lead.",
                                  "Ray has not yet done anything that could be written up as a violation.",
                                  "The escalation (Phase 3): a colleague forwards a message Ray posted in the crew group chat — “Marcus better watch himself. This place is going to regret what they did to me.” Ray has also called out of his last two shifts.",
                                  "The emergency (Phase 4): word reaches the learner on shift that Ray is in the parking lot and someone says he may be armed. Ray is never seen or heard directly at this level — the moment arrives as a report."
                            ]
                      },
                      "characters": [
                            {
                                  "id": "ray",
                                  "name": "Ray",
                                  "behavior": {
                                        "driver": "The grievance — the lead assignment that went to Marcus. He feels the system is against him (“me against them”)."
                                  }
                            }
                      ]
                },
                "coach_persona": "a WARM, LEVEL PEER COACH who has supervised real crews: non-judgmental, affirms before redirecting, frames gaps as growth — and treats a serious topic calmly, without sensationalizing it",
                "opening": {
                      "id": "opening_reflection",
                      "opening_messages": [
                            {
                                  "text": "Before we get into what to do — take a moment. Something about how Ray’s been acting is nagging at you. What’s your read on the situation right now? Anything standing out, or feeling hard to call?"
                            }
                      ],
                      "levels": {
                            "neutral": {
                                  "response": "CALIBRATION ONLY, do not evaluate. 2-3 short bubbles: acknowledge their read in their own words; note what they picked up on (a pattern forming vs. a mood to wait out) without grading it. END on that calibration — do NOT preview looking closer or hand off; the app delivers the next signpost."
                            }
                      }
                },
                "phases": [
                      {
                            "id": "notice",
                            "label": "Notice & Assess",
                            "practice": {
                                  "mode": "coach_inquiry",
                                  "exit": {
                                        "when": {
                                              "turns": 3,
                                              "requirement": "the learner (a) names the signs as Level 1 behaviors of concern — a pattern, not a mood, (b) starts a record, (c) reports up the chain, and (d) plans a private meeting with Ray"
                                        }
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "opening_messages": [
                                              {
                                                    "text": "Let’s take a closer look at what you’re actually seeing here."
                                              },
                                              {
                                                    "text": "Three things have reached you over the last two weeks — Ray snapped at a newer colleague, muttered that management “has it out for him,” and refused to hand a task to the new lead. In your view, what is this — and what do you do first? Walk me through your thinking."
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "explains it away (“rough month,” “he’ll cool off”), treats it as attitude rather than a pattern, jumps straight to formal discipline, or plans to confront Ray on the floor.",
                                                    "response": "Surface the Level 1 marker list; reframe: three converging signs in two weeks is a pattern, not a mood. Redirect away from public confrontation and premature discipline toward assess → document → report up."
                                              },
                                              "neutral": {
                                                    "look_for": "recognizes something’s wrong and wants to address it, but reaches for one move — “I’ll pull Ray aside” — without documenting or looping in the chain.",
                                                    "response": "Right instinct, incomplete protocol. Affirm addressing it; draw out the missing pieces: start a record, give the chain a heads-up so it’s assessed together, make the meeting private and planned."
                                              },
                                              "strong": {
                                                    "look_for": "names these as Level 1 behaviors of concern; starts a record (dates, what was observed, from whom); reports up so it’s assessed together; plans a private meeting — and still acts despite the “is it my place?” friction.",
                                                    "response": "Validate fully: that’s the Level 1 protocol — observe, document, report up, meet privately. Ahead of it instead of behind it."
                                              }
                                        }
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "NAME IT — snapping at the crew, “management has it out for me,” refusing to work with the new lead: Level 1 behaviors of concern, and three converging in two weeks from a steady veteran is a signal worth acting on, not a rough patch.",
                                        "THE LEVEL 1 PROTOCOL — observe and document (dates, what was observed, from whom — it anchors the incident log), report up the chain (never quietly absorb it; that’s an information silo), and plan a private conversation (never a floor confrontation).",
                                        "END on the two principles that carry through every level ahead: don’t sit on it, and don’t go it alone."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Let’s step back and line this up against the ladder."
                                  }
                            }
                      },
                      {
                            "id": "meeting",
                            "label": "The Conversation",
                            "practice": {
                                  "mode": "roleplay",
                                  "exit": {
                                        "when": {
                                              "turns": 6,
                                              "requirement": "the learner (a) hears the grievance without validating any threat in it, (b) sets clear limits and names corrective steps, (c) points to support (EAP), and (d) commits to document and keep the chain informed"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Step into the room"
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "character_id": "ray",
                                        "partner_label": "Ray",
                                        "opening_messages": [
                                              {
                                                    "text": "Now let’s put you in the room with Ray. Step in whenever you’re ready."
                                              },
                                              {
                                                    "text": "You’ve got a private room and twenty minutes. Ray drops into the chair across from you, arms crossed."
                                              },
                                              {
                                                    "text": "So what is this — a write-up? Because I’m the problem now? Marcus gets my job and I’m the one in here.",
                                                    "character_id": "ray"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "dismisses the grievance, threatens discipline, or dresses Ray down; meets defensiveness with more heat; leaves with no clear limits and no record.",
                                                    "response": "Ray shuts down. In the debrief, name the cost without shaming: cornering him closed the door — and set the respect-plus-limits standard."
                                              },
                                              "neutral": {
                                                    "look_for": "hears Ray out with empathy but stops there — “let’s keep things civil” — without specific limits, named steps, support, or a record.",
                                                    "response": "Ray settles but nothing concrete changes. Affirm the empathy; add the missing half: specific behavioral expectations, EAP offered as a resource, and the meeting documented."
                                              },
                                              "strong": {
                                                    "look_for": "keeps it private and calm; hears the grievance without validating any threat; sets clear limits and names corrective steps; gives Ray a stake; points to EAP; commits to document and keep the chain informed.",
                                                    "response": "Ray engages and de-escalates. Validate the both-and: the grievance stayed real AND the line held."
                                              }
                                        },
                                        "input_placeholder": "Respond to Ray…",
                                        "carryover": [
                                              {
                                                    "from": "notice"
                                              }
                                        ]
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "HOLD BOTH AT ONCE — let the frustration be real and give Ray a stake (being passed over stung; that can be true without excusing the behavior), AND set firm limits: the specific behavior that has to change and the corrective steps you expect.",
                                        "Empathy without limits leaves nothing to hold.",
                                        "RESPECT, NOT PUNISHMENT — private and dignified, with EAP offered as a real resource, not a threat; public or punitive handling hardens the grievance.",
                                        "PUT IT ON THE RECORD — document what was discussed and agreed, and keep the chain informed.",
                                        "You are still not carrying this alone."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Let’s unpack how that landed."
                                  }
                            }
                      },
                      {
                            "id": "escalation",
                            "label": "It Escalates",
                            "practice": {
                                  "mode": "roleplay",
                                  "exit": {
                                        "when": {
                                              "turns": 3,
                                              "requirement": "the learner (a) recognizes this as a Level 2 credible threat, (b) secures the people at risk right now — starting with Marcus, (c) notifies the chain and involves 911/security if warranted, and (d) preserves the message without confronting Ray alone"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Keep going"
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "character_id": "ray",
                                        "partner_label": "Ray",
                                        "opening_messages": [
                                              {
                                                    "text": "A week goes by, and something new lands on your desk. Back to you."
                                              },
                                              {
                                                    "text": "A colleague forwards you a message Ray posted in the crew group chat: “Marcus better watch himself. This place is going to regret what they did to me.” Ray has also called out of his last two shifts. What do you do — specifically?"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "keeps treating it as a performance issue — “I’ll call Ray and let him explain” — or tries to resolve a credible threat one-on-one; doesn’t recognize the level changed.",
                                                    "response": "Name it: a credible threat toward a specific person is not a coaching moment. Redirect: secure Marcus, notify the chain, involve security/911 per the plan, never confront Ray solo."
                                              },
                                              "neutral": {
                                                    "look_for": "reports it and preserves the message — right instinct — but stops at logging it, without closing the loop on protecting Marcus and the crew right now.",
                                                    "response": "Affirm reporting and preserving; convert “logged” into “secured”: make sure the people at risk are protected in the moment, not just that it’s on record."
                                              },
                                              "strong": {
                                                    "look_for": "names it as Level 2 — a credible threat, “me against them”; secures the people at risk, notifies the chain immediately, involves 911/security if imminent, preserves the message, and does not confront Ray alone.",
                                                    "response": "Confirm the Level 2 response: safety first, escalate through the chain, document, don’t go it alone."
                                              }
                                        },
                                        "input_placeholder": "What do you do — specifically?",
                                        "carryover": [
                                              {
                                                    "from": "notice"
                                              },
                                              {
                                                    "from": "meeting"
                                              }
                                        ]
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "THE LEVEL HAS CHANGED — “me against them,” a named target, a threat that others will regret it: Level 2 escalation markers, not venting.",
                                        "The moment a credible threat appears, the goal shifts from correcting behavior to protecting people — STOP COACHING.",
                                        "THE LEVEL 2 RESPONSE — secure safety first (Marcus and anyone at risk protected right now, not just on record), notify the chain immediately and follow the agency’s WVPP, involve 911/security if the threat is imminent, preserve the message and document, and never try to talk Ray down solo.",
                                        "WHY IT MATTERS — speed over certainty: you don’t have to be sure it’s real to act; securing safety and notifying is correct even if it de-escalates.",
                                        "Stay calm and factual — your job is routing this to the right people, fast.",
                                        "If the state line says the Level 1 groundwork was never established, name it plainly and without shaming: the record that wasn’t started is exactly what the incident log needed today."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Let’s name what just changed."
                                  }
                            }
                      },
                      {
                            "id": "emergency",
                            "label": "Emergency",
                            "practice": {
                                  "mode": "roleplay",
                                  "exit": {
                                        "when": {
                                              "turns": 3,
                                              "requirement": "the learner (a) calls 911 and the agency’s emergency contacts, (b) secures their own safety, (c) accounts for and moves others to safety, and (d) defers to law enforcement — ready with a description and exact location"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Step into the moment"
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "character_id": "ray",
                                        "partner_label": "Ray",
                                        "opening_messages": [
                                              {
                                                    "text": "It’s not over. One more moment — step in when you’re ready."
                                              },
                                              {
                                                    "text": "Word reaches you on shift: Ray is in the parking lot, and someone says he may be armed. This is a decision point, not a conversation. What do you do — right now?"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "tries to intervene personally — goes out to “talk Ray down” — or delays calling for help to confirm the report first.",
                                                    "response": "Name it as a Level 3 emergency and redirect hard: 911 first, secure your own safety, do not approach. Heroics endanger the learner and everyone else."
                                              },
                                              "neutral": {
                                                    "look_for": "calls 911 — the right first move — but stops short: doesn’t account for and move others, or isn’t ready to give responders a description and exact location.",
                                                    "response": "Affirm calling it in; add the missing steps: protect yourself, account for the crew, cooperate with responders."
                                              },
                                              "strong": {
                                                    "look_for": "calls 911 and the agency’s emergency contacts, secures their own safety, accounts for and moves others, and defers to law enforcement with a description and location ready — and thinks past the moment to the incident log and the WVPP.",
                                                    "response": "Confirm the Level 3 response: call it in, protect people, let law enforcement run it. Respond correctly — don’t be the hero."
                                              }
                                        },
                                        "input_placeholder": "What do you do, right now?",
                                        "carryover": [
                                              {
                                                    "from": "notice"
                                              },
                                              {
                                                    "from": "meeting"
                                              }
                                        ]
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "IT’S AN EMERGENCY — a weapon or direct threat is Level 3: your role is fast, correct decisions, not confronting or resolving it yourself. 911 comes FIRST — don’t wait to confirm; err toward calling it in.",
                                        "PROTECT PEOPLE — your own safety first (you can’t help anyone from harm’s way), then account for and move the crew, and cooperate with law enforcement: description and exact location ready.",
                                        "CLOSE THE LOOP — afterward, record it in the violent-incident log and follow the agency’s WVPP.",
                                        "Then land the through-line of the whole ladder: every level came back to the same two principles — don’t sit on information, and don’t go it alone."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Let’s walk back through those decisions."
                                  }
                            }
                      }
                ],
                "closing": {
                      "ideal_response": {
                            "component_groups": [
                                  {
                                        "components": [
                                              "Intimidation, disrespect, a hardening grievance, refusing to cooperate: behaviors of concern.",
                                              "Observe, document, report up your chain, and meet privately to set limits with respect."
                                        ],
                                        "title": "Level 1 — early warning signs"
                                  },
                                  {
                                        "components": [
                                              "The moment a credible threat appears, stop coaching.",
                                              "Secure the people at risk, notify the chain, involve 911/security if warranted, and preserve the evidence."
                                        ],
                                        "title": "Level 2 — a credible threat"
                                  },
                                  {
                                        "components": [
                                              "It’s an emergency: call 911 and your agency’s emergency contacts, put personal safety first, account for others, and cooperate with law enforcement."
                                        ],
                                        "title": "Level 3 — a weapon or direct threat"
                                  },
                                  {
                                        "components": [
                                              "Recognizing and responding to workplace violence is about reading which level you’re on — and changing your response the moment the level changes."
                                        ],
                                        "title": "Match the response to the level"
                                  },
                                  {
                                        "components": [
                                              "Record behaviors, meetings, and steps taken in the violent-incident log, and follow your agency’s Workplace Violence Prevention Plan."
                                        ],
                                        "title": "Document throughout"
                                  },
                                  {
                                        "components": [
                                              "The incidents that go wrong are almost always the ones somebody kept to themselves.",
                                              "Report up, loop others in, and treat every level as a chain-of-command job, never a solo one."
                                        ],
                                        "title": "Don’t sit on it — don’t go it alone"
                                  }
                            ]
                      }
                },
                "elevated_stakes": true
          }
    },
  },
  "ensemble-arc": {
    label: "Ensemble", icon: "fa-users",
    blurb: "Several characters, disclosure earned across scenes.",
    shape: "RRRC", toFill: 21,
    doc: {
          "implementation_id": "the-call-from-home",
          "modality": "ai-conversational",
          "schema_version": "4.0",
          "content": {
                "title": "The Call from Home",
                "narrative": "You are Sofia’s 7th-grade teacher — the same adult across all four phases, the one who has to carry this from the first report to the follow-through. You teach 7th grade at Pleasant Street Middle School. Sofia joined your class this year — quiet, a little shy, happiest with a sketchbook open. For the first few months she seemed to be settling in. Lately, though, something’s off. She’s stopped raising her hand. She eats lunch alone. Last week you found her lingering in your room during passing period, like she didn’t want to go back out into the hall.\n\nYou told yourself you’d keep an eye on it. Then this morning you got a message: Sofia’s mother has asked to meet with you before first period. She took time off work to come in.\n\nNow she’s sitting across from you. She looks tired, and worried, and like she’s been holding something in for a while. You can tell this isn’t a small thing.",
                "scene_world": {
                      "canon": {
                            "facts": [
                                  "Setting: Pleasant Street Middle School (grades 6–8), a FICTIONAL school. No state is named, so nothing binds this to any district or state policy. The story spans about one week.",
                                  "The learner is Sofia’s 7th-grade teacher — the same adult across all four phases.",
                                  "Sofia Reyes (12, 7th grade): quiet, artistic, new to the school this year. US-born; her family emigrated from Guatemala; Spanish and English at home.",
                                  "Ms. Elena Reyes: Sofia’s mother. Works two jobs and took time off to come in. Protective, and already feels brushed off once by the school.",
                                  "Bianca Duarte (12, 7th grade): the ringleader — socially dominant, popular. NOT a \"bad kid\"; she is reacting to her own turmoil.",
                                  "Maya films the hallway incident on her phone; Bianca shoves Sofia’s bag off her shoulder; ~5–6 other students watch, two laughing.",
                                  "The pattern (~3 months, escalating): exclusion (dropped from Bianca’s group, seats saved so Sofia can’t sit, eats alone); a group chat \"the REAL 7B\" Sofia isn’t in, with screenshots mocking her clothes and calling her family \"border hoppers\" and \"does she even have papers\"; identity comments about where the family is \"really from\" and mocking Ms. Reyes’s accent; yesterday a girl knocked Sofia’s binder to the floor and no one helped.",
                                  "Sofia’s changes: stopped eating lunch, fakes stomachaches to stay home, deleted her art account, cries at night, \"doesn’t want to come to school.\"",
                                  "Ms. Reyes’s past attempts (she raises these when she feels doubted): emailed the office three weeks ago and got a generic reply; left the counselor a voicemail that was never returned; at parent night was told \"girls that age are catty, it blows over.\" \"I already tried the normal way.\"",
                                  "The hallway (Phase 2): three days later, before 2nd period in the east hallway. Sofia is backed against the lockers; Maya is filming; Bianca shoves her bag off her shoulder and books hit the floor; Bianca says the slur, loud enough for the hall to hear — \"Go back to your own country\" / \"does your mom even have papers?\"; ~5–6 students watch, two laugh, someone says \"worldstar.\" Sofia is shaken but not injured (a minor scrape). The recording is the reportable escalation — it may be posted.",
                                  "Bianca (Phase 3), same day while Sofia is with the counselor: her deflections in escalation order — \"It was a joke\"; \"Everyone was doing it — why am I the only one here?\"; \"She’s too sensitive; she took it wrong\"; \"I didn’t even touch her; it was just her bag\"; and if shamed, she shuts down: \"So I’m just the bad guy now.\"",
                                  "Bianca’s backstory (surfaces ONLY if the learner asks with dignity): her parents separated over the summer and she’s splitting time between two houses; an older group dropped her, so she \"did it first\" to Sofia to stay on top; she is not proud of the family comments — \"my abuela’s from Mexico, it’s not like —\" (she trails off).",
                                  "The close (Phase 4) is POLICY-AGNOSTIC: report the incident yourself and follow the school’s process (whatever it is — never a specific form, statute, or timeline); build Sofia’s support plan WITH the family (passing-period/schedule adjustments so she avoids the group, a named check-in adult, a counselor referral, Sofia’s own voice — never mediation); follow up with Ms. Reyes as promised; and name one preventive/climate step."
                            ]
                      },
                      "characters": [
                            {
                                  "id": "ms-reyes",
                                  "name": "Ms. Reyes",
                                  "behavior": {
                                        "driver": "Fear for Sofia, sharpened by having been dismissed before. She is not looking for a fight — she is looking for ONE adult who will actually act."
                                  },
                                  "canon_facts": [
                                        {
                                              "fact": "the past inaction — the ignored email three weeks ago, the counselor voicemail never returned, being told at parent night that \"girls that age are catty.\""
                                        },
                                        {
                                              "fact": "the documentary evidence — the group chat \"the REAL 7B\" and the screenshots someone sent her."
                                        },
                                        {
                                              "fact": "the identity angle — the \"where are you really from,\" the \"does she even have papers,\" the mocking of her own accent."
                                        }
                                  ]
                            },
                            {
                                  "id": "bianca",
                                  "name": "Bianca",
                                  "behavior": {
                                        "driver": "Her own turmoil — her parents separated over the summer and an older group dropped her, so she \"did it first\" to Sofia to keep from being the one on the outside. She NEVER announces this; it only leaks when she’s treated with dignity."
                                  },
                                  "canon_facts": [
                                        {
                                              "fact": "her backstory — the parents’ separation and splitting two houses, being dropped by her old group and \"doing it first,\" and that she’s not actually proud of the family comments (\"my abuela’s from Mexico, it’s not like —\")."
                                        }
                                  ]
                            }
                      ]
                },
                "coach_persona": "a WARM, STEADY PEER COACH who has taught middle school and sat in these meetings: non-judgmental, affirms before redirecting, frames gaps as growth, and never lets the weight of the topic turn preachy",
                "phases": [
                      {
                            "id": "report",
                            "label": "The Report",
                            "practice": {
                                  "mode": "roleplay",
                                  "exit": {
                                        "when": {
                                              "turns": 6,
                                              "requirement": "the learner (a) believes and validates her FIRST, (b) draws out the pattern — harm + an unfair match (a group against one child) + repetition over months — and names the identity angle, and (c) commits to report it personally and support Sofia, holding honest boundaries (no over-promising a punishment, no mediation)"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Talk to Ms. Reyes"
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "character_id": "ms-reyes",
                                        "partner_label": "Ms. Reyes",
                                        "opening_messages": [
                                              {
                                                    "text": "Ms. Reyes just sat down and is ready to tell you why she’s here."
                                              },
                                              {
                                                    "text": "Thank you for seeing me. Sofia doesn’t want to come to school anymore — this morning she was crying and wouldn’t get in the car. I know there’s a group of girls picking on her, and it’s been going on a long time. I need someone here to actually help her.",
                                                    "character_id": "ms-reyes"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "minimizes or interrogates — \"are you sure it’s not just drama?\", cross-examines her for proof, treats it as girl-conflict.",
                                                    "response": "She guards, discloses less, cites the earlier inaction, and may threaten the principal. In the debrief name — without shaming — that leading with doubt cost her trust, and deliver the three-element test (harm + unfair match + repetition) and the identity weight in full."
                                              },
                                              "neutral": {
                                                    "look_for": "warm and takes it seriously but moves to logistics/policy too fast, or gathers thinly — doesn’t draw out the full pattern or misses the identity angle.",
                                                    "response": "Affirm the belief and commitment; fill the recognition gap out loud: name it as bullying via harm + unfair match + repetition, and flag the identity-based comments as added weight."
                                              },
                                              "strong": {
                                                    "look_for": "believes and validates first; gathers with open questions; surfaces harm + unfair match + repetition AND the identity angle; commits to report personally + support + partnership; holds honest boundaries (no over-promise, no mediation).",
                                                    "response": "She softens, shares the screenshots and the \"papers\" comments, names the past inactions with relief, becomes a partner. Validate the model version and note the promise to circle back carries into Phase 4."
                                              }
                                        },
                                        "input_placeholder": "Respond to Ms. Reyes…"
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "THE RECOGNITION FRAME every learner leaves with: this is bullying — there’s harm, an unfair match (a group against one child), and repetition over months — and it’s identity-based, which makes it more serious, the kind of thing school policy treats with added weight.",
                                        "BELIEVE FIRST — believing her is what lets you get the facts at all; leading with doubt costs the trust you need.",
                                        "YOUR JOB — believe, recognize, report it yourself through the school’s process, and support Sofia; never mediate between target and bully, and never promise a specific punishment.",
                                        "If the state line shows she left guarded, name gently that the follow-up you owe her is heavier now — and that it still has to happen."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "That was a real conversation. Let’s step back and talk about what Ms. Reyes brought you — and what it adds up to."
                                  }
                            }
                      },
                      {
                            "id": "hallway",
                            "label": "The Hallway",
                            "practice": {
                                  "mode": "roleplay",
                                  "exit": {
                                        "when": {
                                              "turns": 3,
                                              "requirement": "the learner intervenes immediately — stops it, checks Sofia’s safety, addresses the WHOLE group (the students recording and laughing, not just the shover), and treats the recording and the slur as reportable"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Continue"
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "character_id": "ms-reyes",
                                        "partner_label": "Ms. Reyes",
                                        "opening_messages": [
                                              {
                                                    "text": "Ms. Reyes is expecting action. A few days later, before you’ve done everything you meant to, it happens in front of you — and there’s no time to think it over."
                                              },
                                              {
                                                    "text": "You round the corner into the east hallway. Sofia is backed against the lockers. Bianca knocks Sofia’s bag off her shoulder — books hit the floor — and says it loud enough for the hall to hear: \"Go back to your own country — does your mom even have papers?\" Maya has her phone up, filming. Kids are watching; two are laughing. What do you do — right now?"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "waits, observes, or says \"I’ll keep an eye on it\"; plans to step in only if it worsens.",
                                                    "response": "Name that a witnessed incident is the exception to \"keep an eye on it\" — waiting let it escalate on camera. Deliver the intervene-now standard: stop it, check safety, address everyone."
                                              },
                                              "neutral": {
                                                    "look_for": "steps in and stops the shover but addresses only Bianca — ignores Maya’s phone and the laughing crowd, or skips the safety check.",
                                                    "response": "Affirm stepping in; close the gap: the recording and the bystanders are part of the harm, and the recording is reportable even if you don’t know who’ll post it."
                                              },
                                              "strong": {
                                                    "look_for": "intervenes immediately — stops it, phones down, checks Sofia’s safety/injury, addresses the whole group (recorders and laughers included), names it as seen and reportable, and separates Bianca to talk rather than confronting her in the crowd.",
                                                    "response": "Confirm the immediate-intervention standard and that separating Bianca sets up accountability done right."
                                              }
                                        },
                                        "input_placeholder": "What do you do — right now?",
                                        "carryover": [
                                              {
                                                    "from": "report"
                                              }
                                        ]
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "WHEN YOU WITNESS IT, YOU INTERVENE IMMEDIATELY — you don’t wait or just watch.",
                                        "Stop it, check that Sofia is safe, and address the WHOLE group: the students recording and laughing are causing harm too.",
                                        "The slur and the recording are REPORTABLE, even if you don’t know who’ll post it — the recording is what can follow Sofia home.",
                                        "Separating Bianca (not confronting her in front of the crowd, and never asking Sofia to work it out) is what sets up the accountability conversation next."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "That happened fast. Let’s slow it down and look at what you did — and what a moment like that asks of you."
                                  }
                            }
                      },
                      {
                            "id": "followup",
                            "label": "The Follow-Up",
                            "practice": {
                                  "mode": "roleplay",
                                  "exit": {
                                        "when": {
                                              "turns": 5,
                                              "requirement": "the learner holds her accountable WITH dignity — focuses on the behavior not her character, names a clear consequence AND that it’ll be monitored, gets at what’s driving it, and does NOT shame her or offer to bring Sofia in (mediation)"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Sit down with Bianca"
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "character_id": "ms-reyes",
                                        "partner_label": "Ms. Reyes",
                                        "opening_messages": [
                                              {
                                                    "text": "Sofia’s safe with the counselor now. Bianca is waiting in an empty classroom down the hall. This one’s hard."
                                              },
                                              {
                                                    "text": "You sit down across from Bianca. She’s got her arms crossed before you’ve said anything."
                                              },
                                              {
                                                    "text": "It was a joke. Everyone was doing it — why am I the only one in here? Sofia’s just too sensitive.",
                                                    "character_id": "bianca"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "shames or labels (\"you’re a bully\"), jumps to one-size punishment with no behavior focus, lets her off with \"don’t do it again,\" or offers to bring Sofia in.",
                                                    "response": "She hardens or disengages. In the debrief, name — without shaming the learner — that labeling closed the door and that mediation is unsafe given the power mismatch; model behavior-focus + dignity."
                                              },
                                              "neutral": {
                                                    "look_for": "firm-ish and not shaming, but stays surface — names the behavior lightly, leaves the consequence vague, doesn’t reach root cause or set monitoring.",
                                                    "response": "She stops deflecting but hasn’t really landed. Add the missing pieces: a clear consequence, explicit monitoring, and a real question about what’s driving it."
                                              },
                                              "strong": {
                                                    "look_for": "treats her with dignity, behavior not character; states a clear consequence AND that behavior will be monitored; explores root cause; does not mediate.",
                                                    "response": "She drops the act by degrees and may reveal her backstory. Validate the model and note that understanding the root cause is not excusing it — and that the monitoring you named carries into the close."
                                              }
                                        },
                                        "input_placeholder": "Respond to Bianca…",
                                        "carryover": [
                                              {
                                                    "from": "report"
                                              }
                                        ]
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "ACCOUNTABILITY WITH DIGNITY — focus on the behavior, not her character (\"what you did was serious\" keeps the door to change open in a way \"you’re a bully\" never can); get at what’s driving it; state a CLEAR consequence and that you’ll be monitoring; and follow through.",
                                        "NEVER shame her, NEVER mediate, and NEVER make Sofia \"work it out\" with her — the power mismatch makes that unsafe.",
                                        "Understanding the root cause is not excusing the behavior; it’s what makes the change stick."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "That’s one of the hardest conversations there is. Let’s step back and talk about how it landed with Bianca."
                                  }
                            }
                      },
                      {
                            "id": "close",
                            "label": "Close the Loop",
                            "practice": {
                                  "mode": "coach_inquiry",
                                  "exit": {
                                        "when": {
                                              "turns": 4,
                                              "requirement": "the learner (a) files the report personally and follows the school’s process, (b) builds Sofia’s support plan WITH the family (safety/schedule, a named check-in adult, a counselor referral, Sofia’s voice — not mediation), (c) keeps the promise to Ms. Reyes by following up, and (d) names at least one preventive/climate step"
                                        }
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "opening_messages": [
                                              {
                                                    "text": "It’s the end of the day. Sofia is safe; Bianca has been spoken to. What’s left is the part only you can carry."
                                              },
                                              {
                                                    "text": "On your desk: the incident report to finish, the call you promised Ms. Reyes, and a decision about what to put in place so this doesn’t keep happening."
                                              },
                                              {
                                                    "text": "Where do you start — and what do you do to close this out for Sofia?"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "response": "treats it as done — hands the report to someone else, skips the family, forgets the follow-up call, or offers mediation as the \"support plan.\" Name what’s left undone without shaming: filing it yourself, calling her mom back, and a real plan around Sofia are what turn \"reported\" into \"resolved.\""
                                              },
                                              "neutral": {
                                                    "look_for": "completes the report and supports Sofia but thinly — no family partnership, forgets to close the loop with Ms.",
                                                    "response": "Reyes, or names no preventive step. Complete it: partner with the family on the plan, keep the promised call, and name one preventive/climate step."
                                              },
                                              "strong": {
                                                    "look_for": "files the report personally and follows the school’s process; builds Sofia’s plan WITH the family (safety/schedule, check-in adult, counselor, Sofia’s voice — not mediation); calls Ms.",
                                                    "response": "Reyes as promised; names a preventive step. Validate the full close and tie it back: the follow-up promised in Phase 1 is the loop just closed — that’s what carrying a situation looks like."
                                              }
                                        }
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "CLOSING THE LOOP is four things: report it YOURSELF and follow your school’s process; build Sofia’s support plan WITH her family — safety and schedule, a named check-in adult, a counselor, her own voice, NOT mediation; keep the promise you made to Ms.",
                                        "Reyes; and take at least one preventive step so the climate changes, not just this case.",
                                        "The follow-up you promised in that first meeting is the loop you just closed — belief to resolution, carried by one adult who didn’t let it drop."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "You carried this a long way. Let’s make sure the loop is fully closed."
                                  }
                            }
                      }
                ],
                "closing": {
                      "ideal_response": {
                            "component_groups": [
                                  {
                                        "components": [
                                              "When a parent or student brings you months of exclusion, a group chat, and comments about a family, that’s not \"drama.\" Believing them first is what lets you get the facts at all."
                                        ],
                                        "title": "Believe the report — even secondhand"
                                  },
                                  {
                                        "components": [
                                              "Bullying is harm, an unfair match (a group against one child), and repetition — and targeting who a student is (their identity or background) makes it more serious, the kind of thing policy treats with added weight."
                                        ],
                                        "title": "Recognize it: harm + unfair match + repetition"
                                  },
                                  {
                                        "components": [
                                              "Stop it, check the target’s safety, and address the whole group — the students recording and laughing cause harm too.",
                                              "A recording is reportable even if you don’t know who will post it."
                                        ],
                                        "title": "Intervene immediately when you witness it"
                                  },
                                  {
                                        "components": [
                                              "Focus on the behavior, not the child; get at the root cause; set a clear consequence and monitor it.",
                                              "Never shame, and never make the target \"work it out\" with them."
                                        ],
                                        "title": "Respond to the student who bullied with dignity"
                                  },
                                  {
                                        "components": [
                                              "Report it personally, following your school’s process.",
                                              "Peer mediation between a target and the student who bullied is unsafe given the power mismatch."
                                        ],
                                        "title": "Report yourself — never mediate"
                                  },
                                  {
                                        "components": [
                                              "Build the support plan WITH the family, keep your promises to the parent, and take at least one preventive step so the climate changes — not just this one case."
                                        ],
                                        "title": "Support, partner, and prevent"
                                  }
                            ]
                      }
                },
                "elevated_stakes": true,
                "involves_minors": true
          }
    },
  },
  "guided-arc": {
    label: "Guided Arc", icon: "fa-route",
    blurb: "Coach-led reasoning that builds to one scene at the end.",
    shape: "CCR", toFill: 24,
    doc: {
          "implementation_id": "bystander-intervention-the-marshall-scenario",
          "modality": "ai-conversational",
          "schema_version": "4.0",
          "content": {
                "title": "Bystander Intervention: The Marshall Scenario",
                "narrative": "You are a CO-WORKER who has witnessed incidents involving a colleague named Marshall — an administrative assistant, eight months into the job. You’ve been working alongside Marshall for about eight months. He’s an administrative assistant — organized, a good communicator, clearly someone who takes his job seriously. But lately, he’s not himself.\n\nIt started with Ethan, the project manager. He’d greet Marshall with “Hey Marsha!” in the hallway. A couple of times he asked if Marshall had a skirt on “under that desk.” Marshall let it go. He thought some joking might come with the job — especially given the way he dresses. So he tried not to make it a thing.\n\nThen Jake started. A junior engineer, hired not long after Marshall. He’d ask if the coffee was made whenever he passed Marshall’s desk. He’d refer to Marshall’s role as a “cozy lady job.” What started as occasional became almost daily. The kind of remark that gets a few laughs and then everyone moves on — except Marshall doesn’t move on. He carries it.\n\nWhat Marshall didn’t know, not at first, was that there was a group chat. Someone eventually showed him: sexist memes, jokes. And two altered images — one with his face on a woman in a frilly princess dress, another with his face on a lingerie model’s body, captioned “Marsha’s true calling.”\n\nHe was going to try to let it go. Until those images ended up on public social media — shareable, commentable, out there.\n\nYou’ve seen most of the day-to-day. Marshall has gotten quieter — he keeps his head down, doesn’t linger. You’re not sure what to call any of it, or what your role is.",
                "scene_world": {
                      "characters": [
                            {
                                  "id": "jake",
                                  "name": "Jake"
                            }
                      ]
                },
                "coach_persona": "a PRECISE, WARM PEER COACH: knowledgeable about employment law, but never clinical, preachy, or lecturing. You affirm the learner’s instinct before you sharpen it, and you never shame a response",
                "teaching_points": [
                      {
                            "topic": "The Law",
                            "points": [
                                  "Title VII covers gender-stereotype conduct; no explicit advance and no job threat required; same-sex is fully covered; report — HR, documented, soon."
                            ]
                      }
                ],
                "opening": {
                      "id": "opening_reflection",
                      "opening_messages": [
                            {
                                  "text": "Before we get into the specifics — take a moment. What’s your gut reaction to this behavior? Is anything about this situation standing out to you, or feeling unclear?"
                            }
                      ],
                      "levels": {
                            "neutral": {
                                  "response": "CALIBRATION ONLY, do not evaluate. 2-3 short bubbles: acknowledge in their own words; gently note any misconception (\"nothing sexual is happening\", \"just banter\"). END on that calibration — do NOT add a bubble that hands off, transitions, or previews looking closer / slowing down / naming what’s going on; the app delivers the next signpost, and anticipating it just repeats it."
                            }
                      }
                },
                "phases": [
                      {
                            "id": "legal",
                            "label": "The Law",
                            "practice": {
                                  "mode": "coach_inquiry",
                                  "exit": {
                                        "when": {
                                              "turns": 2
                                        }
                                  },
                                  "answer_shape": "determinate",
                                  "interaction": {
                                        "opening_messages": [
                                              {
                                                    "text": "Now let’s take a closer look at what’s actually happening here."
                                              },
                                              {
                                                    "text": "Based on what you know about workplace harassment — think through what Marshall is experiencing. In your view, does this qualify as sexual harassment? Walk through your reasoning."
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "conflates harassment with explicit sexual acts / quid pro quo; floats Marshall’s dress or his \"expected some joking\" as mitigating; calls it \"just teasing\" or bullying.",
                                                    "response": "Address the \"he knew / how he dresses\" framing head-on: anticipating mistreatment doesn’t make it legal, and presentation is not consent. Explain the TWO types of harassment. Conclude: sex-based harassment under Title VII, and Marshall should report."
                                              },
                                              "neutral": {
                                                    "look_for": "senses it’s wrong and targeted, stuck on quid pro quo (\"no one’s demanding anything\").",
                                                    "response": "Affirm the gender-targeting read; distinguish quid pro quo from hostile work environment (pervasive gender-based conduct making the workplace intimidating qualifies — no exchange required). Confirm: yes, Title VII, report it."
                                              },
                                              "strong": {
                                                    "look_for": "names gender stereotyping, applies the hostile-work-environment standard, notes it need not be explicitly sexual (maybe same-sex coverage).",
                                                    "response": "Validate; add same-sex coverage if unspoken; note the public images are a MAJOR escalation making prompt, documented reporting urgent."
                                              }
                                        }
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "Title VII covers gender-stereotype conduct; no explicit advance and no job threat required; same-sex is fully covered; report — HR, documented, soon."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "This question does have a right and wrong answer, so let’s step back and make the law on this clear."
                                  }
                            }
                      },
                      {
                            "id": "empathy",
                            "label": "The Person",
                            "practice": {
                                  "mode": "coach_inquiry",
                                  "exit": {
                                        "when": {
                                              "turns": 2
                                        }
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "opening_messages": [
                                              {
                                                    "text": "Now let’s set the law aside and make this human."
                                              },
                                              {
                                                    "text": "Think about Marshall as a person. What do you think this situation is doing to him — professionally and personally? And how could it affect others in your workplace?"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "minimizes as embarrassment/annoyance, \"just jokes\", \"brush it off\", treats it as a matter of resilience.",
                                                    "response": "Gently challenge the brush-off; introduce the cost: sustained harassment links to anxiety, performance decline, loss of motivation. Ask what it would cost Marshall to keep \"staying professional\" every day."
                                              },
                                              "strong": {
                                                    "look_for": "names anxiety, dread, the public-image violation, pulling back.",
                                                    "response": "Affirm; extend to the career dimension (eight months in — a credibility-building window) AND the team dimension: unchallenged conduct resets what feels normal for everyone watching. That’s the bystander bridge."
                                              }
                                        }
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Let’s pause and pull this together."
                                  }
                            }
                      },
                      {
                            "id": "scene",
                            "label": "The conversation",
                            "practice": {
                                  "mode": "roleplay",
                                  "exit": {
                                        "when": {}
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "character_id": "jake",
                                        "partner_label": "Jake",
                                        "input_placeholder": "What do you do or say?"
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "a quick honest read of what they did across both actions (quote a word or two); the point that lands it — silence/uncertainty reads as permission to Jake and as no-one-seeing to Marshall, and a witness stepping in resets what the team treats as normal; then name the three moves to carry — Pick an Action, Offer Support (check in with Marshall privately after), Consider Escalating (a witness can report to HR, documented; check the org’s policy)."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Moments like that are worth unpacking. Let’s look at the choice you made and think about what it signaled to both Marshall and Jake."
                                  }
                            }
                      }
                ],
                "closing": {
                      "ideal_response": {
                            "component_groups": [
                                  {
                                        "components": [
                                              "Gender-stereotype-based conduct is sex-based harassment under Title VII — even without explicit sexual advances or a quid pro quo exchange."
                                        ],
                                        "title": "Know what actually qualifies"
                                  },
                                  {
                                        "components": [
                                              "Pervasive, gender-based conduct that makes the workplace intimidating qualifies — and it affects everyone in that environment, not only the primary target."
                                        ],
                                        "title": "Apply the hostile work environment standard"
                                  },
                                  {
                                        "components": [
                                              "Title VII protections apply regardless of the gender relationship between the harasser and the target."
                                        ],
                                        "title": "Same-sex harassment is fully covered"
                                  },
                                  {
                                        "components": [
                                              "The test is impact and context — not whether the harasser meant it as a joke."
                                        ],
                                        "title": "Intent doesn’t determine harassment"
                                  },
                                  {
                                        "components": [
                                              "Sustained harassment causes documented psychological and career harm and reshapes the whole team’s sense of what’s normal. “Just jokes” is never an accurate frame."
                                        ],
                                        "title": "The cumulative weight is real"
                                  },
                                  {
                                        "components": [
                                              "To HR, documented, with specific incidents, dates, and witnesses.",
                                              "The public images make it urgent."
                                        ],
                                        "title": "Marshall should report — immediately"
                                  },
                                  {
                                        "components": [
                                              "A direct signal (“that’s not cool”) or an indirect redirect (“Hey Jake, what’s the update on Henderson?”) changes the dynamic.",
                                              "Direct confrontation is one option — not the only one.",
                                              "Others will support you."
                                        ],
                                        "title": "Pick an action in the moment"
                                  },
                                  {
                                        "components": [
                                              "Check in with the targeted person privately after the moment passes — it tells them they aren’t invisible."
                                        ],
                                        "title": "Offer support"
                                  },
                                  {
                                        "components": [
                                              "Review your organization’s harassment policy — it may define specific obligations for employees who witness conduct like this.",
                                              "Bystanders can report independently of what Marshall decides to do."
                                        ],
                                        "title": "Consider escalating"
                                  }
                            ]
                      }
                }
          }
    },
  },
  "mix-arc": {
    label: "Mix & Match", icon: "fa-shuffle",
    blurb: "Compose the arc step by step — pick coach, roleplay or observe per step.",
    shape: "COR", toFill: 23,
    doc: {
          "implementation_id": "speaking-up-in-the-moment",
          "modality": "ai-conversational",
          "schema_version": "4.0",
          "content": {
                "title": "Speaking Up in the Moment",
                "narrative": "You are the team lead — the person in the room with the standing to say something. You lead a small team. In this morning's stand-up, Dana — one of your senior engineers — cut off Priya twice while she was walking through her design, then re-explained her own point back to the room as if it were his. Priya went quiet for the rest of the meeting. A couple of people noticed; nobody said anything. Now the room is clearing out, and Dana is still at the table, packing up his laptop.",
                "scene_world": {
                      "characters": [
                            {
                                  "id": "dana",
                                  "name": "Dana",
                                  "behavior": {
                                        "baseline": "A strong senior engineer who's used to being the smartest voice in the room and doesn't track how much space he takes.",
                                        "driver": "He wants to be seen as the one who drives good outcomes — being told he stepped on someone reads, at first, as being told he's a bad guy."
                                  }
                            }
                      ]
                },
                "coach_persona": "a warm, steady peer coach — non-judgmental, affirming before redirecting, framing gaps as growth",
                "teaching_points": [
                      {
                            "topic": "Name what happened",
                            "points": [
                                  "Interrupting someone twice and re-voicing their idea as your own is a respect problem, not a style quirk — and the person with standing in the room owns addressing it."
                            ]
                      }
                ],
                "opening": {
                      "id": "opening_reflection",
                      "opening_messages": [
                            {
                                  "text": "Before we break this down — gut read: what just happened in that stand-up, and does it need anything from you?"
                            }
                      ],
                      "levels": {
                            "neutral": {
                                  "response": "Whatever they say, take it as a calibration read, not an answer. Reflect it back in a line, name that we'll test it against what respect actually requires, and hand into the first beat. Never grade this."
                            }
                      }
                },
                "phases": [
                      {
                            "id": "name-it",
                            "label": "Name what happened",
                            "practice": {
                                  "mode": "coach_inquiry",
                                  "exit": {
                                        "when": {
                                              "turns": 2,
                                              "requirement": "the learner names the pattern (interrupting + taking credit) as disrespect worth addressing, not \"just how meetings go\", and can say why it matters (it silenced Priya and the room let it stand)"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Think it through"
                                  },
                                  "answer_shape": "determinate",
                                  "interaction": {
                                        "opening_messages": [
                                              {
                                                    "text": "First, let's get precise. Dana talked over Priya twice, then took her point as his own. Is that just a rough meeting — or is it disrespect worth addressing? Make the call and say why."
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "Calls it a personality clash or normal meeting friction.",
                                                    "response": "Draw out the cost to Priya and the room before teaching."
                                              },
                                              "strong": {
                                                    "look_for": "Names it as disrespect and can say why.",
                                                    "response": "Affirm the read and move."
                                              }
                                        },
                                        "input_placeholder": "Make the call…"
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "Land that the pattern (interrupt + take credit) is the issue, that it had a target and a cost, and that noticing without acting is a choice too."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Okay — say more about why that one lands as disrespect and not just a bad day."
                                  }
                            }
                      },
                      {
                            "id": "watch-it",
                            "label": "Watch it again",
                            "practice": {
                                  "mode": "observe_react",
                                  "exit": {
                                        "when": {
                                              "turns": 2,
                                              "requirement": "the learner reads the WHOLE room, not just Dana — Priya's withdrawal, the bystanders who noticed and stayed quiet, and what the silence teaches the team"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Watch the clip"
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "brief": [
                                              {
                                                    "text": "Here's the moment on tape. Watch it, then tell me what you notice this time — not just Dana, the whole room."
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "response": "Only sees Dana. Point them at Priya and the two who noticed and said nothing."
                                              },
                                              "strong": {
                                                    "look_for": "Reads the room — Priya's withdrawal and the bystanders.",
                                                    "response": "Affirm and move to the step-in."
                                              }
                                        },
                                        "jot_placeholder": "What did you notice…"
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "Land that the harm isn't only the interruption — it's the silence that follows and normalizes it, and that the room reads whether the lead responds."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "So watching it back — what was the room actually teaching itself by letting that stand?"
                                  }
                            }
                      },
                      {
                            "id": "step-in",
                            "label": "Step in",
                            "practice": {
                                  "mode": "roleplay",
                                  "exit": {
                                        "when": {
                                              "turns": 5,
                                              "requirement": "the learner names the specific behavior to Dana directly, keeps it about impact not character, and holds the line if he deflects — without humiliating him"
                                        }
                                  },
                                  "transition": {
                                        "button_label": "Say something to Dana"
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "character_id": "dana",
                                        "partner_label": "Dana",
                                        "opening_messages": [
                                              {
                                                    "text": "The room's empty now. Dana zips his bag, half-glancing at you like he's about to head out."
                                              },
                                              {
                                                    "text": "Good stand-up. I think we finally landed that design direction.",
                                                    "character_id": "dana"
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "Softens it into nothing or doesn't address it.",
                                                    "response": "Debrief: the kind way is the clear way; name the behavior."
                                              },
                                              "neutral": {
                                                    "look_for": "Leads with character (\"you always\").",
                                                    "response": "Debrief: separate the behavior from the person so he can hear it."
                                              },
                                              "strong": {
                                                    "look_for": "Names the specific behavior and its impact, stays steady if he deflects.",
                                                    "response": "Affirm — this is the move."
                                              }
                                        },
                                        "input_placeholder": "Say something to Dana…"
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "Land the pattern that works: name the specific behavior, tie it to impact not identity, and hold the line calmly if he deflects — that's how you correct without making an enemy."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Alright — walk me through what you were going for with Dana there."
                                  }
                            }
                      }
                ],
                "closing": {
                      "ideal_response": {
                            "component_groups": [
                                  {
                                        "components": [
                                              "Address what was done (\"you talked over Priya and restated her point\") — not who they are (\"you're dismissive\").",
                                              "Specific and behavioral is what someone can actually act on."
                                        ],
                                        "title": "Name the behavior, not the person"
                                  },
                                  {
                                        "components": [
                                              "When disrespect goes unaddressed, the room learns it's allowed.",
                                              "The person with standing responding is what resets the norm."
                                        ],
                                        "title": "Silence is a message too"
                                  },
                                  {
                                        "components": [
                                              "Softening a correction into vagueness isn't kindness — it just leaves the problem in place.",
                                              "Clear, calm, and specific is the respectful move."
                                        ],
                                        "title": "Kind and clear are the same thing"
                                  }
                            ]
                      }
                }
          }
    },
  },
  "observe-react": {
    label: "Observe & React", icon: "fa-eye",
    blurb: "Watch, then talk through what you noticed.",
    shape: "O", toFill: 12,
    doc: {
          "implementation_id": "hazmat-scene-size-up-i-65-tanker-rollover",
          "modality": "ai-conversational",
          "schema_version": "4.0",
          "content": {
                "title": "Hazmat Scene Size-Up: I-65 Tanker Rollover",
                "narrative": "A tanker went over on the interstate — and the scene you're about to watch was not run by the book. Watch how it really unfolded, then tell your AI coach what you saw: what was right, what wasn't, and what you'd do differently.",
                "phases": [
                      {
                            "id": "observe",
                            "label": "I-65 Tanker Rollover",
                            "practice": {
                                  "mode": "observe_react",
                                  "exit": {
                                        "when": {
                                              "requirement": "the learner answers the synthesis — \"tomorrow you're first on scene, walk me through your first moves\" — naming their own positioning at distance (upwind/uphill/back), closing the road both directions, opening the ERG, and the notifications (HazMat, law enforcement, incident command)"
                                        }
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "exhibit": {
                                              "type": "video",
                                              "src": "../assets/videos/hazmat_tankerScene.mp4",
                                              "alt": "A tanker's gone over on I-65. Look at the traffic — still moving on both sides, just feet from the tank. On the barrel: a red diamond — 1993, Class 3."
                                        },
                                        "rubric": [
                                              {
                                                    "id": "hazard-id",
                                                    "name": "Hazard ID",
                                                    "standard_term": "Hazard ID",
                                                    "nudge": ""
                                              },
                                              {
                                                    "id": "isolation",
                                                    "name": "Isolation",
                                                    "standard_term": "Isolation",
                                                    "nudge": ""
                                              },
                                              {
                                                    "id": "positioning",
                                                    "name": "Positioning",
                                                    "standard_term": "Positioning",
                                                    "nudge": ""
                                              },
                                              {
                                                    "id": "notifications",
                                                    "name": "Notifications",
                                                    "standard_term": "Notifications",
                                                    "nudge": ""
                                              }
                                        ],
                                        "spot_target": 4,
                                        "brief": [
                                              {
                                                    "text": "What you just watched is how this scene actually unfolded — and parts of it should bother you. We'll get to that. First, the basics: what did you see on the tank's placard?"
                                              },
                                              {
                                                    "text": "Sit with that one for a second before we analyze anything. How did that video make you feel — was that distance reasonable?"
                                              },
                                              {
                                                    "text": "That's the version that keeps everyone breathing. So bring it home: tomorrow this call drops and YOU'RE first on scene. Walk me through your first moves."
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "response": "approaches or guesses at the product before identifying it leaves traffic or bystanders inside the isolation zone; works the tank before the perimeter approaches close enough to touch the tank, in structural gear, not on air delays the calls until after sizing up, or leaves them out"
                                              },
                                              "strong": {
                                                    "response": "reads the placard first — UN 1993, Class 3 flammable liquid — and uses that number to open the ERG closes the road in both directions and clears traffic to at least ERG Guide 128's 150-foot initial isolation stages upwind, uphill, and back behind the rigs, and reads the placard from distance with binoculars gets HazMat, law enforcement, and incident command rolling in parallel with the size-up"
                                              }
                                        }
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "Close with a short, personal affirmation of what the learner actually caught across the three segments — the placard, the uncleared traffic, the too-close approach, the corrected version — then set complete:true.",
                                        "Keep it to a few sentences; the results screen below is authored, not generated, so do not recite it."
                                  ],
                                  "follow_up_turns": 0
                            }
                      }
                ],
                "closing": {
                      "ideal_response": {
                            "component_groups": [
                                  {
                                        "components": [
                                              "The UN number and hazard class — here, 1993 / Class 3 flammable liquid — is the one data point that unlocks the ERG and everything after it.",
                                              "Pull it before anything else pulls your attention."
                                        ],
                                        "title": "Read the placard first"
                                  },
                                  {
                                        "components": [
                                              "ERG Guide 128 calls for at least 150 feet of initial isolation in every direction.",
                                              "The first job on arrival isn't the tank — it's shutting the road down in both directions."
                                        ],
                                        "title": "Isolate before you approach"
                                  },
                                  {
                                        "components": [
                                              "\"Too close\" isn't fear — it's your training trying to get your attention.",
                                              "When an approach feels wrong, fall back to the isolation line and read the placard from there with binoculars."
                                        ],
                                        "title": "Trust the discomfort"
                                  },
                                  {
                                        "components": [
                                              "Position crews upwind, uphill, and behind the rigs at distance.",
                                              "Nobody goes near the product without chemical protection and air."
                                        ],
                                        "title": "Stage upwind, uphill, and back"
                                  },
                                  {
                                        "components": [
                                              "HazMat, law enforcement, and incident command roll while you size up — not after.",
                                              "They'd rather stand down than arrive to a scene that's already gotten worse."
                                        ],
                                        "title": "Make the calls in parallel"
                                  }
                            ]
                      }
                }
          }
    },
  },
  "scene-sweep": {
    label: "Scene Sweep", icon: "fa-magnifying-glass",
    blurb: "Study a scene, spot what is wrong, then act on it.",
    shape: "OC", toFill: 16,
    doc: {
          "implementation_id": "spot-the-hazard",
          "modality": "ai-conversational",
          "schema_version": "4.0",
          "content": {
                "title": "Spot the Hazard",
                "narrative": "You are THEMSELVES — a worker who just finished the HazCom course, looking at their own work area. There is no character to play and no one to talk to but you, the coach. You’ve just finished your hazard communication training — and now you’re standing at the finishing bench on the floor, where product gets wiped down, touched up, and boxed.\n\nA coworker is working right next to you. There’s a chemical drum to your right, a jug and some parts on the bench, the usual clutter of a shift in progress.\n\nNothing’s on fire. Everybody’s just working. But you finished that training for a reason — take a slow look around, and see what your eye catches.",
                "coach_persona": "a knowledgeable, plain-spoken safety trainer with real floor time — authority and genuine concern, never a quiz machine",
                "opening": {
                      "id": "opening_reflection",
                      "opening_messages": [
                            {
                                  "text": "Take a quick look around this work area. Before we start naming anything specific — what’s your first impression? Does anything here make you uneasy, or does it just look like a normal bench? No need to be exhaustive yet."
                            }
                      ],
                      "levels": {
                            "neutral": {
                                  "response": "CALIBRATION ONLY, do not evaluate or credit hazards yet. 2-3 short bubbles: read their confidence (wary vs. \"looks fine to me\") and acknowledge it without grading. END on that — do NOT list hazards or preview the walkthrough; the app opens the Observe beat next."
                            }
                      }
                },
                "phases": [
                      {
                            "id": "observe",
                            "label": "Observe",
                            "practice": {
                                  "mode": "observe_react",
                                  "exit": {
                                        "when": {
                                              "turns": 2,
                                              "requirement": "the learner has named the majority of the observable hazards (the coverage target below) — or has had one look-again nudge"
                                        }
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "exhibit": {
                                              "type": "image",
                                              "src": "assets/hazcom-scene.jpg",
                                              "alt": "A finishing area on a shop floor. On the metal bench in front of you, to the left, a half-full clear plastic jug with no label sits beside a row of metal parts. Your coworker stands at the bench in a short-sleeve shirt, wiping a part with a rag, bare-handed — no gloves and no eye protection. To your right stands a chemical drum: a Safety Data Sheet taped to it is dated decades ago, and the drum’s own hazard label is torn and peeling, so its pictogram and signal word can’t be read.",
                                              "facts": [
                                                    "A finishing area on a shop floor, where product gets wiped down and boxed.",
                                                    "A metal workbench sits in front of you: on it, to the left, a half-full clear plastic jug with no label — nothing written on it — beside a row of metal parts.",
                                                    "Your coworker stands at the bench in a short-sleeve shirt, wiping a part with a rag, bare-handed — no gloves and no eye protection.",
                                                    "To your right stands a chemical drum.",
                                                    "Taped to the drum is a Safety Data Sheet whose printed date is years out of date, and the drum’s own hazard label is torn and peeling, so the pictogram and signal word can’t be read.",
                                                    "Nothing is actively on fire or spilling — the hazards are the everyday, easy-to-walk-past kind."
                                              ]
                                        },
                                        "rubric": [
                                              {
                                                    "id": "jug",
                                                    "name": "Unlabeled secondary container",
                                                    "standard_term": "A jug decanted from a drum with nothing written on it — a secondary container that must be labeled. You can’t tell what chemical is in it.",
                                                    "nudge": "on the bench in front of you, to the left"
                                              },
                                              {
                                                    "id": "ppe",
                                                    "name": "No PPE in use",
                                                    "standard_term": "A coworker handling chemical bare-handed — no gloves and no goggles the task and the label call for.",
                                                    "nudge": "your coworker at the bench, wiping a part with his bare hands"
                                              },
                                              {
                                                    "id": "sds",
                                                    "name": "Out-of-date SDS",
                                                    "standard_term": "The safety data sheet on hand is years out of date — a current SDS is required whenever the hazard information changes.",
                                                    "nudge": "the Safety Data Sheet taped to the drum on your right"
                                              },
                                              {
                                                    "id": "label",
                                                    "name": "Unreadable drum label",
                                                    "standard_term": "A drum whose label is torn and peeling — you can’t read the pictogram or signal word to identify the hazard.",
                                                    "nudge": "the drum on your right — its own label, torn and peeling near the top"
                                              }
                                        ],
                                        "spot_target": 3,
                                        "brief": [
                                              {
                                                    "text": "Let’s take a closer look and walk the area properly. Take your time."
                                              },
                                              {
                                                    "text": "Walk me through everything that looks wrong or unsafe to you — name as many as you can spot."
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "look_for": "spots 0–1, or only names \"it’s messy / chemicals are out\" — vague, treats it as housekeeping rather than a HazCom problem.",
                                                    "response": "Credit any real catch, then cue a LOCATION without giving it away (\"look again right on the bench — the jug, and that sheet — and the person working next to you\"). Do not name the hazards."
                                              },
                                              "neutral": {
                                                    "look_for": "catches the obvious ones — the unlabeled jug, the missing PPE — but misses the less-visible ones (the out-of-date SDS, the unreadable drum label).",
                                                    "response": "Credit each catch in standard terms, then nudge spatially toward the misses (the sheet on the bench; the label on the drum)."
                                              },
                                              "strong": {
                                                    "look_for": "names all four specifically and says why each is a hazard.",
                                                    "response": "Validate fully, read the catches back in standard terms, and move to fixing them."
                                              }
                                        }
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "Deliver the full observable-hazard rubric so every learner leaves the beat seeing all four, in standard terms: an UNLABELED secondary container (you can’t identify the chemical), a coworker with NO PPE in use, an OUT-OF-DATE SDS (a current sheet is required when hazard info changes), and an UNREADABLE label on the drum (you can’t read the pictogram or signal word).",
                                        "Name any the learner missed without judgment.",
                                        "The point: recognizing a hazard in real time is the behavior HazCom is built to create — noticing beats reciting."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Good eyes. Let’s line up everything that’s actually here."
                                  }
                            }
                      },
                      {
                            "id": "remediate",
                            "label": "Diagnose & Remediate",
                            "practice": {
                                  "mode": "coach_inquiry",
                                  "exit": {
                                        "when": {
                                              "turns": 2,
                                              "requirement": "the learner gives immediate, correct corrective action spanning stop-work / PPE and making the chemical identifiable (a current SDS, a legible label) — or has had one follow-up"
                                        }
                                  },
                                  "answer_shape": "open",
                                  "interaction": {
                                        "opening_messages": [
                                              {
                                                    "text": "Now let’s do something about it. Back to the scene."
                                              },
                                              {
                                                    "text": "For each hazard, what would you do right now, in the moment, before anyone keeps working? Be specific."
                                              }
                                        ],
                                        "levels": {
                                              "unthoughtful": {
                                                    "response": "defers — \"clean it up later,\" \"tell a supervisor,\" \"put a note on it.\" Press the immediacy: the coworker is decanting bare-handed this second — what happens before he keeps going? Redirect to stop-work + PPE first."
                                              },
                                              "neutral": {
                                                    "look_for": "fixes one or two well (labels/quarantines the jug) but misses the stop-work/PPE piece, pulling a current SDS, or getting a legible label on the drum.",
                                                    "response": "Affirm the fix, then extend to the live risk and making the chemical identifiable."
                                              },
                                              "strong": {
                                                    "look_for": "stops unsafe work and gets PPE on; quarantines/identifies the unknown jug; pulls a current SDS; gets a legible label on the drum — all before work resumes.",
                                                    "response": "Validate and name the layers at work: PPE and safe handling are protective measures IN ACTION, not recitation."
                                              }
                                        }
                                  }
                            },
                            "debrief": {
                                  "label": "Coach Debrief",
                                  "key_points": [
                                        "The immediate corrective actions, mapped to the protective-measures layers: STOP the unsafe work before another exposure and get the right PPE on; CONTAIN the unknown — quarantine the unlabeled jug until it’s identified, and pull a CURRENT SDS (the out-of-date one can’t be trusted for handling or first aid); and MAKE IT LEGIBLE — a GHS-compliant label on the drum so anyone can identify the hazard at a glance.",
                                        "This is PPE and safe handling applied, not recited.",
                                        "Note the durable angle briefly — a quick record of the outdated SDS or the relabeled drum keeps the fix from quietly slipping back — but the systemic program is the close’s job, not this beat’s."
                                  ],
                                  "follow_up_turns": 1,
                                  "probe": {
                                        "text": "Let’s go over what to do right now."
                                  }
                            }
                      }
                ],
                "closing": {
                      "ideal_response": {
                            "component_groups": [
                                  {
                                        "components": [
                                              "The four observable red flags here: an unlabeled secondary container, a coworker with no PPE, an out-of-date SDS, and an unreadable container label.",
                                              "Recognizing them in real time is the behavior HazCom is built to create."
                                        ],
                                        "title": "Noticing beats reciting"
                                  },
                                  {
                                        "components": [
                                              "Stop unsafe work and get PPE on; quarantine an unknown container and pull a current SDS; get a legible, GHS-compliant label on anything that can’t be identified — all before work resumes."
                                        ],
                                        "title": "Fix it now: stop, protect, identify"
                                  },
                                  {
                                        "components": [
                                              "A secondary-container labeling standard, an SDS review cadence, scheduled PPE checks, and a label-legibility standard — the work-practices layer, written into the employer’s HazCom program so it survives a busy shift."
                                        ],
                                        "title": "Make it stick: build it into the program"
                                  },
                                  {
                                        "components": [
                                              "Work practices reduce risk at the source; emergency procedures define spill/exposure response and who to notify; PPE specifies what to wear, when, and how.",
                                              "A space that covers only PPE leaves workers without the full picture."
                                        ],
                                        "title": "Protective measures come in three layers"
                                  },
                                  {
                                        "components": [
                                              "Ten elements: the HazCom Standard; the written program & how to access it; chemical locations; physical & health hazards; how to detect a release; employee protective measures; employer protective measures (work practices, emergency procedures, PPE); label explanation; SDS access; and who to contact.",
                                              "Understanding these ten isn’t just meeting a requirement — it’s what lets you recognize hazards, respond appropriately, and stay safe on the job."
                                        ],
                                        "title": "What a complete HazCom program covers"
                                  }
                            ]
                      }
                }
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
                                  "answer_shape": "open",
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
     exactly what it produces and observe_react really does credit. */
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
