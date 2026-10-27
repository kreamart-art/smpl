// A browsable, not exhaustive, city catalogue for location autocomplete and the
// People search. Weighted toward the community (NL + Suriname + Caribbean +
// diaspora hubs) then broadened to major world cities. Each entry: [name, cc].
export const CITIES = [
  // Netherlands
  ['Amsterdam', 'NL'], ['Rotterdam', 'NL'], ['Den Haag', 'NL'], ['Utrecht', 'NL'], ['Eindhoven', 'NL'],
  ['Tilburg', 'NL'], ['Groningen', 'NL'], ['Almere', 'NL'], ['Breda', 'NL'], ['Nijmegen', 'NL'],
  ['Arnhem', 'NL'], ['Haarlem', 'NL'], ['Zaanstad', 'NL'], ['Amersfoort', 'NL'], ['Apeldoorn', 'NL'],
  ['Den Bosch', 'NL'], ['Maastricht', 'NL'], ['Leiden', 'NL'], ['Dordrecht', 'NL'], ['Zwolle', 'NL'],
  ['Delft', 'NL'], ['Alkmaar', 'NL'], ['Venlo', 'NL'], ['Hilversum', 'NL'],
  // Suriname + Caribbean
  ['Paramaribo', 'SR'], ['Lelydorp', 'SR'], ['Nieuw-Nickerie', 'SR'],
  ['Willemstad', 'CW'], ['Oranjestad', 'AW'], ['Kralendijk', 'BQ'], ['Philipsburg', 'SX'],
  ['Kingston', 'JM'], ['Port of Spain', 'TT'], ['Bridgetown', 'BB'], ['Nassau', 'BS'],
  ['Santo Domingo', 'DO'], ['San Juan', 'PR'], ['Havana', 'CU'], ['Port-au-Prince', 'HT'],
  // Belgium + nearby Europe
  ['Brussels', 'BE'], ['Antwerp', 'BE'], ['Ghent', 'BE'], ['Bruges', 'BE'], ['Liège', 'BE'],
  ['Paris', 'FR'], ['Marseille', 'FR'], ['Lyon', 'FR'], ['Lille', 'FR'],
  ['London', 'GB'], ['Manchester', 'GB'], ['Birmingham', 'GB'], ['Bristol', 'GB'], ['Leeds', 'GB'],
  ['Glasgow', 'GB'], ['Liverpool', 'GB'], ['Nottingham', 'GB'],
  ['Berlin', 'DE'], ['Hamburg', 'DE'], ['Munich', 'DE'], ['Cologne', 'DE'], ['Frankfurt', 'DE'],
  ['Madrid', 'ES'], ['Barcelona', 'ES'], ['Valencia', 'ES'], ['Lisbon', 'PT'], ['Porto', 'PT'],
  ['Rome', 'IT'], ['Milan', 'IT'], ['Naples', 'IT'],
  ['Vienna', 'AT'], ['Zurich', 'CH'], ['Geneva', 'CH'], ['Copenhagen', 'DK'], ['Stockholm', 'SE'],
  ['Oslo', 'NO'], ['Helsinki', 'FI'], ['Dublin', 'IE'], ['Warsaw', 'PL'], ['Prague', 'CZ'],
  ['Budapest', 'HU'], ['Athens', 'GR'], ['Istanbul', 'TR'],
  // North America
  ['New York', 'US'], ['Brooklyn', 'US'], ['Atlanta', 'US'], ['Los Angeles', 'US'], ['Chicago', 'US'],
  ['Houston', 'US'], ['Miami', 'US'], ['Detroit', 'US'], ['Memphis', 'US'], ['Philadelphia', 'US'],
  ['Oakland', 'US'], ['Compton', 'US'], ['New Orleans', 'US'], ['Dallas', 'US'], ['Washington', 'US'],
  ['Boston', 'US'], ['Seattle', 'US'], ['San Francisco', 'US'], ['Las Vegas', 'US'], ['Phoenix', 'US'],
  ['Toronto', 'CA'], ['Montreal', 'CA'], ['Vancouver', 'CA'], ['Ottawa', 'CA'],
  ['Mexico City', 'MX'], ['Guadalajara', 'MX'],
  // Africa
  ['Lagos', 'NG'], ['Abuja', 'NG'], ['Accra', 'GH'], ['Kumasi', 'GH'], ['Nairobi', 'KE'],
  ['Johannesburg', 'ZA'], ['Cape Town', 'ZA'], ['Durban', 'ZA'], ['Pretoria', 'ZA'],
  ['Dakar', 'SN'], ['Abidjan', 'CI'], ['Kinshasa', 'CD'], ['Luanda', 'AO'], ['Cairo', 'EG'],
  ['Casablanca', 'MA'], ['Marrakesh', 'MA'], ['Tunis', 'TN'], ['Addis Ababa', 'ET'],
  ['Kampala', 'UG'], ['Dar es Salaam', 'TZ'], ['Harare', 'ZW'],
  // Latin America
  ['São Paulo', 'BR'], ['Rio de Janeiro', 'BR'], ['Salvador', 'BR'], ['Brasília', 'BR'],
  ['Bogotá', 'CO'], ['Medellín', 'CO'], ['Cali', 'CO'], ['Lima', 'PE'], ['Buenos Aires', 'AR'],
  ['Santiago', 'CL'], ['Caracas', 'VE'], ['Quito', 'EC'], ['Georgetown', 'GY'],
  // Asia + Oceania + Middle East
  ['Tokyo', 'JP'], ['Osaka', 'JP'], ['Seoul', 'KR'], ['Bangkok', 'TH'], ['Jakarta', 'ID'],
  ['Manila', 'PH'], ['Singapore', 'SG'], ['Mumbai', 'IN'], ['Delhi', 'IN'], ['Bangalore', 'IN'],
  ['Dubai', 'AE'], ['Tel Aviv', 'IL'], ['Beirut', 'LB'],
  ['Sydney', 'AU'], ['Melbourne', 'AU'], ['Auckland', 'NZ'],
]

// Suggest cities for a query (case-insensitive). Prefix matches rank above
// substring matches; returns up to `limit` { name, country } objects.
export function suggestCities(query, limit = 6) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return []
  const starts = []
  const contains = []
  for (const [name, country] of CITIES) {
    const lower = name.toLowerCase()
    if (lower.startsWith(q)) starts.push({ name, country })
    else if (lower.includes(q)) contains.push({ name, country })
  }
  return [...starts, ...contains].slice(0, limit)
}
