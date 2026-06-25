/**
 * The "Now" layer — a contemporary reading of each hexagram.
 *
 * The engine's prose (judgment, image, line texts) stays faithful to the classic
 * I-Ching. This is something else: an original, present-day interpretation in my
 * own voice — the ancient pattern recast for modern life (work, building, teams,
 * attention, relationships, decisions under uncertainty). It's rendered in a
 * modern typeface (see --font-now) precisely to mark it as *now*, set against the
 * old wisdom rather than dressed up as it.
 *
 * Keyed by King Wen number (1..64). Original content — translated from no one.
 */

export interface NowReading {
  /** A punchy modern hook — the hexagram in a breath. */
  hook: string;
  /** Two or three sentences applying the pattern to contemporary life. */
  body: string;
}

/**
 * A present-day framing of the movement itself — what it means that this
 * hexagram is turning into that one. Woven from the two (localized) names so it
 * speaks to the specific cast, while the framing stays general.
 */
export function transitionNote(fromName: string, toName: string): string {
  return `The lines in motion are the hinge. You're not parked in ${fromName} — you're moving through it toward ${toName}. Read the changing lines as the specific turns that carry you there: the second hexagram is the direction you're heading, not a verdict on where you are.`;
}

export const NOW_READINGS: Record<number, NowReading> = {
  1: {
    hook: 'Start the engine.',
    body: 'Pure initiative — the moment you stop waiting for permission and make the first move. The energy is here; the risk is spending it on everything at once. Point it at one thing and begin.',
  },
  2: {
    hook: 'Hold the space.',
    body: 'Power that works by carrying, not pushing. Right now your strength is responsiveness — supporting, absorbing, letting things land before you react. Follow the terrain instead of fighting it.',
  },
  3: {
    hook: 'Messy first draft.',
    body: 'Beginnings are chaos, and this one is no exception — tangled, slow, unclear. Don’t read the friction as proof you’re wrong. Get help, shrink the scope, and push the first sprout through.',
  },
  4: {
    hook: 'You don’t know yet — ask.',
    body: 'Inexperience isn’t shameful; pretending past it is. Find the person who has done this before and actually listen. Ask the real question once, then go do the work.',
  },
  5: {
    hook: 'Don’t force the timer.',
    body: 'The move isn’t ready, and rushing it wastes it. Waiting here is active: stay fed, stay sharp, keep the conditions warm. The strength is in the patience, not the leap.',
  },
  6: {
    hook: 'Pick the fight, or don’t.',
    body: 'You’re heading into a dispute you might win and still lose. Before you escalate, ask what winning actually costs. De-escalate, document, and look for the third option before it goes to war.',
  },
  7: {
    hook: 'Organize the force.',
    body: 'Effort scattered does nothing; the same effort disciplined moves mountains. Lead from a clear cause, give people structure, and don’t deploy power without a reason worth it.',
  },
  8: {
    hook: 'Find your people.',
    body: 'This is about belonging — joining, or being joined, around a center that holds. Commit early and sincerely; half-in alliances rot. Be someone worth gathering around.',
  },
  9: {
    hook: 'Small nudges only.',
    body: 'You can’t force the big thing yet, so work the edges — gentle, repeated influence. Tend the small accumulations; they’re quietly shifting the balance. Clouds, no rain — for now.',
  },
  10: {
    hook: 'Walk on the tiger’s tail.',
    body: 'You’re moving through something powerful and easily provoked. Conduct is everything: precise, courteous, light on your feet. Step wrong and it bites; step right and you pass clean through.',
  },
  11: {
    hook: 'Everything’s flowing.',
    body: 'A rare window where the pieces fit and energy moves freely. Don’t coast — peace is a season, not a state. Build and connect now, while heaven and earth are still talking.',
  },
  12: {
    hook: 'It’s stuck — stop pushing.',
    body: 'The channels are closed and force won’t reopen them. Withdraw, conserve, keep your integrity intact, and wait for the thaw. Not every wall is yours to break today.',
  },
  13: {
    hook: 'Build in the open.',
    body: 'Real fellowship runs on shared, stated purpose — not vibes or in-groups. Bring people together around something true and public. Belonging that excludes isn’t fellowship; it’s a clique.',
  },
  14: {
    hook: 'You have a lot — steward it.',
    body: 'Abundance has arrived, and with it the question of how you hold it. Stay generous and clear-eyed; great possession curdles into arrogance fast. Use the surplus to lift, not to hoard.',
  },
  15: {
    hook: 'Stay low, stay real.',
    body: 'The most durable strength looks like humility. Claim less than you’ve earned and let the work speak. Modesty isn’t smallness — it’s the gravity that keeps you grounded as you rise.',
  },
  16: {
    hook: 'Ride the momentum.',
    body: 'Energy and anticipation are building — people are ready to move with you. Channel it before it dissipates; enthusiasm left uncommitted just evaporates. Set the rhythm and let others fall in.',
  },
  17: {
    hook: 'Adapt, don’t just comply.',
    body: 'The wise move now is to follow — a person, a current, an idea better than yours. But follow what’s actually worth it, and lead by being worth following. Alignment, not submission.',
  },
  18: {
    hook: 'Fix the rot.',
    body: 'Something neglected has decayed — a system, a relationship, a debt left too long. This is repair work: trace it to the source and rebuild, don’t paper over it. Hard now, but rot only spreads.',
  },
  19: {
    hook: 'The opening is here.',
    body: 'Something good is drawing near and you have room to move toward it. Approach with warmth and intent while the window is open. Spring doesn’t last — meet it.',
  },
  20: {
    hook: 'Zoom out and watch.',
    body: 'Before you act, see clearly — the whole pattern, not just your slice. This is the view from the tower: observe, and let yourself be honestly observed. Understanding first, then the move.',
  },
  21: {
    hook: 'Bite through it.',
    body: 'There’s an obstacle that won’t dissolve on its own — it has to be broken. Be decisive and fair; name the problem and act with clean force. Hesitation just lets it harden.',
  },
  22: {
    hook: 'Form matters too.',
    body: 'How a thing looks and is presented isn’t superficial — it shapes how it lands. Give it real polish and beauty. Just don’t let the surface stand in for substance; grace adorns, it doesn’t replace.',
  },
  23: {
    hook: 'Coming apart — protect the core.',
    body: 'Erosion is at work and the structure is failing from below. Don’t prop up what’s already gone; conserve what’s essential and wait it out. The strip-down is clearing the way for return.',
  },
  24: {
    hook: 'The turn back.',
    body: 'The low point has passed and the light is returning — quietly, at first. Don’t force the comeback; nurture the small new energy and let it build. This is the solstice: everything turns from here.',
  },
  25: {
    hook: 'Act without the angle.',
    body: 'The clean move is the spontaneous, honest one — no scheming, no hidden agenda. Align with what’s actually true and act from there. Overthink it and you’ll corrupt something that was working.',
  },
  26: {
    hook: 'Bank the power.',
    body: 'Big energy held in reserve, pressure building into capacity. Restrain, accumulate, train — don’t spend it early. Stored strength, released at the right moment, is what’s unstoppable.',
  },
  27: {
    hook: 'Watch what you feed on.',
    body: 'You become what you consume — food, feeds, company, attention. Audit your inputs honestly. Nourish yourself and others with what genuinely sustains, not just what’s within reach.',
  },
  28: {
    hook: 'The beam is overloaded.',
    body: 'Too much weight on too thin a support — something is at a breaking point. This is an extraordinary moment that calls for bold, unusual action. Reinforce it or release it; don’t pretend the load is fine.',
  },
  29: {
    hook: 'Through the danger, not around.',
    body: 'You’re in a real pit, and there may be another after it. The way out is to stay true to your core and keep moving — water flows on, fills the gaps, gets through. Don’t freeze; flow.',
  },
  30: {
    hook: 'Burn clear.',
    body: 'Clarity and brilliance — but they depend on what they cling to; fire needs fuel. Be radiant and lucid, and stay conscious of your attachments. Clinging well illuminates; clinging badly, it consumes.',
  },
  31: {
    hook: 'Mutual pull.',
    body: 'Attraction is in the air — two things drawn into genuine influence. Stay open and receptive; this works through resonance, not pressure. Let yourself be moved, and move them in turn.',
  },
  32: {
    hook: 'Play the long game.',
    body: 'Not the spark but the sustain — what lasts because you keep showing up. Build the habit, the routine, the relationship that endures. Constancy isn’t glamorous, but it’s what compounds.',
  },
  33: {
    hook: 'Step back on purpose.',
    body: 'This isn’t defeat — it’s a tactical withdrawal while conditions are bad. Retreat in good order, keep your strength, don’t burn bridges on the way out. Knowing when to leave is mastery.',
  },
  34: {
    hook: 'Strength — now aim it.',
    body: 'You have real force right now, and that’s exactly the danger. Power without restraint smashes through things you’ll need later. Move with it, but stay inside what’s right; might is not a license.',
  },
  35: {
    hook: 'You’re rising — keep it clean.',
    body: 'Advancement, recognition, the sun clearing the horizon. Accept it gracefully and keep your conduct bright; visible progress invites scrutiny. Rise without stepping on the people who got you here.',
  },
  36: {
    hook: 'Dim your light.',
    body: 'It’s a hostile environment, and showing everything you have will get it taken. Protect your brilliance — work quietly, hold your inner clarity, don’t broadcast. Survive the dark stretch with integrity intact.',
  },
  37: {
    hook: 'Tend the inner circle.',
    body: 'Roles and the home unit — whoever your people are, including a team. Health here comes from each person holding their part with care. Get the inside right and the outside follows.',
  },
  38: {
    hook: 'Misaligned — bridge it.',
    body: 'Two views diverging, talking past each other. Don’t force agreement; find the small shared ground and work outward. Opposition isn’t always enmity — sometimes it’s two truths that haven’t met yet.',
  },
  39: {
    hook: 'Blocked — turn inward.',
    body: 'The path ahead is genuinely obstructed; pushing harder just hurts. Stop, reassess, and change what you can in yourself, since the obstacle won’t move. Find the way around, and don’t take the wall personally.',
  },
  40: {
    hook: 'The knot loosens.',
    body: 'The tension breaks and the pressure releases — you’re coming out of it. Move quickly to clear the wreckage and forgive what you can; don’t drag the conflict past its end. Then rest, for real.',
  },
  41: {
    hook: 'Subtract on purpose.',
    body: 'Less is the move — cut, simplify, give something up to gain something truer. Decrease at the bottom to strengthen the top. Sacrifice the inessential and you’ll feel lighter, not poorer.',
  },
  42: {
    hook: 'Pour it forward.',
    body: 'A season of gain — and the way to keep it is to send it down and out. Invest in others, ship the improvement, act while the wind’s behind you. Increase that circulates multiplies.',
  },
  43: {
    hook: 'Make the clean break.',
    body: 'A decision has ripened; it’s time to resolve it openly and firmly. Name the problem out loud, commit, and don’t act from spite. One resolute cut beats a hundred half-measures.',
  },
  44: {
    hook: 'Mind the thing creeping in.',
    body: 'Something minor has entered — a temptation, a compromise, a small rot — and it’s stronger than it looks. Don’t overreact, but don’t ignore it. Notice the seed before it becomes the system.',
  },
  45: {
    hook: 'Convene around a center.',
    body: 'People are coming together, and that energy needs a real focal point to cohere. Give the gathering a clear purpose and a worthy center. Crowds without a center scatter; assemblies with one move.',
  },
  46: {
    hook: 'Climb step by step.',
    body: 'Growth is available — the gradual kind, like a tree, not a rocket. Push steadily upward, take the small reliable gains, don’t skip rungs. Effort is rewarded here, but only if it’s persistent.',
  },
  47: {
    hook: 'Drained and stuck — hold your core.',
    body: 'You’re exhausted and constrained, with little outside support. Words won’t help much now; what matters is keeping your inner conviction alive. Conserve, endure, and don’t betray yourself to escape faster.',
  },
  48: {
    hook: 'Return to the source.',
    body: 'The fundamentals are a well — always there, but useless if the rope and bucket fail. Go back to what nourishes everyone; fix the access, not just the surface. Cities change; the well stays.',
  },
  49: {
    hook: 'Shed the old skin.',
    body: 'The old form has to go — not reform, but real transformation. Time it right and bring people with you; revolution before its moment is just chaos. When it’s due, commit fully and don’t look back.',
  },
  50: {
    hook: 'Cook something new.',
    body: 'Raw ingredients transformed into nourishment — creation, culture, making the thing that feeds others. Tend the vessel and the process with care. What you build now can sustain far beyond you.',
  },
  51: {
    hook: 'Take the shock.',
    body: 'A jolt hits — sudden, loud, disruptive. The move is composure: let it wake you up rather than knock you down. After the thunder, you can see what was loose. Steady hands, open eyes.',
  },
  52: {
    hook: 'Stop. Fully stop.',
    body: 'Stillness, on purpose — quiet the mind, halt the motion, sit with what is. Not avoidance; presence. The clarity you’re chasing tends to arrive the moment you stop chasing and keep still.',
  },
  53: {
    hook: 'Grow gradually.',
    body: 'Steady, stage-by-stage progress — like a tree taking root, then branch. Don’t rush the sequence; each phase earns the next. Slow and rooted beats fast and shallow, every time.',
  },
  54: {
    hook: 'You’re entering on their terms.',
    body: 'You’re joining something where you don’t set the rules — a subordinate role, at least for now. Go in clear-eyed about the dynamic; don’t pretend you hold power you don’t. Play it with grace, or don’t enter.',
  },
  55: {
    hook: 'Peak — and peaks pass.',
    body: 'You’re at a high-water mark, full and bright. Enjoy it and use it generously, but don’t expect noon to last. Make the most of the fullness; the highest sun is already starting to set.',
  },
  56: {
    hook: 'You’re just passing through.',
    body: 'Transient ground — new place, new role, no deep roots yet. Travel light, stay courteous, keep your standards even without a home base. The stranger who behaves well finds doors open.',
  },
  57: {
    hook: 'Persistent, not pushy.',
    body: 'Influence like wind — soft, continuous, getting in through the cracks. Drop the frontal assault; small, steady, repeated pressure reshapes what force can’t. Penetrate gently and don’t stop.',
  },
  58: {
    hook: 'Open up and share.',
    body: 'Genuine joy, openness, easy exchange — the lake that reflects and connects. Speak honestly, lighten things, let people in. Shared gladness is a strength — just keep it true, not performed.',
  },
  59: {
    hook: 'Dissolve the blockage.',
    body: 'Rigidity needs to break up and flow again — an ego, a standoff, a clot in the system. Soften it; scatter what’s congealed and let it recirculate. Dispersion clears the way for the next gathering.',
  },
  60: {
    hook: 'Constraints are a feature.',
    body: 'Set the boundary on purpose — the budget, the deadline, the scope. Limits give a thing its shape and keep its energy from leaking everywhere. Just don’t set the limit so harsh it strangles what it holds.',
  },
  61: {
    hook: 'Mean it.',
    body: 'Influence that lasts comes from real sincerity, not technique — people feel the difference. Get your inside aligned with your outside. Trust earned from a genuine center moves even the stubborn.',
  },
  62: {
    hook: 'Sweat the small stuff.',
    body: 'A time for modest, careful action and attention to detail — not grand gestures. Stay grounded, do the small things exactly right, don’t overreach. The small exact move beats the big sloppy one now.',
  },
  63: {
    hook: 'Done — now don’t relax.',
    body: 'Everything’s in place and working — which is exactly when entropy creeps in. Completion isn’t the end; it’s the start of maintenance. Stay alert, tend the details, don’t let “finished” become “forgotten.”',
  },
  64: {
    hook: 'Almost — the hardest part.',
    body: 'You’re at the threshold, nearly there, and this last stretch decides it. Don’t fumble it now with carelessness or premature celebration. Order your steps, stay careful, and carry it across the final river.',
  },
};
