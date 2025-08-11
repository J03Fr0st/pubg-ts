// Generated from PUBG API assets
// Last updated: 2025-08-11T14:06:20.060Z

export type AttackType = 'BlackZone' | 'RedZone' | 'Weapon';

export const ATTACKTYPE_ENUM = ['BlackZone', 'RedZone', 'Weapon'];

export type CarryState =
  | 'BodyCarry_DBNO_Carrier'
  | 'BodyCarry_End_Carried'
  | 'BodyCarry_End_Carrier'
  | 'BodyCarry_Start_Carried'
  | 'BodyCarry_Start_Carrier';

export const CARRYSTATE_ENUM = [
  'BodyCarry_DBNO_Carrier',
  'BodyCarry_End_Carried',
  'BodyCarry_End_Carrier',
  'BodyCarry_Start_Carried',
  'BodyCarry_Start_Carrier',
];

export type DamageReason =
  | 'ArmShot'
  | 'HeadShot'
  | 'LegShot'
  | 'None'
  | 'NonSpecific'
  | 'PelvisShot'
  | 'SimlateAIBeKilled'
  | 'SimulateAIBeKilled'
  | 'TorsoShot';

export const DAMAGEREASON_ENUM = [
  'ArmShot',
  'HeadShot',
  'LegShot',
  'None',
  'NonSpecific',
  'PelvisShot',
  'SimlateAIBeKilled',
  'SimulateAIBeKilled',
  'TorsoShot',
];

export type ObjectType =
  | 'Caraudio'
  | 'Door'
  | 'DoubleSlidingDoor'
  | 'Fence'
  | 'FuelPuddle'
  | 'Hay'
  | 'Jerrycan'
  | 'JerryCan'
  | 'Jukebox'
  | 'JukeBox'
  | 'PropaneTank'
  | 'VendingMachine'
  | 'Window'
  | 'Ascender'
  | 'GasPump'
  | 'LockedDoor'
  | 'BulletproofShield'
  | 'Cartoplights';

export const OBJECTTYPE_ENUM = [
  'Caraudio',
  'Door',
  'DoubleSlidingDoor',
  'Fence',
  'FuelPuddle',
  'Hay',
  'Jerrycan',
  'JerryCan',
  'Jukebox',
  'JukeBox',
  'PropaneTank',
  'VendingMachine',
  'Window',
  'Ascender',
  'GasPump',
  'LockedDoor',
  'BulletproofShield',
  'Cartoplights',
];

export type ObjectTypeStatus =
  | 'ACTIVATED'
  | 'Closing'
  | 'false'
  | 'FuelSpill'
  | 'Ignite'
  | 'Opening'
  | 'Play'
  | 'Stop'
  | 'true'
  | 'Ascender_End_Dismount_Bottom'
  | 'Ascender_End_Dismount_Top'
  | 'Ascender_Start_Mount_Bottom'
  | 'Ascender_Start_Mount_Top'
  | 'LockedDoor_Unlocked';

export const OBJECTTYPESTATUS_ENUM = [
  'ACTIVATED',
  'Closing',
  'false',
  'FuelSpill',
  'Ignite',
  'Opening',
  'Play',
  'Stop',
  'true',
  'Ascender_End_Dismount_Bottom',
  'Ascender_End_Dismount_Top',
  'Ascender_Start_Mount_Bottom',
  'Ascender_Start_Mount_Top',
  'LockedDoor_Unlocked',
];

export type RegionIdChimera_Main = 'Lab' | 'Level_A' | 'Level_B' | 'Level_C' | 'Level_D' | 'Ruins';

export type RegionIdDesert_Main =
  | 'alcantara'
  | 'ruins'
  | 'lacobreria'
  | 'trailerpark'
  | 'craterfields'
  | 'elpozo'
  | 'watertreatment'
  | 'sanmartin'
  | 'heciendadelpatron'
  | 'powergrid'
  | 'cruzdelvalle'
  | 'torreahumada'
  | 'campomilitar'
  | 'tierrabronca'
  | 'elazahar'
  | 'junkyard'
  | 'minasgenerales'
  | 'graveyard'
  | 'montenuevo'
  | 'ladrillera'
  | 'chumacera'
  | 'pecado'
  | 'labendita'
  | 'lmpala'
  | 'losleones'
  | 'puertoparaiso'
  | 'loshigos'
  | 'prison'
  | 'minasdelsur'
  | 'valledelmar';

export type RegionIdDihorOtok_Main =
  | 'port'
  | 'cosmodrome'
  | 'trevno'
  | 'peshkova'
  | 'mountkreznic'
  | 'goroka'
  | 'dobromesto'
  | 'vihar'
  | 'movatra'
  | 'dinopark'
  | 'tovar'
  | 'castle'
  | 'podvosto'
  | 'cementfactory'
  | 'cantra'
  | 'hotspring'
  | 'volnova'
  | 'abbey'
  | 'winery'
  | 'milnar'
  | 'zabava'
  | 'krichas'
  | 'coalmine'
  | 'lumberyard'
  | 'pilnec'
  | 'sawmill';

export type RegionIdErangel_Main =
  | 'zharki'
  | 'shootingrange'
  | 'severny'
  | 'stalber'
  | 'kameshki'
  | 'yasnayapolyana'
  | 'lipovka'
  | 'mansion'
  | 'shelter'
  | 'prison'
  | 'myltapower'
  | 'mylta'
  | 'farm'
  | 'rozhok'
  | 'school'
  | 'georgopol'
  | 'hospital'
  | 'gatka'
  | 'quarry'
  | 'primorsk'
  | 'ferrypier'
  | 'sosnovkamilitarybase'
  | 'novorepnoye'
  | 'ruins'
  | 'pochinki';

export type RegionIdHeaven_Main =
  | 'coalyards'
  | 'docks'
  | 'industrialpark'
  | 'railyard'
  | 'residential'
  | 'steelmill';

export type RegionIdSavage_Main =
  | 'kampong'
  | 'getaway'
  | 'lawaki'
  | 'campbravo'
  | 'airfield'
  | 'khao'
  | 'tatmok'
  | 'paradiseresort'
  | 'bootcamp'
  | 'quarry'
  | 'cave'
  | 'campalpha'
  | 'campcharlie'
  | 'bantai'
  | 'painan'
  | 'sahmee'
  | 'nakham'
  | 'tambang'
  | 'ruins'
  | 'hatinh';

export type RegionIdSummerland_Main =
  | 'alhabar'
  | 'alhayik'
  | 'bahrsahir'
  | 'bashara'
  | 'cargoship'
  | 'hadiqanemo';

export type RegionIdTiger_Main =
  | 'airport'
  | 'armybase'
  | 'buksansa'
  | 'fishingcamp'
  | 'godok'
  | 'haemoosa'
  | 'hapo'
  | 'hosan'
  | 'hosanprison'
  | 'kangneung'
  | 'ohyang'
  | 'palace'
  | 'school'
  | 'shipyard'
  | 'songam'
  | 'studio'
  | 'terminal'
  | 'wolsong'
  | 'yongcheon';

export const REGIONID_ENUM = {
  Chimera_Main: ['Lab', 'Level_A', 'Level_B', 'Level_C', 'Level_D', 'Ruins'],
  Desert_Main: [
    'alcantara',
    'ruins',
    'lacobreria',
    'trailerpark',
    'craterfields',
    'elpozo',
    'watertreatment',
    'sanmartin',
    'heciendadelpatron',
    'powergrid',
    'cruzdelvalle',
    'torreahumada',
    'campomilitar',
    'tierrabronca',
    'elazahar',
    'junkyard',
    'minasgenerales',
    'graveyard',
    'montenuevo',
    'ladrillera',
    'chumacera',
    'pecado',
    'labendita',
    'lmpala',
    'losleones',
    'puertoparaiso',
    'loshigos',
    'prison',
    'minasdelsur',
    'valledelmar',
  ],
  DihorOtok_Main: [
    'port',
    'cosmodrome',
    'trevno',
    'peshkova',
    'mountkreznic',
    'goroka',
    'dobromesto',
    'vihar',
    'movatra',
    'dinopark',
    'tovar',
    'castle',
    'podvosto',
    'cementfactory',
    'cantra',
    'hotspring',
    'volnova',
    'abbey',
    'winery',
    'milnar',
    'zabava',
    'krichas',
    'coalmine',
    'lumberyard',
    'pilnec',
    'sawmill',
  ],
  Erangel_Main: [
    'zharki',
    'shootingrange',
    'severny',
    'stalber',
    'kameshki',
    'yasnayapolyana',
    'lipovka',
    'mansion',
    'shelter',
    'prison',
    'myltapower',
    'mylta',
    'farm',
    'rozhok',
    'school',
    'georgopol',
    'hospital',
    'gatka',
    'quarry',
    'primorsk',
    'ferrypier',
    'sosnovkamilitarybase',
    'novorepnoye',
    'ruins',
    'pochinki',
  ],
  Heaven_Main: ['coalyards', 'docks', 'industrialpark', 'railyard', 'residential', 'steelmill'],
  Savage_Main: [
    'kampong',
    'getaway',
    'lawaki',
    'campbravo',
    'airfield',
    'khao',
    'tatmok',
    'paradiseresort',
    'bootcamp',
    'quarry',
    'cave',
    'campalpha',
    'campcharlie',
    'bantai',
    'painan',
    'sahmee',
    'nakham',
    'tambang',
    'ruins',
    'hatinh',
  ],
  Summerland_Main: ['alhabar', 'alhayik', 'bahrsahir', 'bashara', 'cargoship', 'hadiqanemo'],
  Tiger_Main: [
    'airport',
    'armybase',
    'buksansa',
    'fishingcamp',
    'godok',
    'haemoosa',
    'hapo',
    'hosan',
    'hosanprison',
    'kangneung',
    'ohyang',
    'palace',
    'school',
    'shipyard',
    'songam',
    'studio',
    'terminal',
    'wolsong',
    'yongcheon',
  ],
};

export type WeatherId =
  | 'Clear'
  | 'Clear_02'
  | 'Clouds'
  | 'Cloudy'
  | 'Christmas'
  | 'Dark'
  | 'Halloween'
  | 'Night'
  | 'Overcast'
  | 'Snow'
  | 'Sunrise'
  | 'Sunset'
  | 'Sunset_a'
  | 'Weather_Clear'
  | 'Weather_Overcast'
  | 'Weather_Range_Sunset'
  | 'Weather_Sunset'
  | 'Weather_Summerland_01';

export const WEATHERID_ENUM = [
  'Clear',
  'Clear_02',
  'Clouds',
  'Cloudy',
  'Christmas',
  'Dark',
  'Halloween',
  'Night',
  'Overcast',
  'Snow',
  'Sunrise',
  'Sunset',
  'Sunset_a',
  'Weather_Clear',
  'Weather_Overcast',
  'Weather_Range_Sunset',
  'Weather_Sunset',
  'Weather_Summerland_01',
];
