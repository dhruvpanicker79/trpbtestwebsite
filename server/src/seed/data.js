/**
 * Sample content for The Ronin's Playbook.
 *
 * All players, clubs, matches and figures below are FICTIONAL and exist only
 * to demonstrate the platform. Historical essays discuss well-known tactical
 * ideas in general terms and contain no invented statistics.
 */

const u = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  floodlight: u('1431324155629-1a6deb1dec8d'),
  stadiumNight: u('1489944440615-453fc2b6a9a9'),
  stadium: u('1522778119026-d647f0596c20'),
  tunnel: u('1577223625816-7546f13df25d'),
  aerial: u('1556056504-5c7696c4c28d'),
  aerial2: u('1517747614396-d21a78b850e8'),
  tackle: u('1553778263-73a83bab9b0c'),
  player16: u('1517466787929-bc90951d0974'),
  striker: u('1560272564-c83b66b1ad12'),
  matchplay: u('1543326727-cf6c39e8f84c'),
  bootBall: u('1579952363873-27f3bade9f55'),
  streetBall: u('1606925797300-0b35e9d1794e'),
  grassroots: u('1600679472829-3044539ce8ed'),
  youth: u('1624880357913-a8539238245b'),
  sky: u('1434648957308-5e6a859697e8'),
  stadiumSun: u('1570498839593-e565b39455fc'),
  stadiumWide: u('1610201417828-29dd1173d62f'),
  corner: u('1529900748604-07564a03e7a6'),
  line: u('1459865264687-595d652de67e'),
  ballNight: u('1614632537190-23e4146777db'),
  feet: u('1574629810360-7efbbe195018'),
  boots: u('1511886929837-354d827aae26'),
};

export const categories = [
  { name: 'The Stories', slug: 'the-stories', kicker: 'Long reads', order: 1, description: 'Long-form features about the people, places and nights that make football more than ninety minutes.' },
  { name: 'Tactical Room', slug: 'tactical-room', kicker: 'Shape & structure', order: 2, description: 'Formations, roles and the ideas underneath them — explained with boards, not buzzwords.' },
  { name: 'Player Files', slug: 'player-files', kicker: 'Careers', order: 3, description: 'Career retrospectives and close studies of the players who define how the game is played.' },
  { name: 'Match Analysis', slug: 'match-analysis', kicker: 'After the whistle', order: 4, description: 'What actually decided the game: phases, adjustments and the moments in between.' },
  { name: 'Football Culture', slug: 'football-culture', kicker: 'Terraces & beyond', order: 5, description: 'Kits, terraces, design, language and everything the sport leaves behind in the culture.' },
  { name: 'Opinions', slug: 'opinions', kicker: 'Arguments', order: 6, description: 'Strong takes, clearly labelled. Disagree in the comments.' },
];

export const tags = [
  'Pressing', 'Build-up', 'Full-backs', 'Rest defence', 'Mid-block', 'Regista',
  'Number 10', 'Back three', 'Fan culture', 'Design', 'History', 'Youth football',
];

const SAMPLE_NOTE = 'Sample profile — fictional player created for demonstration.';

export const players = [
  {
    name: 'Ren Takeda',
    nationality: 'Japan',
    position: 'Attacking Midfielder',
    currentClub: 'Ravenmoor Athletic',
    born: '1999, Yokohama',
    preferredFoot: 'Left',
    portrait: IMG.player16,
    summary: `${SAMPLE_NOTE} A left-footed creator who prefers the half-space to the centre, Takeda moved from J-League second-tier side FC Kanagawa Shore to Europe at 22. His game is built on disguised passes and late arrivals into the box rather than dribbling volume.`,
    timeline: [
      { club: 'FC Kanagawa Shore Academy', from: '2012', to: '2017', note: 'Youth system' },
      { club: 'FC Kanagawa Shore', from: '2017', to: '2021', note: 'Promoted with the club in his final season' },
      { club: 'SV Eichental', from: '2021', to: '2023', note: 'First move to Europe' },
      { club: 'Ravenmoor Athletic', from: '2023', to: '', note: 'Current club' },
    ],
    achievements: [
      { title: 'Second-division title (sample)', year: '2021' },
      { title: 'Club Young Player of the Season (sample)', year: '2022' },
    ],
  },
  {
    name: 'Mateo Ilarramendi',
    nationality: 'Spain',
    position: 'Defensive Midfielder',
    currentClub: 'Real Costa Ámbar',
    born: '1996, San Sebastián',
    preferredFoot: 'Right',
    portrait: IMG.tackle,
    summary: `${SAMPLE_NOTE} A single pivot who rarely leaves the centre circle, Ilarramendi is valued for scanning, body orientation and a willingness to take the ball under pressure. He is the reference point for Real Costa Ámbar's build-up.`,
    timeline: [
      { club: 'Real Costa Ámbar B', from: '2014', to: '2017' },
      { club: 'CD Montesal', from: '2017', to: '2018', note: 'Season-long loan', loan: true },
      { club: 'Real Costa Ámbar', from: '2018', to: '', note: 'Club captain since 2022' },
    ],
    achievements: [
      { title: 'Domestic cup winner (sample)', year: '2020' },
      { title: 'Club captain', year: '2022' },
    ],
  },
  {
    name: 'Kwame Asante-Boateng',
    nationality: 'Ghana',
    position: 'Centre-Back',
    currentClub: 'Calderbrook United',
    born: '1998, Kumasi',
    preferredFoot: 'Right',
    portrait: IMG.matchplay,
    summary: `${SAMPLE_NOTE} A front-foot centre-back comfortable defending large spaces. Calderbrook's high line is built around his recovery speed and his habit of stepping into midfield with the ball.`,
    timeline: [
      { club: 'Kumasi Lions', from: '2015', to: '2018' },
      { club: 'Olympique Sainte-Lune', from: '2018', to: '2022' },
      { club: 'Calderbrook United', from: '2022', to: '' },
    ],
    achievements: [{ title: 'League Team of the Season (sample)', year: '2023' }],
  },
  {
    name: 'Elias Brandt',
    nationality: 'Germany',
    position: 'Full-Back',
    currentClub: 'SV Eichental',
    born: '2000, Freiburg',
    preferredFoot: 'Right',
    portrait: IMG.striker,
    summary: `${SAMPLE_NOTE} A right-back by name and a midfielder by habit. Brandt is the archetype of the inverted full-back: he steps inside in possession to form a box with the pivot, then recovers to the touchline when the ball is lost.`,
    timeline: [
      { club: 'SV Eichental Youth', from: '2010', to: '2018' },
      { club: 'SV Eichental', from: '2018', to: '' },
    ],
    achievements: [{ title: 'Youth international (sample)', year: '2019' }],
  },
  {
    name: 'Luca Ferrandi',
    nationality: 'Italy',
    position: 'Deep-Lying Playmaker (retired)',
    currentClub: 'Retired',
    born: '1984, Brescia',
    preferredFoot: 'Right',
    portrait: IMG.feet,
    summary: `${SAMPLE_NOTE} A regista who dictated tempo from in front of the back four for nearly two decades. Ferrandi retired in 2022 and now coaches the under-17s at AC Vespera.`,
    timeline: [
      { club: 'AC Vespera', from: '2002', to: '2009' },
      { club: 'Real Costa Ámbar', from: '2009', to: '2015' },
      { club: 'AC Vespera', from: '2015', to: '2022', note: 'Returned to finish his career' },
    ],
    achievements: [
      { title: 'League champion ×2 (sample)', year: '2007, 2012' },
      { title: 'Continental cup finalist (sample)', year: '2013' },
      { title: 'Testimonial match', year: '2022' },
    ],
  },
  {
    name: 'Samir Haddad',
    nationality: 'France / Morocco',
    position: 'Winger',
    currentClub: 'Olympique Sainte-Lune',
    born: '2002, Marseille',
    preferredFoot: 'Right',
    portrait: IMG.bootBall,
    summary: `${SAMPLE_NOTE} An inverted left winger who lives on the outside shoulder of the full-back. Haddad came through the street-football scene before joining a club academy at fifteen.`,
    timeline: [
      { club: 'Olympique Sainte-Lune Academy', from: '2017', to: '2020' },
      { club: 'Olympique Sainte-Lune', from: '2020', to: '' },
    ],
    achievements: [{ title: 'Academy graduate of the year (sample)', year: '2020' }],
  },
];

/* ------------------------------------------------------------------ */
/* Articles. `daysAgo` is resolved to a real date when seeding.        */
/* ------------------------------------------------------------------ */

const fig = (src, caption, alt = caption) =>
  `<figure data-type="figure"><img src="${src}" alt="${alt}" loading="lazy" /><figcaption>${caption}</figcaption></figure>`;

export const articles = [
  {
    title: 'Floodlights Over Kanagawa: The Night a Second-Division Club Learned to Dream',
    category: 'the-stories',
    author: 'haruki',
    daysAgo: 1,
    featured: true,
    tags: ['Youth football', 'Fan culture'],
    players: ['Ren Takeda'],
    clubs: ['FC Kanagawa Shore'],
    excerpt:
      'A fictional club, a real feeling: how one promotion night turned a coastal town’s quiet loyalty into something louder — and what it cost to keep it.',
    coverImage: { url: IMG.floodlight, alt: 'A single floodlight over a dark pitch at night', caption: 'The lights come on long before the crowd arrives.', credit: 'Unsplash' },
    content: `
<p><em>This is a work of sample fiction written to demonstrate The Ronin’s Playbook. FC Kanagawa Shore and the people in it are invented.</em></p>
<p>The floodlights at the Shore Ground are switched on at five o’clock, two hours before kick-off, because the groundsman likes to see how the grass holds the light. On the night of the promotion decider he switched them on at four. Nobody asked him why.</p>
<h2>A town that waited politely</h2>
<p>Kanagawa Shore had been a second-division club for so long that its supporters had developed a particular kind of patience — the patience of people who expect nothing and arrive anyway. Season-ticket holders knew each other by the colour of their thermos flasks. Away fans were offered directions to the station before they asked.</p>
<p>That politeness, the older supporters will tell you, was not the absence of ambition. It was a way of protecting it. If you never say you want something, it can never be taken from you in front of everyone.</p>
<blockquote><p>“We were not a loud club. We were a club that listened very carefully to the sound of the ball.”</p></blockquote>
<h2>The boy with the left foot</h2>
<p>Ren Takeda was twenty-one that season and already wearing the look of someone who knew he would be leaving. He played between the lines, drifting into the left half-space and receiving on the half-turn, and the crowd had learned to hold its breath whenever he shaped to pass with the outside of his boot.</p>
${fig(IMG.youth, 'Academy sessions at the Shore Ground ran on Tuesday evenings, under the same lights as the first team.', 'Young players training on an artificial pitch')}
<p>He scored the winner that night — a late run into the box that nobody tracked because nobody believed a ten would bother — and then, instead of running to the corner flag, he walked to the main stand and bowed. Not a celebration. A thank-you.</p>
<h2>What promotion costs</h2>
<p>Promotion changes a club in ways the table does not record. The ticket prices went up the next summer. Takeda left for Germany eighteen months later. The thermos-flask regulars found themselves sitting next to people who filmed corners on their phones.</p>
<p>And yet. Ask anyone who was there and they will describe the same moment: the final whistle, a half-second of silence, and then a sound the town had never made before. It is the sound you make when you finally say out loud that you wanted something all along.</p>
<h2>Beyond the 90</h2>
<p>The groundsman still switches the lights on early. When asked about it now, he shrugs. The grass, he says, holds the light better than it used to.</p>`,
  },
  {
    title: 'The Inverted Full-Back Is Really a Midfielder in Disguise',
    category: 'tactical-room',
    author: 'ines',
    daysAgo: 3,
    featured: true,
    tags: ['Full-backs', 'Build-up', 'Rest defence'],
    players: ['Elias Brandt', 'Mateo Ilarramendi'],
    clubs: ['SV Eichental'],
    excerpt:
      'Why stepping a full-back into midfield is less about attacking numbers and more about protecting the team when the ball is lost.',
    coverImage: { url: IMG.aerial, alt: 'Aerial view of a football pitch', caption: 'From above, shape is everything.', credit: 'Unsplash' },
    tactical: {
      formation: '4-3-3',
      inPossession: '3-2-5',
      outOfPossession: '4-4-2',
      summary:
        'The right-back steps inside alongside the pivot to form a 3-2 base. The wingers hold the width, the No.8s push into the half-spaces, and the box created in midfield is the first line of defence when possession is lost.',
      roles: [
        { position: 'RB', role: 'Inverted full-back', description: 'Moves infield next to the pivot in possession; recovers to the flank when the ball is lost.' },
        { position: 'DM', role: 'Single pivot', description: 'Stays central and connects the back three with the No.8s. Never leaves the box.' },
        { position: 'LB', role: 'Third centre-back', description: 'Tucks in to make a back three, defending the left channel in transition.' },
        { position: 'RW', role: 'Touchline winger', description: 'Holds maximum width to pin the opposition full-back.' },
      ],
      boards: [
        { url: '/images/tactics/inverted-fullback.svg', caption: 'Board 1 — The 3-2 base: RB steps inside, LB tucks in. (Sample diagram)', alt: 'Tactical board showing an inverted full-back' },
      ],
    },
    content: `
<p>Every few seasons a role becomes fashionable enough that people stop asking what it is for. The inverted full-back is there now. It appears in previews and post-match talk as a sign of sophistication, as if moving a defender ten metres infield were an end in itself.</p>
<h2>The problem it solves</h2>
<p>Start with the moment the ball is lost. A team attacking with five players across the front line has, by definition, committed its width. If the opponent wins the ball and plays forward quickly, the question is simple: who is standing in front of the centre-backs?</p>
<p>A traditional overlapping full-back answers that question badly. He is thirty metres upfield, on the touchline, facing the wrong way. The inverted full-back answers it well. He is already in the centre, next to the pivot, in exactly the zone the counter-attack wants to travel through.</p>
<blockquote><p>The inverted full-back is less an attacking idea than a defensive insurance policy that happens to help the build-up.</p></blockquote>
<h2>The 3-2 base</h2>
<p>In the sample structure on the board above, the right-back (our fictional Elias Brandt) steps in beside the pivot. The left-back tucks in to form a back three. The result is a 3-2 base behind a front five — a shape that offers short passing angles in build-up and a compact rest defence in transition.</p>
<h3>What changes for the pivot</h3>
<p>The single pivot is no longer alone. With a second body beside him, he can afford to receive on the half-turn because there is cover if he is dispossessed. Players like the fictional Mateo Ilarramendi benefit enormously: the extra partner frees them to scan and play forward rather than simply recycle.</p>
<h3>What changes for the winger</h3>
<p>With the full-back inside, the winger becomes the team’s only source of width on that side. That is why inverted full-back systems tend to favour touchline wingers who are comfortable isolated one-against-one.</p>
<h2>The cost</h2>
<p>Nothing is free. A full-back who spends his time in midfield must be able to play there — to receive with his back to goal, to turn under pressure, to recognise when not to turn. Many cannot. And when the opposition beats the first press and switches play quickly, the flank the full-back vacated is suddenly very empty.</p>
<h2>A midfielder in disguise</h2>
<p>The clearest way to understand the role is to stop calling it a full-back at all. It is a midfielder who defends from a wide starting position. Seen that way, the recruitment question becomes obvious: if you want to play this way, scout for midfielders who can run backwards, not defenders who can pass.</p>`,
  },
  {
    title: 'Rest Defence: Why the Best Attacks Are Built on the Players Who Stay Behind',
    category: 'tactical-room',
    author: 'ines',
    daysAgo: 9,
    tags: ['Rest defence', 'Pressing', 'Back three'],
    players: ['Kwame Asante-Boateng'],
    clubs: ['Calderbrook United'],
    excerpt:
      'The structure a team leaves behind the ball decides whether it can keep attacking. A primer on rest defence and counter-pressing.',
    coverImage: { url: IMG.stadiumNight, alt: 'A floodlit stadium at night', caption: 'Control is decided before the ball is lost.', credit: 'Unsplash' },
    tactical: {
      formation: '4-2-3-1',
      inPossession: '2-3-5',
      outOfPossession: '4-4-1-1',
      summary:
        'Two centre-backs and a three-man midfield screen stay behind the ball. Their positioning is designed to win the ball back within seconds of losing it, rather than retreat.',
      roles: [
        { position: 'CB', role: 'Front-foot defender', description: 'Steps out aggressively to intercept the first forward pass after a turnover.' },
        { position: 'DM', role: 'Screen', description: 'Positions to block passing lanes into the opposition striker.' },
        { position: 'FB', role: 'Underlapping', description: 'Stays narrow to support the screen rather than overlapping.' },
      ],
      boards: [
        { url: '/images/tactics/rest-defence.svg', caption: 'Board 1 — A 2+3 rest-defence structure. (Sample diagram)', alt: 'Tactical board showing rest defence' },
      ],
    },
    content: `
<p>The most important players in an attack are often the ones who never touch the ball in the final third. They are the defenders and midfielders standing behind it, and their job is to make sure that when the attack fails — and most attacks fail — the opponent cannot hurt you.</p>
<h2>What rest defence means</h2>
<p>Rest defence is the shape a team holds behind the ball while it is in possession. It is not a separate defensive phase; it is part of attacking. The players in rest defence are pre-positioned for the moment of transition, so that a lost ball becomes an opportunity to win it back rather than a sprint towards your own goal.</p>
<h2>Numbers versus positions</h2>
<p>Coaches often describe rest defence by numbers: “2+3”, “3+2”. These refer to the count of defenders and the count of screening midfielders. But the numbers matter less than the positions. Three players in the wrong place are worse than two in the right place.</p>
<blockquote><p>Good rest defence looks like nothing is happening. That is the point.</p></blockquote>
<h3>The striker is the target</h3>
<p>Most counter-attacks begin with a pass into the opposition’s most advanced player. A well-built rest defence identifies that player and blocks the lanes to him. The screening midfielders position themselves in those lanes; the centre-backs are ready to step out if the ball arrives anyway.</p>
<h3>Front-foot centre-backs</h3>
<p>This is why teams who attack in numbers often recruit centre-backs who are comfortable defending forwards. A defender like the fictional Kwame Asante-Boateng, who intercepts rather than retreats, allows the whole structure to sit higher up the pitch.</p>
<h2>The link to counter-pressing</h2>
<p>Rest defence and counter-pressing are two halves of one idea. The rest-defence players prevent the first forward pass; the players near the ball pressure it immediately. If both work, the opponent is trapped. If either fails, the whole team is exposed.</p>
<h2>Why it matters</h2>
<p>A team with good rest defence can afford to take risks in attack, because the cost of losing the ball is low. That is the real reason the best attacking sides are built from the back: not because their defenders pass well, but because their defenders make it safe to keep attacking.</p>`,
  },
  {
    title: 'Luca Ferrandi: The Metronome Who Never Rushed',
    category: 'player-files',
    author: 'haruki',
    daysAgo: 6,
    featured: true,
    tags: ['Regista', 'History'],
    players: ['Luca Ferrandi'],
    clubs: ['AC Vespera', 'Real Costa Ámbar'],
    excerpt:
      'A career retrospective on a fictional regista who spent twenty years proving that the fastest way to play is often the slowest.',
    coverImage: { url: IMG.tunnel, alt: 'A stadium tunnel leading to the pitch', caption: 'Every career ends with one last walk out.', credit: 'Unsplash' },
    content: `
<p><em>Luca Ferrandi is a fictional player created as sample content. His career, clubs and honours are invented.</em></p>
<p>There is a type of footballer who seems to exist slightly outside the speed of the match. While everyone else is sprinting, he is walking; while everyone else is reacting, he has already decided. Luca Ferrandi was that type of footballer for twenty years.</p>
<h2>Brescia beginnings</h2>
<p>Ferrandi grew up playing on a concrete pitch behind his father’s workshop, where the ball bounced unpredictably and the only way to keep it was to control it with your first touch. By the time AC Vespera signed him at sixteen, his first touch was the thing scouts wrote about first.</p>
<h2>The regista years</h2>
<p>At Vespera he was moved from attacking midfield to the base of the midfield, in front of the defence. It was, he later said, the best thing that ever happened to him. “In front of the defence, you see the whole game. As a ten, you only see the goal.”</p>
${fig(IMG.feet, 'Ferrandi’s game was built on the first touch — the moment the ball arrived, the next pass was already decided.', 'A player controlling a football on grass')}
<p>His defining trait was tempo control. When Vespera were leading, he slowed games to a crawl, receiving, turning, recycling. When they needed a goal, he would suddenly play the pass everyone else had stopped looking for — the long diagonal to the far-side winger.</p>
<h2>Six years in Spain</h2>
<p>His move to Real Costa Ámbar in 2009 surprised Italian observers, who thought his game too slow for Spanish football. It turned out to be the opposite. Surrounded by technically gifted midfielders, he became the reference point of their build-up, and helped mentor a young Mateo Ilarramendi, who would later inherit his role.</p>
<blockquote><p>“He taught me that you check your shoulder before the ball arrives, not after. Everything else is detail.” — Mateo Ilarramendi (fictional)</p></blockquote>
<h2>Coming home</h2>
<p>He returned to Vespera at thirty-one and played seven more seasons, gradually dropping deeper until, in his final year, he was effectively a third centre-back in possession. He retired in 2022 after a testimonial in front of a full stadium.</p>
<h2>Legacy</h2>
<p>Ferrandi never ran far, never tackled much, and rarely scored. What he did was make everyone around him calmer. That is a hard thing to measure, which is perhaps why players like him are so often underrated while they play and so badly missed once they stop.</p>`,
  },
  {
    title: 'Ren Takeda and the Burden of the Number Ten',
    category: 'player-files',
    author: 'ines',
    daysAgo: 14,
    tags: ['Number 10'],
    players: ['Ren Takeda'],
    clubs: ['Ravenmoor Athletic', 'SV Eichental'],
    excerpt:
      'Modern systems have little room for a classic playmaker. A sample profile of a fictional ten finding space in a game that keeps shrinking it.',
    coverImage: { url: IMG.player16, alt: 'A footballer striking the ball', caption: 'The ten has always lived between the lines.', credit: 'Unsplash' },
    content: `
<p><em>Ren Takeda is a fictional player used as sample content.</em></p>
<p>The number ten was once football’s most romantic shirt. It belonged to the player who did not defend, did not run, and did not need to, because what he did with the ball was worth the trade. Then pressing arrived, and the space the ten needed began to disappear.</p>
<h2>Shrinking space</h2>
<p>A compact mid-block leaves perhaps fifteen metres between the opponent’s midfield and defence. A classic ten, standing still in that gap, is easy to mark. The players who survive there are those who move into it late — arriving rather than waiting.</p>
<h2>How Takeda adapted</h2>
<p>Takeda’s solution was to stop being a central ten at all. At Ravenmoor he starts nominally as a left-sided eight and drifts into the left half-space, where he can receive on the half-turn facing forward. The positional label changed; the job didn’t.</p>
<h3>Disguise over dribbling</h3>
<p>He rarely beats players with the ball. What he does is make defenders guess wrong. His body shape suggests one pass; his foot plays another. Analysts call it disguise. Supporters call it the bit where everybody stands up.</p>
<blockquote><p>The ten didn’t die. It just stopped standing in the middle.</p></blockquote>
<h2>The burden</h2>
<p>The burden of the shirt is expectation. Supporters want the ten to decide matches. Coaches want him to press. Takeda’s answer has been to treat defending as another way of finding the ball — pressing in moments rather than for ninety minutes, and saving his energy for the pass that matters.</p>`,
  },
  {
    title: 'Calderbrook 2–2 Ravenmoor: How a Mid-Block Swallowed a Title Favourite',
    category: 'match-analysis',
    author: 'haruki',
    daysAgo: 4,
    tags: ['Mid-block', 'Pressing'],
    players: ['Kwame Asante-Boateng', 'Ren Takeda'],
    clubs: ['Calderbrook United', 'Ravenmoor Athletic'],
    excerpt:
      'A fictional match, analysed properly: how Calderbrook’s compact 4-4-2 block took away Ravenmoor’s central options for an hour.',
    coverImage: { url: IMG.matchplay, alt: 'Players contesting the ball during a match', caption: 'Sample match analysis — fictional fixture.', credit: 'Unsplash' },
    tactical: {
      formation: '4-4-2',
      inPossession: '4-2-4',
      outOfPossession: '4-4-2 mid-block',
      summary:
        'Calderbrook defended in a compact 4-4-2 with the strikers screening the pivot. Wide players stayed narrow, inviting passes to the full-backs, then pressed on the touchline.',
      roles: [
        { position: 'ST', role: 'Cover-shadow forward', description: 'Positioned to block passes into the opposition pivot.' },
        { position: 'LM/RM', role: 'Narrow wide midfielder', description: 'Tucked in to close the half-spaces; pressed outward on the trigger.' },
      ],
      boards: [
        { url: '/images/tactics/mid-block.svg', caption: 'Board 1 — Calderbrook’s 4-4-2 mid-block forcing play wide. (Sample diagram)', alt: 'Tactical board showing a 4-4-2 mid-block' },
      ],
    },
    content: `
<p><em>Sample match analysis. Calderbrook United, Ravenmoor Athletic and this fixture are fictional; no real data is used.</em></p>
<p>Ravenmoor arrived as the favourites and left with a point that felt like a defeat. For an hour they could not find a way through the middle of Calderbrook’s block, and by the time they did, they had already conceded twice.</p>
<h2>The shape</h2>
<p>Calderbrook defended in a 4-4-2 mid-block, starting their pressure around the halfway line. The two strikers did not press the centre-backs; they stood in front of Ravenmoor’s pivot, blocking passes into him with their cover shadows.</p>
<h2>Forcing play wide</h2>
<p>With the centre closed, Ravenmoor’s centre-backs were left with one option: the full-back. That was the trigger. As soon as the ball travelled wide, Calderbrook’s wide midfielder jumped, the near striker cut the return pass, and the touchline did the rest.</p>
<h3>Where Takeda went missing</h3>
<p>Ren Takeda, usually Ravenmoor’s outlet in the left half-space, found that space occupied by Calderbrook’s narrow right midfielder. He dropped deeper in search of the ball, which only crowded the area further.</p>
<h2>The adjustment</h2>
<p>Ravenmoor’s coach changed the game after the hour by pushing a midfielder into the back line, creating a back three in build-up. Suddenly Calderbrook’s two strikers could not cover three centre-backs and the pivot at once. Both Ravenmoor goals came from that extra man.</p>
<blockquote><p>The block didn’t break. It was simply outnumbered.</p></blockquote>
<h2>What it tells us</h2>
<p>A good mid-block is about controlling where the opponent can play, not winning the ball everywhere. Calderbrook decided that the touchline was their friend — and for an hour, it was.</p>`,
  },
  {
    title: 'Anatomy of a Comeback: Real Costa Ámbar’s Second-Half Switch to a Back Three',
    category: 'match-analysis',
    author: 'ines',
    daysAgo: 20,
    tags: ['Back three', 'Build-up'],
    players: ['Mateo Ilarramendi'],
    clubs: ['Real Costa Ámbar'],
    excerpt:
      'Two goals down at half-time, one structural change. A sample breakdown of how a back three can unlock a high press.',
    coverImage: { url: IMG.stadiumSun, alt: 'A stadium in sunlight', caption: 'Sample analysis — fictional match.', credit: 'Unsplash' },
    tactical: {
      formation: '4-3-3 → 3-4-3',
      inPossession: '3-1-6',
      outOfPossession: '5-2-3',
      summary:
        'At half-time the pivot dropped between the centre-backs, giving a three-man first line. The opponent’s two-man press could no longer cover the width of the build-up.',
      roles: [
        { position: 'DM', role: 'Dropping pivot', description: 'Splits the centre-backs to create a back three in possession.' },
        { position: 'WB', role: 'High wing-back', description: 'Pushes very high to pin the opposition wide players.' },
      ],
      boards: [
        { url: '/images/tactics/back-three-switch.svg', caption: 'Board 1 — The pivot drops to form a back three. (Sample diagram)', alt: 'Tactical board showing a back three build-up' },
      ],
    },
    content: `
<p><em>Sample match analysis of a fictional fixture.</em></p>
<p>At half-time Real Costa Ámbar were two goals down and had not completed a single pass into their attacking third that was not a long ball. By full-time they had won. The difference was one player moving fifteen metres.</p>
<h2>The first-half problem</h2>
<p>The opponent pressed with two strikers on Costa Ámbar’s two centre-backs, with a midfielder jumping onto the pivot, Mateo Ilarramendi. Every pass in the build-up was covered. The goalkeeper went long; the long balls were lost.</p>
<h2>The switch</h2>
<p>After the break, Ilarramendi dropped between the centre-backs. The two strikers now faced three defenders. Whichever centre-back was free could carry the ball forward into midfield, drawing a midfielder out of position and opening space behind him.</p>
<h3>Wing-backs high</h3>
<p>With three at the back, the full-backs pushed on into wing-back positions, pinning the opposition wingers deep. That turned the opponent’s 4-4-2 press into a 6-2-2 shape — and two midfielders cannot cover the whole pitch.</p>
<blockquote><p>A back three isn’t defensive. In possession it’s often the boldest choice on the board.</p></blockquote>
<h2>The cost</h2>
<p>Dropping the pivot leaves the midfield thin. Costa Ámbar were vulnerable to direct balls into the space Ilarramendi vacated, and their goalkeeper made two important saves before the equaliser. Every structure trades one weakness for another; the trick is choosing the weakness your opponent is least equipped to exploit.</p>`,
  },
  {
    title: 'Terrace Typography: How Fan Banners Became Football’s Best Graphic Design',
    category: 'football-culture',
    author: 'haruki',
    daysAgo: 8,
    featured: true,
    tags: ['Fan culture', 'Design'],
    players: [],
    clubs: [],
    excerpt:
      'Hand-painted letters, borrowed fonts and ten-metre banners: why the most honest design in football is made by people who are not designers.',
    coverImage: { url: IMG.stadiumWide, alt: 'Fans in a stadium stand', caption: 'The stand is a canvas.', credit: 'Unsplash' },
    content: `
<p>Before clubs had brand guidelines, they had supporters with paint. Every great terrace has its typography — not chosen by an agency, but arrived at over years by people working in garages with brushes, bedsheets and whatever letters they could find.</p>
<h2>The vernacular letter</h2>
<p>Hand-painted banner lettering has rules of its own. Letters are tall and condensed because the banner has to fit across a section of the stand. Strokes are thick because they have to be read from the far end. Words are short because paint is expensive.</p>
<p>These constraints produce a style that professional designers have spent decades imitating: heavy, compressed, slightly uneven, unmistakably made by hand.</p>
${fig(IMG.stadium, 'A stand is designed to be seen from a distance — and so is everything that hangs from it.', 'Wide view of a stadium bowl')}
<h2>Borrowed alphabets</h2>
<p>Many fan groups borrow letterforms from the culture around them: shop signage, record sleeves, graffiti, the gothic script of old newspaper mastheads. A banner can tell you which music a terrace listened to and which city it grew up in as clearly as the words written on it.</p>
<blockquote><p>The best football design isn’t in the club shop. It’s hanging over the railings.</p></blockquote>
<h2>From terraces to merchandise</h2>
<p>In recent years clubs have started quoting terrace typography in their official design — retro kits, heritage collections, matchday posters that deliberately look home-made. It is a form of flattery and a form of appropriation, and supporters notice the difference.</p>
<h2>Why it matters</h2>
<p>Banners are the closest thing football has to a public archive of what supporters actually think. They record grief, protest, humour and loyalty in letters a metre high. Long after a season is forgotten, a photograph of a banner can bring the whole thing back.</p>`,
  },
  {
    title: 'Sacchi’s Milan and the Modern Press: Same Idea, Different Lungs',
    category: 'football-culture',
    author: 'ines',
    daysAgo: 26,
    tags: ['History', 'Pressing'],
    players: [],
    clubs: ['AC Milan'],
    excerpt:
      'A historical comparison: what today’s pressing teams inherited from Arrigo Sacchi’s compact zonal Milan — and what they changed.',
    coverImage: { url: IMG.line, alt: 'A white line painted on a grass pitch', caption: 'Compactness is drawn in lines.', credit: 'Unsplash' },
    content: `
<p>Arrigo Sacchi’s Milan of the late 1980s is one of the most referenced teams in modern coaching. It is often described as the moment pressing became a system rather than an instinct. Like most turning points, the reality is more gradual — but the comparison with today’s game is still revealing.</p>
<h2>The idea: the team as a unit</h2>
<p>Sacchi’s core principle was compactness. The distance between his defensive and attacking lines was kept short, and the whole team moved together in relation to the ball, the opponent and team-mates — rather than following individual opponents around the pitch.</p>
<p>That zonal approach allowed his team to defend high up the pitch with an aggressive offside line, squeezing the space in which opponents could play. It was demanding, rehearsed relentlessly in training, and, at its best, suffocating.</p>
<h2>What stayed the same</h2>
<p>Modern pressing teams still rely on the same foundations: compact lines, collective movement, pressing triggers, and a high defensive line that makes the field smaller. The vocabulary has changed — “cover shadows”, “rest defence”, “counter-pressing” — but the underlying idea is recognisably Sacchi’s.</p>
<blockquote><p>The question has never changed: how small can you make the pitch for the team with the ball?</p></blockquote>
<h2>What changed</h2>
<h3>Physical demands</h3>
<p>Today’s players cover more high-intensity distance, and squads are rotated more heavily to sustain it. Pressing schemes can now be planned around specific opponents and specific build-up patterns in a way that was far harder before video analysis became routine.</p>
<h3>Goalkeepers and build-up</h3>
<p>The modern press also has to deal with goalkeepers who are part of the build-up. The back-pass rule change of 1992 and the subsequent evolution of keepers as passers mean that pressing teams now plan for an extra outfield-capable player in the opponent’s first line.</p>
<h2>A lineage, not a copy</h2>
<p>It is tempting to draw a straight line from Sacchi to today. The truth is a web: Dutch total football before him, and many coaches after who adapted, refined and sometimes rejected his ideas. But when a modern team squeezes the pitch and hunts the ball as one, it is speaking a language Sacchi helped write.</p>`,
  },
  {
    title: 'Stop Calling It a “Six-Pointer”: In Defence of the Ordinary Match',
    category: 'opinions',
    author: 'haruki',
    daysAgo: 2,
    tags: ['Fan culture'],
    players: [],
    clubs: [],
    excerpt:
      'Not every game is a final, a decider or a must-win. The ordinary Saturday is where football actually lives — and we should stop apologising for it.',
    coverImage: { url: IMG.grassroots, alt: 'A player dribbling a ball on grass', caption: 'Most football is ordinary. That’s the point.', credit: 'Unsplash' },
    content: `
<p><em>Opinion.</em></p>
<p>Every match is now marketed as the most important match. Relegation games are “six-pointers”. Mid-table fixtures are “statement games”. Cup ties against lower-league sides are “banana skins”. The language of football coverage has become a language of permanent crisis.</p>
<h2>The inflation of stakes</h2>
<p>When every match is enormous, none of them are. The emotional vocabulary of the sport has been spent so many times that it no longer buys anything. We reach for superlatives out of habit, and the result is that genuinely huge occasions sound exactly like a wet Tuesday in October.</p>
<h2>What the ordinary match gives you</h2>
<p>The ordinary match is where you notice things. A full-back trying something new. A substitute who changes the rhythm. A teenager given twenty minutes because the result doesn’t matter. These are the details that, over a season, become the story — but only if you were paying attention when they seemed unimportant.</p>
<blockquote><p>The ordinary Saturday is not filler between big games. It is the game.</p></blockquote>
<h2>A modest proposal</h2>
<p>Let some matches be small. Let a 1–0 in March be a 1–0 in March. Save the big words for the nights that earn them. Football will feel larger, not smaller, for it.</p>
<p>Agree? Disagree? That’s what the comments are for.</p>`,
  },
  {
    title: 'The Kit Man’s Notebook: Small Rituals in a Big Game',
    category: 'the-stories',
    author: 'ines',
    daysAgo: 33,
    tags: ['Fan culture'],
    players: [],
    clubs: ['Calderbrook United'],
    excerpt:
      'Sample fiction: a season in the life of the person who lays out every shirt, every sock and every superstition before kick-off.',
    coverImage: { url: IMG.boots, alt: 'Football boots and balls on grass', caption: 'Everything has its place by two o’clock.', credit: 'Unsplash' },
    content: `
<p><em>Sample fiction for demonstration purposes.</em></p>
<p>The kit man at Calderbrook United keeps a notebook. Not a spreadsheet, not an app — a paper notebook with a red elastic band, in which he records who wants their socks folded and who wants them rolled, which goalkeeper refuses to wear new gloves on a Saturday, and which striker has to have the peg nearest the door.</p>
<h2>Ritual as preparation</h2>
<p>Football is full of rituals that look like superstition and work like preparation. Laying out a kit in the same order every week gives players one less thing to think about. Familiarity is a form of calm.</p>
<h2>The season in pages</h2>
<p>By May the notebook is nearly full. There are notes about injuries, birthdays, a young defender’s first start, and one page simply titled “Do not mention the cup final.” The kit man says he’ll start a new notebook next season. He says that every year.</p>
<blockquote><p>“Players come and go. The pegs stay in the same place.”</p></blockquote>`,
  },
  // Draft — must never appear publicly.
  {
    title: 'Draft: Set-Piece Coaches Are the New Assistant Managers',
    category: 'tactical-room',
    author: 'ines',
    status: 'draft',
    tags: ['Build-up'],
    players: [],
    clubs: [],
    excerpt: 'Unpublished draft used to verify that drafts are hidden from public endpoints.',
    coverImage: { url: IMG.corner, alt: 'Corner of a football pitch', caption: '' },
    content: '<p>Work in progress. This draft should only be visible in the dashboard.</p>',
  },
  // Scheduled — published automatically by the scheduler when its time arrives.
  {
    title: 'Scheduled: The Season Preview Nobody Asked For',
    category: 'opinions',
    author: 'haruki',
    status: 'scheduled',
    scheduleInDays: 7,
    tags: ['Fan culture'],
    players: [],
    clubs: [],
    excerpt: 'A scheduled article that the in-process scheduler will publish automatically when its time arrives.',
    coverImage: { url: IMG.sky, alt: 'Stadium under a blue sky', caption: '' },
    content: '<p>Scheduled content. It becomes public automatically at its scheduled time while the API is running.</p>',
  },
];

export const polls = [
  {
    question: 'Which role has changed the most in the last decade?',
    description: 'Pick the position you think has been most transformed by modern coaching.',
    options: ['Full-back', 'Goalkeeper', 'Number 10', 'Centre-forward'],
    featured: true,
    seedVotes: [14, 9, 11, 5],
    articleSlugHint: 'inverted-full-back',
  },
  {
    question: 'Best way to beat a compact mid-block?',
    options: ['Overload the half-spaces', 'Switch play quickly', 'Go direct over the top', 'Set pieces'],
    featured: false,
    seedVotes: [12, 15, 4, 7],
  },
  {
    question: 'Should every match be sold as a “must-win”?',
    options: ['Yes — stakes make it exciting', 'No — let ordinary games be ordinary', 'Depends on the league'],
    featured: false,
    status: 'closed',
    seedVotes: [6, 21, 8],
  },
];

export const sampleComments = [
  { article: 'inverted-full-back', user: 'tomasz', body: 'Best explanation of the role I’ve read. The rest-defence angle finally made it click for me.' },
  { article: 'inverted-full-back', user: 'amara', body: 'Agree on the recruitment point — most full-backs simply can’t receive on the half-turn.', replyTo: 0 },
  { article: 'floodlights', user: 'amara', body: 'The bit about the groundsman got me. Every small club has someone like that.' },
  { article: 'six-pointer', user: 'tomasz', body: 'Strongly disagree — relegation games ARE bigger. But the language has definitely inflated.' },
  { article: 'six-pointer', user: 'jules', body: 'The wet Tuesday in October line is perfect.', replyTo: 3 },
  { article: 'ferrandi', user: 'jules', body: 'Every team needs a player who makes everyone else calmer. Lovely piece.' },
];
