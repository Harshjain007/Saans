export const cities = {Indore:[22.72,75.86],Delhi:[28.61,77.21],Mumbai:[19.08,72.88],Lucknow:[26.85,80.95],Kolkata:[22.57,88.36],Bengaluru:[12.97,77.59],Ahmedabad:[23.02,72.57],Jaipur:[26.91,75.79],Bhopal:[23.26,77.41]};
export function category(aqi) {
  if (aqi == null) return 'Air quality unavailable';
  return ['Good','Moderate','Unhealthy for sensitive groups','Unhealthy','Very unhealthy','Hazardous'][[50,100,150,200,300].filter(n => aqi > n).length];
}
export function plan({aqi, household, commute, filter}) {
  const sensitive = household !== 'Adults';
  const limit = aqi == null || aqi > (sensitive ? 100 : 150);
  const outdoor = limit
    ? ['Move outdoor exercise indoors', 'Reschedule strenuous outdoor activity. Keep essential outings brief when local guidance calls for it.', 'Shorter outdoor exertion can reduce inhaled pollution when outdoor particle levels are high.']
    : ['Pick a quieter route', 'For outdoor activity, choose a route away from heavy traffic and check local guidance before leaving.', 'Distance from traffic can reduce exposure to nearby tailpipe pollution.'];
  const indoor = filter === 'HEPA purifier'
    ? ['Filter the room you use most', 'Use a room-sized HEPA purifier where your household spends the most time. Follow the filter replacement instructions.', 'HEPA filtration removes airborne particles while the air circulates through the filter.']
    : ['Cut indoor smoke at the source', 'Skip incense and candles today. Damp-wipe surfaces and use an outdoor-vented exhaust when cooking, if available.', 'Fewer combustion sources means fewer particles added indoors.'];
  const transport = {
    'Private car':['Share a ride or combine errands','When trips overlap, share a ride or combine errands into one trip. Switch off the engine while safely parked.','A shared ride saves vehicle kilometres when it replaces a separate car trip.'],
    'Two-wheeler':['Replace one solo ride','Try a practical public transport option or combine nearby errands. On high-pollution days, check local guidance before choosing an exposed route.','Replacing a solo petrol trip can avoid tailpipe emissions from that trip.'],
    'Public transport':['Keep the shared commute','When practical, use your usual transit route and wait away from idling vehicles.','Shared trips spread vehicle emissions across passengers. Waiting away from exhaust can reduce direct exposure.'],
    'Walk or cycle':limit ? ['Adjust the outdoor commute','Consider a shared transport option on high-pollution days if available. Recheck conditions before resuming active travel.','Less outdoor exertion during a smog episode can reduce exposure.'] : ['Keep the zero-tailpipe trip','Use quieter streets for walking or cycling when local conditions permit.','Walking and cycling produce no tailpipe emissions on the trip.'],
    'Work from home':['Group essential errands','Bundle errands or coordinate with a neighbour who is already making the trip.','Avoiding a separate motor vehicle trip can cut fuel use and tailpipe emissions.']
  }[commute];
  return [outdoor,indoor,transport].map(([title,action,impact],i)=>({i,title,action,impact,type:['Outdoor exposure','Indoor particles','Travel impact'][i],icon:['◒','⌂','↔'][i]}));
}
export function answerFor(question, context) {
  const [outdoor, indoor, transport] = plan(context);
  const explain = card => card.action + '\n\nWhy it helps · ' + card.impact;
  if (/school|child|pickup|pick.up/i.test(question)) return explain(outdoor) + '\n\nAt pickup, avoid idling while parked and check whether the school has issued its own outdoor activity guidance.';
  if (/purifier|indoor|cook|home|window|incense/i.test(question)) {
    return explain(/without|no purifier/i.test(question) ? plan({...context, filter:'No purifier'})[1] : indoor);
  }
  if (/building|communit|neighbou|society/i.test(question)) return 'Share the city reading with its source and time. Ask drivers to switch off engines safely while parked, and organise a shared backup plan for outdoor activities.\n\nWhy it helps · Less idling reduces exhaust near entrances. A shared plan gives families a practical way to shorten outdoor activity during smog.';
  if (/car|commut|transport|bike|cycle|ride/i.test(question)) return explain(transport);
  if (/exercise|outdoor|walk|run/i.test(question)) return explain(outdoor);
  return 'The built-in guide can help with indoor air, outdoor activity, school pickup, transport and community coordination. Try a question about one of those routines.';
}
