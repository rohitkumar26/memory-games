// ============================================
// SEO & Educational Metadata Registry
// Structured learning data for parents, educators, and search engines
// ============================================

export interface GameSEOData {
  skills: string[];
  howToPlay: string[];
  parentTips: string[];
  learningObjective: string;
  keywords: string[];
}

export const GAME_SEO_REGISTRY: Record<string, GameSEOData> = {
  'memory-match': {
    skills: ['Visual Working Memory', 'Spatial Orientation', 'Pattern Recognition', 'Concentration'],
    learningObjective: 'Enhances short-term visual retention by challenging children to remember card locations and identify matching pairs.',
    howToPlay: [
      'Tap any card to flip it over and reveal its hidden picture.',
      'Tap a second card to find its matching twin.',
      'If the cards match, they stay revealed! If not, they turn back over.',
      'Match all card pairs in the fewest moves and fastest time to win.'
    ],
    parentTips: [
      'Encourage children to name each emoji or item out loud as they flip cards to build dual-coding audio-visual memory.',
      'For younger toddlers (ages 3–4), start with Level 1 (6 cards) before moving up to larger grids.'
    ],
    keywords: ['memory match game for kids', 'free card matching game', 'preschool memory puzzle', 'visual memory training', 'toddler brain games']
  },
  'shadow-matching': {
    skills: ['Shape Discrimination', 'Visual Figure-Ground Perception', 'Object Recognition', 'Spatial Reasoning'],
    learningObjective: 'Develops visual discrimination and abstract shape analysis by matching colored items to their dark silhouette outlines.',
    howToPlay: [
      'Inspect the dark mystery silhouettes on the top shelf.',
      'Tap a colorful animal or item in the bottom tray.',
      'Tap the matching shadow silhouette where it belongs.',
      'Pair all items with their silhouettes to complete the board.'
    ],
    parentTips: [
      'Guide your child to focus on distinctive contours like animal ears, wheels, wings, or tails.',
      'Great warm-up activity for developing pre-reading letter recognition skills (distinguishing between similar letter shapes like b/d and p/q).'
    ],
    keywords: ['shadow matching game online', 'silhouette match for kids', 'shape recognition game', 'preschool visual perception', 'toddler shadow puzzle']
  },
  'spot-the-difference': {
    skills: ['Visual Scanning', 'Sustained Attention', 'Comparative Analysis', 'Attention to Detail'],
    learningObjective: 'Sharpens visual scanning and visual search strategies by comparing two nearly identical side-by-side scenes.',
    howToPlay: [
      'Look closely at both the Left Scene and Right Scene side by side.',
      'Find the tiles where items, colors, or icons are different.',
      'Tap the differing tile in either scene to highlight it with a golden ring.',
      'Find all hidden differences to earn a 3-star rating.'
    ],
    parentTips: [
      'Teach systematic scanning habits (scanning row-by-row from left-to-right and top-to-bottom) rather than random looking.',
      'Celebrates patient observation over rushed clicking.'
    ],
    keywords: ['spot the difference game for kids', 'find the difference online free', 'visual attention games for children', 'observation puzzles kids']
  },
  'maze-memory': {
    skills: ['Spatial Orientation', 'Mental Path Mapping', 'Working Memory', 'Visual Forward Planning'],
    learningObjective: 'Develops cognitive mapping and spatial planning by memorizing labyrinth routes before navigating a character from start to goal.',
    howToPlay: [
      'Look closely at the glowing golden path that lights up across the labyrinth.',
      'Remember the turns and steps before the timer runs out.',
      'Tap or step along the memorized path to guide your character to the treasure.',
      'Reach the goal safely without stepping into labyrinth walls.'
    ],
    parentTips: [
      'Encourage children to verbalize directions (e.g. "Right two steps, down two steps") to pair verbal memory with spatial memory.',
      'Builds foundational mental planning and foresight for maze problem solving.'
    ],
    keywords: ['maze memory game for kids', 'labyrinth path recall online', 'spatial memory games for children', 'preschool maze puzzle', 'kids navigation brain game']
  },
  'simon-says': {
    skills: ['Auditory Working Memory', 'Sequential Processing', 'Motor Inhibition', 'Audio-Visual Integration'],
    learningObjective: 'Boosts sequential memory capacity and focus by observing, memorizing, and reproducing growing audio-visual patterns.',
    howToPlay: [
      'Watch and listen as the colorful pads light up in a melodic sequence.',
      'Wait until it is your turn, then tap the pads in the exact same order.',
      'Each successful round adds one more step to the melody.',
      'Complete all target rounds to achieve the Memory Master trophy.'
    ],
    parentTips: [
      'Sing or hum the tones together to help reinforce rhythmic and tonal memory.',
      'Promotes self-regulation by teaching kids to wait patiently until the sequence finishes playing before acting.'
    ],
    keywords: ['simon says game online free', 'sequence memory game for kids', 'audio memory game', 'repeat pattern game kids', 'preschool rhythm memory']
  },
  'rhythm-repeat': {
    skills: ['Rhythm Perception', 'Auditory Sequential Memory', 'Beat Synchronization', 'Motor Timing'],
    learningObjective: 'Enhances rhythmic timing, auditory sequence memory, and musical tempo awareness by listening to instrument beats and repeating them.',
    howToPlay: [
      'Listen carefully as the drums, piano, or synthesizer play a rhythmic beat.',
      'Watch the musical pads light up to the tempo.',
      'When your turn begins, tap the pads in the exact same rhythm and sequence.',
      'Complete all rounds to become a Rhythm Maestro!'
    ],
    parentTips: [
      'Clap hands along with the beat to reinforce physical body-rhythm connection.',
      'Musical rhythm training is strongly linked to phonological awareness and early reading skills.'
    ],
    keywords: ['rhythm repeat game for kids', 'drum beat memory game', 'musical sequence game online', 'kids rhythm memory', 'audio beat memory game']
  },
  'number-sequence': {
    skills: ['Numeric Working Memory', 'Reverse Digit Span', 'Executive Function', 'Mental Manipulation'],
    learningObjective: 'Strengthens active working memory and mathematical agility by holding and manipulating number sequences forward and backward.',
    howToPlay: [
      'Watch digits flash on the screen one by one with sound chimes.',
      'Remember the sequence in your head.',
      'Type the numbers on the keypad in Forward order (or Reverse order in Brain Buster mode!).',
      'Clear all 5 rounds to set a new personal high score.'
    ],
    parentTips: [
      'Reverse digit recall is a recognized cognitive exercise used in educational assessments to build working memory capacity.',
      'Chunking digits into pairs (e.g. "4-2" then "8-9") helps kids remember longer sequences easily.'
    ],
    keywords: ['number memory game kids', 'digit span game online', 'reverse number sequence game', 'math memory games for children', 'working memory brain training']
  },
  'category-sorting': {
    skills: ['Semantic Categorization', 'Conceptual Knowledge', 'Logical Classification', 'Executive Function'],
    learningObjective: 'Reinforces cognitive categorization and vocabulary by sorting items into thematic conceptual baskets.',
    howToPlay: [
      'Look at the current spotlight item in the center.',
      'Determine which category it belongs to (e.g. Animals vs Delicious Foods).',
      'Tap the matching category basket to sort it.',
      'Clear your queue of items with high accuracy for maximum points.'
    ],
    parentTips: [
      'Ask your child "Why does an apple go into Foods while a lion goes into Animals?" to prompt verbal articulation and reasoning.',
      'Great for bilingual learners to build conceptual associations across languages.'
    ],
    keywords: ['category sorting game for kids', 'classification games preschool', 'animal vs food sorting', 'semantic memory exercises kids']
  },
  'habitat-sort': {
    skills: ['Biological Classification', 'Environmental Awareness', 'Deductive Reasoning', 'World Knowledge'],
    learningObjective: 'Teaches natural sciences and ecological associations by placing animals into their native planetary biomes.',
    howToPlay: [
      'Look at the wild animal waiting at the entrance.',
      'Identify its natural home (Farm, Ocean, Jungle, Arctic, or Desert).',
      'Tap the corresponding habitat card to send the animal home.',
      'Sort all animals safely across multiple habitats to win.'
    ],
    parentTips: [
      'Discuss how animal physical traits (like polar bear fur or dolphin fins) help them survive in their unique habitats.',
      'Pairs perfectly with elementary science and nature curriculum units.'
    ],
    keywords: ['animal habitat sorting game', 'preschool science games', 'ocean vs jungle animals game', 'educational biology games for kids']
  },
  'food-groups': {
    skills: ['Nutritional Classification', 'Semantic Categorization', 'Healthy Habits Formation', 'Conceptual Grouping'],
    learningObjective: 'Promotes healthy eating and scientific taxonomy by sorting real-world foods into their 5 nutritional food pyramid groups.',
    howToPlay: [
      'Look at the delicious food item featured on the plate.',
      'Decide whether it belongs to Fruits, Veggies, Grains, Proteins, or Dairy.',
      'Tap the matching food group basket to sort the food correctly.',
      'Sort all foods to achieve a Master Nutritionist rating.'
    ],
    parentTips: [
      'Involve your child in sorting real dinner ingredients into food groups while cooking together at home.',
      'Discuss how each food group helps our bodies grow strong (e.g. calcium in dairy for bones, protein for muscles).'
    ],
    keywords: ['food groups sorting game', 'kids nutrition game online', 'healthy eating educational games', 'preschool food classification', 'fruits vs vegetables game']
  },
  'whats-missing': {
    skills: ['Short-Term Visual Recall', 'Mental Visualization', 'Object Identification', 'Concentration'],
    learningObjective: 'Sharpens acute visual recall and mental imagery by identifying which item was removed from a group.',
    howToPlay: [
      'Memorize all colorful items displayed on the magic tray during the countdown.',
      'Watch the magic curtain cover the tray as an item mysteriously vanishes.',
      'Look at the remaining items and the question mark pedestal.',
      'Tap the missing item from the multiple-choice options below.'
    ],
    parentTips: [
      'Encourage children to invent a silly short story connecting all items on the tray to dramatically boost recall.',
      'Known as the "Kim\'s Game" technique, celebrated in childhood education worldwide for fostering active memory.'
    ],
    keywords: ['whats missing game for kids', 'kims game online', 'tray memory game', 'short term memory games for kids', 'missing object puzzle']
  },
  'shopping-list': {
    skills: ['List Memorization', 'Visual Scanning & Filtering', 'Working Memory Retrieval', 'Semantic Categorization'],
    learningObjective: 'Boosts working memory capacity and focused retrieval by holding a multi-item grocery list in mind while searching crowded store shelves.',
    howToPlay: [
      'Read and memorize the grocery items on the notepad before it slips into your pocket.',
      'Scan the supermarket shelves for the exact items from your list.',
      'Tap the target items to add them to your shopping cart.',
      'Avoid distractor items that were not on Mom\'s list to earn a 3-star rating.'
    ],
    parentTips: [
      'Great real-world rehearsal game before going on real grocery store trips with your child.',
      'Practice mnemonic chunking strategies (e.g., grouping "2 fruits and 1 dairy item").'
    ],
    keywords: ['shopping list memory game', 'grocery store game for kids', 'item recall brain game', 'preschool memory list game', 'supermarket memory puzzle']
  },
  'trace-the-path': {
    skills: ['Fine Motor Coordination', 'Visual-Motor Integration', 'Pencil Control', 'Spatial Trajectory Tracking'],
    learningObjective: 'Prepares young learners for handwriting and drawing by tracing fluid curves and guided paths.',
    howToPlay: [
      'Put your finger or mouse cursor on the starting character.',
      'Trace carefully along the glowing dotted ribbon without letting go.',
      'Hit all star checkpoints along the curve to illuminate the path.',
      'Reach the goal destination to trigger victory confetti.'
    ],
    parentTips: [
      'Ideal for preschoolers and kindergarteners developing grip, stylus control, and hand-eye coordination.',
      'Encourage smooth, steady motion rather than racing as fast as possible.'
    ],
    keywords: ['tracing games for kids', 'fine motor skills games online', 'handwriting preparation preschool', 'draw the path game kids', 'dotted line tracing online']
  },
  'connect-the-dots': {
    skills: ['Number Sequencing', 'Shape Formation', 'Fine Motor Control', 'Anticipatory Visual Thinking'],
    learningObjective: 'Reinforces sequential counting from 1 upwards while demonstrating how geometric vertices form recognizable pictures.',
    howToPlay: [
      'Find Dot number (1) with the pulsing glow halo.',
      'Tap or drag to Dot (2), then (3), and continue in sequential counting order.',
      'Watch the mystery picture connect and reveal its vibrant full-color artwork.',
      'Solve all puzzle shapes in the collection.'
    ],
    parentTips: [
      'Reinforces number recognition and cardinal counting in early kindergarten learners.',
      'Ask your child to guess what shape or object is forming before the final dot is connected!'
    ],
    keywords: ['connect the dots online kids', 'dot to dot numbers game free', 'preschool counting game', 'numbered dot puzzle kids', 'early math motor games']
  },
  'draw-the-shape': {
    skills: ['Visual Imagery Memory', 'Shape Geometry', 'Fine Motor Reconstruction', 'Spatial Proportions'],
    learningObjective: 'Fosters acute mental imagery and geometry recall by reconstructing glowing polygon shapes on canvas from memory.',
    howToPlay: [
      'Look closely at the glowing geometric shape as it pulses on the canvas.',
      'Memorize its sides, corners, and proportions before it fades away.',
      'Draw the shape outline from memory using your finger or stylus.',
      'Tap "Check My Shape" to see your accuracy rating and reveal the original!'
    ],
    parentTips: [
      'Encourage children to name each shape and count its sides (e.g. "A triangle has 3 sides and 3 sharp corners").',
      'Boosts spatial-motor confidence and visual memory reproduction.'
    ],
    keywords: ['draw the shape game kids', 'geometry memory game online', 'shape tracing game preschool', 'visual memory drawing game', 'drawing from memory kids']
  }
};
