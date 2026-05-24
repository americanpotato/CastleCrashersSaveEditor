const CHARACTER_NAMES = [
  "Green Knight","Red Knight","Blue Knight","Orange Knight","Gray Knight",
  "Barbarian","Thief","Fencer","Beekeeper","Industrialist","Alien Hominid",
  "The King","The Brute","Snakey","Saracen","Royal Guard","Stoveface",
  "Peasant","Bear","Necromancer","Conehead","Civilian","Open-face Gray Knight",
  "Fire Demon","Skeleton","Iceskimo","Ninja","Cultist","Pink Knight",
  "Blacksmith","Hatty","Paint Junior",
  "Custom 1","Custom 2","Custom 3","Custom 4","Custom 5",
  "Custom 6","Custom 7","Custom 8","Custom 9","Custom 10"
];

const CHARACTER_IMAGES = [
  "images/GreenKnight.png",       
  "images/RedKnight.png",         
  "images/BlueKnight.png",     
  "images/OrangeKnight.png",      
  "images/GrayKnight.png",        
  "images/Barbarian.png",        
  "images/Thief.png",             
  "images/Fencer.png",           
  "images/Beekeeper.png",         
  "images/Industrialist.png",     
  "images/AlienHominid.png",      
  "images/TheKing.png",           
  "images/TheBrute.png",          
  "images/Snakey.png",            
  "images/Saracen.png",           
  "images/RoyalGuard.png",       
  "images/Stoveface.png",         
  "images/Peasant.png",          
  "images/Bear.png",              
  "images/Necromancer.png",       
  "images/Conehead.png",          
  "images/Civilian.png",          
  "images/OpenFaceGrayKnight.png",
  "images/FireDemon.png",         
  "images/Skeleton.png",          
  "images/Iceskimo.png",          
  "images/Ninja.png",             
  "images/Cultist.png",           
  "images/PinkKnight.png",        
  "images/Blacksmith.png",
  "images/Hatty.png",         
  "images/PaintJunior.png",            
  "images/custom/1.png",          
  "images/custom/2.png",          
  "images/custom/3.png",         
  "images/custom/4.png",          
  "images/custom/5.png",          
  "images/custom/6.png",         
  "images/custom/7.png",          
  "images/custom/8.png",          
  "images/custom/9.png",          
  "images/custom/10.png",         
];

const WEAPONS = [
  "Skinny Sword","Skinny Sword","Skinny Sword","Thin Sword","Thick Sword",
  "Pumpkin Peeler","Gladiator Sword","Butcher Knife","Half Sword","Carrot",
  "Thief Sword","Gold Sword","Dual Prong Sword","Zigzag","Playdo Pasta Maker",
  "Falchion","Pointy Sword","Chewed Up Sword","Fencer's Foil","Barbarian Axe",
  "Pitchfork","Curved Sword","Key Sword","Apple Peeler","Rubber Handle Sword",
  "Mace","Club","Ugly Mace","Refined Mace","Fish","Wrapped Sword",
  "Skeletor Mace","Clunky Mace","Snakey Mace","Rat Beating Bat",
  "Black Morning Star","King's Mace","Meat Tenderizer","Leaf","Sheathed Sword",
  "Practice Foil","Twig","Leafy Twig","Light Saber","Staff","Wooden Spoon",
  "Bone Leg","Alien Gun","Fishing Spear","Lance","Sai","Unicorn Horn",
  "Ribeye","Kielbasa","Lobster","Umbrella","Broad Ax","Evil Sword",
  "Ice Sword","Candlestick","Panic Mallet","Fishing Rod","Wrench",
  "NG Lollipop","Gold Skull Mace","NG Gold Sword","Chainsaw","Broad Spear",
  "Glowstick","Chicken Stick","Demon Sword","Broccoli Sword","Man Catcher",
  "Wooden Mace","Ninja Claw","Buffalo Mace","Electric Eel","Scissors",
  "Dinner Fork","Cattle Prod","Lightning Bolt","2x4","Wooden Sword",
  "Cardboard Tube","Emerald Sword","Hammer","Pencil","Invisible Sword",
  "Invisible Sword","Invisible Sword","Invisible Sword","Invisible Sword",
  "Invisible Sword","Invisible Map","Invisible Horn","Invisible Arrow",
  "Invisible Shovel","Map","Horn","Arrow","Shovel"
];

const PETS = [
  "None","Cardinal","Owlet","Rammy","Frogglet","Monkeyface","BiPolar Bear",
  "Bitey Bat","Yeti","Troll","Snailburt","Giraffey","Zebra","Meowburt",
  "Pazzo","Burly Bear","Hawkster","Snoot","Piggy","Spiny","Scratchpaw",
  "Seahorse","Chicken","Install Ball","Mr. Buddy","Sherbert","Pelter",
  "Dragonhead","Beholder","Golden Whale"
];

const LEVELS = [
  "Checkpoint 0","Castle Keep","Barbarian Boss","Thieves' Forest","Catfish",
  "Pipistrello's Cave","Parade","Cyclops' Fortress","Lava World",
  "Industrial Castle","Pirate Ship","Desert Chase","Sand Castle Roof",
  "Corn Boss","Medusa's Lair","Full Moon","Ice Castle","Final Battle"
];

const OFF = {
  UNLOCK: 0,
  LEVEL: 1,
  XP: 2,
  WEAPON: 6,
  PET: 7,
  STR: 8,
  DEF: 9,
  MAG: 10,
  AGI: 11,
  NORMAL_LVL: 12,
  POTIONS: 15,
  BOMBS: 16,
  SANDWICHES: 17,
  NON_CONSUMABLE: 18,
  GOLD: 19,
  INSANE_UNLOCKED: 23,
  INSANE_LVL: 24,
  SKULL: 27,
};

const NON_CONSUMABLE_ITEMS = [
  "Compass (Normal)",
  "Wheel (Normal)",
  "Telescope (Normal)",
  "Horn (Normal)",
  "Compass (Insane)",
  "Wheel (Insane)",
  "Telescope (Insane)",
  "Horn (Insane)",
];

const GLOBAL_OFF = {
  VIBRATION: 1,
  MUSIC_VOL: 3,
  GORE: 5,
  ARENAS: 8,
  ANIMALS: 9,
  ITEMS: 13,
  RELICS: 18,
  WEAPONS: 21,
  WEAPONS_DLC: 29,
  BOB_TIME: 48,
  BOB_CHAR: 52,
};

const RELICS = ["Compass", "Wheel", "Telescope"];

const ARENAS = ["Thieves' Arena", "Volcano Arena", "Peasant Arena", "Icy Arena"];

const ITEM_WHEEL_ITEMS = [
  "Bow", "Shovel", "Boomerang", "Ax", "Shuriken", "Horn",
  "Knife", "Bombs", "Potions", "Mittens", "Sandwich", "Blade",
];

const ITEM_BITS = [1, 2, 3, 6, 8, 11];

const ITEMS_BYTES = 2;
const WEAPONS_MAIN = 64;
const WEAPONS_DLC_BYTES = 8;

const GLOBAL_SIZE = 64;
const CHAR_SIZE = 48;
const NUM_CHARS = 42;
const SAVE_LENGTH = GLOBAL_SIZE + NUM_CHARS * CHAR_SIZE;

let saveData = null;
let selectedChar = -1;
