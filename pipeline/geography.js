/**
 * Power Draw - Dynamic Geographic Resolution & Spatial Alignment Engine
 * Dynamically correlates facilities, utility service boundaries, and county economic zones worldwide.
 */

export const KNOWN_HUBS = {
  // --- NORTH AMERICA: UNITED STATES ---
  'us-va-loudoun': {
    name: 'Loudoun County (Data Center Alley)',
    state: 'Virginia',
    country: 'United States',
    country_code: 'US',
    county: 'Loudoun County',
    cities: ['ashburn', 'sterling', 'leesburg', 'dulles', 'arcola'],
    metro: 'Washington DC Metro Area',
    lat: 39.0839,
    lng: -77.6497,
    primary_utility: 'Dominion Energy Virginia',
    avg_annual_kwh: 12500
  },
  'us-va-prince-william': {
    name: 'Prince William County (Digital Gateway)',
    state: 'Virginia',
    country: 'United States',
    country_code: 'US',
    county: 'Prince William County',
    cities: ['manassas', 'gainesville', 'haymarket', 'woodbridge'],
    metro: 'Washington DC Metro Area',
    lat: 38.7188,
    lng: -77.4753,
    primary_utility: 'Dominion Energy Virginia',
    avg_annual_kwh: 12000
  },
  'us-va-caroline': {
    name: 'Caroline & Spotsylvania Counties',
    state: 'Virginia',
    country: 'United States',
    country_code: 'US',
    county: 'Caroline County',
    cities: ['caroline', 'spotsylvania', 'bowling green', 'fredericksburg'],
    metro: 'Central Virginia Corridor',
    lat: 38.0315,
    lng: -77.3481,
    primary_utility: 'Rappahannock Electric Co-op / Dominion',
    avg_annual_kwh: 12200
  },
  'us-oh-franklin': {
    name: 'Franklin & Licking Counties (Columbus Tech Hub)',
    state: 'Ohio',
    country: 'United States',
    country_code: 'US',
    county: 'Franklin County',
    cities: ['columbus', 'new albany', 'gahanna', 'hilliard', 'pataskala', 'licking'],
    metro: 'Columbus Metropolitan Area',
    lat: 39.9612,
    lng: -82.9988,
    primary_utility: 'AEP Ohio',
    avg_annual_kwh: 11000
  },
  'us-az-maricopa': {
    name: 'Maricopa County (Phoenix / Mesa Hub)',
    state: 'Arizona',
    country: 'United States',
    country_code: 'US',
    county: 'Maricopa County',
    cities: ['phoenix', 'mesa', 'goodyear', 'chandler', 'gilbert', 'avondale', 'el mirage'],
    metro: 'Phoenix Metropolitan Area',
    lat: 33.4484,
    lng: -112.0740,
    primary_utility: 'Arizona Public Service (APS) / SRP',
    avg_annual_kwh: 14200
  },
  'us-tx-dallas': {
    name: 'Dallas-Fort Worth Metroplex',
    state: 'Texas',
    country: 'United States',
    country_code: 'US',
    county: 'Dallas County',
    cities: ['dallas', 'carrollton', 'fort worth', 'plano', 'richardson', 'irving', 'garland', 'denton'],
    metro: 'Dallas-Fort Worth Metropolitan Area',
    lat: 32.7767,
    lng: -96.7970,
    primary_utility: 'Oncor Electric Delivery',
    avg_annual_kwh: 13800
  },
  'us-tx-shackelford': {
    name: 'Shackelford & Taylor Counties (Abilene Hub)',
    state: 'Texas',
    country: 'United States',
    country_code: 'US',
    county: 'Shackelford County',
    cities: ['albany', 'abilene', 'shackelford', 'taylor'],
    metro: 'West Texas Energy Hub',
    lat: 32.7337,
    lng: -99.3512,
    primary_utility: 'AEP Texas',
    avg_annual_kwh: 13900
  },
  'us-tx-bexar': {
    name: 'Bexar County (San Antonio Hub)',
    state: 'Texas',
    country: 'United States',
    country_code: 'US',
    county: 'Bexar County',
    cities: ['san antonio', 'converse', 'schertz', 'castroville'],
    metro: 'San Antonio Metropolitan Area',
    lat: 29.4241,
    lng: -98.4936,
    primary_utility: 'CPS Energy',
    avg_annual_kwh: 13500
  },
  'us-ga-douglas': {
    name: 'Douglas & Fulton Counties (Atlanta Tech Corridor)',
    state: 'Georgia',
    country: 'United States',
    country_code: 'US',
    county: 'Douglas County',
    cities: ['lithia springs', 'douglasville', 'atlanta', 'union city', 'fayetteville'],
    metro: 'Atlanta Metropolitan Area',
    lat: 33.7018,
    lng: -84.7174,
    primary_utility: 'Georgia Power',
    avg_annual_kwh: 13000
  },
  'us-la-richland': {
    name: 'Richland Parish (Hyperion AI Campus)',
    state: 'Louisiana',
    country: 'United States',
    country_code: 'US',
    county: 'Richland Parish',
    cities: ['rayville', 'richland', 'delhi', 'monroe'],
    metro: 'Northeast Louisiana Corridor',
    lat: 32.4768,
    lng: -91.7587,
    primary_utility: 'Entergy Louisiana',
    avg_annual_kwh: 14000
  },
  'us-wi-racine': {
    name: 'Racine County (Fairwater / Mount Pleasant)',
    state: 'Wisconsin',
    country: 'United States',
    country_code: 'US',
    county: 'Racine County',
    cities: ['mount pleasant', 'racine', 'sturtevant', 'kenosha'],
    metro: 'Milwaukee-Chicago Corridor',
    lat: 42.7261,
    lng: -87.8911,
    primary_utility: 'We Energies',
    avg_annual_kwh: 9800
  },
  'us-in-st-joseph': {
    name: 'St. Joseph County (New Carlisle / Project Rainier)',
    state: 'Indiana',
    country: 'United States',
    country_code: 'US',
    county: 'St. Joseph County',
    cities: ['new carlisle', 'south bend', 'mishawaka'],
    metro: 'Northern Indiana Corridor',
    lat: 41.6764,
    lng: -86.2519,
    primary_utility: 'Indiana Michigan Power (AEP)',
    avg_annual_kwh: 11200
  },
  'us-tn-shelby': {
    name: 'Shelby & DeSoto Counties (xAI Colossus / Memphis)',
    state: 'Tennessee',
    country: 'United States',
    country_code: 'US',
    county: 'Shelby County',
    cities: ['memphis', 'southaven', 'collierville', 'bartlett'],
    metro: 'Greater Memphis Metropolitan Area',
    lat: 35.1495,
    lng: -90.0490,
    primary_utility: 'Memphis Light, Gas and Water (TVA)',
    avg_annual_kwh: 13600
  },
  'us-pa-luzerne': {
    name: 'Luzerne & Columbia Counties (Susquehanna Nuclear Hub)',
    state: 'Pennsylvania',
    country: 'United States',
    country_code: 'US',
    county: 'Luzerne County',
    cities: ['berwick', 'salem township', 'wilkes-barre', 'hazleton'],
    metro: 'Northeast Pennsylvania Corridor',
    lat: 41.2458,
    lng: -75.8813,
    primary_utility: 'PPL Electric Utilities',
    avg_annual_kwh: 10400
  },
  'us-ut-salt-lake': {
    name: 'Salt Lake & Utah Counties (Silicon Slopes)',
    state: 'Utah',
    country: 'United States',
    country_code: 'US',
    county: 'Salt Lake County',
    cities: ['salt lake city', 'west jordan', 'eagle mountain', 'sandy', 'lehi', 'provo'],
    metro: 'Salt Lake City Metropolitan Area',
    lat: 40.7608,
    lng: -111.8910,
    primary_utility: 'Rocky Mountain Power',
    avg_annual_kwh: 10200
  },
  'us-ca-santa-clara': {
    name: 'Santa Clara County (Silicon Valley)',
    state: 'California',
    country: 'United States',
    country_code: 'US',
    county: 'Santa Clara County',
    cities: ['santa clara', 'san jose', 'sunnyvale', 'mountain view', 'milpitas'],
    metro: 'San Jose-Sunnyvale-Santa Clara',
    lat: 37.3541,
    lng: -121.9552,
    primary_utility: 'Silicon Valley Power / PG&E',
    avg_annual_kwh: 7800
  },
  'us-il-cook': {
    name: 'Cook & DuPage Counties (Greater Chicago)',
    state: 'Illinois',
    country: 'United States',
    country_code: 'US',
    county: 'Cook County',
    cities: ['chicago', 'elk grove village', 'franklin park', 'northlake', 'aurora', 'itasca'],
    metro: 'Chicago Metropolitan Area',
    lat: 41.8781,
    lng: -87.6298,
    primary_utility: 'Commonwealth Edison (ComEd)',
    avg_annual_kwh: 9200
  },
  'us-or-washington': {
    name: 'Washington & Morrow Counties (Silicon Forest)',
    state: 'Oregon',
    country: 'United States',
    country_code: 'US',
    county: 'Washington County',
    cities: ['hillsboro', 'beaverton', 'boardman', 'portland', 'morrow'],
    metro: 'Portland Metropolitan Area',
    lat: 45.5229,
    lng: -122.9898,
    primary_utility: 'Portland General Electric',
    avg_annual_kwh: 10500
  },
  'us-ia-polk': {
    name: 'Polk & Dallas Counties (Des Moines Hub)',
    state: 'Iowa',
    country: 'United States',
    country_code: 'US',
    county: 'Polk County',
    cities: ['des moines', 'west des moines', 'altoona', 'waukee'],
    metro: 'Des Moines Metropolitan Area',
    lat: 41.5868,
    lng: -93.6250,
    primary_utility: 'MidAmerican Energy',
    avg_annual_kwh: 10800
  },
  'us-nv-storey': {
    name: 'Storey & Washoe Counties (Reno / Tahoe Reno)',
    state: 'Nevada',
    country: 'United States',
    country_code: 'US',
    county: 'Storey County',
    cities: ['reno', 'sparks', 'mccarran', 'storey'],
    metro: 'Reno-Sparks Metropolitan Area',
    lat: 39.5296,
    lng: -119.8138,
    primary_utility: 'NV Energy',
    avg_annual_kwh: 10900
  },
  'us-nc-mecklenburg': {
    name: 'Mecklenburg & Rutherford Counties (Charlotte Tech)',
    state: 'North Carolina',
    country: 'United States',
    country_code: 'US',
    county: 'Mecklenburg County',
    cities: ['charlotte', 'forest city', 'rutherfordton', 'maiden'],
    metro: 'Charlotte Metropolitan Area',
    lat: 35.2271,
    lng: -80.8431,
    primary_utility: 'Duke Energy Carolinas',
    avg_annual_kwh: 12800
  },

  // --- INTERNATIONAL: EUROPE & UK ---
  'ie-leinster-dublin': {
    name: 'Dublin Region (Grange Castle / Clonee)',
    state: 'Leinster',
    country: 'Ireland',
    country_code: 'IE',
    county: 'County Dublin',
    cities: ['dublin', 'clondalkin', 'clonee', 'tallaght', 'ballycoolin'],
    metro: 'Greater Dublin Area',
    lat: 53.3498,
    lng: -6.2603,
    primary_utility: 'ESB Networks / Electric Ireland',
    avg_annual_kwh: 4200
  },
  'de-he-frankfurt': {
    name: 'Frankfurt Rhein-Main Region',
    state: 'Hesse',
    country: 'Germany',
    country_code: 'DE',
    county: 'Frankfurt am Main',
    cities: ['frankfurt', 'sossenheim', 'hanau', 'offenbach', 'eschborn'],
    metro: 'Frankfurt Rhine-Main',
    lat: 50.1109,
    lng: 8.6821,
    primary_utility: 'Mainova AG / Syna',
    avg_annual_kwh: 3500
  },
  'gb-eng-slough': {
    name: 'Slough & West London Corridor',
    state: 'England',
    country: 'United Kingdom',
    country_code: 'GB',
    county: 'Berkshire',
    cities: ['slough', 'london', 'reading', 'hayes', 'uxbridge', 'docklands'],
    metro: 'Greater London Area',
    lat: 51.5105,
    lng: -0.5950,
    primary_utility: 'Scottish and Southern Electricity Networks',
    avg_annual_kwh: 3800
  },
  'nl-nh-amsterdam': {
    name: 'Haarlemmermeer / Amsterdam Metro',
    state: 'North Holland',
    country: 'Netherlands',
    country_code: 'NL',
    county: 'Haarlemmermeer',
    cities: ['amsterdam', 'haarlemmermeer', 'schiphol-rijk', 'hoofddorp'],
    metro: 'Amsterdam Metropolitan Area',
    lat: 52.3676,
    lng: 4.9041,
    primary_utility: 'Liander',
    avg_annual_kwh: 3200
  },
  'fr-idf-paris': {
    name: 'Paris & Hauts-de-France Tech Hub',
    state: 'Île-de-France',
    country: 'France',
    country_code: 'FR',
    county: 'Paris',
    cities: ['paris', 'saint-denis', 'marcoussis', 'hauts-de-france', 'lille'],
    metro: 'Grand Paris & Northern France',
    lat: 48.8566,
    lng: 2.3522,
    primary_utility: 'Enedis / EDF',
    avg_annual_kwh: 4100
  },
  'se-ab-stockholm': {
    name: 'Stockholm & Luleå Arctic Hub',
    state: 'Stockholm County',
    country: 'Sweden',
    country_code: 'SE',
    county: 'Stockholm',
    cities: ['stockholm', 'kista', 'lulea', 'sandviken'],
    metro: 'Stockholm Tech Region',
    lat: 59.3293,
    lng: 18.0686,
    primary_utility: 'Ellevio / Vattenfall',
    avg_annual_kwh: 8500
  },
  'no-03-oslo': {
    name: 'Oslo & Telemark Green Energy Hub',
    state: 'Eastern Norway',
    country: 'Norway',
    country_code: 'NO',
    county: 'Oslo',
    cities: ['oslo', 'telemark', 'gromstul', 'hamar'],
    metro: 'Greater Oslo Region',
    lat: 59.9139,
    lng: 10.7522,
    primary_utility: 'Elvia / Statnett',
    avg_annual_kwh: 16000
  },
  'es-md-madrid': {
    name: 'Community of Madrid Tech Region',
    state: 'Madrid',
    country: 'Spain',
    country_code: 'ES',
    county: 'Madrid',
    cities: ['madrid', 'san sebastian de los reyes', 'alcobendas', 'talavera'],
    metro: 'Madrid Metropolitan Area',
    lat: 40.4168,
    lng: -3.7038,
    primary_utility: 'Iberdrola / Endesa',
    avg_annual_kwh: 3600
  },

  // --- ASIA-PACIFIC, MIDDLE EAST & AMERICAS ---
  'ae-az-abu-dhabi': {
    name: 'Abu Dhabi AI & Energy Hub (Stargate G42)',
    state: 'Abu Dhabi',
    country: 'United Arab Emirates',
    country_code: 'AE',
    county: 'Abu Dhabi Emirate',
    cities: ['abu dhabi', 'kizad', 'masdar city'],
    metro: 'Emirate of Abu Dhabi',
    lat: 24.4539,
    lng: 54.3773,
    primary_utility: 'Abu Dhabi Distribution Company (ADDC)',
    avg_annual_kwh: 18000
  },
  'jp-kanto-tokyo': {
    name: 'Greater Tokyo & Inzai Mega Hub',
    state: 'Kanto',
    country: 'Japan',
    country_code: 'JP',
    county: 'Chiba Prefecture',
    cities: ['tokyo', 'inzai', 'chiba', 'koto', 'osaka'],
    metro: 'Greater Tokyo Area',
    lat: 35.6762,
    lng: 139.6503,
    primary_utility: 'TEPCO Power Grid',
    avg_annual_kwh: 4500
  },
  'sg-central-singapore': {
    name: 'Singapore Infrastructure Hub (Jurong / Tuas)',
    state: 'Central Region',
    country: 'Singapore',
    country_code: 'SG',
    county: 'Singapore',
    cities: ['singapore', 'jurong', 'tuas', 'loyang', 'tanjong kling'],
    metro: 'Singapore',
    lat: 1.3521,
    lng: 103.8198,
    primary_utility: 'SP Group',
    avg_annual_kwh: 5400
  },
  'kr-46-jeollanam': {
    name: 'Jeollanam-do & Seoul AI Hub',
    state: 'Jeollanam-do',
    country: 'South Korea',
    country_code: 'KR',
    county: 'Jeollanam-do',
    cities: ['seoul', 'jeollanam-do', 'haenam', 'incheon'],
    metro: 'Greater Seoul & South Honam Corridor',
    lat: 34.8161,
    lng: 126.4629,
    primary_utility: 'KEPCO (Korea Electric Power Corp)',
    avg_annual_kwh: 5100
  },
  'in-mh-mumbai': {
    name: 'Mumbai & Navi Mumbai Tech Corridor',
    state: 'Maharashtra',
    country: 'India',
    country_code: 'IN',
    county: 'Thane / Raigad',
    cities: ['mumbai', 'navi mumbai', 'mahape', 'chandivali', 'panvel'],
    metro: 'Mumbai Metropolitan Region',
    lat: 19.0760,
    lng: 72.8777,
    primary_utility: 'MSEDCL / Adani Electricity / Tata Power',
    avg_annual_kwh: 2400
  },
  'in-tn-chennai': {
    name: 'Chennai & Tamil Nadu AI Cloud Hub',
    state: 'Tamil Nadu',
    country: 'India',
    country_code: 'IN',
    county: 'Chennai / Kanchipuram',
    cities: ['chennai', 'ambattur', 'siruseri', 'kanchipuram'],
    metro: 'Chennai Metropolitan Area',
    lat: 13.0827,
    lng: 80.2707,
    primary_utility: 'TANGEDCO (Tamil Nadu Generation & Distribution)',
    avg_annual_kwh: 2600
  },
  'in-tg-hyderabad': {
    name: 'Hyderabad & Telangana AI Corridor',
    state: 'Telangana',
    country: 'India',
    country_code: 'IN',
    county: 'Ranga Reddy / Hyderabad',
    cities: ['hyderabad', 'gachibowli', 'hitec city', 'kondapur'],
    metro: 'Hyderabad Urban Agglomeration',
    lat: 17.3850,
    lng: 78.4867,
    primary_utility: 'TSSPDCL (Southern Power Distribution)',
    avg_annual_kwh: 2500
  },
  'in-ka-bengaluru': {
    name: 'Bengaluru Silicon Valley AI Hub',
    state: 'Karnataka',
    country: 'India',
    country_code: 'IN',
    county: 'Bangalore Urban',
    cities: ['bengaluru', 'bangalore', 'whitefield', 'electronic city'],
    metro: 'Bengaluru Metropolitan Area',
    lat: 12.9716,
    lng: 77.5946,
    primary_utility: 'BESCOM (Bangalore Electricity Supply)',
    avg_annual_kwh: 2800
  },
  'au-nsw-sydney': {
    name: 'Sydney & Western Sydney Tech Corridor',
    state: 'New South Wales',
    country: 'Australia',
    country_code: 'AU',
    county: 'Cumberland',
    cities: ['sydney', 'alexandria', 'eastern creek', 'macquarie park', 'artarmon'],
    metro: 'Greater Sydney Area',
    lat: -33.8688,
    lng: 151.2093,
    primary_utility: 'Ausgrid / Endeavour Energy',
    avg_annual_kwh: 5800
  },
  'au-vic-melbourne': {
    name: 'Melbourne & Victoria AI Megacluster',
    state: 'Victoria',
    country: 'Australia',
    country_code: 'AU',
    county: 'Greater Melbourne',
    cities: ['melbourne', 'tullamarine', 'port melbourne', 'docklands'],
    metro: 'Greater Melbourne Metropolitan Area',
    lat: -37.8136,
    lng: 144.9631,
    primary_utility: 'CitiPower / Powercor',
    avg_annual_kwh: 5200
  },
  'cn-hb-zhangbei': {
    name: 'Beijing-Zhangbei AI Computing Supercluster',
    state: 'Hebei',
    country: 'China',
    country_code: 'CN',
    county: 'Zhangbei / Langfang',
    cities: ['zhangbei', 'beijing', 'langfang', 'hebei'],
    metro: 'Jing-Jin-Ji Megalopolis',
    lat: 41.1558,
    lng: 114.7142,
    primary_utility: 'State Grid Jibei Electric Power',
    avg_annual_kwh: 3200
  },
  'cn-gd-qingyuan': {
    name: 'Guangdong & Greater Bay Area AI Hub',
    state: 'Guangdong',
    country: 'China',
    country_code: 'CN',
    county: 'Qingyuan / Shenzhen',
    cities: ['qingyuan', 'shenzhen', 'guangzhou', 'dongguan'],
    metro: 'Pearl River Delta / Greater Bay Area',
    lat: 23.6817,
    lng: 113.0560,
    primary_utility: 'China Southern Power Grid',
    avg_annual_kwh: 3600
  },
  'cn-nm-horinger': {
    name: 'Inner Mongolia & Guizhou Green Computing Hub',
    state: 'Inner Mongolia',
    country: 'China',
    country_code: 'CN',
    county: 'Horinger / Guiyang',
    cities: ['horinger', 'hohhot', 'guiyang', 'guian', 'yangquan'],
    metro: 'National Green Computing Hub',
    lat: 40.3789,
    lng: 111.8219,
    primary_utility: 'Inner Mongolia Power Group',
    avg_annual_kwh: 3000
  },
  'za-gt-johannesburg': {
    name: 'Johannesburg & Gauteng AI Megacloud (Teraco & Vantage)',
    state: 'Gauteng',
    country: 'South Africa',
    country_code: 'ZA',
    county: 'City of Johannesburg',
    cities: ['johannesburg', 'bredell', 'midrand', 'sandton', 'ekurhuleni'],
    metro: 'Gauteng City Region',
    lat: -26.2041,
    lng: 28.0473,
    primary_utility: 'City Power Johannesburg / Eskom',
    avg_annual_kwh: 4800
  },
  'za-wc-capetown': {
    name: 'Cape Town Green Tech & Subsea Hub',
    state: 'Western Cape',
    country: 'South Africa',
    country_code: 'ZA',
    county: 'City of Cape Town',
    cities: ['cape town', 'rondebosch', 'brackenfell'],
    metro: 'Cape Town Metropolitan Area',
    lat: -33.9249,
    lng: 18.4241,
    primary_utility: 'Eskom / City of Cape Town Electricity',
    avg_annual_kwh: 4200
  },
  'ke-na-nairobi': {
    name: 'Nairobi Silicon Savannah Hub (East Africa Gateway)',
    state: 'Nairobi County',
    country: 'Kenya',
    country_code: 'KE',
    county: 'Nairobi',
    cities: ['nairobi', 'mombasa', 'konza'],
    metro: 'Nairobi Metropolitan Area',
    lat: -1.2921,
    lng: 36.8219,
    primary_utility: 'Kenya Power and Lighting Company (KPLC)',
    avg_annual_kwh: 1600
  },
  'ng-la-lagos': {
    name: 'Lagos & Lekki Coastal Digital Corridor',
    state: 'Lagos State',
    country: 'Nigeria',
    country_code: 'NG',
    county: 'Lagos',
    cities: ['lagos', 'lekki', 'ikeja', 'victoria island'],
    metro: 'Lagos Megacity Region',
    lat: 6.5244,
    lng: 3.3792,
    primary_utility: 'Eko Electricity Distribution (EKEDC) / Ikeja Electric',
    avg_annual_kwh: 1800
  },
  'eg-ca-cairo': {
    name: 'Cairo & Suez Subsea Cable Interconnect Hub',
    state: 'Cairo Governorate',
    country: 'Egypt',
    country_code: 'EG',
    county: 'Cairo',
    cities: ['cairo', 'new cairo', 'suez', 'alexandria'],
    metro: 'Greater Cairo Metropolitan Area',
    lat: 30.0444,
    lng: 31.2357,
    primary_utility: 'Egyptian Electricity Holding Company (EEHC)',
    avg_annual_kwh: 2200
  },
  'ru-mo-moscow': {
    name: 'Moscow & Kaluga Hyperscale AI Corridor',
    state: 'Moscow Oblast',
    country: 'Russia',
    country_code: 'RU',
    county: 'Moscow / Kaluga',
    cities: ['moscow', 'kaluga', 'skolkovo', 'udomlya'],
    metro: 'Moscow Metropolitan Area',
    lat: 55.7558,
    lng: 37.6173,
    primary_utility: 'Rosseti Moscow Region / Rosenergoatom',
    avg_annual_kwh: 3600
  },
  'pl-mz-warsaw': {
    name: 'Warsaw & Central Poland Tech Hub',
    state: 'Masovian',
    country: 'Poland',
    country_code: 'PL',
    county: 'Warsaw',
    cities: ['warsaw', 'omulew', 'ozarow', 'piaseczno'],
    metro: 'Warsaw Metropolitan Area',
    lat: 52.2297,
    lng: 21.0122,
    primary_utility: 'PGE Polska Grupa Energetyczna / Innogy',
    avg_annual_kwh: 3100
  },
  'id-jb-jakarta': {
    name: 'Jakarta & West Java Cikarang Mega Corridor',
    state: 'West Java',
    country: 'Indonesia',
    country_code: 'ID',
    county: 'Bekasi / Jakarta',
    cities: ['jakarta', 'bekasi', 'cikarang', 'karawang'],
    metro: 'Jabodetabek Megacity',
    lat: -6.2088,
    lng: 106.8456,
    primary_utility: 'PLN (Perusahaan Listrik Negara)',
    avg_annual_kwh: 2100
  },
  'my-jh-johor': {
    name: 'Johor Bahru & Cyberjaya AI Corridor',
    state: 'Johor',
    country: 'Malaysia',
    country_code: 'MY',
    county: 'Johor / Selangor',
    cities: ['johor bahru', 'cyberjaya', 'sedenak', 'nusajaya', 'kuala lumpur'],
    metro: 'Iskandar Malaysia & Greater KL',
    lat: 1.4927,
    lng: 103.7414,
    primary_utility: 'Tenaga Nasional Berhad (TNB)',
    avg_annual_kwh: 3800
  },
  'tw-tp-taipei': {
    name: 'Taipei & Changhua Island AI Hub',
    state: 'Northern Taiwan',
    country: 'Taiwan',
    country_code: 'TW',
    county: 'Taipei / Changhua',
    cities: ['taipei', 'changhua', 'taoyuan', 'hsinchu'],
    metro: 'Taipei-Keelung Metropolitan Area',
    lat: 25.0330,
    lng: 121.5654,
    primary_utility: 'Taiwan Power Company (Taipower)',
    avg_annual_kwh: 3900
  },
  'sa-ri-riyadh': {
    name: 'Riyadh & NEOM Oxagon AI Megacluster',
    state: 'Riyadh Province',
    country: 'Saudi Arabia',
    country_code: 'SA',
    county: 'Riyadh / Tabuk',
    cities: ['riyadh', 'neom', 'oxagon', 'dammam'],
    metro: 'Riyadh Metropolitan & NEOM Zone',
    lat: 24.7136,
    lng: 46.6753,
    primary_utility: 'Saudi Electricity Company (SEC)',
    avg_annual_kwh: 16500
  },
  'mx-qt-queretaro': {
    name: 'Querétaro Central Cloud & AI Hub',
    state: 'Querétaro',
    country: 'Mexico',
    country_code: 'MX',
    county: 'El Marqués / Colón',
    cities: ['queretaro', 'el marques', 'colon', 'mexico city'],
    metro: 'Querétaro Metropolitan Area',
    lat: 20.5888,
    lng: -100.3899,
    primary_utility: 'CFE (Comisión Federal de Electricidad)',
    avg_annual_kwh: 2600
  },
  'cl-rm-santiago': {
    name: 'Santiago & Quilicura AI Cloud Region',
    state: 'Santiago Metropolitan',
    country: 'Chile',
    country_code: 'CL',
    county: 'Santiago / Quilicura',
    cities: ['santiago', 'quilicura', 'san bernardo'],
    metro: 'Santiago Metropolitan Area',
    lat: -33.4489,
    lng: -70.6693,
    primary_utility: 'Enel Distribución Chile / CGE',
    avg_annual_kwh: 2900
  },
  'br-rs-rio-grande': {
    name: 'Rio Grande do Sul & Rio de Janeiro (Scala & Elea)',
    state: 'Rio Grande do Sul',
    country: 'Brazil',
    country_code: 'BR',
    county: 'Eldorado do Sul',
    cities: ['eldorado do sul', 'porto alegre', 'rio de janeiro', 'sao paulo', 'campinas'],
    metro: 'Southern & Southeast Brazil Tech Hub',
    lat: -30.0039,
    lng: -51.3039,
    primary_utility: 'CEEE Equatorial / Light / Enel SP',
    avg_annual_kwh: 2800
  },
  'ca-ab-calgary': {
    name: 'Alberta & Western Canada AI Corridor',
    state: 'Alberta',
    country: 'Canada',
    country_code: 'CA',
    county: 'Calgary',
    cities: ['calgary', 'edmonton', 'montreal', 'vancouver', 'alberta'],
    metro: 'Western Canada Corridor',
    lat: 51.0447,
    lng: -114.0719,
    primary_utility: 'ENMAX Power / EPCOR / Hydro-Québec',
    avg_annual_kwh: 7200
  }
};

/**
 * Calculates geographic match between facility and local region
 */
export function matchGeography(facility, regionKey, regionDef) {
  const fCounty = (facility.county || '').toLowerCase();
  const fCity = (facility.city || '').toLowerCase();
  const fRegion = (facility.region || '').toLowerCase();
  const fCountry = (facility.country_code || facility.country || '').toUpperCase();

  const rCounty = (regionDef.county || '').toLowerCase();
  const rState = (regionDef.state || regionDef.state_province || '').toLowerCase();
  const rName = (regionDef.name || '').toLowerCase();

  // Tier 1: Exact County Match
  if (fCounty && rCounty && (fCounty.includes(rCounty) || rCounty.includes(fCounty))) {
    return { type: 'exact_county', confidence: 0.97 };
  }

  // Tier 2: Exact City to Hub Match
  if (fCity && (rName.includes(fCity) || regionDef.cities?.some(c => c === fCity || fCity.includes(c)))) {
    return { type: 'exact_city', confidence: 0.92 };
  }

  // Tier 3: Utility Service Territory Match
  if (regionDef.primary_utility) {
    const pUtil = regionDef.primary_utility.toLowerCase();
    const fUtil = (facility.utility_name || '').toLowerCase();
    const fOp = (facility.operator || '').toLowerCase();
    if (fUtil && (pUtil.includes(fUtil) || fUtil.includes(pUtil))) {
      return { type: 'utility_service_area', confidence: 0.85 };
    }
    if (fOp && (pUtil.includes(fOp) || fOp.includes(pUtil))) {
      return { type: 'utility_service_area', confidence: 0.85 };
    }
  }

  // Tier 4: Metro Area Match
  if (fRegion && rState && (fRegion.includes(rState) || rState.includes(fRegion))) {
    return { type: 'metro_match', confidence: 0.75 };
  }

  // Tier 5: Country Level Match (Sub-national fallback per METHODOLOGY.md Level 5)
  if (fCountry && (fCountry === regionDef.country_code || fCountry.includes(regionDef.country?.toUpperCase()))) {
    return { type: 'country_match', confidence: 0.45 };
  }

  return { type: 'inferred', confidence: 0.30 };
}

/**
 * Dynamically resolves or creates a region key from any record
 */
export function findBestRegionKey(record) {
  const query = `${record.region || record.state || ''} ${record.county || ''} ${record.city || ''} ${record.country || ''}`.toLowerCase();
  const recordCountry = (record.country_code || record.country || '').toLowerCase();

  // 1. Pass 1: Try finding match within the same country
  for (const [key, hub] of Object.entries(KNOWN_HUBS)) {
    const hubCountry = (hub.country_code || hub.country || '').toLowerCase();
    if (recordCountry && (query.includes(hubCountry) || recordCountry === hubCountry || hubCountry.includes(recordCountry))) {
      if (hub.county && query.includes(hub.county.toLowerCase())) return key;
      if (hub.cities && hub.cities.some(c => query.includes(c))) return key;
      if (hub.name && query.includes(hub.name.toLowerCase())) return key;
      if (hub.state && query.includes(hub.state.toLowerCase())) return key;
    }
  }

  // 2. Pass 2: Global scan
  for (const [key, hub] of Object.entries(KNOWN_HUBS)) {
    if (hub.county && query.includes(hub.county.toLowerCase())) return key;
    if (hub.cities && hub.cities.some(c => query.includes(c))) return key;
    if (hub.name && query.includes(hub.name.toLowerCase())) return key;
    if (hub.metro && query.includes(hub.metro.toLowerCase())) return key;
    if (hub.state && query.includes(hub.state.toLowerCase())) return key;
  }

  // Dynamic slug generation for new/unseen geographies
  const countryCode = (record.country_code || (record.country ? record.country.substring(0, 2) : 'GL')).toLowerCase();
  const stateCode = (record.region || record.state || 'reg').toLowerCase().substring(0, 3).replace(/[^a-z]/g, '');
  const locality = (record.county || record.city || 'hub').toLowerCase().substring(0, 8).replace(/[^a-z]/g, '');

  return `${countryCode}-${stateCode}-${locality}`;
}
