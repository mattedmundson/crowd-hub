// Priority countries (English-speaking)
const priorityCountries = [
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿" },
];

// All other countries
const otherCountries = [
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "Spain", code: "ES", flag: "🇪🇸" },
  { name: "Italy", code: "IT", flag: "🇮🇹" },
  { name: "Netherlands", code: "NL", flag: "🇳🇱" },
  { name: "Belgium", code: "BE", flag: "🇧🇪" },
  { name: "Switzerland", code: "CH", flag: "🇨🇭" },
  { name: "Austria", code: "AT", flag: "🇦🇹" },
  { name: "Sweden", code: "SE", flag: "🇸🇪" },
  { name: "Norway", code: "NO", flag: "🇳🇴" },
  { name: "Denmark", code: "DK", flag: "🇩🇰" },
  { name: "Finland", code: "FI", flag: "🇫🇮" },
  { name: "Poland", code: "PL", flag: "🇵🇱" },
  { name: "Czech Republic", code: "CZ", flag: "🇨🇿" },
  { name: "Ireland", code: "IE", flag: "🇮🇪" },
  { name: "Portugal", code: "PT", flag: "🇵🇹" },
  { name: "Greece", code: "GR", flag: "🇬🇷" },
  { name: "Romania", code: "RO", flag: "🇷🇴" },
  { name: "Bulgaria", code: "BG", flag: "🇧🇬" },
  { name: "Croatia", code: "HR", flag: "🇭🇷" },
  { name: "Slovenia", code: "SI", flag: "🇸🇮" },
  { name: "Slovakia", code: "SK", flag: "🇸🇰" },
  { name: "Hungary", code: "HU", flag: "🇭🇺" },
  { name: "Lithuania", code: "LT", flag: "🇱🇹" },
  { name: "Latvia", code: "LV", flag: "🇱🇻" },
  { name: "Estonia", code: "EE", flag: "🇪🇪" },
  { name: "Malta", code: "MT", flag: "🇲🇹" },
  { name: "Cyprus", code: "CY", flag: "🇨🇾" },
  { name: "Luxembourg", code: "LU", flag: "🇱🇺" },
  { name: "Iceland", code: "IS", flag: "🇮🇸" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", flag: "🇰🇷" },
  { name: "China", code: "CN", flag: "🇨🇳" },
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "Singapore", code: "SG", flag: "🇸🇬" },
  { name: "Malaysia", code: "MY", flag: "🇲🇾" },
  { name: "Thailand", code: "TH", flag: "🇹🇭" },
  { name: "Indonesia", code: "ID", flag: "🇮🇩" },
  { name: "Philippines", code: "PH", flag: "🇵🇭" },
  { name: "Vietnam", code: "VN", flag: "🇻🇳" },
  { name: "Taiwan", code: "TW", flag: "🇹🇼" },
  { name: "Hong Kong", code: "HK", flag: "🇭🇰" },
  { name: "Israel", code: "IL", flag: "🇮🇱" },
  { name: "United Arab Emirates", code: "AE", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "SA", flag: "🇸🇦" },
  { name: "Turkey", code: "TR", flag: "🇹🇷" },
  { name: "South Africa", code: "ZA", flag: "🇿🇦" },
  { name: "Egypt", code: "EG", flag: "🇪🇬" },
  { name: "Nigeria", code: "NG", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", flag: "🇰🇪" },
  { name: "Morocco", code: "MA", flag: "🇲🇦" },
  { name: "Brazil", code: "BR", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", flag: "🇲🇽" },
  { name: "Argentina", code: "AR", flag: "🇦🇷" },
  { name: "Chile", code: "CL", flag: "🇨🇱" },
  { name: "Colombia", code: "CO", flag: "🇨🇴" },
  { name: "Peru", code: "PE", flag: "🇵🇪" },
  { name: "Venezuela", code: "VE", flag: "🇻🇪" },
  { name: "Uruguay", code: "UY", flag: "🇺🇾" },
  { name: "Ecuador", code: "EC", flag: "🇪🇨" },
  { name: "Bolivia", code: "BO", flag: "🇧🇴" },
  { name: "Paraguay", code: "PY", flag: "🇵🇾" },
  { name: "Russia", code: "RU", flag: "🇷🇺" },
  { name: "Ukraine", code: "UA", flag: "🇺🇦" },
  { name: "Belarus", code: "BY", flag: "🇧🇾" },
  { name: "Kazakhstan", code: "KZ", flag: "🇰🇿" },
  { name: "Pakistan", code: "PK", flag: "🇵🇰" },
  { name: "Bangladesh", code: "BD", flag: "🇧🇩" },
  { name: "Sri Lanka", code: "LK", flag: "🇱🇰" },
  { name: "Nepal", code: "NP", flag: "🇳🇵" },
  { name: "Afghanistan", code: "AF", flag: "🇦🇫" },
  { name: "Iran", code: "IR", flag: "🇮🇷" },
  { name: "Iraq", code: "IQ", flag: "🇮🇶" },
  { name: "Jordan", code: "JO", flag: "🇯🇴" },
  { name: "Lebanon", code: "LB", flag: "🇱🇧" },
  { name: "Qatar", code: "QA", flag: "🇶🇦" },
  { name: "Kuwait", code: "KW", flag: "🇰🇼" },
  { name: "Bahrain", code: "BH", flag: "🇧🇭" },
  { name: "Oman", code: "OM", flag: "🇴🇲" },
  { name: "Yemen", code: "YE", flag: "🇾🇪" },
  { name: "Tunisia", code: "TN", flag: "🇹🇳" },
  { name: "Algeria", code: "DZ", flag: "🇩🇿" },
  { name: "Libya", code: "LY", flag: "🇱🇾" },
  { name: "Ethiopia", code: "ET", flag: "🇪🇹" },
  { name: "Ghana", code: "GH", flag: "🇬🇭" },
  { name: "Ivory Coast", code: "CI", flag: "🇨🇮" },
  { name: "Cameroon", code: "CM", flag: "🇨🇲" },
  { name: "Uganda", code: "UG", flag: "🇺🇬" },
  { name: "Tanzania", code: "TZ", flag: "🇹🇿" },
  { name: "Zimbabwe", code: "ZW", flag: "🇿🇼" },
  { name: "Botswana", code: "BW", flag: "🇧🇼" },
  { name: "Namibia", code: "NA", flag: "🇳🇦" },
  { name: "Mozambique", code: "MZ", flag: "🇲🇿" },
  { name: "Angola", code: "AO", flag: "🇦🇴" },
  { name: "Zambia", code: "ZM", flag: "🇿🇲" },
].sort((a, b) => a.name.localeCompare(b.name));

// Combine with priority countries at the top
export const countries = [
  ...priorityCountries,
  { name: "---", code: "divider", flag: "---" }, // Divider
  ...otherCountries
];