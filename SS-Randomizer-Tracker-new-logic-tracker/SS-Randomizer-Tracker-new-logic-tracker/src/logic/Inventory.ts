// The order here defines the order of items in requirement tooltips too
export const itemMaxes = {
    Sailcloth: 1,

    'Emerald Tablet': 1,
    'Ruby Tablet': 1,
    'Amber Tablet': 1,

    'Lanayru Caves Small Key': 1,
    'Sea Chart': 1,
    'Stone of Trials': 1,

    'Empty Bottle': 5,
    'Progressive Pouch': 1,
    'Progressive Wallet': 4,
    'Extra Wallet': 3,

    'Progressive Sword': 6,

    'Progressive Slingshot': 2,
    'Progressive Beetle': 4,
    'Bomb Bag': 1,
    'Gust Bellows': 1,
    Whip: 1,
    Clawshots: 1,
    'Progressive Bow': 3,
    'Progressive Bug Net': 2,

    'Progressive Mitts': 2,
    "Water Dragon's Scale": 1,
    'Fireshield Earrings': 1,

    "Goddess's Harp": 1,
    'Ballad of the Goddess': 1,

    "Farore's Courage": 1,
    "Nayru's Wisdom": 1,
    "Din's Power": 1,
    'Song of the Hero': 3,
    Triforce: 3,

    "Cawlin's Letter": 1,
    'Horned Colossus Beetle': 1,
    'Baby Rattle': 1,
    'Gratitude Crystal Pack': 13,
    'Spiral Charge': 1,
    'Life Tree Fruit': 1,
    'Group of Tadtones': 17,
    Scrapper: 1,

    'Skyview Boss Key': 1,
    'Earth Temple Boss Key': 1,
    'Lanayru Mining Facility Boss Key': 1,
    'Ancient Cistern Boss Key': 1,
    'Sandship Boss Key': 1,
    'Fire Sanctuary Boss Key': 1,
    'Skyview Small Key': 2,
    'Key Piece': 5,
    'Lanayru Mining Facility Small Key': 1,
    'Ancient Cistern Small Key': 2,
    'Sandship Small Key': 2,
    'Fire Sanctuary Small Key': 3,
    'Sky Keep Small Key': 1,

    Tumbleweed: 1,
};

export type InventoryItem = keyof typeof itemMaxes;

export function isItem(id: string): id is InventoryItem {
    return id in itemMaxes;
}

export function itemName(item: string, amount: number) {
    return amount > 1 ? `${item} x ${amount}` : item;
}
