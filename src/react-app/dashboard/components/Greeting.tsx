function getGreeting() {
  const hour = new Date().toLocaleString("en-US", {
    timeZone: "America/Lima",
    hour: "numeric",
    hour12: false,
  });
  const hourNum = parseInt(hour);

  if (hourNum >= 5 && hourNum < 12) return "Good Morning";
  if (hourNum >= 12 && hourNum < 19) return "Good Afternoon";
  return "Good Evening";
}

const greeting = getGreeting();

export function Greeting() {
  return <p className="text-[#F1FFF3] text-sm font-normal">{greeting}</p>;
}
