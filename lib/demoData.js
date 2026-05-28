export const DEMO_DESIGN = {
  jobAddress: '10248 W Arkansas Ave, Lakewood CO 80232',
  items: [
    { sku:'B18-L',          description:'18" Base Cabinet - Island HL', qty:1, section:'island',    itemType:'cabinet',   handed:'left',  price:null },
    { sku:'3DB12',          description:'12" 3 Drawer Base',            qty:3, section:'island',    itemType:'cabinet',   handed:null,    price:null },
    { sku:'443028',         description:'Trash Pull',                   qty:1, section:'island',    itemType:'accessory', handed:null,    price:null },
    { sku:'440149',         description:'24" Microwave Base',           qty:1, section:'island',    itemType:'cabinet',   handed:null,    price:null },
    { sku:'BWBK18',         description:'18" Base w/ Back Panel',       qty:1, section:'island',    itemType:'cabinet',   handed:null,    price:null },
    { sku:'PNL34.5*96*1/4',description:'34.5x96x1/4 Cabinet Panel',    qty:1, section:'island',    itemType:'trim',      handed:null,    price:null },
    { sku:'KSGG700ESS',    description:'KitchenAid Gas Range',          qty:1, section:'island',    itemType:'appliance', handed:null,    price:null },
    { sku:'B18-L',          description:'18" Base Cabinet - Sink HL',   qty:1, section:'sink wall', itemType:'cabinet',   handed:'left',  price:null },
    { sku:'SB36',           description:'36" Sink Base',                qty:1, section:'sink wall', itemType:'cabinet',   handed:null,    price:null },
    { sku:'B15',            description:'15" Base Cabinet HR',          qty:1, section:'sink wall', itemType:'cabinet',   handed:'right', price:null },
    { sku:'W361824',        description:'36x18x24 Wall Cabinet',        qty:1, section:'sink wall', itemType:'cabinet',   handed:null,    price:null },
    { sku:'W1536-L',        description:'15x36 Wall - Left',            qty:1, section:'sink wall', itemType:'cabinet',   handed:'left',  price:null },
    { sku:'W1536-R',        description:'15x36 Wall - Right',           qty:1, section:'sink wall', itemType:'cabinet',   handed:'right', price:null },
    { sku:'W1836-R',        description:'18x36 Wall Cabinet HR',        qty:1, section:'sink wall', itemType:'cabinet',   handed:'right', price:null },
    { sku:'REP1.5X96-L',   description:'1.5" Top Filler Left',          qty:1, section:'sink wall', itemType:'trim',      handed:'left',  price:null },
    { sku:'REP1.5X96-R',   description:'1.5" Top Filler Right',         qty:1, section:'sink wall', itemType:'trim',      handed:'right', price:null },
    { sku:'KRSC503ESS',    description:'KitchenAid Refrigerator',       qty:1, section:'sink wall', itemType:'appliance', handed:null,    price:null },
    { sku:'KDFE104DSS',    description:'KitchenAid Dishwasher',         qty:1, section:'sink wall', itemType:'appliance', handed:null,    price:null },
  ]
}

export const DEMO_INVOICE = {
  jobAddress:'10248 W Arkansas Ave, Lakewood CO 80232', invoiceNumber:'63052', soNumber:'SO70940',
  items: [
    { sku:'MTS-B18',             description:'18" Base Cabinet',                 qty:1,  section:'island',    itemType:'cabinet',   price:262.12 },
    { sku:'TRASH KIT',           description:'Trash Kit',                        qty:1,  section:'island',    itemType:'accessory', price:180.50 },
    { sku:'MTS-3DB12',           description:'12" 3 Drawer Base',                qty:2,  section:'island',    itemType:'cabinet',   price:334.62 },
    { sku:'MTS-BMC24',           description:'24" Base Microwave Cabinet',       qty:1,  section:'island',    itemType:'cabinet',   price:355.37 },
    { sku:'MTS-TK8',             description:'Toe Kick',                         qty:1,  section:'island',    itemType:'trim',      price:18.22  },
    { sku:'MTS-PNL 34.5x96x1/4',description:'34.5x96x1/4" MTS Cabinet Panel',  qty:1,  section:'island',    itemType:'trim',      price:124.93 },
    { sku:'MTS-OCM8',            description:"8' Outside Corner Molding",        qty:1,  section:'island',    itemType:'trim',      price:27.89  },
    { sku:'MTS-SM8',             description:'Scribe Molding',                   qty:3,  section:'island',    itemType:'trim',      price:13.76  },
    { sku:'MTS-TOUCH UP',        description:'Mountain Timber Touch up Kit',     qty:1,  section:'island',    itemType:'accessory', price:20.28  },
    { sku:'WHS-B18',             description:'18" Base Cabinet HL',              qty:1,  section:'sink wall', itemType:'cabinet',   price:217.00 },
    { sku:'WHS-SB36',            description:'36" Sink Base',                    qty:1,  section:'sink wall', itemType:'cabinet',   price:249.45 },
    { sku:'WHS-B15',             description:'15" Base Cabinet HR',              qty:1,  section:'sink wall', itemType:'cabinet',   price:207.87 },
    { sku:'WHS-W361824',         description:'36x18x24 Wall Cabinet',            qty:1,  section:'sink wall', itemType:'cabinet',   price:209.90 },
    { sku:'WHS-W1536',           description:'15x36 Wall Cabinet HR AND HL',     qty:2,  section:'sink wall', itemType:'cabinet',   price:142.98 },
    { sku:'WHS-W1836',           description:'18x36 Wall Cabinet HR',            qty:1,  section:'sink wall', itemType:'cabinet',   price:164.61 },
    { sku:'WHS-TK8',             description:'Toe Kick',                         qty:1,  section:'sink wall', itemType:'trim',      price:15.89  },
    { sku:'WHS-SM8',             description:'Scribe Molding',                   qty:3,  section:'sink wall', itemType:'trim',      price:11.94  },
    { sku:'WHS-TOUCH UP',        description:'White Touch up Kit',               qty:1,  section:'sink wall', itemType:'accessory', price:20.28  },
    { sku:'WHS-REP3x96',         description:'3" Return w/ dado + 1/2" panel',  qty:2,  section:'sink wall', itemType:'trim',      price:157.85 },
    { sku:'WHS-TF1.5x96',        description:'1.5x96 White Shaker Top Filler',  qty:2,  section:'sink wall', itemType:'trim',      price:21.64  },
    { sku:'Assembly (Shaker)',   description:'Shaker Assembly Fee',              qty:11, section:'services',  itemType:'service',   price:30.00  },
    { sku:'Delivery',            description:'Local Delivery',                   qty:1,  section:'services',  itemType:'service',   price:250.00 },
  ]
}

export const DEMO_DESIGN_TEXT = `
REP1.5X96-L KRSC503ESS REP1.5X96-R B18-L SB36 440149 KDFE104DSS B15 BWBK18
---- island ---- 3DB12 3DB12 3DB12 KSGG700ESS PNL34.5*96*1/4 443028
W361824 W1536-L W1536-R W1836-R
Layout: 142" total | 96" ceiling | Island: 57"x36" | Sink wall: 93"
`
